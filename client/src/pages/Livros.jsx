import React, { useState, useEffect } from 'react';
import { Plus, Search, BookOpen, Edit, Trash2, Layers, Barcode, X, CheckCircle, Smartphone, RefreshCw, SearchX } from 'lucide-react';
import LivroModal from '../components/LivroModal';
import ExemplarModal from '../components/ExemplarModal';

const Livros = () => {
    const [livros, setLivros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLivro, setSelectedLivro] = useState(null);
    const [isLivroModalOpen, setIsLivroModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Exemplares state
    const [exemplares, setExemplares] = useState([]);
    const [selectedExemplar, setSelectedExemplar] = useState(null);
    const [isExemplarModalOpen, setIsExemplarModalOpen] = useState(false);
    const [viewingExemplaresFor, setViewingExemplaresFor] = useState(null);

    useEffect(() => {
        fetchLivros();
    }, []);

    const fetchLivros = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/livros');
            const data = await response.json();
            if (data.success) {
                setLivros(data.data);
            }
        } catch (error) {
            console.error('Erro ao buscar livros:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchExemplares = async (livroId) => {
        try {
            const response = await fetch(`/api/exemplares?livro_id=${livroId}`);
            const data = await response.json();
            if (data.success) {
                setExemplares(data.data);
            }
        } catch (error) {
            console.error('Erro ao buscar exemplares:', error);
        }
    };

    const handleCreateLivro = () => {
        setSelectedLivro(null);
        setIsLivroModalOpen(true);
    };

    const handleEditLivro = (livro) => {
        setSelectedLivro(livro);
        setIsLivroModalOpen(true);
    };

    const handleSaveLivro = async (formData) => {
        // Basic formatting for ISBN/Year if needed
        try {
            // Convert formData to url encoded form data since backend expects request.form for books
            // (as per previous analysis of api_livros POST)
            const form = new FormData();
            Object.keys(formData).forEach(key => form.append(key, formData[key]));

            const url = '/api/livros';
            const method = selectedLivro ? 'PUT' : 'POST';

            if (selectedLivro) {
                form.append('id', selectedLivro.id);
            }

            const response = await fetch(url, {
                method: method,
                body: form,
            });

            const data = await response.json();
            if (data.success) {
                setIsLivroModalOpen(false);
                fetchLivros();
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Erro ao salvar livro:', error);
        }
    };

    const handleDeleteLivro = async (livroId) => {
        if (!window.confirm('Tem certeza que deseja excluir este livro? Todos os exemplares devem ser removidos primeiro.')) return;
        try {
            const response = await fetch(`/api/livros?id=${livroId}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                fetchLivros();
                if (viewingExemplaresFor?.id === livroId) {
                    setViewingExemplaresFor(null);
                }
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Erro ao excluir livro:', error);
        }
    };

    const handleManageExemplares = (livro) => {
        setViewingExemplaresFor(livro);
        fetchExemplares(livro.id);
    };

    const handleCreateExemplar = () => {
        setSelectedExemplar(null);
        setIsExemplarModalOpen(true);
    };

    const handleEditExemplar = (exemplar) => {
        setSelectedExemplar(exemplar);
        setIsExemplarModalOpen(true);
    };

    const handleDeleteExemplar = async (exemplarId) => {
        if (!window.confirm('Tem certeza que deseja excluir este exemplar?')) return;
        try {
            const response = await fetch(`/api/exemplares?id=${exemplarId}`, { method: 'DELETE' });
            const data = await response.json();
            if (data.success) {
                fetchExemplares(viewingExemplaresFor.id);
                fetchLivros(); // Update counts
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveExemplar = async (formData) => {
        try {
            const method = selectedExemplar ? 'PUT' : 'POST';
            const body = {
                ...formData,
                livro_id: viewingExemplaresFor.id,
                id: selectedExemplar?.id
            };

            const response = await fetch('/api/exemplares', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            if (data.success) {
                setIsExemplarModalOpen(false);
                fetchExemplares(viewingExemplaresFor.id);
                fetchLivros(); // To update availability counts
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Erro ao salvar exemplar:', error);
        }
    };

    const filteredLivros = livros.filter(livro =>
        livro.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        livro.autor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (livro.isbn && livro.isbn.includes(searchTerm))
    );

    return (
        <div className="p-6 max-w-[1700px] mx-auto animate-in fade-in duration-700">
            {/* Premium Header Segment */}
            <div className="bg-white rounded-[2rem] p-8 mb-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-80 h-80 bg-blue-50/50 rounded-full -ml-40 -mt-40 blur-3xl"></div>

                <div className="relative z-10 flex items-center gap-6">
                    <div className="p-4 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl shadow-xl shadow-indigo-200">
                        <BookOpen size={36} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Gestão de Acervo</h1>
                        <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Biblioteca Inteligente & Controle de Exemplares
                        </p>
                    </div>
                </div>

                <div className="relative z-10">
                    <button
                        onClick={handleCreateLivro}
                        className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-2xl hover:from-indigo-700 hover:to-blue-800 transition-all font-black text-sm shadow-xl shadow-indigo-200 active:scale-95 group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        Novo Livro
                    </button>
                </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                        <BookOpen size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Títulos</p>
                        <p className="text-3xl font-black text-slate-900 mt-1 leading-none">{livros.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        <Layers size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Exemplares</p>
                        <p className="text-3xl font-black text-slate-900 mt-1 leading-none">{livros.reduce((acc, curr) => acc + (curr.total_exemplares || 0), 0)}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                        <CheckCircle size={28} className="text-emerald-500 group-hover:text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Disponíveis</p>
                        <p className="text-3xl font-black text-slate-900 mt-1 leading-none">{livros.reduce((acc, curr) => acc + (curr.disponiveis || 0), 0)}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group">
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                        <Smartphone size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Emprestados</p>
                        <p className="text-3xl font-black text-slate-900 mt-1 leading-none">
                            {livros.reduce((acc, curr) => acc + (curr.total_exemplares - curr.disponiveis || 0), 0)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Split Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Book List - Left Panel */}
                <div className={`bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden ${viewingExemplaresFor ? 'lg:col-span-8' : 'lg:col-span-12'} transition-all duration-500`}>
                    <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="relative flex-1 w-full max-w-lg group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por título, autor, categoria ou ISBN..."
                                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-700 font-bold placeholder:text-slate-400 shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={fetchLivros}
                                className="p-4 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all shadow-sm group"
                                title="Atualizar Lista"
                            >
                                <RefreshCw size={20} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left order-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-50">
                                    <th className="px-8 py-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Título & Autor</th>
                                    <th className="px-8 py-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] hidden xl:table-cell">Categoria</th>
                                    <th className="px-8 py-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] hidden sm:table-cell">ISBN / Registro</th>
                                    <th className="px-8 py-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] text-center">Status Interno</th>
                                    <th className="px-8 py-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] text-right text-xs">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading && livros.length === 0 ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="5" className="px-8 py-10"><div className="h-10 bg-slate-50 rounded-2xl w-full"></div></td>
                                        </tr>
                                    ))
                                ) : filteredLivros.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                                    <SearchX size={48} strokeWidth={1} className="text-slate-300" />
                                                </div>
                                                <p className="text-2xl font-black text-slate-900">O acervo está em silêncio</p>
                                                <p className="text-slate-500 font-medium mt-2">Nenhum livro corresponde à sua busca atual.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLivros.map(livro => (
                                        <tr key={livro.id} className={`hover:bg-indigo-50/20 transition-all group ${viewingExemplaresFor?.id === livro.id ? 'bg-indigo-50/40' : ''}`}>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-white border border-slate-100 rounded-xl group-hover:scale-110 transition-transform shadow-sm">
                                                        <BookOpen size={20} className="text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-base leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight truncate max-w-[200px]" title={livro.titulo}>
                                                            {livro.titulo}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">{livro.autor}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 hidden xl:table-cell">
                                                <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest">{livro.categoria || 'Geral'}</span>
                                            </td>
                                            <td className="px-8 py-6 hidden sm:table-cell">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <Barcode size={12} className="text-slate-300" />
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-tighter">{livro.isbn || 'SEM REGISTRO'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="inline-flex items-center bg-white border border-slate-100 rounded-2xl p-1 pr-4 gap-3 shadow-sm group-hover:border-indigo-200 transition-colors">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${livro.disponiveis > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                        }`}>
                                                        {livro.disponiveis}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Disponíveis</p>
                                                        <p className="text-[9px] font-bold text-slate-300 uppercase mt-1">De {livro.total_exemplares} Exemplares</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleManageExemplares(livro)}
                                                        className="p-3 bg-white border border-slate-100 hover:border-indigo-500 hover:text-indigo-600 rounded-xl transition-all shadow-sm"
                                                        title="Gerenciar Exemplares"
                                                    >
                                                        <Layers size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditLivro(livro)}
                                                        className="p-3 bg-white border border-slate-100 hover:border-amber-500 hover:text-amber-600 rounded-xl transition-all shadow-sm"
                                                        title="Editar Livro"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteLivro(livro.id)}
                                                        className="p-3 bg-white border border-slate-100 hover:border-rose-500 hover:text-rose-600 rounded-xl transition-all shadow-sm"
                                                        title="Excluir Registro"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Exemplares Sidebar - Right Panel */}
                {viewingExemplaresFor && (
                    <div className="lg:col-span-4 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col max-h-[calc(100vh-200px)] sticky top-6 animate-in slide-in-from-right duration-500 overflow-hidden">
                        <div className="p-8 border-b border-indigo-50 bg-indigo-50/20 relative">
                            <button
                                onClick={() => setViewingExemplaresFor(null)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                            >
                                <X size={24} />
                            </button>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
                                    <Layers size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 leading-tight">Exemplares</h3>
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1 truncate max-w-[180px]">
                                        {viewingExemplaresFor.titulo}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleCreateExemplar}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-white border-2 border-dashed border-indigo-200 text-indigo-600 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all font-black uppercase text-xs tracking-widest"
                            >
                                <Plus size={18} />
                                Adicionar Novo Item
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/20">
                            {exemplares.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-50 shadow-sm">
                                        <Layers size={32} className="text-slate-200" />
                                    </div>
                                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Nenhum exemplar</p>
                                </div>
                            ) : (
                                exemplares.map(ex => (
                                    <div key={ex.id} className="relative bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group/card">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Código Identificador</p>
                                                    <p className="font-mono text-sm font-black text-slate-900 mt-1">{ex.codigo_barras}</p>
                                                </div>
                                            </div>
                                            <span className={`inline-flex items-center px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-sm ${ex.status === 'Disponível' ? 'bg-emerald-50 text-emerald-700' :
                                                ex.status === 'Emprestado' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-500'
                                                }`}>
                                                {ex.status}
                                            </span>
                                        </div>

                                        <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl mb-4 border border-slate-50/50">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Localização Física:</span>
                                                <span className="text-xs font-bold text-slate-700">{ex.localizacao || 'Dante Alighieri'}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Setor:</span>
                                                <span className="text-xs font-bold text-slate-700">Acervo Principal</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 pt-2">
                                            <button
                                                onClick={() => handleEditExemplar(ex)}
                                                className="flex-1 py-3 bg-slate-50 text-slate-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all font-black uppercase text-[10px] tracking-widest"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDeleteExemplar(ex.id)}
                                                className="p-3 bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            <LivroModal
                isOpen={isLivroModalOpen}
                onClose={() => setIsLivroModalOpen(false)}
                onSave={handleSaveLivro}
                livro={selectedLivro}
            />

            <ExemplarModal
                isOpen={isExemplarModalOpen}
                onClose={() => setIsExemplarModalOpen(false)}
                onSave={handleSaveExemplar}
                exemplar={selectedExemplar}
                livroTitulo={viewingExemplaresFor?.titulo}
            />
        </div>
    );
};

export default Livros;
