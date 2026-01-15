import React, { useState, useEffect } from 'react';
import { Plus, Search, BookOpen, Edit, Trash2, Layers, Barcode } from 'lucide-react';
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
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <BookOpen className="text-blue-600" />
                        Gerenciamento de Acervo
                    </h1>
                    <p className="text-gray-500 mt-1">Gerencie os livros e exemplares da biblioteca.</p>
                </div>
                <button
                    onClick={handleCreateLivro}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    Novo Livro
                </button>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Book List - Takes up 2/3 if Exemplars view is active, else full width */}
                <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${viewingExemplaresFor ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por título, autor ou ISBN..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                                <tr>
                                    <th className="px-6 py-3">Título / Autor</th>
                                    <th className="px-6 py-3 hidden md:table-cell">Categoria</th>
                                    <th className="px-6 py-3 hidden md:table-cell">ISBN</th>
                                    <th className="px-6 py-3 text-center">Exemplares</th>
                                    <th className="px-6 py-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Carregando acervo...</td></tr>
                                ) : filteredLivros.length === 0 ? (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Nenhum livro encontrado.</td></tr>
                                ) : (
                                    filteredLivros.map(livro => (
                                        <tr key={livro.id} className={`hover:bg-gray-50 transition-colors ${viewingExemplaresFor?.id === livro.id ? 'bg-blue-50' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{livro.titulo}</div>
                                                <div className="text-sm text-gray-500">{livro.autor}</div>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-600">{livro.categoria || '-'}</td>
                                            <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-500 font-mono">{livro.isbn || '-'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${livro.disponiveis > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {livro.disponiveis} / {livro.total_exemplares}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleManageExemplares(livro)}
                                                    className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 transition-colors"
                                                    title="Gerenciar Exemplares"
                                                >
                                                    <Layers size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleEditLivro(livro)}
                                                    className="text-amber-600 hover:text-amber-800 p-1 rounded hover:bg-amber-100 transition-colors"
                                                    title="Editar Detalhes"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Exemplares Sidebar - Only visible when a book is selected */}
                {viewingExemplaresFor && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-200px)] sticky top-6">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <div>
                                <h3 className="font-semibold text-gray-800">Exemplares</h3>
                                <p className="text-xs text-gray-500 truncate max-w-[150px]">{viewingExemplaresFor.titulo}</p>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={handleCreateExemplar}
                                    className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 transition"
                                    title="Adicionar Exemplar"
                                >
                                    <Plus size={16} />
                                </button>
                                <button
                                    onClick={() => setViewingExemplaresFor(null)}
                                    className="text-gray-400 hover:text-gray-600 p-1.5"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {exemplares.length === 0 ? (
                                <div className="text-center text-gray-500 py-8 text-sm">
                                    Nenhum exemplar cadastrado.
                                </div>
                            ) : (
                                exemplares.map(ex => (
                                    <div key={ex.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow bg-white">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <Barcode size={16} className="text-gray-400" />
                                                <span className="font-mono text-sm font-medium">{ex.codigo_barras}</span>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${ex.status === 'Disponível' ? 'bg-green-100 text-green-800' :
                                                    ex.status === 'Emprestado' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {ex.status}
                                            </span>
                                        </div>

                                        {ex.localizacao && (
                                            <div className="text-xs text-gray-500 mb-1">
                                                <span className="font-medium">Local:</span> {ex.localizacao}
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-gray-50">
                                            <button
                                                onClick={() => handleEditExemplar(ex)}
                                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDeleteExemplar(ex.id)}
                                                className="text-xs text-red-600 hover:text-red-800 font-medium"
                                            >
                                                Excluir
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
