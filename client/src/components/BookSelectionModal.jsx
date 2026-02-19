import { useState, useEffect } from 'react';
import { X, Search, BookOpen, AlertCircle } from 'lucide-react';

export default function BookSelectionModal({ isOpen, onClose, onSelectBook }) {
    const [loading, setLoading] = useState(false);
    const [books, setBooks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        if (isOpen) {
            fetchBooks(1, '');
            setUniqueSearch('');
        }
    }, [isOpen]);

    // Debounce search
    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(() => {
            fetchBooks(1, searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, isOpen]);

    const setUniqueSearch = (term) => {
        setSearchTerm(term);
    };

    const fetchBooks = async (pageNum, search) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pageNum,
                per_page: 8,
                search: search
            });
            const res = await fetch(`/api/livros?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setBooks(data.data);
                setTotalPages(data.pagination.total_pages);
                setPage(pageNum);
            }
        } catch (error) {
            console.error("Erro ao buscar livros:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (book) => {
        onSelectBook(book);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="relative w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-slate-100 flex flex-col max-h-[90vh]">

                    {/* Header */}
                    <div className="bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Selecionar Livro</h3>
                            <p className="text-sm text-slate-500">Busque por título, autor ou ISBN</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="p-6 bg-slate-50 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Digite o nome do livro..."
                                value={searchTerm}
                                onChange={(e) => setUniqueSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-3 opacity-50">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="text-sm font-medium text-slate-500">Carregando catálogo...</span>
                            </div>
                        ) : books.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <AlertCircle className="w-8 h-8 text-slate-300" />
                                </div>
                                <h4 className="text-lg font-bold text-slate-700">Nenhum livro encontrado</h4>
                                <p className="text-slate-500 mt-1">Tente buscar por outros termos.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {books.map((book) => (
                                    <button
                                        key={book.id}
                                        onClick={() => handleSelect(book)}
                                        disabled={book.disponiveis === 0}
                                        className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all group ${book.disponiveis === 0
                                                ? 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'
                                                : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md hover:bg-blue-50/10'
                                            }`}
                                    >
                                        <div className={`p-3 rounded-lg ${book.disponiveis > 0
                                                ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                                                : 'bg-slate-100 text-slate-400'
                                            } transition-colors`}>
                                            <BookOpen size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 text-sm truncate">{book.titulo}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5 truncate">{book.autor}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${book.disponiveis > 0
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                        : 'bg-red-50 text-red-700 border-red-100'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${book.disponiveis > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                                    {book.disponiveis > 0 ? `${book.disponiveis} Disponíveis` : 'Indisponível'}
                                                </span>
                                                {book.localizacao && (
                                                    <span className="text-[10px] font-medium text-slate-400">
                                                        Loc: {book.localizacao}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer / Pagination */}
                    {totalPages > 1 && (
                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                            <button
                                onClick={() => fetchBooks(page - 1, searchTerm)}
                                disabled={page === 1}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                            >
                                Anterior
                            </button>
                            <span className="text-sm font-medium text-slate-500">
                                Página {page} de {totalPages}
                            </span>
                            <button
                                onClick={() => fetchBooks(page + 1, searchTerm)}
                                disabled={page === totalPages}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                            >
                                Próxima
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
