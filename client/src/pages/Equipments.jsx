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
        <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Controle de Equipamentos</h1>
                    <p className="text-slate-500 mt-1">Gerencie o inventário de dispositivos e hardware da academia.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={handleDownloadTemplate}
                        className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-medium whitespace-nowrap"
                    >
                        <Download size={18} />
                        Template
                    </button>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-medium whitespace-nowrap"
                    >
                        <Upload size={18} />
                        Importar
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-medium whitespace-nowrap"
                    >
                        <Download size={18} />
                        Exportar
                    </button>
                    <button
                        onClick={() => handleOpenEdit()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-lg shadow-blue-200 whitespace-nowrap"
                    >
                        <Plus size={18} />
                        Novo Equipamento
                    </button>
                </div>
            </div>

            {/* Quick Stats Summary (Mini) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Laptop size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total</p>
                        <p className="text-2xl font-bold text-slate-900">{equipments.length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Disponíveis</p>
                        <p className="text-2xl font-bold text-slate-900">{equipments.filter(e => e.status === 'Disponível').length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Smartphone size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Emprestados</p>
                        <p className="text-2xl font-bold text-slate-900">{equipments.filter(e => e.status === 'Emprestado').length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-lg"><AlertCircle size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Manutenção</p>
                        <p className="text-2xl font-bold text-slate-900">{equipments.filter(e => e.status === 'Manutenção').length}</p>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por serial, modelo, responsável..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-600"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2 min-w-[180px]">
                        <Filter size={18} className="text-slate-400" />
                        <select
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-600 bg-white"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">Todos os status</option>
                            <option value="Disponível">Disponível</option>
                            <option value="Emprestado">Emprestado</option>
                            <option value="Manutenção">Manutenção</option>
                            <option value="Reservado">Reservado</option>
                        </select>
                    </div>
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all font-medium border border-rose-100 whitespace-nowrap"
                        >
                            <Trash2 size={18} />
                            Excluir ({selectedIds.size})
                        </button>
                    )}
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-bottom border-slate-200">
                                <th className="px-6 py-4 w-12">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        checked={paginatedItems.length > 0 && paginatedItems.every(i => selectedIds.has(i.id))}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Equipamento</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Modelo / Serial</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Infor. Técnica</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-8"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : paginatedItems.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <AlertCircle size={48} strokeWidth={1} className="mb-4" />
                                            <p className="text-lg font-medium">Nenhum equipamento encontrado</p>
                                            <p className="text-sm">Tente ajustar seus filtros ou busca.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedItems.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            checked={selectedIds.has(item.id)}
                                            onChange={() => handleToggleSelect(item.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                                {item.tipo_device?.toLowerCase().includes('mac') || item.tipo_device?.toLowerCase().includes('lab') ? <Laptop size={20} /> : <Smartphone size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{item.tipo_device}</p>
                                                <p className="text-sm text-slate-500 flex items-center gap-1">
                                                    {item.local || 'Sem local'} • {item.responsavel || 'Sem desc.'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-slate-900 font-medium">{item.modelo || '—'}</p>
                                            <p className="text-sm text-slate-500 font-mono tracking-tight">{item.numero_serie}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            {item.processador && <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded inline-flex w-fit">{item.processador}</span>}
                                            <span className="text-xs text-slate-500">
                                                {[item.memoria, item.armazenamento].filter(Boolean).join(' / ') || 'N/A'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-2">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border w-fit ${getStatusStyles(item.status)}`}>
                                                {item.status}
                                            </span>
                                            {item.para_emprestimo && (
                                                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 flex items-center gap-1">
                                                    <CheckCircle size={10} /> Disponível para empréstimo
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenEdit(item)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Editar"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('Excluir este equipamento?')) {
                                                        const res = await fetch(`/api/equipment-control/${item.id}`, { method: 'DELETE' });
                                                        const data = await res.json();
                                                        if (data.success) loadData();
                                                    }
                                                }}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                title="Excluir"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Area */}
                <div className="mt-auto px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <div className="flex items-center gap-4">
                        <p className="text-sm text-slate-500 font-medium">
                            Mostrando <span className="text-slate-900 font-bold">{filteredEquipments.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> a <span className="text-slate-900 font-bold">{Math.min(currentPage * itemsPerPage, filteredEquipments.length)}</span> de <span className="text-slate-900 font-bold">{filteredEquipments.length}</span>
                        </p>
                        <select
                            className="text-sm border border-slate-200 rounded px-2 py-1 bg-white"
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
                            className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-30 transition-all text-slate-600 shadow-sm"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => {
                                if (totalPages > 5) {
                                    if (i + 1 === 1 || i + 1 === totalPages || (i + 1 >= currentPage - 1 && i + 1 <= currentPage + 1)) {
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={`min-w-[40px] h-10 rounded-lg font-bold transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-white text-slate-600 border border-transparent hover:border-slate-200'}`}
                                            >
                                                {i + 1}
                                            </button>
                                        );
                                    } else if (i + 1 === currentPage - 2 || i + 1 === currentPage + 2) {
                                        return <span key={i} className="px-2 text-slate-400">...</span>;
                                    }
                                    return null;
                                }
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`min-w-[40px] h-10 rounded-lg font-bold transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-white text-slate-600 border border-transparent hover:border-slate-200'}`}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-30 transition-all text-slate-600 shadow-sm"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit / Add Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsEditModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-900">{currentEquipment ? 'Editar Equipamento' : 'Cadastrar Equipamento'}</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg transition-all text-slate-500">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="overflow-y-auto p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Column 1 */}
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700">Tipo Device *</label>
                                        <select
                                            required
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            value={formData.tipo_device}
                                            onChange={(e) => setFormData({ ...formData, tipo_device: e.target.value })}
                                        >
                                            <option value="">Selecione...</option>
                                            {deviceTypes.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700">Número de Série *</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            value={formData.numero_serie}
                                            onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                                            placeholder="Ex: C02DFHK90MD6"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700">Modelo</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            value={formData.modelo}
                                            onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                                            placeholder="Ex: MacBook Pro M2"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-slate-700">Cor</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                value={formData.cor}
                                                onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                                                placeholder="Black"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-slate-700">Processador</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                value={formData.processador}
                                                onChange={(e) => setFormData({ ...formData, processador: e.target.value })}
                                                placeholder="Chip M2"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-slate-700">Memória</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                value={formData.memoria}
                                                onChange={(e) => setFormData({ ...formData, memoria: e.target.value })}
                                                placeholder="16GB"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-slate-700">Tela</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                value={formData.tela}
                                                onChange={(e) => setFormData({ ...formData, tela: e.target.value })}
                                                placeholder="13.3 pol"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Column 2 */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-slate-700">Status *</label>
                                            <select
                                                required
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            >
                                                <option value="Disponível">Disponível</option>
                                                <option value="Emprestado">Emprestado</option>
                                                <option value="Manutenção">Manutenção</option>
                                                <option value="Reservado">Reservado</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-slate-700">P/ Empréstimo</label>
                                            <div className="flex items-center gap-2 h-10">
                                                <input
                                                    type="checkbox"
                                                    id="para_emprestimo"
                                                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                    checked={formData.para_emprestimo}
                                                    onChange={(e) => setFormData({ ...formData, para_emprestimo: e.target.checked })}
                                                />
                                                <label htmlFor="para_emprestimo" className="text-sm font-medium text-slate-600">Disponibilizar</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700">Responsável</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            value={formData.responsavel}
                                            onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                                            placeholder="Nome do responsável"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700">Local</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            value={formData.local}
                                            onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                                            placeholder="Ex: Laboratório A"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700">Convênio</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            value={formData.convenio}
                                            onChange={(e) => setFormData({ ...formData, convenio: e.target.value })}
                                            placeholder="Parceria"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700">Observação</label>
                                        <textarea
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all min-h-[85px] resize-none"
                                            value={formData.observacao}
                                            onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                                            placeholder="Informações adicionais..."
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-end gap-3 px-1">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className={`flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-200 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            {currentEquipment ? 'Salvar Alterações' : 'Cadastrar Equipamento'}
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
