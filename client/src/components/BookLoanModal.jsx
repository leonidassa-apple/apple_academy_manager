import { useState, useEffect, useRef } from 'react';
import { X, Save, User, Barcode, Calendar, FileText, CheckCircle, AlertCircle, Search, ChevronDown, ListFilter, ArrowLeft } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { Html5Qrcode } from 'html5-qrcode';
import BookSelectionModal from './BookSelectionModal';

export default function BookLoanModal({ isOpen, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);

    // Aluno Search State
    const [alunos, setAlunos] = useState([]);
    const [filteredAlunos, setFilteredAlunos] = useState([]);
    const [alunoSearch, setAlunoSearch] = useState('');
    const [showAlunosDropdown, setShowAlunosDropdown] = useState(false);

    // Book Search State
    const [searchMode, setSearchMode] = useState('barcode'); // 'barcode' | 'manual'
    const [selectedBook, setSelectedBook] = useState(null);
    const [availableCopies, setAvailableCopies] = useState([]);
    const [isBookSelectionOpen, setIsBookSelectionOpen] = useState(false);

    // Form Data
    const [scanning, setScanning] = useState(false);
    const [formData, setFormData] = useState({
        aluno_id: '',
        codigo_barras: '',
        data_retirada: new Date().toISOString().split('T')[0],
        observacao: ''
    });

    const sigCanvas = useRef({});
    const dropdownRef = useRef(null);

    // Initial Setup
    useEffect(() => {
        if (isOpen) {
            fetchAlunos();
            setFormData(prev => ({
                ...prev,
                data_retirada: new Date().toISOString().split('T')[0],
                codigo_barras: ''
            }));
            setScanning(false);
            setAlunoSearch('');
            setShowAlunosDropdown(false);
            setSelectedBook(null);
            setAvailableCopies([]);
            setSearchMode('barcode');
        }
    }, [isOpen]);

    // Close Dropdown on Click Outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowAlunosDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter Alunos
    useEffect(() => {
        const result = alunos.filter(aluno =>
            aluno.nome.toLowerCase().includes(alunoSearch.toLowerCase())
        );
        setFilteredAlunos(result);
    }, [alunoSearch, alunos]);

    const fetchAlunos = async () => {
        try {
            const res = await fetch('/api/alunos/lista');
            const data = await res.json();
            if (data.success) setAlunos(data.data);
        } catch (error) {
            console.error('Erro ao buscar alunos:', error);
        }
    };

    const handleSelectAluno = (aluno) => {
        setFormData(prev => ({ ...prev, aluno_id: aluno.id }));
        setAlunoSearch(aluno.nome);
        setShowAlunosDropdown(false);
    };

    // --- Book Search Logic ---

    const handleBookSelected = async (book) => {
        setSelectedBook(book);
        setIsBookSelectionOpen(false);
        setLoading(true);
        try {
            const res = await fetch(`/api/livros/${book.id}/exemplares`);
            const data = await res.json();

            if (data.success) {
                // Filter only available or currently selected copies
                const available = data.data.filter(copy => copy.status === 'Disponível');
                setAvailableCopies(available);

                if (available.length === 1) {
                    // Auto-select if only one copy
                    setFormData(prev => ({ ...prev, codigo_barras: available[0].codigo_barras }));
                } else if (available.length === 0) {
                    alert("Este livro não possui exemplares disponíveis para empréstimo no momento.");
                } else {
                    // Start with empty if multiple choices
                    setFormData(prev => ({ ...prev, codigo_barras: '' }));
                }
            }
        } catch (error) {
            console.error("Erro ao buscar exemplares:", error);
            alert("Erro ao buscar exemplares do livro.");
        } finally {
            setLoading(false);
        }
    };

    // --- Scanner Logic ---

    useEffect(() => {
        let html5QrCode = null;
        async function stopScanner() {
            if (html5QrCode && html5QrCode.isScanning) {
                try { await html5QrCode.stop(); } catch (e) { console.error(e); }
            }
        }

        if (scanning && isOpen && searchMode === 'barcode') {
            const startScanner = async () => {
                try {
                    html5QrCode = new Html5Qrcode("reader-book");
                    await html5QrCode.start(
                        { facingMode: "environment" },
                        { fps: 15, qrbox: { width: 300, height: 180 }, aspectRatio: 1.0 },
                        (decodedText) => {
                            setFormData(prev => ({ ...prev, codigo_barras: decodedText }));
                            if (navigator.vibrate) navigator.vibrate(200);
                            stopScanner().then(() => setScanning(false));
                        }
                    );
                } catch (err) {
                    console.error("Erro ao iniciar câmera:", err);
                    setScanning(false);
                    alert("Erro no scanner. Tente digitar o código.");
                }
            };
            const timer = setTimeout(startScanner, 300);
            return () => { clearTimeout(timer); stopScanner(); };
        }
    }, [scanning, isOpen, searchMode]);

    const clearSignature = () => sigCanvas.current.clear();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.aluno_id) return alert("Selecione um aluno da lista.");
        if (sigCanvas.current.isEmpty()) return alert("A assinatura do aluno é obrigatória.");
        if (!formData.codigo_barras) return alert("Indique o código de barras (Exemplar) do livro.");

        setLoading(true);
        const signatureData = sigCanvas.current.getCanvas().toDataURL('image/png');

        try {
            const res = await fetch('/api/emprestimos-livros', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, assinatura: signatureData })
            });
            const data = await res.json();
            if (data.success) {
                onSuccess();
                onClose();
            } else {
                alert(data.message || 'Erro ao criar empréstimo');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao enviar formulário.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

                <div className="flex min-h-screen items-center justify-center p-4 sm:p-0">
                    <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-100">

                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-4 flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold leading-6 text-white">Novo Empréstimo</h3>
                                    <p className="text-blue-100 text-xs mt-0.5">Registre a saída do exemplar</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-blue-100 hover:text-white p-1 hover:bg-white/10 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
                            <div className="grid grid-cols-1 gap-4">

                                {/* Aluno Search Selector */}
                                <div className="space-y-1 relative" ref={dropdownRef}>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center">
                                        <User className="w-3 h-3 mr-1" />
                                        Aluno
                                    </label>
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Pesquise o nome..."
                                            value={alunoSearch}
                                            onChange={(e) => {
                                                setAlunoSearch(e.target.value);
                                                setShowAlunosDropdown(true);
                                                if (e.target.value === '') setFormData(prev => ({ ...prev, aluno_id: '' }));
                                            }}
                                            onFocus={() => setShowAlunosDropdown(true)}
                                            className={`block w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all ${formData.aluno_id ? 'border-green-200 bg-green-50/30' : ''}`}
                                        />
                                        {/* Dropdown changes omitted for brevity, keeping logic same */}
                                    </div>
                                    {showAlunosDropdown && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-fade-in-down">
                                            {filteredAlunos.length > 0 ? (
                                                filteredAlunos.map(aluno => (
                                                    <button
                                                        key={aluno.id}
                                                        type="button"
                                                        onClick={() => handleSelectAluno(aluno)}
                                                        className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center justify-between border-b border-gray-50"
                                                    >
                                                        <div>
                                                            <div className="font-medium text-gray-700">{aluno.nome}</div>
                                                            <div className="text-xs text-gray-500">{aluno.tipo_aluno}</div>
                                                        </div>
                                                        {formData.aluno_id === aluno.id && <CheckCircle className="w-4 h-4 text-green-500" />}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-4 py-8 text-center text-gray-500">Nenhum aluno encontrado</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Mode Switcher */}
                                <div>
                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => { setSearchMode('barcode'); setScanning(false); }}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${searchMode === 'barcode' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <Barcode size={16} />
                                            Mencionar Código
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setSearchMode('manual'); setScanning(false); }}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${searchMode === 'manual' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <Search size={16} />
                                            Buscar Livro
                                        </button>
                                    </div>
                                </div>

                                {/* Barcode Mode */}
                                {searchMode === 'barcode' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={formData.codigo_barras}
                                                onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                                                placeholder="Código de barras..."
                                                className="block w-full px-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white shadow-sm font-mono"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setScanning(!scanning)}
                                                className={`px-3 rounded-lg border transition-all ${scanning ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-600 border-gray-200'}`}
                                            >
                                                <Barcode className="w-5 h-5" />
                                            </button>
                                        </div>
                                        {scanning && (
                                            <div className="rounded-lg overflow-hidden border-2 border-blue-500 bg-black relative h-48">
                                                <div id="reader-book" className="w-full h-full"></div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Manual Search Mode */}
                                {searchMode === 'manual' && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                            {!selectedBook ? (
                                                <div className="text-center py-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsBookSelectionOpen(true)}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition w-full shadow-sm"
                                                    >
                                                        Selecionar Livro
                                                    </button>
                                                </div>
                                            ) : (
                                                // ... Selected book display ...
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{selectedBook.titulo}</h4>
                                                            <p className="text-slate-500 text-xs line-clamp-1">{selectedBook.autor}</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setSelectedBook(null); setAvailableCopies([]); setFormData(prev => ({ ...prev, codigo_barras: '' })); }}
                                                            className="text-xs text-blue-600 hover:underline font-bold whitespace-nowrap ml-2"
                                                        >
                                                            Trocar
                                                        </button>
                                                    </div>

                                                    {loading ? (
                                                        <div className="text-center py-1 text-xs text-slate-500">Buscando...</div>
                                                    ) : availableCopies.length > 0 ? (
                                                        <select
                                                            value={formData.codigo_barras}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setFormData(prev => ({ ...prev, codigo_barras: val }));
                                                            }}
                                                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                                                        >
                                                            <option value="">Selecione o exemplar...</option>
                                                            {availableCopies.map(copy => (
                                                                <option key={copy.id} value={copy.codigo_barras}>
                                                                    {copy.codigo_barras} {copy.localizacao ? `- ${copy.localizacao}` : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-red-500 text-xs font-semibold p-2 bg-red-50 rounded">
                                                            <AlertCircle size={14} />
                                                            Indisponível.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Date */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        Data de Retirada
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.data_retirada}
                                        onChange={(e) => setFormData({ ...formData, data_retirada: e.target.value })}
                                        required
                                        className="block w-full px-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-all shadow-sm"
                                    />
                                </div>

                                {/* Signature Section */}
                                <div className="space-y-1">
                                    <div className="flex justify-between items-end">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Assinatura</label>
                                        <button
                                            type="button"
                                            onClick={clearSignature}
                                            className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline"
                                        >
                                            Limpar
                                        </button>
                                    </div>
                                    <div className="border border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-white transition-colors overflow-hidden relative">
                                        <SignatureCanvas
                                            ref={sigCanvas}
                                            penColor="black"
                                            canvasProps={{
                                                className: 'w-full h-28 cursor-crosshair'
                                            }}
                                        />
                                        <div className="absolute bottom-1 right-2 pointer-events-none text-[10px] text-gray-300 select-none">
                                            Assine aqui
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || (searchMode === 'manual' && (!formData.codigo_barras || !selectedBook))}
                                    className="flex items-center px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-md transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? '...' : 'Confirmar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Book Selection Modal for Manual Search */}
            <BookSelectionModal
                isOpen={isBookSelectionOpen}
                onClose={() => setIsBookSelectionOpen(false)}
                onSelectBook={handleBookSelected}
            />
        </>
    );
}
