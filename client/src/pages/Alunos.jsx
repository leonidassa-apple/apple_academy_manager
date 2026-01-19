import { useState, useEffect } from 'react';
import { Search, UserPlus, Filter, Edit, Trash2, Upload, User, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import AlunoModal from '../components/AlunoModal';
import DataImportModal from '../components/DataImportModal';

export default function Alunos() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStudents, setTotalStudents] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedStudents, setSelectedStudents] = useState([]);

    const fetchStudents = (page = 1, limit = 10) => {
        setLoading(true);
        fetch(`/api/alunos/pagina?page=${page}&limit=${limit}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setStudents(data.data);
                    setTotalPages(data.pages);
                    setTotalStudents(data.total);
                    setCurrentPage(data.page);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchStudents(currentPage, itemsPerPage);
    }, [currentPage, itemsPerPage]);

    const handleCreate = () => {
        setSelectedStudent(null);
        setIsModalOpen(true);
    };

    const handleImport = () => {
        setIsImportModalOpen(true);
    };

    const handleEdit = (student) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        fetchStudents(currentPage, itemsPerPage);
    };

    const handleSelectStudent = (id) => {
        setSelectedStudents(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedStudents(filteredStudents.map(s => s.id));
        } else {
            setSelectedStudents([]);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Tem certeza que deseja excluir o aluno ${name}?`)) return;

        try {
            const res = await fetch(`/api/alunos/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                alert('Aluno excluído com sucesso!');
                fetchStudents(currentPage, itemsPerPage);
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao excluir aluno.');
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Tem certeza que deseja excluir ${selectedStudents.length} alunos?`)) return;

        try {
            const res = await fetch('/api/alunos/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedStudents })
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                setSelectedStudents([]);
                fetchStudents(currentPage, itemsPerPage);
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao excluir alunos em massa.');
        }
    };

    const filteredStudents = students.filter(student =>
        student.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Premium Header Segment */}
            <div className="bg-white rounded-[2rem] p-8 mb-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/50 rounded-full -mr-48 -mt-48 blur-3xl"></div>

                <div className="relative z-10 flex items-center gap-6">
                    <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-xl shadow-blue-200">
                        <User size={36} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Gestão de Estudantes</h1>
                        <div className="flex items-center gap-2 mt-1 text-slate-500 font-medium">
                            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                            Controle acadêmico e demográfico
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                    <button
                        onClick={handleImport}
                        className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                        <Upload size={18} className="text-slate-400" />
                        Importar Base
                    </button>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-800 transition-all font-black text-sm shadow-xl shadow-blue-200 active:scale-95 group"
                    >
                        <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Novo Aluno
                    </button>
                </div>
            </div>

            {/* Academic Metrics Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        <User size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Matrículas</p>
                        <p className="text-3xl font-black text-slate-900 mt-1 leading-none">{totalStudents}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                        <RefreshCw size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Estudantes Ativos</p>
                        <p className="text-3xl font-black text-slate-900 mt-1 leading-none">
                            {students.filter(s => s.status_aluno === 'Ativo').length || 0}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group">
                    <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                        <UserPlus size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Foundation</p>
                        <p className="text-3xl font-black text-slate-900 mt-1 leading-none">
                            {students.filter(s => s.tipo_aluno === 'Foundation').length || 0}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group">
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                        <Filter size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Bolsistas</p>
                        <p className="text-3xl font-black text-slate-900 mt-1 leading-none">
                            {students.filter(s => s.tipo_aluno === 'Bolsista').length || 0}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter & Search Dashboard Area */}
            <div className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm mb-8 flex flex-col lg:flex-row gap-5 items-center">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Pesquisar por nome, email ou matrícula..."
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-slate-700 font-bold placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchStudents(currentPage, itemsPerPage)}
                        className="p-4 bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-100 rounded-2xl transition-all"
                        title="Sincronizar Dados"
                    >
                        <RefreshCw size={22} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                        <Filter size={18} />
                        Filtros Avançados
                    </button>
                </div>
            </div>

            {/* Enhanced Student Registry Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[500px] flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 uppercase tracking-[0.1em] text-[10px] font-black text-slate-400">
                                <th className="px-6 py-4 w-16 text-center">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 text-blue-600 border-slate-300 rounded-lg focus:ring-blue-500 transition-all cursor-pointer"
                                        checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="px-4 py-4">Perfil do Estudante</th>
                                <th className="px-4 py-4 hidden lg:table-cell">Comunicação</th>
                                <th className="px-4 py-4 hidden sm:table-cell">Trajetória Acadêmica</th>
                                <th className="px-4 py-4 hidden md:table-cell">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading && students.length === 0 ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-8"><div className="h-10 bg-slate-50 rounded-2xl w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-32 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
                                                <User size={40} strokeWidth={1} />
                                            </div>
                                            <p className="text-xl font-black text-slate-900 leading-tight">Nenhum estudante encontrado</p>
                                            <p className="text-slate-500 font-medium mt-2">Refine sua busca ou verifique os filtros aplicados.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-blue-50/20 transition-all group">
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 text-blue-600 border-slate-300 rounded-lg focus:ring-blue-500 transition-all cursor-pointer"
                                                checked={selectedStudents.includes(student.id)}
                                                onChange={() => handleSelectStudent(student.id)}
                                            />
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    {student.foto_path ? (
                                                        <img
                                                            className="h-12 w-12 rounded-2xl object-cover border-2 border-white shadow-md group-hover:scale-110 transition-transform"
                                                            src={student.foto_path?.startsWith('http') ? student.foto_path : `/uploads/${student.foto_path?.replace('uploads/', '')}`}
                                                            alt={student.nome}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.nome) + '&background=random&color=fff';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600 font-black text-xl border-2 border-white shadow-md group-hover:scale-110 transition-transform">
                                                            {student.nome?.charAt(0).toUpperCase() || '?'}
                                                        </div>
                                                    )}
                                                    <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${student.status_aluno === 'Ativo' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-[15px] leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                                                        {student.nome}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider font-mono">MAT: {student.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden lg:table-cell px-4 py-4">
                                            <div className="text-sm font-bold text-slate-700">{student.email}</div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{student.telefone || 'NÃO INFORMADO'}</div>
                                        </td>
                                        <td className="hidden sm:table-cell px-4 py-4">
                                            <div className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{student.curso || 'Academy'}</div>
                                            <div className="mt-2 flex gap-2">
                                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${student.tipo_aluno === 'Foundation' ? 'bg-purple-50 text-purple-700' :
                                                    student.tipo_aluno === 'Bolsista' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                                                    }`}>
                                                    {student.tipo_aluno}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell px-4 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${student.status_aluno === 'Ativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${student.status_aluno === 'Ativo' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                                {student.status_aluno}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleEdit(student)} className="p-2.5 bg-white border border-slate-100 hover:border-blue-500 hover:text-blue-600 rounded-xl transition-all shadow-sm">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(student.id, student.nome)} className="p-2.5 bg-white border border-slate-100 hover:border-rose-500 hover:text-rose-600 rounded-xl transition-all shadow-sm">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Modern Pagination Area */}
                <div className="mt-auto px-6 py-4 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50/20">
                    <div className="flex items-center gap-6">
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            Mostrando <span className="text-slate-900">{totalStudents > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} — {Math.min(currentPage * itemsPerPage, totalStudents)}</span> de <span className="text-slate-900">{totalStudents}</span> registros
                        </div>
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pág:</span>
                            <select
                                className="text-xs font-black text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(parseInt(e.target.value));
                                    setCurrentPage(1);
                                }}
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 disabled:opacity-20 transition-all text-slate-600 shadow-sm disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex items-center gap-1.5">
                            {[...Array(totalPages)].map((_, i) => {
                                const pageNum = i + 1;
                                if (totalPages > 5 && (pageNum !== 1 && pageNum !== totalPages && (pageNum < currentPage - 1 || pageNum > currentPage + 1))) {
                                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) return <span key={pageNum} className="px-2 text-slate-300 font-bold">...</span>;
                                    return null;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-11 h-11 rounded-2xl font-black text-sm transition-all ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-white hover:bg-slate-50 text-slate-400 border border-slate-100'}`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 disabled:opacity-20 transition-all text-slate-600 shadow-sm disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <AlunoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                student={selectedStudent}
            />

            <DataImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={() => fetchStudents(currentPage, itemsPerPage)}
                endpoint="/api/importar/alunos"
                title="Importar Alunos"
                helpText="Colunas esperadas: nome, email (obrigatórios), cpf, telefone, endereco, tipo_aluno"
            />

            {/* Premium Bulk Actions Bar */}
            {selectedStudents.length > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl text-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-8 z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">
                            {selectedStudents.length}
                        </div>
                        <p className="text-sm font-black uppercase tracking-widest text-slate-300">
                            Selecionados
                        </p>
                    </div>
                    <div className="h-10 w-px bg-slate-700/50"></div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-6 py-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                        >
                            <Trash2 size={16} />
                            Excluir Tudo
                        </button>
                        <button
                            onClick={() => setSelectedStudents([])}
                            className="px-6 py-3 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
