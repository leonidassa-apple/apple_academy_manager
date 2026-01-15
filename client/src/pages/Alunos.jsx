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

    const filteredStudents = students.filter(student =>
        student.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in-up">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Alunos</h1>
                    <p className="text-gray-500 mt-1">Gerencie todos os estudantes da Apple Developer Academy</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleImport}
                        className="flex items-center text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium shadow-sm active:scale-95"
                    >
                        <Upload className="w-4 h-4 mr-2 text-gray-500" />
                        Importar CSV
                    </button>
                    <button
                        onClick={handleCreate}
                        className="flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all duration-200 font-medium shadow-lg shadow-blue-500/30 active:scale-95 hover:shadow-xl"
                    >
                        <UserPlus className="w-5 h-5 mr-2" />
                        Novo Aluno
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
                        placeholder="Buscar nesta página..."
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
                        onClick={() => fetchStudents(currentPage, itemsPerPage)}
                        className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        title="Atualizar Lista"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Table Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Aluno
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Contato
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Curso & Tipo
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
                            {loading && students.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                            <p className="text-gray-500 font-medium">Carregando alunos...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <div className="p-4 bg-gray-50 rounded-full mb-3">
                                                <User className="w-8 h-8" />
                                            </div>
                                            <p className="text-lg font-medium text-gray-600">Nenhum aluno encontrado</p>
                                            <p className="text-sm">Tente ajustar sua busca ou mude de página.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((student) => (
                                    <tr key={student.id} className="group hover:bg-gray-50/80 transition-colors duration-150">

                                        {/* Avatar & Name */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-12 w-12 relative">
                                                    {student.foto_path ? (
                                                        <img
                                                            className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm group-hover:border-blue-100 transition-colors"
                                                            src={student.foto_path.startsWith('http') ? student.foto_path : `/uploads/${student.foto_path.replace('uploads/', '')}`}
                                                            alt={student.nome}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.nome) + '&background=random&color=fff';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg border-2 border-white shadow-sm">
                                                            {student.nome.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                        {student.nome}
                                                    </div>
                                                    <div className="text-xs text-gray-500">ID: {student.id}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contact */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-600">{student.email}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">{student.telefone || 'Sem telefone'}</div>
                                        </td>

                                        {/* Course */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-medium">{student.curso || 'Apple Developer Academy'}</div>
                                            <div className="mt-1">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${student.tipo_aluno === 'Foundation'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : student.tipo_aluno === 'Bolsista'
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {student.tipo_aluno}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${student.status_aluno === 'Ativo'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : 'bg-rose-50 text-rose-700 border-rose-100'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${student.status_aluno === 'Ativo' ? 'bg-emerald-500' : 'bg-rose-500'
                                                    }`}></span>
                                                {student.status_aluno}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleEdit(student)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Editar Aluno"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                    title="Excluir (Desativado)"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Area */}
                <div className="mt-auto px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <p className="text-sm text-gray-600 font-medium">
                            Mostrando <span className="text-gray-900 font-bold">{totalStudents > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> até <span className="text-gray-900 font-bold">{Math.min(currentPage * itemsPerPage, totalStudents)}</span> de <span className="text-gray-900 font-bold">{totalStudents}</span> resultados
                        </p>
                        <select
                            className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(parseInt(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={10}>10 / pág</option>
                            <option value={20}>20 / pág</option>
                            <option value={50}>50 / pág</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 transition-all text-gray-600 shadow-sm"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => {
                                const pageNum = i + 1;
                                // Logic to show first, last, and pages around current
                                if (totalPages > 5) {
                                    if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`min-w-[36px] h-9 rounded-lg font-bold transition-all ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-white text-gray-600 border border-transparent hover:border-gray-200'}`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                        return <span key={pageNum} className="px-1 text-gray-400">...</span>;
                                    }
                                    return null;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`min-w-[36px] h-9 rounded-lg font-bold transition-all ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-white text-gray-600 border border-transparent hover:border-gray-200'}`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 transition-all text-gray-600 shadow-sm"
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
        </div>
    );
}
