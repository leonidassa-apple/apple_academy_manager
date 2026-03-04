import { useState, useEffect } from 'react';
import { Search, Plus, Monitor, Edit, Upload, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DeviceModal from '../components/DeviceModal';
import DataImportModal from '../components/DataImportModal';

export default function Devices() {
    const { user: currentUser } = useAuth();
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDevices, setSelectedDevices] = useState([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);

    const fetchDevices = () => {
        setLoading(true);
        fetch('/api/devices')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setDevices(data);
                else if (data.success && data.data) setDevices(data.data); // Fallback if API changes
                else if (data.data) setDevices(data.data); // Another fallback
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchDevices();
    }, []);

    const handleCreate = () => {
        setSelectedDevice(null);
        setIsModalOpen(true);
    };

    const handleImport = () => {
        setIsImportModalOpen(true);
    };

    const handleEdit = (device) => {
        // Handle negative ID (Equipment Control) - Maybe read-only or warn?
        // For now let's assume valid ID > 0 are editable
        if (device.id < 0) {
            alert("Este item vem do Controle de Equipamentos e não pode ser editado aqui.");
            return;
        }
        setSelectedDevice(device);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        fetchDevices();
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Tem certeza que deseja excluir o device ${name}?`)) return;

        try {
            const res = await fetch(`/api/devices/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                alert('Device excluído com sucesso!');
                fetchDevices();
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao excluir device.');
        }
    };

    const handleSelectDevice = (id) => {
        setSelectedDevices(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedDevices(filteredDevices.map(d => d.id));
        } else {
            setSelectedDevices([]);
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Tem certeza que deseja excluir ${selectedDevices.length} devices?`)) return;

        try {
            const res = await fetch('/api/devices/delete-multiple', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedDevices })
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                setSelectedDevices([]);
                fetchDevices();
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao excluir devices em massa.');
        }
    };

    const filteredDevices = devices.filter(d =>
        d.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.numero_serie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.modelo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
    const paginatedDevices = filteredDevices.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="animate-in-up">
            {/* Premium Header */}
            <div className="premium-card p-10 mb-10 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full -mr-64 -mt-64 blur-3xl"></div>

                <div className="relative z-10 flex items-center gap-8">
                    <div className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] shadow-2xl shadow-blue-200">
                        <Monitor size={40} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2">Inventário de Devices</h1>
                        <div className="flex items-center gap-3 text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">
                            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                            {filteredDevices.length} Itens Catalogados
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex flex-wrap gap-3">
                    {currentUser?.role === 'admin' && (
                        <>
                            <button
                                onClick={handleImport}
                                className="premium-btn-secondary"
                            >
                                <Upload size={18} className="text-slate-400" />
                                Importar Base
                            </button>
                            <button
                                onClick={handleCreate}
                                className="premium-btn-primary"
                            >
                                <Plus size={20} />
                                Novo Device
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* List Section */}
            <div className="premium-card overflow-hidden">
                <div className="p-8 border-b border-slate-50 bg-slate-50/20">
                    <div className="relative max-w-xl group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, serial ou tipo..."
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700 font-bold placeholder:text-slate-400 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 uppercase tracking-[0.1em] text-[10px] font-black text-slate-400">
                                <th className="px-6 py-4 w-16 text-center">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 text-blue-600 border-slate-300 rounded-lg focus:ring-blue-500 transition-all cursor-pointer"
                                        checked={selectedDevices.length === paginatedDevices.length && paginatedDevices.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="px-4 py-4">Hardware</th>
                                <th className="px-4 py-4 hidden sm:table-cell">Especificações</th>
                                <th className="px-4 py-4 hidden lg:table-cell">ID / Serial</th>
                                <th className="px-4 py-4 hidden md:table-cell">Localização/Obs</th>
                                <th className="px-4 py-4 text-center">Status</th>
                                {currentUser?.role === 'admin' && (
                                    <th className="px-6 py-4 text-right">Ações</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="7" className="px-6 py-8"><div className="h-12 bg-slate-50 rounded-2xl w-full"></div></td>
                                    </tr>
                                ))
                            ) : paginatedDevices.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-32 text-center text-slate-400 font-bold uppercase tracking-widest">
                                        Nenhum dispositivo registrado no sistema.
                                    </td>
                                </tr>
                            ) : (
                                paginatedDevices.map((d) => (
                                    <tr key={d.id} className="hover:bg-blue-50/20 transition-all group">
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 text-blue-600 border-slate-300 rounded-lg focus:ring-blue-500 transition-all cursor-pointer"
                                                checked={selectedDevices.includes(d.id)}
                                                onChange={() => handleSelectDevice(d.id)}
                                            />
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600 border-2 border-white shadow-md group-hover:scale-110 transition-transform">
                                                    <Monitor size={24} />
                                                </div>
                                                <div className="max-w-[200px]">
                                                    <div className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight truncate">{d.nome}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{d.modelo || 'S/ MODELO'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden sm:table-cell px-4 py-4 whitespace-nowrap">
                                            <div className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{d.tipo}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider font-mono">{d.ano || 'ANO N/D'}</div>
                                        </td>
                                        <td className="hidden lg:table-cell px-4 py-4 whitespace-nowrap">
                                            <div className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase">{d.numero_serie}</div>
                                        </td>
                                        <td className="hidden md:table-cell px-4 py-4">
                                            <div className="text-xs font-bold text-slate-600 line-clamp-1 italic tracking-tight uppercase leading-relaxed">
                                                {d.local || d.observacao || '—'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-center">
                                            <span className={`status-badge ${d.status === 'Disponível'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : d.status === 'Emprestado'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                    : 'bg-rose-50 text-rose-700 border-rose-100'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${d.status === 'Disponível' ? 'bg-emerald-500' : d.status === 'Emprestado' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                                                {d.status}
                                            </span>
                                        </td>
                                        {currentUser?.role === 'admin' && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(d)}
                                                        className={`p-2.5 bg-white border border-slate-100 rounded-xl transition-all shadow-sm ${d.id < 0 ? 'opacity-30 cursor-not-allowed' : 'hover:border-blue-500 hover:text-blue-600'}`}
                                                        title={d.id < 0 ? "Item de sistema - Não editável" : "Editar Device"}
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(d.id, d.nome)}
                                                        className={`p-2.5 bg-white border border-slate-100 rounded-xl transition-all shadow-sm ${d.id < 0 ? 'opacity-30 cursor-not-allowed' : 'hover:border-rose-500 hover:text-rose-600'}`}
                                                        disabled={d.id < 0}
                                                        title={d.id < 0 ? "Item de sistema - Não excluível" : "Excluir Device"}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
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
                            Mostrando <span className="text-blue-600 px-1">{filteredDevices.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} — {Math.min(currentPage * itemsPerPage, filteredDevices.length)}</span> de <span className="text-slate-900">{filteredDevices.length}</span> registros
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

            {/* Bulk Actions Bar */}
            {currentUser?.role === 'admin' && selectedDevices.length > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl text-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-8 z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">
                            {selectedDevices.length}
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
                            onClick={() => setSelectedDevices([])}
                            className="px-6 py-3 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            <DeviceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                device={selectedDevice}
            />

            <DataImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={fetchDevices}
                endpoint="/api/importar/devices"
                title="Importar Devices"
                helpText="Colunas esperadas: tipo, numero_serie (obrigatórios), modelo, cor, observacao"
            />
        </div>
    );
}
