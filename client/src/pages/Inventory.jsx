import { useState, useEffect, useCallback } from 'react';
import {
    Plus, Search, Filter, Download, Upload, Trash2, Edit2,
    MoreVertical, ChevronLeft, ChevronRight, CheckCircle,
    XCircle, AlertCircle, Package, Save, X, Archive
} from 'lucide-react';

const Inventory = () => {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [labelFilter, setLabelFilter] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Selection
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);

    // Form fields
    const [formData, setFormData] = useState({
        tombamento: '',
        equipamento: '',
        carga: '',
        local: '',
        etiquetado: false
    });

    const [isSaving, setIsSaving] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/inventory');
            const data = await res.json();

            if (data.success) {
                setItems(data.data || []);
                setFilteredItems(data.data || []);
            } else {
                setError(data.message);
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
        let result = items;

        if (searchTerm) {
            const term = searchTerm.toLowerCase().trim();
            result = result.filter(item =>
                (item.tombamento && item.tombamento.toLowerCase().includes(term)) ||
                (item.equipamento && item.equipamento.toLowerCase().includes(term)) ||
                (item.carga && item.carga.toLowerCase().includes(term)) ||
                (item.local && item.local.toLowerCase().includes(term))
            );
        }

        if (labelFilter !== '') {
            const val = labelFilter === '1';
            result = result.filter(item => item.etiquetado === val);
        }

        setFilteredItems(result);
        setCurrentPage(1);
    }, [searchTerm, labelFilter, items]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const pageItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
            const newSelected = new Set(selectedIds);
            pageItems.forEach(item => newSelected.add(item.id));
            setSelectedIds(newSelected);
        } else {
            const pageItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
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
        if (!window.confirm(`Tem certeza que deseja excluir ${selectedIds.size} item(ns)?`)) return;

        try {
            const response = await fetch('/api/inventory/delete-multiple', {
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
            alert("Erro ao excluir itens.");
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (isSaving) return;

        const url = currentItem ? `/api/inventory/${currentItem.id}` : '/api/inventory';
        const method = currentItem ? 'PUT' : 'POST';

        setIsSaving(true);
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (result.success) {
                setIsEditModalOpen(false);
                loadData();
            } else {
                alert(result.message);
            }
        } catch (err) {
            alert("Erro ao salvar item.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenEdit = (item = null) => {
        if (item) {
            setCurrentItem(item);
            setFormData({
                tombamento: item.tombamento || '',
                equipamento: item.equipamento || '',
                carga: item.carga || '',
                local: item.local || '',
                etiquetado: !!item.etiquetado
            });
        } else {
            setCurrentItem(null);
            setFormData({
                tombamento: '',
                equipamento: '',
                carga: '',
                local: '',
                etiquetado: false
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
            const response = await fetch('/api/importar/inventory', {
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
        window.open('/api/export/inventory', '_blank');
    };

    const handleDownloadTemplate = () => {
        window.open('/api/download/template/inventory', '_blank');
    };

    // Pagination helpers
    const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
    const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Premium Header */}
            <div className="bg-white rounded-3xl p-8 mb-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                            <Archive className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inventário</h1>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                        {items.length} itens registrados no patrimônio
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 relative z-10">
                    <button
                        onClick={handleDownloadTemplate}
                        className="flex items-center gap-2 px-5 py-3 text-slate-600 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all font-bold text-sm shadow-sm"
                    >
                        <Download size={18} />
                        Template
                    </button>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-3 text-slate-600 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all font-bold text-sm shadow-sm"
                    >
                        <Upload size={18} />
                        Importar
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-5 py-3 text-slate-600 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all font-bold text-sm shadow-sm"
                    >
                        <Download size={18} />
                        Exportar
                    </button>
                    <button
                        onClick={() => handleOpenEdit()}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-800 transition-all font-black text-sm shadow-xl shadow-blue-200 active:scale-95"
                    >
                        <Plus size={18} />
                        Novo Item
                    </button>
                </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Archive size={28} /></div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total de Itens</p>
                        <p className="text-3xl font-black text-slate-900 leading-none mt-1">{items.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle size={28} /></div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Etiquetados</p>
                        <p className="text-3xl font-black text-slate-900 leading-none mt-1">{items.filter(e => e.etiquetado).length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl"><XCircle size={28} /></div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Não Etiquetados</p>
                        <p className="text-3xl font-black text-slate-900 leading-none mt-1">{items.filter(e => !e.etiquetado).length}</p>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm mb-8 flex flex-col lg:flex-row gap-5 items-center">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por tombamento, equipamento, local..."
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-slate-700 font-medium placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="relative w-full lg:w-64">
                        <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                            className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all text-slate-700 font-bold appearance-none cursor-pointer"
                            value={labelFilter}
                            onChange={(e) => setLabelFilter(e.target.value)}
                        >
                            <option value="">Todos Status</option>
                            <option value="1">Etiquetado</option>
                            <option value="0">Não Etiquetado</option>
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

            {/* Table Area */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col min-h-[500px]">
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
                                <th className="px-6 py-5 font-bold text-slate-500 text-xs uppercase tracking-widest">Equipamento / Descrição</th>
                                <th className="px-6 py-5 font-bold text-slate-500 text-xs uppercase tracking-widest">Patrimônio / Tombamento</th>
                                <th className="px-6 py-5 font-bold text-slate-500 text-xs uppercase tracking-widest">Localização & Carga</th>
                                <th className="px-6 py-5 font-bold text-slate-500 text-xs uppercase tracking-widest text-center">Tag Física</th>
                                <th className="px-8 py-5 font-bold text-slate-500 text-xs uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-8 py-8"><div className="h-10 bg-slate-50 rounded-2xl w-full"></div></td>
                                    </tr>
                                ))
                            ) : paginatedItems.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                <AlertCircle size={40} strokeWidth={1.5} className="text-slate-300" />
                                            </div>
                                            <p className="text-xl font-bold text-slate-400">Nenhum item encontrado no inventário</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-blue-50/30 transition-all group">
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
                                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                                    <Package size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-base">{item.equipamento}</p>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{item.carga || 'Não informado'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="px-3 py-1.5 bg-slate-100 text-slate-900 rounded-lg font-mono font-bold text-sm tracking-tighter">
                                                {item.tombamento}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-start gap-2">
                                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></div>
                                                <p className="text-slate-700 font-bold text-sm leading-tight">{item.local || 'Sem local'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            {item.etiquetado ? (
                                                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                    SIM
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-slate-50 text-slate-400 border border-slate-100">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                                    NÃO
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenEdit(item)}
                                                    className="p-3 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-md rounded-2xl transition-all"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={20} />
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm('Excluir este item permanentemente?')) {
                                                            const res = await fetch(`/api/inventory/${item.id}`, { method: 'DELETE' });
                                                            const data = await res.json();
                                                            if (data.success) loadData();
                                                        }
                                                    }}
                                                    className="p-3 text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-md rounded-2xl transition-all"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="mt-auto px-8 py-6 border-t border-slate-50 flex items-center justify-between bg-slate-50/20">
                    <p className="text-sm font-bold text-slate-400">
                        Página <span className="text-blue-600">{currentPage}</span> de <span className="text-slate-900">{totalPages}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="p-3 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 transition-all text-slate-600 disabled:opacity-30 disabled:hover:border-slate-100 shadow-sm"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex items-center gap-1 mx-2">
                            {/* Simple dynamic pagination showing few pages */}
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
                                        className={`w-11 h-11 rounded-2xl font-black text-sm transition-all ${currentPage === pageNum ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-200' : 'bg-white hover:bg-blue-50 text-slate-600 border border-slate-100 hover:border-blue-100'}`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-3 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 transition-all text-slate-600 disabled:opacity-30 disabled:hover:border-slate-100 shadow-sm"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Edit/Add */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsEditModalOpen(false)}></div>
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl relative z-10 animate-in zoom-in-95 duration-300 border border-white/20 overflow-hidden">

                        {/* Modal Header */}
                        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white">{currentItem ? 'Editar Item' : 'Novo Patrimônio'}</h2>
                                    <p className="text-blue-100 text-sm font-medium">Preencha os detalhes do registro</p>
                                </div>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/70 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-10 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Número Tombamento *</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ex: 002345"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                                        value={formData.tombamento}
                                        onChange={(e) => setFormData({ ...formData, tombamento: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Equipamento *</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ex: Projetor Epson"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                                        value={formData.equipamento}
                                        onChange={(e) => setFormData({ ...formData, equipamento: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Carga Responsável</label>
                                    <input
                                        type="text"
                                        placeholder="Nome do responsável"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                                        value={formData.carga}
                                        onChange={(e) => setFormData({ ...formData, carga: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Localização</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Laboratório 04"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                                        value={formData.local}
                                        onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 py-4 px-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.etiquetado}
                                        onChange={(e) => setFormData({ ...formData, etiquetado: e.target.checked })}
                                    />
                                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-600"></div>
                                </label>
                                <div>
                                    <span className="text-sm font-black text-slate-700 block">Etiquetado Fisicamente?</span>
                                    <span className="text-xs text-slate-500 font-medium tracking-tight">Marque se o item já possui a tag de patrimônio colada.</span>
                                </div>
                            </div>

                            <div className="pt-6 flex items-center justify-end gap-5">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-8 py-4 text-slate-500 font-black hover:text-slate-900 transition-all text-sm uppercase tracking-widest"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-800 transition-all font-black shadow-2xl shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 text-sm uppercase tracking-widest"
                                >
                                    {isSaving ? 'Processando...' : (
                                        <>
                                            <Save size={20} />
                                            {currentItem ? 'Salvar Alterações' : 'Cadastrar Item'}
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsImportModalOpen(false)}></div>
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg relative z-10 animate-in zoom-in-95 duration-300 border border-white/20 overflow-hidden">
                        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                                    <Upload className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-2xl font-black text-white tracking-tight">Importar Inventário</h2>
                            </div>
                            <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/70 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleImport} className="p-10 space-y-8">
                            <div className="border-4 border-dashed border-slate-100 rounded-[2rem] p-10 text-center hover:border-blue-200 transition-all group flex flex-col items-center">
                                <Upload className="w-12 h-12 text-slate-200 mb-4 group-hover:text-blue-500 transition-colors" />
                                <input
                                    type="file"
                                    name="file"
                                    required
                                    accept=".xlsx,.xls,.csv"
                                    id="file-upload"
                                    className="hidden"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <span className="text-lg font-bold text-slate-400 block group-hover:text-blue-600 transition-colors">Selecione um arquivo .xlsx ou .csv</span>
                                    <span className="text-sm text-slate-300 font-medium">clique para procurar no computador</span>
                                </label>
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-[1.5rem] font-black shadow-2xl shadow-blue-200 transition-all hover:from-blue-700 hover:to-indigo-800 active:scale-95"
                                >
                                    <Upload size={20} />
                                    CONFIRMAR IMPORTAÇÃO
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
