import { useState, useEffect, useRef } from 'react';
import { X, QrCode, PenTool, User, Smartphone, Package, Calendar, Save, Scan, Search, ChevronDown, CheckCircle, AlertCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import SignatureCanvas from 'react-signature-canvas';

export default function LoanModal({ isOpen, onClose, onSuccess }) {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [studentSearch, setStudentSearch] = useState('');
    const [showStudentsDropdown, setShowStudentsDropdown] = useState(false);

    const [devices, setDevices] = useState([]);
    const [formData, setFormData] = useState({
        aluno_id: '',
        device_id: '',
        acessorios: '',
        data_retirada: new Date().toISOString().split('T')[0],
        data_devolucao: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assinatura: ''
    });
    const [scanning, setScanning] = useState(false);
    const sigCanvas = useRef({});
    const dropdownRef = useRef(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            Promise.all([
                fetch('/api/alunos/lista').then(res => res.json()),
                fetch('/api/devices').then(res => res.json())
            ]).then(([studentsData, devicesData]) => {
                if (studentsData.success) {
                    setStudents(studentsData.data);
                    setFilteredStudents(studentsData.data);
                }
                if (Array.isArray(devicesData)) setDevices(devicesData);
            }).catch(err => console.error("Error loading resources:", err));

            setStudentSearch('');
            setShowStudentsDropdown(false);
        }
    }, [isOpen]);

    // Handle clicks outside dropdown to close it
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowStudentsDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const result = students.filter(s =>
            s.nome?.toLowerCase().includes(studentSearch.toLowerCase())
        );
        setFilteredStudents(result);
    }, [studentSearch, students]);

    const handleSelectStudent = (student) => {
        setFormData(prev => ({ ...prev, aluno_id: student.id }));
        setStudentSearch(student.nome);
        setShowStudentsDropdown(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleScan = () => {
        setScanning(true);
    };

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
                    html5QrCode = new Html5Qrcode("reader");
                    const config = {
                        fps: 15,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    };

                    await html5QrCode.start(
                        { facingMode: "environment" },
                        config,
                        (decodedText) => {
                            const foundDevice = devices.find(d => d.numero_serie === decodedText);

                            if (foundDevice) {
                                setFormData(prev => ({ ...prev, device_id: foundDevice.id }));
                                if (navigator.vibrate) navigator.vibrate(200);
                                stopScanner().then(() => setScanning(false));
                            } else {
                                alert(`Device com serial ${decodedText} não encontrado ou indisponível.`);
                            }
                        }
                    );
                } catch (err) {
                    console.error("Erro ao iniciar câmera:", err);
                    try {
                        await html5QrCode.start({ facingMode: "user" }, { fps: 15, qrbox: { width: 250, height: 250 } }, (decodedText) => {
                            const foundDevice = devices.find(d => d.numero_serie === decodedText);
                            if (foundDevice) {
                                setFormData(prev => ({ ...prev, device_id: foundDevice.id }));
                                stopScanner().then(() => setScanning(false));
                            } else {
                                alert(`Device com serial ${decodedText} não encontrado ou indisponível.`);
                            }
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
    }, [scanning, devices, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.aluno_id) {
            alert("Selecione um aluno da lista.");
            return;
        }

        if (!formData.device_id) {
            alert("Selecione um device da lista.");
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

        try {
            const res = await fetch('/api/emprestimos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                onSuccess();
                onClose();
            } else {
                alert(data.message || 'Erro ao criar empréstimo');
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
                                <PenTool className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold leading-6 text-white">Novo Empréstimo</h3>
                                <p className="text-blue-100 text-sm mt-0.5">Registre a saída de um equipamento</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Student Search Selector */}
                            <div className="md:col-span-1 space-y-1.5 relative" ref={dropdownRef}>
                                <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                    <User className="w-4 h-4 mr-1.5 text-gray-400" />
                                    Aluno Responsável
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Pesquise o nome do aluno..."
                                        value={studentSearch}
                                        onChange={(e) => {
                                            setStudentSearch(e.target.value);
                                            setShowStudentsDropdown(true);
                                            if (e.target.value === '') setFormData(prev => ({ ...prev, aluno_id: '' }));
                                        }}
                                        onFocus={() => setShowStudentsDropdown(true)}
                                        className={`block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm ${formData.aluno_id ? 'border-green-200 bg-green-50/30' : ''}`}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showStudentsDropdown ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>

                                {showStudentsDropdown && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-fade-in-down">
                                        {filteredStudents.length > 0 ? (
                                            filteredStudents.map(s => (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => handleSelectStudent(s)}
                                                    className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center justify-between group transition-colors border-b border-gray-50 last:border-none"
                                                >
                                                    <div>
                                                        <div className="font-semibold text-gray-800">{s.nome}</div>
                                                        <div className="text-xs text-gray-500">ID: {s.id}</div>
                                                    </div>
                                                    {formData.aluno_id === s.id && (
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                    )}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-8 text-center text-gray-500 flex flex-col items-center">
                                                <AlertCircle className="w-8 h-8 mb-2 text-gray-300" />
                                                <p className="font-medium">Nenhum aluno encontrado</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Device Select */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 ml-1">Equipamento</label>
                                <div className="grid grid-cols-[1fr,auto] gap-2">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Smartphone className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <select
                                            name="device_id"
                                            value={formData.device_id}
                                            onChange={handleChange}
                                            className="block w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm appearance-none text-sm"
                                            required
                                        >
                                            <option value="">Selecione...</option>
                                            {devices.map(d => (
                                                <option key={d.id} value={d.id}>{d.nome} - {d.tipo}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleScan}
                                        className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl border border-gray-200 transition-colors"
                                        title="Escanear QR Code / Barcode"
                                    >
                                        <QrCode className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Scanner Area */}
                        {scanning && (
                            <div className="rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 p-4 transition-all animate-fade-in">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-bold text-blue-800 flex items-center">
                                        <Scan className="w-4 h-4 mr-2" />
                                        Escaneando código...
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => setScanning(false)}
                                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                                    >
                                        Fechar Câmera
                                    </button>
                                </div>
                                <div id="reader" className="overflow-hidden rounded-lg shadow-inner w-full"></div>
                            </div>
                        )}

                        {/* Accessories */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700 ml-1">Acessórios Incluídos</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Package className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="acessorios"
                                    value={formData.acessorios}
                                    onChange={handleChange}
                                    placeholder="Ex: Carregador USB-C, Cabo Lightning, Capa..."
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 ml-1">Data da Retirada</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="date"
                                        name="data_retirada"
                                        value={formData.data_retirada}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 ml-1">Previsão de Devolução</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="date"
                                        name="data_devolucao"
                                        value={formData.data_devolucao}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Signature */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                    <PenTool className="w-4 h-4 mr-2 text-gray-500" />
                                    Assinatura do Aluno
                                </label>
                                <button
                                    type="button"
                                    onClick={() => sigCanvas.current.clear()}
                                    className="text-xs text-red-500 hover:text-red-700 hover:underline transition-colors"
                                >
                                    Limpar Assinatura
                                </button>
                            </div>
                            <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50 shadow-inner hover:border-gray-300 transition-colors">
                                <SignatureCanvas
                                    ref={sigCanvas}
                                    canvasProps={{
                                        className: 'sigCanvas w-full h-32 cursor-crosshair'
                                    }}
                                    backgroundColor="rgba(249, 250, 251, 1)"
                                />
                            </div>
                            <p className="text-xs text-gray-400 ml-1">
                                O aluno declara estar de acordo com os termos de responsabilidade ao assinar.
                            </p>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
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
                                className="flex items-center px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95"
                            >
                                {loading ? 'Processando...' : (
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
