import React, { useState, useEffect } from 'react';
import { Search, Book, CircleAlert } from 'lucide-react';

const LivrosPublic = () => {
    const [livros, setLivros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCatalogo();
    }, []);

    const fetchCatalogo = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/livros');
            const data = await response.json();
            if (data.success) {
                setLivros(data.data);
            }
        } catch (error) {
            console.error('Erro ao buscar catálogo:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLivros = livros.filter(livro =>
        livro.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        livro.autor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (livro.categoria && livro.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Biblioteca da Apple Academy</h1>
                <p className="text-gray-500">Explore nosso acervo de livros e recursos.</p>

                <div className="mt-6 max-w-2xl mx-auto relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Pesquisar por título, autor ou categoria..."
                        className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Carregando acervo...</p>
                </div>
            ) : filteredLivros.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Book size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">Nenhum livro encontrado para sua pesquisa.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredLivros.map(livro => (
                        <div key={livro.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden flex flex-col h-full group">
                            <div className="h-48 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                                {/* Placeholder for Book Cover - Could be replaced with real image if API supports it */}
                                <div className="w-24 h-36 bg-white shadow-lg rounded border border-gray-200 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                                    <Book size={32} className="text-gray-300" />
                                </div>

                                {/* Categoria Badge */}
                                {livro.categoria && (
                                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur text-xs font-semibold px-2 py-1 rounded text-gray-600 shadow-sm">
                                        {livro.categoria}
                                    </span>
                                )}
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1 line-clamp-2" title={livro.titulo}>
                                    {livro.titulo}
                                </h3>
                                <p className="text-gray-500 text-sm mb-4">{livro.autor}</p>

                                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                                    <span className="text-xs font-mono text-gray-400">
                                        {livro.ano ? `${livro.ano}` : ''}
                                    </span>

                                    <div className={`text-sm font-medium px-3 py-1 rounded-full ${livro.disponiveis > 0
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                        {livro.disponiveis > 0 ? (
                                            <span>{livro.disponiveis} disponível{livro.disponiveis > 1 ? 'is' : ''}</span>
                                        ) : (
                                            <span className="flex items-center gap-1">
                                                <CircleAlert size={14} /> Indisponível
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LivrosPublic;
