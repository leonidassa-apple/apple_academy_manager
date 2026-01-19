import { useState, useEffect, useCallback } from 'react';
import {
    Plus, Search, Filter, Download, Upload, Trash2, Edit2,
    MoreVertical, ChevronLeft, ChevronRight, CheckCircle,
    XCircle, AlertCircle, Laptop, Smartphone, Monitor, Save, X
} from 'lucide-react';

const Equipments = () => {
    const [equipments, setEquipments] = useState([]);
    const [filteredEquipments, setFilteredEquipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Selection
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [currentEquipment, setCurrentEquipment] = useState(null);

    // Form fields (14+)
    const [formData, setFormData] = useState({
        tipo_device: '',
        numero_serie: '',
        modelo: '',
        cor: '',
        processador: '',
        memoria: '',
        armazenamento: '',
        tela: '',
        status: 'Disponível',
        para_emprestimo: true,
        responsavel: '',
        local: '',
        convenio: '',
        observacao: ''
    });

    const [isSaving, setIsSaving] = useState(false);

    const [deviceTypes, setDeviceTypes] = useState([]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [equipRes, typesRes] = await Promise.all([
                fetch('/api/equipment-control'),
                fetch('/api/tipos-devices/lista')
            ]);

            const equipData = await equipRes.json();
            const typesData = await typesRes.json();

            if (equipData.success) {
                setEquipments(equipData.data);
                setFilteredEquipments(equipData.data);
            } else {
                setError(equipData.message);
            }

            if (typesData.success) {
                setDeviceTypes(typesData.data);
            }
        } catch (err) {
            setError("Erro ao carregar dados do servidor.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        let result = equipments;

        if (searchTerm) {
            const term = searchTerm.toLowerCase().trim();
            result = result.filter(item =>
                (item.numero_serie && item.numero_serie.toLowerCase().includes(term)) ||
                (item.modelo && item.modelo.toLowerCase().includes(term)) ||
                (item.tipo_device && item.tipo_device.toLowerCase().includes(term)) ||
                (item.responsavel && item.responsavel.toLowerCase().includes(term)) ||
                (item.local && item.local.toLowerCase().includes(term))
            );
        }

        if (statusFilter) {
            result = result.filter(item => item.status === statusFilter);
        }

        setFilteredEquipments(result);
        setCurrentPage(1);
    }, [searchTerm, statusFilter, equipments]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const pageItems = filteredEquipments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
            const newSelected = new Set(selectedIds);
            pageItems.forEach(item => newSelected.add(item.id));
            setSelectedIds(newSelected);
        } else {
            const pageItems = filteredEquipments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
            const newSelected = new Set(selectedIds);
            pageItems.forEach(item => newSelected.delete(item.id));
            setSelectedIds(newSelected);
        }
    };

    const handleToggleSelect = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return;
        if (!window.confirm(`Tem certeza que deseja excluir ${selectedIds.size} equipamento(s)?`)) return;

        try {
            const response = await fetch('/api/equipment-control/delete-multiple', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            });
            const result = await response.json();
            if (result.success) {
                setSelectedIds(new Set());
                loadData();
            } else {
                alert(result.message);
            }
        } catch (err) {
            alert("Erro ao excluir equipamentos.");
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (isSaving) return;

        const url = currentEquipment ? `/api/equipment-control/${currentEquipment.id}` : '/api/equipment-control';
        const method = currentEquipment ? 'PUT' : 'POST';

        // Prepare data - Trim serial number
        const submissionData = {
            ...formData,
            numero_serie: formData.numero_serie.trim()
        };

        setIsSaving(true);
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData)
            });
            const result = await response.json();
            if (result.success) {
                setIsEditModalOpen(false);
                loadData();
            } else {
                alert(result.message);
            }
        } catch (err) {
            alert("Erro ao salvar equipamento.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenEdit = (equipment = null) => {
        if (equipment) {
            setCurrentEquipment(equipment);
            setFormData({
                tipo_device: equipment.tipo_device || '',
                numero_serie: equipment.numero_serie || '',
                modelo: equipment.modelo || '',
                cor: equipment.cor || '',
                processador: equipment.processador || '',
                memoria: equipment.memoria || '',
                armazenamento: equipment.armazenamento || '',
                tela: equipment.tela || '',
                status: equipment.status || 'Disponível',
                para_emprestimo: equipment.para_emprestimo,
                responsavel: equipment.responsavel || '',
                local: equipment.local || '',
                convenio: equipment.convenio || '',
                observacao: equipment.observacao || ''
            });
        } else {
            setCurrentEquipment(null);
            setFormData({
                tipo_device: '',
                numero_serie: '',
                modelo: '',
                cor: '',
                processador: '',
                memoria: '',
                armazenamento: '',
                tela: '',
                status: 'Disponível',
                para_emprestimo: true,
                responsavel: '',
                local: '',
                convenio: '',
                observacao: ''
            });
        }
        setIsEditModalOpen(true);
    };

    const handleImport = async (e) => {
        e.preventDefault();
        const file = e.target.file.files[0];
        if (!file) return;

        const fd = new FormData();
        fd.append('file', file);

        try {
            const response = await fetch('/api/importar/equipment-control', {
                method: 'POST',
                body: fd
            });
            const result = await response.json();
            if (result.success) {
                alert(result.message);
                setIsImportModalOpen(false);
                loadData();
            } else {
                alert(result.message);
            }
        } catch (err) {
            alert("Erro na importação.");
        }
    };

    const handleExport = () => {
        window.open('/api/export/equipment-control', '_blank');
    };

    const handleDownloadTemplate = () => {
        window.open('/api/export/template-equipment-control', '_blank');
    };

    // Pagination helpers
    const totalPages = Math.max(1, Math.ceil(filteredEquipments.length / itemsPerPage));
    const paginatedItems = filteredEquipments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Disponível': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Emprestado': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Manutenção': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'Reservado': return 'bg-sky-100 text-sky-700 border-sky-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Premium Header Container */}
            <div className="bg-white rounded-[2rem] p-8 mb-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50/50 rounded-full -mr-40 -mt-40 blur-3xl"></div>

                <div className="relative z-10 flex items-center gap-5">
                    <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-xl shadow-blue-200 group-hover:scale-105 transition-transform">
                        <Laptop className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Controle de Equipamentos</h1>
                        <div className="flex items-center gap-2 mt-1 text-slate-500 font-medium">
                            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                            Gestão de hardware e ativos tecnológicos
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 relative z-10">
                    <button
                        onClick={handleDownloadTemplate}
                        className="flex items-center gap-2 px-5 py-3 text-slate-600 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all font-bold text-sm shadow-sm active:scale-95"
                    >
                        <Download size={18} />
                        Template
                    </button>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-3 text-slate-600 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all font-bold text-sm shadow-sm active:scale-95"
                    >
                        <Upload size={18} />
                        Importar
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-5 py-3 text-slate-600 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all font-bold text-sm shadow-sm active:scale-95"
                    >
                        <Download size={18} />
                        Exportar
                    </button>
                    <button
                        onClick={() => handleOpenEdit()}
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-800 transition-all font-black text-sm shadow-xl shadow-blue-200 active:scale-95 ml-2"
                    >
                        <Plus size={18} />
                        Novo Equipamento
                    </button>
                </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                        <Laptop size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Geral</p>
                        <p className="text-3xl font-black text-slate-900 leading-none mt-1">{equipments.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                        <CheckCircle size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Disponíveis</p>
                        <p className="text-3xl font-black text-slate-900 leading-none mt-1">{equipments.filter(e => e.status === 'Disponível').length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group">
                    <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                        <Smartphone size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Emprestados</p>
                        <p className="text-3xl font-black text-slate-900 leading-none mt-1">{equipments.filter(e => e.status === 'Emprestado').length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group">
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300">
                        <AlertCircle size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Manutenção</p>
                        <p className="text-3xl font-black text-slate-900 leading-none mt-1">{equipments.filter(e => e.status === 'Manutenção').length}</p>
                    </div>
                </div>
            </div>

            {/* Advanced Filters Section */}
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm mb-8 flex flex-col lg:flex-row gap-5 items-center">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por serial, modelo, responsável, local..."
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-slate-700 font-bold placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="relative w-full lg:w-64">
                        <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-slate-700 font-black appearance-none cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">Todos os Status</option>
                            <option value="Disponível">Disponível</option>
                            <option value="Emprestado">Emprestado</option>
                            <option value="Manutenção">Manutenção</option>
                            <option value="Reservado">Reservado</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronRight size={18} className="rotate-90" />
                        </div>
                    </div>
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="flex items-center gap-2 px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-all font-black text-sm border border-rose-100 shadow-sm active:scale-95 whitespace-nowrap"
                        >
                            <Trash2 size={18} />
                            Excluir ({selectedIds.size})
                        </button>
                    )}
                </div>
            </div>

            {/* Main Table Area */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col min-h-[500px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all"
                                        checked={paginatedItems.length > 0 && paginatedItems.every(i => selectedIds.has(i.id))}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Equipamento / Origem</th>
                                <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Modelo & Serial</th>
                                <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Informações Técnicas</th>
                                <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Status & Controle</th>
                                <th className="px-8 py-5 font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] text-right">Opções</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-8 py-10"><div className="h-10 bg-slate-50 rounded-2xl w-full"></div></td>
                                    </tr>
                                ))
                            ) : paginatedItems.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-8 py-32 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                                <AlertCircle size={48} strokeWidth={1} className="text-slate-300" />
                                            </div>
                                            <p className="text-2xl font-black text-slate-900 leading-tight">Nenhum equipamento listado</p>
                                            <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto">Tente ajustar seus filtros de busca ou adicione um novo item agora mesmo.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedItems.map((item) => (
                                <tr key={item.id} className="hover:bg-blue-50/20 transition-all group">
                                    <td className="px-8 py-6 text-center">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all"
                                            checked={selectedIds.has(item.id)}
                                            onChange={() => handleToggleSelect(item.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400 flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white transition-all duration-300">
                                                {item.tipo_device?.toLowerCase().includes('mac') || item.tipo_device?.toLowerCase().includes('lab') ? <Laptop size={28} /> :
                                                    item.tipo_device?.toLowerCase().includes('pad') ? <Laptop size={28} /> : <Smartphone size={28} />}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-lg leading-tight">{item.tipo_device}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-md">{item.local || 'Sem local'}</span>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="text-xs font-bold text-slate-500 leading-none">{item.responsavel || 'Desc. não definida'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div>
                                            <p className="text-slate-900 font-black text-sm">{item.modelo || 'Modelo N/A'}</p>
                                            <p className="text-xs text-slate-400 font-mono font-bold mt-1 tracking-wider uppercase">{item.numero_serie}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-wrap gap-1.5">
                                            {item.processador && (
                                                <span className="px-2.5 py-1 bg-slate-50 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-tight border border-slate-100">
                                                    {item.processador}
                                                </span>
                                            )}
                                            {(item.memoria || item.armazenamento) && (
                                                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-tight border border-blue-100/50">
                                                    {[item.memoria, item.armazenamento].filter(Boolean).join(' / ')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="space-y-2">
                                            <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusStyles(item.status)}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Disponível' ? 'bg-emerald-500 animate-pulse' :
                                                    item.status === 'Manutenção' ? 'bg-rose-500' : 'bg-slate-400'
                                                    }`}></span>
                                                {item.status}
                                            </span>
                                            {item.para_emprestimo && (
                                                <div className="flex items-center gap-1.5 pl-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">Habilitado p/ Empréstimo</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                            <button
                                                onClick={() => handleOpenEdit(item)}
                                                className="p-3 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-xl hover:shadow-blue-100 rounded-[1rem] transition-all bg-slate-50/50"
                                                title="Editar"
                                            >
                                                <Edit2 size={20} />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('Excluir este equipamento permanentemente?')) {
                                                        const res = await fetch(`/api/equipment-control/${item.id}`, { method: 'DELETE' });
                                                        const data = await res.json();
                                                        if (data.success) loadData();
                                                    }
                                                }}
                                                className="p-3 text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-xl hover:shadow-rose-100 rounded-[1rem] transition-all bg-slate-50/50"
                                                title="Excluir"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Modern Pagination Area */}
                <div className="mt-auto px-10 py-8 border-t border-slate-50 flex items-center justify-between bg-slate-50/20">
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Registros</span>
                            <p className="text-sm font-bold text-slate-500">
                                <span className="text-slate-900 font-black">{filteredEquipments.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> — <span className="text-slate-900 font-black">{Math.min(currentPage * itemsPerPage, filteredEquipments.length)}</span> de <span className="text-slate-900 font-black tracking-tighter">{filteredEquipments.length}</span> unidades
                            </p>
                        </div>
                        <div className="h-10 w-[1px] bg-slate-200"></div>
                        <div className="relative group">
                            <select
                                className="text-sm font-black text-slate-700 border border-slate-200 rounded-xl px-4 py-2 bg-white appearance-none pr-10 cursor-pointer hover:border-blue-300 transition-all shadow-sm"
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
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-3 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 transition-all text-slate-600 disabled:opacity-30 disabled:hover:border-slate-200 shadow-sm"
                        >
                            <ChevronRight size={22} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Premium Edit / Add Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsEditModalOpen(false)}></div>
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col relative z-10 animate-in zoom-in-95 duration-300 border border-white/20">
                        {/* Modal Header */}
                        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-white/20 rounded-[1.5rem] backdrop-blur-md">
                                    <Laptop className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white leading-tight">
                                        {currentEquipment ? 'Editar Equipamento' : 'Novo Equipamento'}
                                    </h2>
                                    <p className="text-blue-100 text-sm font-medium">Configure os detalhes e especificações do dispositivo</p>
                                </div>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-all text-white/70 hover:text-white">
                                <X size={28} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="overflow-y-auto p-10 bg-slate-50/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                {/* Basic Info Section */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
                                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                                        <h3 className="text-md font-black text-slate-900 uppercase tracking-widest">Informações Básicas</h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Tipo Device *</label>
                                            <div className="relative group">
                                                <select
                                                    required
                                                    className="w-full px-5 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 appearance-none shadow-sm group-hover:border-slate-200"
                                                    value={formData.tipo_device}
                                                    onChange={(e) => setFormData({ ...formData, tipo_device: e.target.value })}
                                                >
                                                    <option value="">Selecione...</option>
                                                    {deviceTypes.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                                                </select>
                                                <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Número de Série *</label>
                                            <input
                                                required
                                                type="text"
                                                className="w-full px-5 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 shadow-sm"
                                                value={formData.numero_serie}
                                                onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                                                placeholder="Ex: C02DFHK90MD6"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Modelo</label>
                                            <input
                                                type="text"
                                                className="w-full px-5 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 shadow-sm"
                                                value={formData.modelo}
                                                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                                                placeholder="Ex: MacBook Pro M2"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Cor</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-5 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 shadow-sm"
                                                    value={formData.cor}
                                                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                                                    placeholder="Gray"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Chip</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-5 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 shadow-sm"
                                                    value={formData.processador}
                                                    onChange={(e) => setFormData({ ...formData, processador: e.target.value })}
                                                    placeholder="Chip M2"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Memória</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-5 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 shadow-sm"
                                                    value={formData.memoria}
                                                    onChange={(e) => setFormData({ ...formData, memoria: e.target.value })}
                                                    placeholder="16GB"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Tela</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-5 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 shadow-sm"
                                                    value={formData.tela}
                                                    onChange={(e) => setFormData({ ...formData, tela: e.target.value })}
                                                    placeholder="13.3 pol"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 2 */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
                                        <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                                        <h3 className="text-md font-black text-slate-900 uppercase tracking-widest">Controle & Localização</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Status Ativo *</label>
                                            <div className="relative group">
                                                <select
                                                    required
                                                    className="w-full px-5 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 appearance-none shadow-sm group-hover:border-slate-200"
                                                    value={formData.status}
                                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                >
                                                    <option value="Disponível">Disponível</option>
                                                    <option value="Emprestado">Emprestado</option>
                                                    <option value="Manutenção">Manutenção</option>
                                                    <option value="Reservado">Reservado</option>
                                                </select>
                                                <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pl-1">P/ Empréstimo</label>
                                            <div className="flex items-center gap-3 h-[60px] px-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        id="para_emprestimo"
                                                        className="sr-only peer"
                                                        checked={formData.para_emprestimo}
                                                        onChange={(e) => setFormData({ ...formData, para_emprestimo: e.target.checked })}
                                                    />
                                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                </div>
                                                <label htmlFor="para_emprestimo" className="text-sm font-black text-slate-600 uppercase tracking-tight">Liberado</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Responsável Atual</label>
                                        <input
                                            type="text"
                                            className="w-full px-5 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 shadow-sm"
                                            value={formData.responsavel}
                                            onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                                            placeholder="Nome do colaborador ou setor"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Localização Física</label>
                                        <input
                                            type="text"
                                            className="w-full px-5 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 shadow-sm"
                                            value={formData.local}
                                            onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                                            placeholder="Ex: Armário 04 - Sala de TI"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Convênio / Origem</label>
                                            <input
                                                type="text"
                                                className="w-full px-5 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 shadow-sm"
                                                value={formData.convenio}
                                                onChange={(e) => setFormData({ ...formData, convenio: e.target.value })}
                                                placeholder="Instituição ou Empresa parceira"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Observações Técnicas</label>
                                            <textarea
                                                className="w-full px-5 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 shadow-sm min-h-[120px] resize-none"
                                                value={formData.observacao}
                                                onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                                                placeholder="Histórico de manutenção ou detalhes específicos..."
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 flex items-center justify-end gap-4 border-t border-slate-100 pt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-8 py-4 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-100 rounded-2xl transition-all"
                                >
                                    Descartar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className={`flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-800 transition-all font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-200 active:scale-95 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Processando...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            {currentEquipment ? 'Salvar Alterações' : 'Finalizar Cadastro'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsImportModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Importar Dados</h2>
                            <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-500">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleImport} className="p-6 space-y-4">
                            <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-blue-400 hover:bg-blue-50/30 transition-all group">
                                <div className="p-4 bg-blue-50 text-blue-600 rounded-full group-hover:scale-110 transition-transform">
                                    <Upload size={32} />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-slate-700">Clique para selecionar</p>
                                    <p className="text-sm text-slate-500 mt-1">Excel (.xlsx) ou CSV</p>
                                </div>
                                <input
                                    type="file"
                                    name="file"
                                    required
                                    accept=".xlsx,.xls,.csv"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Regras:</p>
                                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                                    <li>Colunas obrigatórias: <span className="font-bold">tipo_device, numero_serie</span></li>
                                    <li>Formatos: XLSX, XLS ou CSV</li>
                                    <li>Status válidos: "Disponível", "Emprestado", etc.</li>
                                </ul>
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-200"
                                >
                                    Enviar Arquivo
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDownloadTemplate}
                                    className="w-full py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
                                >
                                    Baixar Template
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Equipments;
