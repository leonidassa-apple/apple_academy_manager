import { useState, useEffect } from 'react';
import { Search, Plus, Monitor, Edit, Upload } from 'lucide-react';
import DeviceModal from '../components/DeviceModal';
import DataImportModal from '../components/DataImportModal';

export default function Devices() {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredDevices = devices.filter(d =>
        d.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.numero_serie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Devices</h1>
                    <p className="text-gray-500 text-sm">Inventário de equipamentos</p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={handleImport}
                        className="flex items-center text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Importar
                    </button>
                    <button
                        onClick={handleCreate}
                        className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Novo Device
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 relative">
                    <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, serial ou tipo..."
                        className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 outline-none max-w-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Device</th>
                                <th scope="col" className="px-6 py-3">Tipo</th>
                                <th scope="col" className="px-6 py-3">Serial</th>
                                <th scope="col" className="px-6 py-3">Localle</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-4 text-center">Carregando...</td></tr>
                            ) : filteredDevices.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-4 text-center">Nenhum device encontrado.</td></tr>
                            ) : (
                                filteredDevices.map((d) => (
                                    <tr key={d.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center">
                                            <Monitor className="w-4 h-4 mr-2 text-gray-400" />
                                            {d.nome}
                                        </td>
                                        <td className="px-6 py-4">{d.tipo}</td>
                                        <td className="px-6 py-4 font-mono text-xs">{d.numero_serie}</td>
                                        <td className="px-6 py-4">{d.local}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${d.status === 'Disponível'
                                                ? 'bg-green-100 text-green-800'
                                                : d.status === 'Emprestado'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                {d.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex space-x-2">
                                            <button
                                                onClick={() => handleEdit(d)}
                                                className={`text-blue-600 hover:text-blue-900 ${d.id < 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
