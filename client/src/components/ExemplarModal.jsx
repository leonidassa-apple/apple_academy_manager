import React, { useState, useEffect } from 'react';
import { X, Save, Barcode, MapPin, AlertCircle, Info } from 'lucide-react';

const ExemplarModal = ({ isOpen, onClose, onSave, exemplar, livroTitulo }) => {
    const [formData, setFormData] = useState({
        codigo_barras: '',
        localizacao: '',
        observacao: '',
        status: 'Disponível'
    });

    useEffect(() => {
        if (exemplar) {
            setFormData({
                codigo_barras: exemplar.codigo_barras || '',
                localizacao: exemplar.localizacao || '',
                observacao: exemplar.observacao || '',
                status: exemplar.status || 'Disponível'
            });
        } else {
            setFormData({
                codigo_barras: '',
                localizacao: '',
                observacao: '',
                status: 'Disponível'
            });
        }
    }, [exemplar, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-gray-100">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 flex justify-between items-center">
                        <div className="flex items-center space-x-3 text-white">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                <Barcode className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold leading-6">
                                    {exemplar ? 'Editar Exemplar' : 'Novo Exemplar'}
                                </h3>
                                <p className="text-blue-100 text-xs mt-0.5 truncate max-w-[200px]">{livroTitulo}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                <Barcode className="w-4 h-4 mr-1.5 text-gray-400" />
                                Código de Barras *
                            </label>
                            <input
                                type="text"
                                name="codigo_barras"
                                value={formData.codigo_barras}
                                onChange={handleChange}
                                required
                                className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm font-mono placeholder-gray-400"
                                placeholder="Escaneie ou digite o código"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                                Localização
                            </label>
                            <input
                                type="text"
                                name="localizacao"
                                value={formData.localizacao}
                                onChange={handleChange}
                                className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                placeholder="Ex: Estante A, Prateleira 2"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1.5 text-gray-400" />
                                Status de Disponibilidade
                            </label>
                            <div className="relative">
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm appearance-none"
                                >
                                    <option value="Disponível">🟢 Disponível</option>
                                    <option value="Emprestado">🟡 Emprestado</option>
                                    <option value="Manutenção">🟠 Manutenção</option>
                                    <option value="Perdido">🔴 Perdido</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                <Info className="w-4 h-4 mr-1.5 text-gray-400" />
                                Observações
                            </label>
                            <textarea
                                name="observacao"
                                value={formData.observacao}
                                onChange={handleChange}
                                rows="3"
                                className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm resize-none"
                                placeholder="Condição física, restrições, etc..."
                            ></textarea>
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
};

export default ExemplarModal;

