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
        <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Hero Section with Integrated Search */}
            <div className="relative mb-16 rounded-[3rem] overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-black p-12 md:p-20 text-center shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-600 rounded-full blur-[120px]"></div>
                </div>

                <div className="relative z-10 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 rounded-full text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-6 backdrop-blur-sm border border-indigo-400/20">
                        <Book size={14} />
                        Acervo Acadêmico Digital
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter leading-none">
                        CONHECIMENTO EM <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">EVOLUÇÃO CONSTANTE</span>
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl font-medium mb-12 max-w-xl mx-auto">
                        Explore centenas de títulos técnicos, literários e recursos exclusivos da Apple Academy.
                    </p>

                    <div className="relative group max-w-2xl mx-auto">
                        <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={24} />
                        <input
                            type="text"
                            placeholder="Pesquisar por título, autor ou categoria..."
                            className="w-full pl-16 pr-8 py-6 bg-white/10 border border-white/10 rounded-[2.5rem] focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:bg-white transition-all text-white focus:text-slate-900 text-xl font-medium backdrop-blur-md shadow-2xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="animate-pulse bg-slate-50 rounded-[2.5rem] h-[500px]"></div>
                    ))}
                </div>
            ) : filteredLivros.length === 0 ? (
                <div className="text-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <div className="p-8 bg-white rounded-full w-fit mx-auto shadow-sm mb-8">
                        <Book size={64} className="text-slate-200" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Acervo não localizado</h3>
                    <p className="text-slate-500 font-medium">Não encontramos nenhum resultado para sua busca atual.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                    {filteredLivros.map(livro => (
                        <div key={livro.id} className="bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 overflow-hidden flex flex-col group relative">
                            {/* Visual Header / Cover Area */}
                            <div className="h-64 bg-slate-50 relative overflow-hidden flex items-center justify-center p-8">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>

                                {/* Depth-Styled Book Placeholder */}
                                <div className="w-32 h-44 bg-white shadow-[10px_10px_30px_rgba(0,0,0,0.1)] rounded-sm border-l-8 border-indigo-600 flex items-center justify-center transform group-hover:rotate-2 group-hover:scale-105 transition-all duration-500 relative z-10 group-hover:shadow-[20px_20px_50px_rgba(0,0,0,0.15)]">
                                    <Book size={48} className="text-slate-100" />
                                </div>

                                {/* Floating Categoria Badge */}
                                {livro.categoria && (
                                    <span className="absolute top-6 right-6 bg-white/95 backdrop-blur-md text-[10px] font-black px-4 py-2 rounded-2xl text-slate-900 shadow-sm border border-slate-100 z-20 uppercase tracking-widest">
                                        {livro.categoria}
                                    </span>
                                )}
                            </div>

                            <div className="p-10 flex-1 flex flex-col">
                                <div className="mb-4">
                                    <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2" title={livro.titulo}>
                                        {livro.titulo}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-[2px] bg-indigo-500 rounded-full"></div>
                                        <p className="text-slate-400 font-bold text-sm tracking-tight">{livro.autor}</p>
                                    </div>
                                </div>

                                <div className="mt-auto pt-8 border-t border-slate-50 flex items-center justify-between">
                                    <span className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">
                                        Ref: {livro.ano || '---'}
                                    </span>

                                    <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${livro.disponiveis > 0
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                                        }`}>
                                        {livro.disponiveis > 0 ? (
                                            <span className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                {livro.disponiveis} Exemplares
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <CircleAlert size={14} /> Esgotado
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
