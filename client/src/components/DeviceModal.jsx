import { useState, useEffect } from 'react';
import { X, Save, Monitor } from 'lucide-react';

export default function DeviceModal({ isOpen, onClose, onSave, device = null }) {
    const [formData, setFormData] = useState({
        tipo: 'MacBook',
        modelo: '',
        cor: '',
        polegadas: '',
        ano: '',
        nome: '',
        chip: '',
        memoria: '',
        numero_serie: '',
        versao_os: '',
        status: 'Disponível',
        para_emprestimo: true,
        observacao: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (device) {
            setFormData({
                ...device,
                // Handle potentially missing fields or nulls
                modelo: device.modelo || '',
                cor: device.cor || '',
                polegadas: device.polegadas || '',
                ano: device.ano || '',
                chip: device.chip || '',
                memoria: device.memoria || '',
                versao_os: device.versao_os || '',
                observacao: device.observacao || '',
                para_emprestimo: device.para_emprestimo === true || device.para_emprestimo === 1
            });
        } else {
            // Reset form
            setFormData({
                tipo: 'MacBook',
                modelo: '',
                cor: '',
                polegadas: '',
                ano: '',
                nome: '',
                chip: '',
                memoria: '',
                numero_serie: '',
                versao_os: '',
                status: 'Disponível',
                para_emprestimo: true,
                observacao: ''
            });
        }
    }, [device, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = device ? `/api/devices/${device.id}` : '/api/devices';
            const method = device ? 'PUT' : 'POST';

            // Adjust payload for backend
            const payload = {
                ...formData,
                // Ensure numeric fields are numbers if needed, though backend seems to handle strings
            };

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success) {
                onSave();
                onClose();
            } else {
                alert(data.message || 'Erro ao salvar device');
            }
        } catch (error) {
            console.error('Error saving device:', error);
            alert('Erro ao conectar com o servidor');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-3xl border border-gray-100 flex flex-col max-h-[90vh]">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 flex justify-between items-center shrink-0">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                <Monitor className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">
                                    {device ? 'Editar Equipamento' : 'Novo Equipamento'}
                                </h2>
                                <p className="text-blue-100 text-xs">Preencha as informações do device</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="overflow-y-auto">
                        <div className="p-6 space-y-8">

                            {/* Section: Basic Info */}
                            <div>
                                <div className="flex items-center space-x-2 mb-4">
                                    <div className="h-4 w-1 bg-blue-600 rounded-full"></div>
                                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider text-xs">Informações Básicas</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tipo</label>
                                        <select
                                            name="tipo"
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block p-3 outline-none transition-all"
                                            value={formData.tipo}
                                            onChange={handleChange}
                                        >
                                            <option value="MacBook">MacBook</option>
                                            <option value="iPad">iPad</option>
                                            <option value="iPhone">iPhone</option>
                                            <option value="Apple Watch">Apple Watch</option>
                                            <option value="Apple TV">Apple TV</option>
                                            <option value="Acessório">Acessório</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-2 lg:col-span-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nome (Identificador)</label>
                                        <input
                                            type="text"
                                            name="nome"
                                            required
                                            placeholder="Ex: MacBook do João"
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block p-3 outline-none transition-all placeholder:text-gray-400"
                                            value={formData.nome || ''}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Série / Serial</label>
                                        <input
                                            type="text"
                                            name="numero_serie"
                                            required
                                            placeholder="Ex: C02X..."
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block p-3 outline-none transition-all uppercase placeholder:text-gray-400"
                                            value={formData.numero_serie || ''}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Modelo</label>
                                        <input
                                            type="text"
                                            name="modelo"
                                            placeholder="Ex: Pro M1"
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block p-3 outline-none transition-all placeholder:text-gray-400"
                                            value={formData.modelo || ''}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cor</label>
                                        <input
                                            type="text"
                                            name="cor"
                                            placeholder="Ex: Space Gray"
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block p-3 outline-none transition-all placeholder:text-gray-400"
                                            value={formData.cor || ''}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ano</label>
                                        <input
                                            type="text"
                                            name="ano"
                                            placeholder="Ex: 2021"
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block p-3 outline-none transition-all placeholder:text-gray-400"
                                            value={formData.ano || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Technical Info */}
                            <div>
                                <div className="flex items-center space-x-2 mb-4">
                                    <div className="h-4 w-1 bg-indigo-600 rounded-full"></div>
                                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider text-xs">Especificações Técnicas</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Chip / Processador</label>
                                        <input
                                            type="text"
                                            name="chip"
                                            placeholder="Ex: M1 Pro"
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block p-3 outline-none transition-all placeholder:text-gray-400"
                                            value={formData.chip || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Memória (RAM)</label>
                                        <input
                                            type="text"
                                            name="memoria"
                                            placeholder="Ex: 16GB"
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block p-3 outline-none transition-all placeholder:text-gray-400"
                                            value={formData.memoria || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tamanho (Pol)</label>
                                        <input
                                            type="text"
                                            name="polegadas"
                                            placeholder="Ex: 14"
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block p-3 outline-none transition-all placeholder:text-gray-400"
                                            value={formData.polegadas || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Status */}
                            <div>
                                <div className="flex items-center space-x-2 mb-4">
                                    <div className="h-4 w-1 bg-emerald-600 rounded-full"></div>
                                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider text-xs">Estado & Controle</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Versão do SO</label>
                                        <input
                                            type="text"
                                            name="versao_os"
                                            placeholder="Ex: macOS Sonoma"
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block p-3 outline-none transition-all placeholder:text-gray-400"
                                            value={formData.versao_os || ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status Inicial</label>
                                        <select
                                            name="status"
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block p-3 outline-none transition-all"
                                            value={formData.status}
                                            onChange={handleChange}
                                        >
                                            <option value="Disponível">Disponível</option>
                                            <option value="Manutenção">Manutenção</option>
                                            <option value="Perdido">Perdido</option>
                                        </select>
                                    </div>
                                    <div className="flex items-start pt-8">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="para_emprestimo"
                                                className="sr-only peer"
                                                checked={formData.para_emprestimo}
                                                onChange={handleChange}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            <span className="ml-3 text-sm font-bold text-gray-700">Para Empréstimo?</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Observations */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Observações Detalhadas</label>
                                <textarea
                                    name="observacao"
                                    rows="3"
                                    placeholder="Informações adicionais, defeitos ou detalhes importantes..."
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block p-4 outline-none transition-all placeholder:text-gray-400 resize-none"
                                    value={formData.observacao || ''}
                                    onChange={handleChange}
                                ></textarea>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50/80 px-8 py-6 flex justify-end gap-4 shrink-0 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all font-bold shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-3"></div>
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 mr-2" />
                                        {device ? 'Salvar Alterações' : 'Cadastrar Device'}
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
