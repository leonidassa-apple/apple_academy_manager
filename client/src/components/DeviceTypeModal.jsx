import { useState, useEffect } from 'react';
import { X, Smartphone, Tag, FileText, ToggleLeft, Save, Component } from 'lucide-react';

export default function DeviceTypeModal({ isOpen, onClose, onSave, deviceType }) {
    const [formData, setFormData] = useState({
        nome: '',
        categoria: 'Smartphone',
        descricao: '',
        para_emprestimo: true
    });

    const categorias = [
        'Smartphone',
        'Tablet',
        'Notebook',
        'Desktop',
        'Wearable',
        'VR/AR',
        'Acessório',
        'Áudio',
        'Outros'
    ];

    useEffect(() => {
        if (deviceType) {
            setFormData({
                nome: deviceType.nome || '',
                categoria: deviceType.categoria || 'Smartphone',
                descricao: deviceType.descricao || '',
                para_emprestimo: deviceType.para_emprestimo !== undefined ? deviceType.para_emprestimo : true
            });
        } else {
            setFormData({
                nome: '',
                categoria: 'Smartphone',
                descricao: '',
                para_emprestimo: true
            });
        }
    }, [deviceType, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const url = deviceType ? `/api/admin/tipos-devices/${deviceType.id}` : '/api/admin/tipos-devices';
        const method = deviceType ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (data.success) {
                onSave();
                onClose();
            } else {
                alert(data.message || 'Erro ao salvar tipo de device');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Erro ao salvar tipo de device');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-100">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                <Component className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold leading-6 text-white">
                                    {deviceType ? 'Editar Tipo' : 'Novo Tipo de Device'}
                                </h3>
                                <p className="text-blue-100 text-sm mt-0.5">Configuração do catálogo</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                <Tag className="w-4 h-4 mr-1.5 text-gray-400" />
                                Nome do Modelo *
                            </label>
                            <input
                                type="text"
                                required
                                className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                placeholder="Ex: iPhone 15 Pro"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                <Smartphone className="w-4 h-4 mr-1.5 text-gray-400" />
                                Categoria *
                            </label>
                            <div className="relative">
                                <select
                                    required
                                    className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm appearance-none"
                                    value={formData.categoria}
                                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                >
                                    {categorias.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                <FileText className="w-4 h-4 mr-1.5 text-gray-400" />
                                Descrição
                            </label>
                            <textarea
                                rows={3}
                                className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm resize-none"
                                value={formData.descricao}
                                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                placeholder="Detalhes técnicos ou observações..."
                            />
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100 hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => setFormData({ ...formData, para_emprestimo: !formData.para_emprestimo })}>
                            <div className={`w-11 h-6 flex items-center bg-gray-200 rounded-full p-1 duration-300 ease-in-out ${formData.para_emprestimo ? 'bg-blue-600' : ''}`}>
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${formData.para_emprestimo ? 'translate-x-5' : ''}`}></div>
                            </div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer select-none">
                                <ToggleLeft className="w-4 h-4 text-blue-600" />
                                Disponível para Empréstimo
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex items-center px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all shadow-md hover:shadow-lg transform active:scale-95"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Salvar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
