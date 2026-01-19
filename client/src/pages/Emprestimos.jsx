import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, ChevronRight, Smartphone, User, RefreshCw, Filter, CheckCircle, Clock, SearchX, MousePointerClick } from 'lucide-react';
import LoanModal from '../components/LoanModal';

export default function Emprestimos() {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

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
        // Set up interval to refresh data occasionally? Or keep simple. 
        // Simple for now.
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
            alert('Erro ao devolver item'); // TODO: Replace with toast in future
        }
    };

    const filteredLoans = loans.filter(loan =>
        loan.aluno_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.device_nome?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Premium Header Container */}
            <div className="bg-white rounded-[2rem] p-8 mb-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        <RefreshCw size={28} className={loading ? 'animate-spin' : ''} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Geral</p>
                        <p className="text-3xl font-black text-slate-900 leading-none mt-1">{loans.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group">
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                        <Clock size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Em Aberto</p>
                        <p className="text-3xl font-black text-slate-900 leading-none mt-1">{loans.filter(l => l.status === 'Ativo').length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                        <CheckCircle size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Concluídos</p>
                        <p className="text-3xl font-black text-slate-900 leading-none mt-1">{loans.filter(l => l.status === 'Devolvido').length}</p>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm mb-8 flex flex-col lg:flex-row gap-5 items-center">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por aluno, equipamento, número de série..."
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-slate-700 font-bold placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchLoans}
                        className="p-4 bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-100 rounded-2xl transition-all"
                        title="Atualizar Lista"
                    >
                        <RefreshCw size={22} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                        <Filter size={18} />
                        Filtros
                    </button>
                </div>
            </div>

            {/* Main Table Area */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[500px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Responsável / Aluno</th>
                                <th className="px-8 py-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Equipamento Emprestado</th>
                                <th className="px-8 py-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Fluxo de Datas</th>
                                <th className="px-8 py-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] text-right">Ações</th>
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
                                filteredLoans.map((loan) => (
                                    <tr key={loan.id} className="hover:bg-blue-50/20 transition-all group">
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg shadow-sm border-2 border-white group-hover:scale-110 transition-transform">
                                                    {loan.aluno_nome ? loan.aluno_nome.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-base leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                                                        {loan.aluno_nome}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <User size={12} className="text-slate-400" />
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Membro da Academia</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                                                    <Smartphone size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 leading-tight">{loan.device_nome}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-tight">{loan.device_tipo}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                    <Calendar size={14} className="text-blue-500" />
                                                    <span className="text-slate-400 font-black text-[10px] uppercase">Saída:</span>
                                                    <span className="bg-blue-50 px-2 py-0.5 rounded-lg text-blue-700">{new Date(loan.data_retirada).toLocaleDateString()}</span>
                                                </div>
                                                {loan.data_devolucao && (
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                        <Clock size={14} className="text-orange-400" />
                                                        <span className="text-slate-400 font-black text-[10px] uppercase">Prev:</span>
                                                        <span className="bg-orange-50 px-2 py-0.5 rounded-lg text-orange-700">{new Date(loan.data_devolucao).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${loan.status === 'Ativo'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${loan.status === 'Ativo' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                                                {loan.status === 'Ativo' ? 'Em Aberto' : 'Concluído'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                {loan.status === 'Ativo' ? (
                                                    <button
                                                        onClick={() => handleReturn(loan.id)}
                                                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 rounded-xl transition-all shadow-sm text-[10px] font-black uppercase tracking-widest active:scale-95 group/btn"
                                                    >
                                                        <CheckCircle className="w-4 h-4 text-slate-400 group-hover/btn:text-blue-500 transition-colors" />
                                                        Devolver
                                                    </button>
                                                ) : (
                                                    <div className="px-5 py-2.5 bg-slate-50 border border-transparent rounded-xl flex items-center gap-2 opacity-50">
                                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Encerrado</span>
                                                    </div>
                                                )}

                                                <button className="p-3 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                                                    <ChevronRight size={20} />
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
        </div>
    );
}
