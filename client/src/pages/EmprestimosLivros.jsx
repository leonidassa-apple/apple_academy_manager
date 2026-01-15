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
        <div className="space-y-8 animate-fade-in-up">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                        <BookOpen className="w-8 h-8 text-blue-600" />
                        Circulação de Livros
                    </h1>
                    <p className="text-gray-500 mt-1">Gerencie empréstimos e devoluções do acervo</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleEnviarAlerta}
                        className="flex items-center px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-all duration-200 font-medium border border-amber-200"
                    >
                        <Mail className="w-4 h-4 mr-2" />
                        Relatório de Atrasos
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all duration-200 font-medium shadow-lg shadow-blue-500/30 active:scale-95 hover:shadow-xl group"
                    >
                        <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                        Novo Empréstimo
                    </button>
                </div>
            </div>

            {/* Filters & Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full md:max-w-md group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 sm:text-sm"
                        placeholder="Buscar por aluno, título ou código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none flex items-center justify-center px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all">
                        <Filter className="w-4 h-4 mr-2 text-gray-500" />
                        Filtros
                    </button>
                    <button
                        onClick={fetchEmprestimos}
                        className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        title="Atualizar Lista"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Table Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Aluno
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Livro / Exemplar
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Datas
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {loading && emprestimos.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                            <p className="text-gray-500 font-medium">Carregando circulação...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredEmprestimos.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <div className="p-4 bg-gray-50 rounded-full mb-3">
                                                <SearchX className="w-8 h-8" />
                                            </div>
                                            <p className="text-lg font-medium text-gray-600">Nenhum empréstimo encontrado</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredEmprestimos.map((emp) => (
                                    <tr key={emp.id} className="group hover:bg-gray-50/80 transition-colors duration-150">

                                        {/* Aluno Column */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 relative">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm">
                                                        {emp.aluno_nome ? emp.aluno_nome.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                        {emp.aluno_nome}
                                                    </div>
                                                    <div className="text-xs text-gray-500 flex items-center mt-0.5">
                                                        <User className="w-3 h-3 mr-1" />
                                                        {emp.aluno_tipo || 'Aluno'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Livro Column */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="bg-gray-100 p-2 rounded-lg mr-3 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-200">
                                                    <BookOpen className="w-5 h-5 text-gray-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 line-clamp-1 max-w-[200px]" title={emp.titulo}>
                                                        {emp.titulo}
                                                    </div>
                                                    <div className="text-xs text-gray-500 flex items-center mt-0.5 font-mono">
                                                        <Barcode className="w-3 h-3 mr-1" />
                                                        {emp.codigo_barras}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Datas Column */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col space-y-1">
                                                <div className="flex items-center text-xs text-gray-600">
                                                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                                                    <span className="font-medium">Retirada:</span>
                                                    <span className="ml-1">{new Date(emp.data_retirada).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                                {emp.data_previsao_devolucao && (
                                                    <div className={`flex items-center text-xs ${emp.status === 'Atrasado' ? 'text-red-500 font-medium' : 'text-gray-500'
                                                        }`}>
                                                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                                                        <span>Prev. Devolução:</span>
                                                        <span className="ml-1">{new Date(emp.data_previsao_devolucao).toLocaleDateString('pt-BR')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Status Column */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${emp.status === 'Atrasado'
                                                    ? 'bg-red-50 text-red-700 border-red-100'
                                                    : emp.status === 'Devolvido'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                        : 'bg-blue-50 text-blue-700 border-blue-100'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${emp.status === 'Atrasado' ? 'bg-red-500' :
                                                        emp.status === 'Devolvido' ? 'bg-emerald-500' : 'bg-blue-500'
                                                    }`}></span>
                                                {emp.status}
                                            </span>
                                        </td>

                                        {/* Ações Column */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                {emp.status !== 'Devolvido' ? (
                                                    <button
                                                        onClick={() => handleDevolver(emp.id)}
                                                        className="flex items-center px-3 py-1.5 bg-white border border-gray-200 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 rounded-lg transition-all shadow-sm text-xs font-medium group/btn"
                                                        title="Registrar Devolução"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5 mr-1.5 group-hover/btn:text-emerald-600 transition-colors" />
                                                        Devolver
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic flex items-center">
                                                        <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-gray-300" />
                                                        Concluído
                                                    </span>
                                                )}
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
