import { useState, useEffect, useRef } from 'react';
import { X, Save, User, Barcode, Calendar, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function BookLoanModal({ isOpen, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [alunos, setAlunos] = useState([]);
    const [scanning, setScanning] = useState(false);
    const [formData, setFormData] = useState({
        aluno_id: '',
        codigo_barras: '',
        data_retirada: new Date().toISOString().split('T')[0],
        observacao: ''
    });

    const sigCanvas = useRef({});

    useEffect(() => {
        if (isOpen) {
            fetchAlunos();
            setFormData(prev => ({ ...prev, data_retirada: new Date().toISOString().split('T')[0] }));
            setScanning(false);
        }
    }, [isOpen]);

    // Cleanup scanner when modal closes
    useEffect(() => {
        if (!isOpen) {
            setScanning(false);
            // If we had a way to manually clear the scanner instance here we would, 
            // but the useEffect below handles the `scanning` state toggle.
        }
    }, [isOpen]);


    const fetchAlunos = async () => {
        try {
            const res = await fetch('/api/alunos/lista');
            const data = await res.json();
            if (data.success) setAlunos(data.data);
        } catch (error) {
            console.error('Erro ao buscar alunos:', error);
        }
    };

    // Scanner Logic
    useEffect(() => {
        let scanner = null;
        if (scanning && isOpen) {
            // Slight delay to ensure DOM is ready
            const timer = setTimeout(() => {
                try {
                    scanner = new Html5QrcodeScanner(
                        "reader-book",
                        { fps: 10, qrbox: { width: 250, height: 150 } }, // Rectangular box for barcodes
                        false
                    );

                    scanner.render((decodedText) => {
                        setFormData(prev => ({ ...prev, codigo_barras: decodedText }));
                        if (navigator.vibrate) navigator.vibrate(200);
                        scanner.clear().then(() => setScanning(false));
                    }, (error) => {
                        // ignore scan errors
                    });
                } catch (e) {
                    console.error("Scanner init error", e);
                    setScanning(false);
                }
            }, 100);

            return () => {
                clearTimeout(timer);
                if (scanner) {
                    scanner.clear().catch(e => console.error("Failed to clear scanner", e));
                }
            };
        }
    }, [scanning, isOpen]);

    const clearSignature = () => {
        sigCanvas.current.clear();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (sigCanvas.current.isEmpty()) {
            alert("A assinatura do aluno é obrigatória.");
            return;
        }

        setLoading(true);

        const signatureData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');

        const payload = {
            ...formData,
            assinatura: signatureData
        };

        try {
            const res = await fetch('/api/emprestimos-livros', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                onSuccess();
                onClose();
            } else {
                alert(data.message || 'Erro ao criar empréstimo de livro');
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('Erro ao enviar formulário');
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

                        {/* Grid System */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Aluno Selection */}
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                    <User className="w-4 h-4 mr-1.5 text-gray-400" />
                                    Aluno
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.aluno_id}
                                        onChange={(e) => setFormData({ ...formData, aluno_id: e.target.value })}
                                        required
                                        className="block w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm appearance-none"
                                    >
                                        <option value="">Selecione o aluno...</option>
                                        {alunos.map(aluno => (
                                            <option key={aluno.id} value={aluno.id}>{aluno.nome}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                    </div>
                                </div>
                            </div>

                            {/* Barcode/Book Selection - LEFT COL */}
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

                            {/* Date - RIGHT COL */}
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

                        {/* Footer Actions */}
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
