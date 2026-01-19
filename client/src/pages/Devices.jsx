import { useState, useEffect } from 'react';
import { Search, Plus, Monitor, Edit, Upload, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import DeviceModal from '../components/DeviceModal';
import DataImportModal from '../components/DataImportModal';

export default function Devices() {
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
        <div className="space-y-8 animate-fade-in-up">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Devices</h1>
                    <p className="text-gray-500 mt-1 flex items-center">
                        <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                        {filteredDevices.length} itens no inventário
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleImport}
                        className="flex-1 md:flex-none flex items-center justify-center px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-semibold shadow-sm group"
                    >
                        <Upload className="w-5 h-5 mr-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        Importar
                    </button>
                    <button
                        onClick={handleCreate}
                        className="flex-1 md:flex-none flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold shadow-lg shadow-blue-200 active:scale-95"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Novo Device
                    </button>
                </div>
            </div>

            {/* List Section */}
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, serial ou tipo..."
                            className="bg-white border border-gray-200 text-gray-900 text-sm rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block w-full pl-12 p-3.5 outline-none transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        checked={selectedDevices.length === paginatedDevices.length && paginatedDevices.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Device</th>
                                <th scope="col" className="hidden sm:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo & Modelo</th>
                                <th scope="col" className="hidden lg:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Serial</th>
                                <th scope="col" className="hidden md:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3">Local/Obs</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                                            <p className="text-gray-500 font-medium">Carregando inventário...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedDevices.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500 font-medium">
                                        Nenhum device encontrado.
                                    </td>
                                </tr>
                            ) : (
                                paginatedDevices.map((d) => (
                                    <tr key={d.id} className="group hover:bg-gray-50/80 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                checked={selectedDevices.includes(d.id)}
                                                onChange={() => handleSelectDevice(d.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mr-3 group-hover:bg-blue-100 transition-colors">
                                                    <Monitor className="w-5 h-5" />
                                                </div>
                                                <div className="max-w-[200px] truncate">
                                                    <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{d.nome}</div>
                                                    <div className="text-xs text-gray-500 truncate">{d.modelo || 'Modelo não inf.'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <span className="font-medium text-gray-900">{d.tipo}</span>
                                            <div className="text-xs text-gray-400">{d.ano || 'Ano não inf.'}</div>
                                        </td>
                                        <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-400 uppercase">
                                            {d.numero_serie}
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-500 min-w-[200px] max-w-xs">
                                            <div className="line-clamp-2 leading-relaxed">
                                                {d.local || d.observacao || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${d.status === 'Disponível'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : d.status === 'Emprestado'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                    : 'bg-rose-50 text-rose-700 border-rose-100'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${d.status === 'Disponível' ? 'bg-emerald-500' : d.status === 'Emprestado' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                                                {d.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleEdit(d)}
                                                    className={`p-2 rounded-lg transition-all ${d.id < 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                                    title={d.id < 0 ? "Item de sistema - Não editável" : "Editar Device"}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(d.id, d.nome)}
                                                    className={`p-2 rounded-lg transition-all ${d.id < 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'}`}
                                                    disabled={d.id < 0}
                                                    title={d.id < 0 ? "Item de sistema - Não excluível" : "Excluir Device"}
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

                {/* Pagination */}
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">
                            Mostrando <span className="font-semibold text-gray-800">{(currentPage - 1) * itemsPerPage + 1}</span>-
                            <span className="font-semibold text-gray-800">{Math.min(currentPage * itemsPerPage, filteredDevices.length)}</span> de
                            <span className="font-semibold text-gray-800"> {filteredDevices.length}</span>
                        </span>
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
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`min-w-[36px] h-9 rounded-lg font-bold transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-white text-gray-600 border border-transparent hover:border-gray-200'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-30 transition-all text-gray-600 shadow-sm"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedDevices.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-bounce-in">
                    <span className="text-sm font-semibold">
                        {selectedDevices.length} item(s) selecionado(s)
                    </span>
                    <div className="h-6 w-px bg-slate-700"></div>
                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center text-rose-400 hover:text-rose-300 font-bold text-sm transition-colors"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir Selecionados
                    </button>
                    <button
                        onClick={() => setSelectedDevices([])}
                        className="text-slate-400 hover:text-white text-sm transition-colors"
                    >
                        Cancelar
                    </button>
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
