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
        <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inventário</h1>
                    <p className="text-slate-500 mt-1">Gerencie o inventário físico e mobiliário.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={handleDownloadTemplate}
                        className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-medium"
                    >
                        <Download size={18} />
                        Template
                    </button>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-medium"
                    >
                        <Upload size={18} />
                        Importar
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-medium"
                    >
                        <Download size={18} />
                        Exportar
                    </button>
                    <button
                        onClick={() => handleOpenEdit()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-lg shadow-blue-200"
                    >
                        <Plus size={18} />
                        Novo Item
                    </button>
                </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Archive size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total de Itens</p>
                        <p className="text-2xl font-bold text-slate-900">{items.length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Etiquetados</p>
                        <p className="text-2xl font-bold text-slate-900">{items.filter(e => e.etiquetado).length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-lg"><XCircle size={24} /></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Não Etiquetados</p>
                        <p className="text-2xl font-bold text-slate-900">{items.filter(e => !e.etiquetado).length}</p>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por tombamento, equipamento, local..."
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
                            value={labelFilter}
                            onChange={(e) => setLabelFilter(e.target.value)}
                        >
                            <option value="">Status Etiqueta</option>
                            <option value="1">Etiquetado</option>
                            <option value="0">Não Etiquetado</option>
                        </select>
                    </div>
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all font-medium border border-rose-100"
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
                                <th className="px-6 py-4 font-semibold text-slate-700">Tombamento</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Carga / Local</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Etiquetado</th>
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
                                            <p className="text-lg font-medium">Nenhum item encontrado</p>
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
                                                <Package size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{item.equipamento}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-slate-900 font-medium font-mono tracking-tight">{item.tombamento}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-slate-900 font-medium">{item.local || 'Sem local'}</p>
                                            <p className="text-sm text-slate-500">{item.carga || 'N/A'}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.etiquetado ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                <CheckCircle size={14} /> Sim
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                                <XCircle size={14} /> Não
                                            </span>
                                        )}
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
                                                    if (window.confirm('Excluir este item?')) {
                                                        const res = await fetch(`/api/inventory/${item.id}`, { method: 'DELETE' });
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

                {/* Pagination */}
                <div className="mt-auto px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <p className="text-sm text-slate-500">
                        Mostrando <span className="font-bold">{filteredItems.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> a <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredItems.length)}</span> de <span className="font-bold">{filteredItems.length}</span> itens
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-30 transition-all text-slate-600"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-10 h-10 rounded-lg font-bold transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white text-slate-600 border border-transparent hover:border-slate-200'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-30 transition-all text-slate-600"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Edit/Add */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-900">{currentItem ? 'Editar Item' : 'Novo Item'}</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-lg transition-all text-slate-500">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Tombamento *</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    value={formData.tombamento}
                                    onChange={(e) => setFormData({ ...formData, tombamento: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Equipamento *</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    value={formData.equipamento}
                                    onChange={(e) => setFormData({ ...formData, equipamento: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Carga</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    value={formData.carga}
                                    onChange={(e) => setFormData({ ...formData, carga: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Local</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    value={formData.local}
                                    onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-2 py-2">
                                <input
                                    type="checkbox"
                                    id="etiquetado"
                                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    checked={formData.etiquetado}
                                    onChange={(e) => setFormData({ ...formData, etiquetado: e.target.checked })}
                                />
                                <label htmlFor="etiquetado" className="text-sm font-medium text-slate-600">Este item possui etiqueta física</label>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3">
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
                                    className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg"
                                >
                                    {isSaving ? 'Salvando...' : (
                                        <>
                                            <Save size={18} />
                                            {currentItem ? 'Salvar' : 'Cadastrar'}
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
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsImportModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Importar Inventário</h2>
                            <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-500">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleImport} className="p-6 space-y-4">
                            <input
                                type="file"
                                name="file"
                                required
                                accept=".xlsx,.xls,.csv"
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg"
                                >
                                    <Upload size={18} />
                                    Confirmar Importação
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
