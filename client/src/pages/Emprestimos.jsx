import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Smartphone, User, RefreshCw, CheckCircle, Clock, SearchX, X, PenTool, Package, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import LoanModal from '../components/LoanModal';

export default function Emprestimos() {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // View detail modal state
    const [viewLoan, setViewLoan] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchLoans = () => {
        setLoading(true);
        fetch('/api/emprestimos/lista')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setLoans(data.data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchLoans();
    }, []);

    const handleReturn = async (id) => {
        if (!confirm('Confirmar devolução do item?')) return;

        try {
            const res = await fetch(`/api/emprestimos/${id}/devolver`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                fetchLoans();
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao devolver item');
        }
    };

    const filteredLoans = loans.filter(loan => {
        const matchesSearch = loan.aluno_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            loan.device_nome?.toLowerCase().includes(searchTerm.toLowerCase());

        if (showHistory) return matchesSearch;
        return matchesSearch && loan.status === 'Ativo';
    });

    const totalPages = Math.ceil(filteredLoans.length / itemsPerPage);
    const paginatedLoans = filteredLoans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="p-4 max-w-[1400px] mx-auto animate-in fade-in duration-700">
            {/* Premium Header Container */}
            <div className="bg-white rounded-[1.5rem] p-6 mb-6 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/50 rounded-full -mr-40 -mt-40 blur-3xl"></div>

                <div className="relative z-10 flex items-center gap-5">
                    <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-xl shadow-blue-200">
                        <Calendar className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Empréstimos</h1>
                        <div className="flex items-center gap-2 mt-1 text-slate-500 font-medium">
                            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                            Gestão de saída e devolução de equipamentos
                        </div>
                    </div>
                </div>

                <div className="relative z-10">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-800 transition-all font-black text-sm shadow-xl shadow-blue-200 active:scale-95 group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        Novo Empréstimo
                    </button>
                </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Geral</p>
                        <p className="text-2xl font-black text-slate-900 leading-none mt-1">{loans.length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Em Aberto</p>
                        <p className="text-2xl font-black text-slate-900 leading-none mt-1">{loans.filter(l => l.status === 'Ativo').length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Concluídos</p>
                        <p className="text-2xl font-black text-slate-900 leading-none mt-1">{loans.filter(l => l.status === 'Finalizado').length}</p>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm mb-6 flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por aluno, equipamento, número de série..."
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-sm text-slate-700 font-bold placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchLoans}
                        className="p-3 bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-100 rounded-xl transition-all"
                        title="Atualizar Lista"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`flex items-center gap-2 px-5 py-3 border rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm ${showHistory
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        <RefreshCw size={16} className={showHistory ? 'rotate-180' : ''} />
                        {showHistory ? 'Ocultar Histórico' : 'Ver Histórico'}
                    </button>
                </div>
            </div>

            {/* Main Table Area */}
            <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-4 py-4 font-black text-slate-400 text-[9px] uppercase tracking-[0.2em]">Responsável / Aluno</th>
                                <th className="px-4 py-4 font-black text-slate-400 text-[9px] uppercase tracking-[0.2em]">Equipamento</th>
                                <th className="px-4 py-4 font-black text-slate-400 text-[9px] uppercase tracking-[0.2em]">Datas</th>
                                <th className="px-4 py-4 font-black text-slate-400 text-[9px] uppercase tracking-[0.2em]">Status</th>
                                <th className="px-4 py-4 font-black text-slate-400 text-[9px] uppercase tracking-[0.2em] text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading && loans.length === 0 ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-8 py-10"><div className="h-10 bg-slate-50 rounded-2xl w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredLoans.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                                <SearchX size={48} strokeWidth={1} className="text-slate-300" />
                                            </div>
                                            <p className="text-2xl font-black text-slate-900 leading-tight">Nenhum registro encontrado</p>
                                            <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto">Tente ajustar seus termos de busca ou filtros.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedLoans.map((loan) => (
                                    <tr key={loan.id} className="hover:bg-blue-50/20 transition-all group">
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => setViewLoan(loan)}
                                                className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity cursor-pointer"
                                                title="Clique para ver detalhes do empréstimo"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-600 font-black text-base shadow-sm border-2 border-white group-hover:scale-105 transition-transform">
                                                    {loan.aluno_nome ? loan.aluno_nome.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div>
                                                    <p className="font-black text-blue-600 text-sm leading-tight uppercase tracking-tight underline decoration-blue-200 underline-offset-2 group-hover:decoration-blue-400 transition-colors">
                                                        {loan.aluno_nome}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <Eye size={10} className="text-slate-400" />
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Clique para visualizar</span>
                                                    </div>
                                                </div>
                                            </button>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                    <Smartphone size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-900 leading-tight">{loan.device_nome}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-tight">{loan.device_tipo}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                                                    <Calendar size={12} className="text-blue-500" />
                                                    <span className="text-slate-400 font-black text-[9px] uppercase">Saída:</span>
                                                    <span className="bg-blue-50 px-1.5 py-0.5 rounded text-blue-700">{new Date(loan.data_retirada).toLocaleDateString()}</span>
                                                </div>
                                                {loan.data_devolucao && (
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                                                        <Clock size={12} className="text-orange-400" />
                                                        <span className="text-slate-400 font-black text-[9px] uppercase">Prev:</span>
                                                        <span className="bg-orange-50 px-1.5 py-0.5 rounded text-orange-700">{new Date(loan.data_devolucao).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${loan.status === 'Ativo'
                                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                }`}>
                                                <span className={`w-1 h-1 rounded-full ${loan.status === 'Ativo' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                                                {loan.status === 'Ativo' ? 'Em Aberto' : 'Concluído'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {loan.status === 'Ativo' && (
                                                    <button
                                                        onClick={() => handleReturn(loan.id)}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 rounded-lg transition-all shadow-sm text-[9px] font-black uppercase tracking-widest active:scale-95 group/btn"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-blue-500 transition-colors" />
                                                        Devolver
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => setViewLoan(loan)}
                                                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                    title="Visualizar"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Modern Pagination Area - Standardized Premium Style */}
                <div className="mt-auto px-8 py-6 border-t border-slate-50 flex flex-col lg:flex-row items-center justify-between gap-6 bg-slate-50/30">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                            Mostrando <span className="text-blue-600 px-1">{filteredLoans.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} — {Math.min(currentPage * itemsPerPage, filteredLoans.length)}</span> de <span className="text-slate-900">{filteredLoans.length}</span> registros
                        </div>
                        <div className="relative group min-w-[140px]">
                            <select
                                className="w-full pl-5 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-600 uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 cursor-pointer appearance-none transition-all shadow-sm group-hover:border-blue-200"
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(parseInt(e.target.value));
                                    setCurrentPage(1);
                                }}
                            >
                                <option value={10}>Exibir 10</option>
                                <option value={20}>Exibir 20</option>
                                <option value={50}>Exibir 50</option>
                            </select>
                            <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="p-3 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 transition-all text-slate-600 disabled:opacity-30 disabled:hover:border-slate-200 shadow-sm"
                        >
                            <ChevronLeft size={22} />
                        </button>

                        <div className="flex items-center gap-2 mx-3">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) pageNum = i + 1;
                                else if (currentPage <= 3) pageNum = i + 1;
                                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                else pageNum = currentPage - 2 + i;

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-12 h-12 rounded-[1.25rem] font-black text-sm transition-all shadow-sm ${currentPage === pageNum ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-100 scale-110' : 'bg-white hover:bg-blue-50 text-slate-500 border border-slate-100 hover:border-blue-200'}`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-3 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 transition-all text-slate-600 disabled:opacity-30 disabled:hover:border-slate-200 shadow-sm"
                        >
                            <ChevronRight size={22} />
                        </button>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <LoanModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchLoans();
                    }}
                />
            )}

            {/* View Loan Detail Modal */}
            {viewLoan && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewLoan(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-indigo-700 sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <Eye size={20} className="text-white" />
                                <h2 className="text-xl font-black text-white tracking-tight">Detalhes do Empréstimo</h2>
                            </div>
                            <button onClick={() => setViewLoan(null)} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-6">
                            {/* Status Badge */}
                            <div className="flex justify-center">
                                <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest border shadow-sm ${viewLoan.status === 'Ativo'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}>
                                    <span className={`w-2 h-2 rounded-full ${viewLoan.status === 'Ativo' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                                    {viewLoan.status === 'Ativo' ? 'Empréstimo Ativo' : 'Empréstimo Concluído'}
                                </span>
                            </div>

                            {/* Student Info */}
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                <div className="flex items-center gap-4 mb-1">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-600 font-black text-lg">
                                        {viewLoan.aluno_nome ? viewLoan.aluno_nome.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aluno / Responsável</p>
                                        <p className="text-lg font-black text-slate-900 uppercase tracking-tight">{viewLoan.aluno_nome || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Device Info */}
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                                        <Smartphone size={22} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Equipamento</p>
                                        <p className="text-base font-black text-slate-900">{viewLoan.device_tipo || 'N/A'}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">S/N: {viewLoan.device_numero_serie || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 text-center">
                                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Data de Retirada</p>
                                    <p className="text-sm font-black text-blue-700">
                                        {viewLoan.data_retirada ? new Date(viewLoan.data_retirada).toLocaleDateString('pt-BR') : 'N/A'}
                                    </p>
                                </div>
                                <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 text-center">
                                    <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1">Previsão Devolução</p>
                                    <p className="text-sm font-black text-orange-700">
                                        {viewLoan.data_devolucao ? new Date(viewLoan.data_devolucao).toLocaleDateString('pt-BR') : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Accessories */}
                            {viewLoan.acessorios && (
                                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Package size={16} className="text-slate-400" />
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Acessórios</p>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700">{viewLoan.acessorios}</p>
                                </div>
                            )}

                            {/* Signature */}
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <PenTool size={16} className="text-slate-400" />
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assinatura do Aluno</p>
                                </div>
                                {viewLoan.assinatura ? (
                                    <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-4 flex items-center justify-center min-h-[120px]">
                                        <img
                                            src={viewLoan.assinatura}
                                            alt="Assinatura do aluno"
                                            className="max-w-full max-h-[150px] object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-6 flex items-center justify-center min-h-[120px]">
                                        <p className="text-sm font-bold text-slate-400 italic">Nenhuma assinatura registrada</p>
                                    </div>
                                )}
                            </div>

                            {/* Close button */}
                            <button
                                onClick={() => setViewLoan(null)}
                                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
