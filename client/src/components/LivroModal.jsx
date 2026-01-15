import React, { useState, useEffect } from 'react';
import { X, Save, Book, AlignLeft, Calendar, Tag, Layers, Type } from 'lucide-react';

const LivroModal = ({ isOpen, onClose, onSave, livro }) => {
    const [formData, setFormData] = useState({
        titulo: '',
        autor: '',
        isbn: '',
        categoria: '',
        ano: '',
        editora: '',
        edicao: '',
        descricao: ''
    });

    useEffect(() => {
        if (livro) {
            setFormData({
                titulo: livro.titulo || '',
                autor: livro.autor || '',
                isbn: livro.isbn || '',
                categoria: livro.categoria || '',
                ano: livro.ano || '',
                editora: livro.editora || '',
                edicao: livro.edicao || '',
                descricao: livro.descricao || ''
            });
        } else {
            setFormData({
                titulo: '',
                autor: '',
                isbn: '',
                categoria: '',
                ano: '',
                editora: '',
                edicao: '',
                descricao: ''
            });
        }
    }, [livro, isOpen]);

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
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-gray-100">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                <Book className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold leading-6 text-white">
                                    {livro ? 'Editar Livro' : 'Novo Livro'}
                                </h3>
                                <p className="text-blue-100 text-sm mt-0.5">Detalhes da obra</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Título & Autor - Full Width on mobile, distinct cols */}
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 ml-1">Título da Obra *</label>
                                <input
                                    type="text"
                                    name="titulo"
                                    value={formData.titulo}
                                    onChange={handleChange}
                                    required
                                    className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                    placeholder="Ex: Clean Code"
                                />
                            </div>

                            <div className="md:col-span-2 space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                    <Type className="w-4 h-4 mr-1.5 text-gray-400" />
                                    Autor(es) *
                                </label>
                                <input
                                    type="text"
                                    name="autor"
                                    value={formData.autor}
                                    onChange={handleChange}
                                    required
                                    className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                    placeholder="Ex: Robert C. Martin"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                    <Tag className="w-4 h-4 mr-1.5 text-gray-400" />
                                    ISBN
                                </label>
                                <input
                                    type="text"
                                    name="isbn"
                                    value={formData.isbn}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm font-mono"
                                    placeholder="978-0-..."
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                    <Layers className="w-4 h-4 mr-1.5 text-gray-400" />
                                    Categoria
                                </label>
                                <div className="relative">
                                    <select
                                        name="categoria"
                                        value={formData.categoria}
                                        onChange={handleChange}
                                        className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm appearance-none"
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="Tecnologia">Tecnologia</option>
                                        <option value="Design">Design</option>
                                        <option value="Negócios">Negócios</option>
                                        <option value="Inovação">Inovação</option>
                                        <option value="Outros">Outros</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                    <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                                    Ano de Publicação
                                </label>
                                <input
                                    type="number"
                                    name="ano"
                                    value={formData.ano}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                    placeholder="Ex: 2024"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 ml-1">Editora</label>
                                <input
                                    type="text"
                                    name="editora"
                                    value={formData.editora}
                                    onChange={handleChange}
                                    className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                />
                            </div>

                            <div className="md:col-span-2 space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                    <AlignLeft className="w-4 h-4 mr-1.5 text-gray-400" />
                                    Descrição
                                </label>
                                <textarea
                                    name="descricao"
                                    value={formData.descricao}
                                    onChange={handleChange}
                                    rows="3"
                                    className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm resize-none"
                                    placeholder="Sinopse ou observações sobre o livro..."
                                ></textarea>
                            </div>
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
export default LivroModal;
