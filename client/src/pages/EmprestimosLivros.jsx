import { useState, useEffect } from 'react';
import { Plus, Search, CheckCircle, AlertTriangle, Barcode, Mail, BookOpen, Clock, Calendar, SearchX, User, ChevronRight, RefreshCw, Filter } from 'lucide-react';
import BookLoanModal from '../components/BookLoanModal';

const EmprestimosLivros = () => {
    const [emprestimos, setEmprestimos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchEmprestimos();
    }, []);

    const fetchEmprestimos = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/emprestimos-livros/lista');
            const data = await response.json();
            if (data.success) {
                setEmprestimos(data.data);
            }
        } catch (error) {
            console.error("Erro ao buscar empréstimos", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDevolver = async (emprestimoId) => {
        if (!window.confirm('Confirmar devolução do livro?')) return;
        try {
            const response = await fetch('/api/devolucao-livros', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emprestimo_id: emprestimoId })
            });
            const data = await response.json();
            if (data.success) {
                fetchEmprestimos();
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Erro na devolução:', error);
            alert('Erro ao processar devolução');
        }
    };

    const handleEnviarAlerta = async () => {
        if (!window.confirm('Deseja enviar e-mail com relatório de atrasos para você?')) return;
        try {
            const response = await fetch('/api/enviar-alerta-atraso', { method: 'POST' });
            const data = await response.json();
            alert(data.message);
        } catch (error) {
            console.error('Erro ao enviar alerta:', error);
            alert('Erro ao enviar alerta');
        }
    };

    const filteredEmprestimos = emprestimos.filter(emp =>
        emp.aluno_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.codigo_barras?.includes(searchTerm)
    );

    return (
        <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Premium Header Container */}
            <div className="bg-white rounded-[2rem] p-8 mb-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50/50 rounded-full -mr-40 -mt-40 blur-3xl"></div>

                <div className="relative z-10 flex items-center gap-5">
                    <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-xl shadow-blue-200">
                        <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Circulação de Livros</h1>
                        <div className="flex items-center gap-2 mt-1 text-slate-500 font-medium">
                            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            Gestão de acervo, empréstimos e devoluções
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                    <button
                        onClick={handleEnviarAlerta}
                        className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                        <Mail size={18} className="text-slate-400" />
                        Relatório de Atrasos
                    </button>
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
                        <p className="text-3xl font-black text-slate-900 leading-none mt-1">{emprestimos.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group">
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                        <Clock size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Em Aberto</p>
                        <p className="text-3xl font-black text-slate-900 leading-none mt-1">
                            {emprestimos.filter(e => e.status !== 'Devolvido').length}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group">
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                        <AlertTriangle size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Atrasados</p>
                        <p className="text-3xl font-black text-slate-900 leading-none mt-1">
                            {emprestimos.filter(e => e.status === 'Atrasado').length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm mb-8 flex flex-col lg:flex-row gap-5 items-center">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por aluno, título do livro ou código de barras..."
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all text-slate-700 font-bold placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchEmprestimos}
                        className="p-4 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-100 rounded-2xl transition-all"
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
                                <th className="px-8 py-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Estudante / Leitor</th>
                                <th className="px-8 py-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Obra / Exemplar</th>
                                <th className="px-8 py-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Período</th>
                                <th className="px-8 py-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Situação</th>
                                <th className="px-8 py-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading && emprestimos.length === 0 ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-8 py-10"><div className="h-10 bg-slate-50 rounded-2xl w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredEmprestimos.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                                <SearchX size={48} strokeWidth={1} className="text-slate-300" />
                                            </div>
                                            <p className="text-2xl font-black text-slate-900 leading-tight">Nenhuma circulação encontrada</p>
                                            <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto">Tente ajustar seus termos de busca ou filtros.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredEmprestimos.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-indigo-50/20 transition-all group">
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg shadow-sm border-2 border-white group-hover:scale-110 transition-transform">
                                                    {emp.aluno_nome ? emp.aluno_nome.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-base leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                                                        {emp.aluno_nome}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        <User size={12} />
                                                        {emp.aluno_tipo || 'Estudante'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                                    <BookOpen size={20} />
                                                </div>
                                                <div className="max-w-[280px]">
                                                    <p className="text-sm font-black text-slate-900 leading-tight truncate" title={emp.titulo}>{emp.titulo}</p>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <Barcode size={12} className="text-slate-300" />
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-tighter">{emp.codigo_barras}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                    <Calendar size={14} className="text-blue-500" />
                                                    <span className="text-slate-400 font-black text-[10px] uppercase w-12">Retirada:</span>
                                                    <span className="bg-blue-50 px-2 py-0.5 rounded-lg text-blue-700">{new Date(emp.data_retirada).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                                {emp.data_previsao_devolucao && (
                                                    <div className="flex items-center gap-2 text-xs font-bold">
                                                        <Clock size={14} className={emp.status === 'Atrasado' ? 'text-red-500' : 'text-slate-400'} />
                                                        <span className="text-slate-400 font-black text-[10px] uppercase w-12">Entrega:</span>
                                                        <span className={`px-2 py-0.5 rounded-lg ${emp.status === 'Atrasado' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {new Date(emp.data_previsao_devolucao).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${emp.status === 'Atrasado'
                                                    ? 'bg-red-50 text-red-700 border-red-100'
                                                    : emp.status === 'Devolvido'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                        : 'bg-blue-50 text-blue-700 border-blue-100'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'Atrasado' ? 'bg-red-500 animate-pulse' :
                                                        emp.status === 'Devolvido' ? 'bg-emerald-500' : 'bg-blue-500'
                                                    }`}></span>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                {emp.status !== 'Devolvido' ? (
                                                    <button
                                                        onClick={() => handleDevolver(emp.id)}
                                                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 rounded-xl transition-all shadow-sm text-[10px] font-black uppercase tracking-widest active:scale-95 group/btn"
                                                    >
                                                        <CheckCircle className="w-4 h-4 text-slate-400 group-hover/btn:text-emerald-500 transition-colors" />
                                                        Receber Livro
                                                    </button>
                                                ) : (
                                                    <div className="px-5 py-2.5 bg-slate-50 border border-transparent rounded-xl flex items-center gap-2 opacity-50">
                                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Devolvido</span>
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
                <BookLoanModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchEmprestimos();
                    }}
                />
            )}
        </div>
    );
};

export default EmprestimosLivros;
