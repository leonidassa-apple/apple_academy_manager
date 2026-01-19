import { useState, useEffect, useRef } from 'react';
import { X, Save, User, Barcode, Calendar, FileText, CheckCircle, AlertCircle, Search, ChevronDown } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { Html5Qrcode } from 'html5-qrcode';

export default function BookLoanModal({ isOpen, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [alunos, setAlunos] = useState([]);
    const [filteredAlunos, setFilteredAlunos] = useState([]);
    const [alunoSearch, setAlunoSearch] = useState('');
    const [showAlunosDropdown, setShowAlunosDropdown] = useState(false);
    const [selectedAlunoName, setSelectedAlunoName] = useState('');

    const [scanning, setScanning] = useState(false);
    const [formData, setFormData] = useState({
        aluno_id: '',
        codigo_barras: '',
        data_retirada: new Date().toISOString().split('T')[0],
        observacao: ''
    });

    const sigCanvas = useRef({});
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchAlunos();
            setFormData(prev => ({ ...prev, data_retirada: new Date().toISOString().split('T')[0] }));
            setScanning(false);
            setAlunoSearch('');
            setSelectedAlunoName('');
            setShowAlunosDropdown(false);
        }
    }, [isOpen]);

    // Handle clicks outside dropdown to close it
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowAlunosDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchAlunos = async () => {
        try {
            const res = await fetch('/api/alunos/lista');
            const data = await res.json();
            if (data.success) {
                setAlunos(data.data);
                setFilteredAlunos(data.data);
            } else {
                console.error('Erro na API de alunos:', data.message);
            }
        } catch (error) {
            console.error('Erro ao buscar alunos:', error);
        }
    };

    useEffect(() => {
        const result = alunos.filter(aluno =>
            aluno.nome.toLowerCase().includes(alunoSearch.toLowerCase())
        );
        setFilteredAlunos(result);
    }, [alunoSearch, alunos]);

    const handleSelectAluno = (aluno) => {
        setFormData(prev => ({ ...prev, aluno_id: aluno.id }));
        setSelectedAlunoName(aluno.nome);
        setAlunoSearch(aluno.nome);
        setShowAlunosDropdown(false);
    };

    // Scanner Logic using Html5Qrcode
    useEffect(() => {
        let html5QrCode = null;

        async function stopScanner() {
            if (html5QrCode && html5QrCode.isScanning) {
                try {
                    await html5QrCode.stop();
                } catch (e) {
                    console.error("Erro ao parar scanner:", e);
                }
            }
        }

        if (scanning && isOpen) {
            const startScanner = async () => {
                try {
                    html5QrCode = new Html5Qrcode("reader-book");
                    const config = {
                        fps: 15,
                        qrbox: { width: 300, height: 180 },
                        aspectRatio: 1.0
                    };

                    await html5QrCode.start(
                        { facingMode: "environment" },
                        config,
                        (decodedText) => {
                            setFormData(prev => ({ ...prev, codigo_barras: decodedText }));
                            if (navigator.vibrate) navigator.vibrate(200);
                            stopScanner().then(() => setScanning(false));
                        }
                    );
                } catch (err) {
                    console.error("Erro ao iniciar câmera:", err);
                    try {
                        // Fallback to any camera
                        await html5QrCode.start({ facingMode: "user" }, { fps: 15, qrbox: { width: 300, height: 180 } }, (decodedText) => {
                            setFormData(prev => ({ ...prev, codigo_barras: decodedText }));
                            stopScanner().then(() => setScanning(false));
                        });
                    } catch (err2) {
                        console.error("Falha total na câmera:", err2);
                        alert("Não foi possível acessar a câmera. Verifique as permissões.");
                        setScanning(false);
                    }
                }
            };

            const timer = setTimeout(startScanner, 300);
            return () => {
                clearTimeout(timer);
                stopScanner();
            };
        }
    }, [scanning, isOpen]);

    const clearSignature = () => {
        sigCanvas.current.clear();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.aluno_id) {
            alert("Selecione um aluno da lista.");
            return;
        }

        if (sigCanvas.current.isEmpty()) {
            alert("A assinatura do aluno é obrigatória.");
            return;
        }

        setLoading(true);

        const signatureData = sigCanvas.current.getCanvas().toDataURL('image/png');

        const payload = {
            ...formData,
            assinatura: signatureData
        };

        console.log("Submitting loan with payload keys:", Object.keys(payload));

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            const res = await fetch('/api/emprestimos-livros', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log("Response status:", res.status);
            const data = await res.json();
            console.log("Response data:", data);

            if (data.success) {
                onSuccess();
                onClose();
            } else {
                alert(data.message || 'Erro ao criar empréstimo de livro');
            }
        } catch (error) {
            console.error('Submit error:', error);
            if (error.name === 'AbortError') {
                alert('A requisição demorou muito tempo. Verifique sua conexão ou se o servidor está respondendo.');
            } else {
                alert(`Erro ao enviar formulário: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-gray-100">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold leading-6 text-white">Novo Empréstimo de Livro</h3>
                                <p className="text-blue-100 text-sm mt-0.5">Registre a saída do exemplar</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Aluno Search Selector */}
                            <div className="md:col-span-2 space-y-1.5 relative" ref={dropdownRef}>
                                <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                    <User className="w-4 h-4 mr-1.5 text-gray-400" />
                                    Aluno
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Pesquise o nome do aluno..."
                                        value={alunoSearch}
                                        onChange={(e) => {
                                            setAlunoSearch(e.target.value);
                                            setShowAlunosDropdown(true);
                                            if (e.target.value === '') setFormData(prev => ({ ...prev, aluno_id: '' }));
                                        }}
                                        onFocus={() => setShowAlunosDropdown(true)}
                                        className={`block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm ${formData.aluno_id ? 'border-green-200 bg-green-50/30' : ''}`}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showAlunosDropdown ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>

                                {showAlunosDropdown && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-fade-in-down">
                                        {filteredAlunos.length > 0 ? (
                                            filteredAlunos.map(aluno => (
                                                <button
                                                    key={aluno.id}
                                                    type="button"
                                                    onClick={() => handleSelectAluno(aluno)}
                                                    className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center justify-between group transition-colors border-b border-gray-50 last:border-none"
                                                >
                                                    <div>
                                                        <div className="font-semibold text-gray-800">{aluno.nome}</div>
                                                        <div className="text-xs text-gray-500">ID: {aluno.id}</div>
                                                    </div>
                                                    {formData.aluno_id === aluno.id && (
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                    )}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-8 text-center text-gray-500 flex flex-col items-center">
                                                <AlertCircle className="w-8 h-8 mb-2 text-gray-300" />
                                                <p className="font-medium">Nenhum aluno encontrado</p>
                                                <p className="text-xs mt-1">Verifique o nome ou cadastre o aluno</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Barcode Selection */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                    <Barcode className="w-4 h-4 mr-1.5 text-gray-400" />
                                    Código de Barras
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.codigo_barras}
                                        onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                                        required
                                        placeholder="Escaneie ou digite..."
                                        className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setScanning(!scanning)}
                                        className={`p-2.5 rounded-xl border transition-all ${scanning
                                            ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600'}`}
                                        title={scanning ? "Parar Scanner" : "Iniciar Scanner"}
                                    >
                                        <Barcode className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Date */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                    <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                                    Data de Retirada
                                </label>
                                <input
                                    type="date"
                                    value={formData.data_retirada}
                                    onChange={(e) => setFormData({ ...formData, data_retirada: e.target.value })}
                                    required
                                    className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                />
                            </div>

                            {/* Scanner Viewport */}
                            {scanning && (
                                <div className="md:col-span-2 animate-fade-in-down">
                                    <div className="rounded-xl overflow-hidden border-2 border-blue-500 bg-black relative">
                                        <div id="reader-book" className="w-full h-64"></div>
                                        <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                                            Aponte para o código
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Signature Section */}
                            <div className="md:col-span-2 space-y-2">
                                <div className="flex justify-between items-end">
                                    <label className="block text-sm font-semibold text-gray-700 ml-1">Assinatura do Aluno</label>
                                    <button
                                        type="button"
                                        onClick={clearSignature}
                                        className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline"
                                    >
                                        Limpar Assinatura
                                    </button>
                                </div>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-white hover:border-blue-300 transition-colors overflow-hidden relative">
                                    <SignatureCanvas
                                        ref={sigCanvas}
                                        penColor="black"
                                        canvasProps={{
                                            className: 'w-full h-40 cursor-crosshair'
                                        }}
                                    />
                                    <div className="absolute bottom-2 right-2 pointer-events-none text-xs text-gray-300 select-none">
                                        Assine acima
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 ml-1 flex items-center">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    A assinatura é obrigatória para confirmar a retirada.
                                </p>
                            </div>

                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all shadow-md hover:shadow-lg transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Processando...
                                    </span>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Confirmar Empréstimo
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
