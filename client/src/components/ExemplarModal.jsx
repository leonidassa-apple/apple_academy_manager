import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            {exemplar ? 'Editar Exemplar' : 'Novo Exemplar'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">{livroTitulo}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Código de Barras *</label>
                        <input
                            type="text"
                            name="codigo_barras"
                            value={formData.codigo_barras}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Escaneie ou digite o código"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                        <input
                            type="text"
                            name="localizacao"
                            value={formData.localizacao}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Estante A, Prateleira 2"
                        />
                    </div>

                    {exemplar && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Disponível">Disponível</option>
                                <option value="Emprestado">Emprestado</option>
                                <option value="Manutenção">Manutenção</option>
                                <option value="Perdido">Perdido</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
                        <textarea
                            name="observacao"
                            value={formData.observacao}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
                        >
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExemplarModal;
