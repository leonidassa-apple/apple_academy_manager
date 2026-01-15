import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">
                        {device ? 'Editar Device' : 'Novo Device'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="col-span-1 md:col-span-2 lg:col-span-3">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Informações Básicas</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                            <select
                                name="tipo"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome (Identificador)</label>
                            <input
                                type="text"
                                name="nome"
                                required
                                placeholder="Ex: MacBook do João"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={formData.nome}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Número de Série</label>
                            <input
                                type="text"
                                name="numero_serie"
                                required
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 uppercase"
                                value={formData.numero_serie}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                            <input
                                type="text"
                                name="modelo"
                                placeholder="Ex: Pro M1"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={formData.modelo}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                            <input
                                type="text"
                                name="cor"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={formData.cor}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
                            <input
                                type="text"
                                name="ano"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={formData.ano}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-2">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Especificações</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Chip/Processador</label>
                            <input
                                type="text"
                                name="chip"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={formData.chip}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Memória</label>
                            <input
                                type="text"
                                name="memoria"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={formData.memoria}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho (Pol)</label>
                            <input
                                type="text"
                                name="polegadas"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={formData.polegadas}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-2">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Estado & Controle</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Versão OS</label>
                            <input
                                type="text"
                                name="versao_os"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={formData.versao_os}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status Atual</label>
                            <select
                                name="status"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="Disponível">Disponível</option>
                                <option value="Emprestado">Emprestado</option>
                                <option value="Manutenção">Manutenção</option>
                                <option value="Perdido">Perdido</option>
                            </select>
                        </div>

                        <div className="flex items-center pt-6">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="para_emprestimo"
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    checked={formData.para_emprestimo}
                                    onChange={handleChange}
                                />
                                <span className="text-gray-700 font-medium">Disponível para Empréstimo?</span>
                            </label>
                        </div>

                        <div className="col-span-1 md:col-span-2 lg:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                            <textarea
                                name="observacao"
                                rows="3"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={formData.observacao}
                                onChange={handleChange}
                            ></textarea>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? 'Salvando...' : 'Salvar Device'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
