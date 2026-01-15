import { useState, useEffect } from 'react';
import { Users, Smartphone, Shield, Activity, Plus, Edit2, Trash2, CheckCircle, Search, User, Filter, RefreshCw, Upload, Database, Download, AlertTriangle } from 'lucide-react';
import UserModal from '../components/UserModal';
import DeviceTypeModal from '../components/DeviceTypeModal';

export default function Admin() {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [deviceTypes, setDeviceTypes] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isDeviceTypeModalOpen, setIsDeviceTypeModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedDeviceType, setSelectedDeviceType] = useState(null);

    useEffect(() => {
        fetchStats();
        fetchUsers();
        fetchDeviceTypes();
    }, []);

    // Reset search when tab changes
    useEffect(() => {
        setSearchTerm('');
    }, [activeTab]);

    const fetchStats = () => {
        fetch('/api/admin').then(res => res.json()).then(data => {
            if (data.success) setStats(data.data);
        });
    };

    const fetchUsers = () => {
        fetch('/api/admin/users').then(res => res.json()).then(data => {
            if (data.success) setUsers(data.data);
        });
    };

    const fetchDeviceTypes = () => {
        fetch('/api/admin/tipos-devices').then(res => res.json()).then(data => {
            if (data.success) setDeviceTypes(data.data);
        });
    };

    const handleCreateUser = () => {
        setSelectedUser(null);
        setIsUserModalOpen(true);
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setIsUserModalOpen(true);
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

        try {
            const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                fetchUsers();
                fetchStats();
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Erro ao excluir usuário');
        }
    };

    const handleCreateDeviceType = () => {
        setSelectedDeviceType(null);
        setIsDeviceTypeModalOpen(true);
    };

    const handleEditDeviceType = (type) => {
        setSelectedDeviceType(type);
        setIsDeviceTypeModalOpen(true);
    };

    const handleDeleteDeviceType = async (typeId) => {
        if (!confirm('Tem certeza que deseja excluir este tipo de device?')) return;

        try {
            const res = await fetch(`/api/admin/tipos-devices/${typeId}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                fetchDeviceTypes();
                fetchStats();
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Erro ao excluir tipo');
        }
    };

    // Filter Logic
    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredDeviceTypes = deviceTypes.filter(t =>
        t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition-all relative ${activeTab === id
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
        >
            <Icon className={`w-5 h-5 ${activeTab === id ? 'text-blue-600' : 'text-gray-400'}`} />
            {label}
            {activeTab === id && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></span>
            )}
        </button>
    );

    return (
        <div className="space-y-8 animate-fade-in-up">

            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                        <Shield className="w-8 h-8 text-blue-600" />
                        Painel Administrativo
                    </h1>
                    <p className="text-gray-500 mt-1">Central de controle e configurações do sistema</p>
                </div>
                {/* Stats Summary could go here in small pills if needed */}
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">

                {/* Tabs Navigation */}
                <div className="flex border-b border-gray-200 overflow-x-auto bg-gray-50/50">
                    <TabButton id="dashboard" label="Visão Geral" icon={Activity} />
                    <TabButton id="users" label="Usuários" icon={Users} />
                    <TabButton id="types" label="Tipos de Device" icon={Smartphone} />
                    <TabButton id="system" label="Sistema & Backup" icon={Database} />
                </div>

                <div className="p-6">
                    {/* Dashboard Tab */}
                    {activeTab === 'dashboard' && stats && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-500/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Users className="w-24 h-24 transform rotate-12" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-blue-100 font-medium mb-1">Total Usuários</p>
                                    <h3 className="text-4xl font-bold">{stats.total_usuarios}</h3>
                                    <div className="mt-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-400/30 text-white border border-blue-400/30">
                                        {stats.admin_users} Admins
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Shield className="w-24 h-24 transform rotate-12" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-indigo-100 font-medium mb-1">Nível de Acesso</p>
                                    <h3 className="text-4xl font-bold">{stats.admin_users}</h3>
                                    <p className="text-indigo-200 text-sm mt-1">Administradores ativos</p>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Smartphone className="w-24 h-24 transform rotate-12" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-emerald-100 font-medium mb-1">Tipos de Device</p>
                                    <h3 className="text-4xl font-bold">{stats.total_tipos}</h3>
                                    <p className="text-emerald-200 text-sm mt-1">Categorias cadastradas</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="relative w-full md:max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar usuário por nome, email ou cargo..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all shadow-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={handleCreateUser}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 font-medium active:scale-95"
                                >
                                    <Plus className="w-5 h-5" />
                                    Novo Usuário
                                </button>
                            </div>

                            <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <table className="w-full">
                                    <thead className="bg-gray-50/80 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuário</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contato</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Perfil</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                                    Nenhum usuário encontrado.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUsers.map(u => (
                                                <tr key={u.id} className="hover:bg-gray-50/80 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10 relative">
                                                                {u.foto_path ? (
                                                                    <img
                                                                        src={`/${u.foto_path.replace('uploads/', 'uploads/')}`}
                                                                        alt={u.username}
                                                                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                                                    />
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-white shadow-sm text-gray-500 font-bold">
                                                                        {u.username?.[0]?.toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-semibold text-gray-900">{u.username}</div>
                                                                <div className="text-xs text-gray-400">ID: {u.id}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {u.email ? (
                                                            <span className="flex items-center gap-1.5"><Search className="w-3 h-3" /> {u.email}</span>
                                                        ) : (
                                                            <span className="text-gray-400 italic">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${u.role === 'admin'
                                                            ? 'bg-purple-50 text-purple-700 border-purple-100'
                                                            : u.role === 'professor'
                                                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                                : 'bg-gray-50 text-gray-700 border-gray-100'
                                                            }`}>
                                                            {u.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                                                            {u.role === 'admin' ? 'Administrador' : u.role === 'professor' ? 'Professor' : 'Usuário'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleEditUser(u)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                                title="Editar"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUser(u.id)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                                title="Excluir"
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
                        </div>
                    )}

                    {/* Device Types Tab */}
                    {activeTab === 'types' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="relative w-full md:max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar tipo por nome ou categoria..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all shadow-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={handleCreateDeviceType}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 font-medium active:scale-95"
                                >
                                    <Plus className="w-5 h-5" />
                                    Novo Tipo
                                </button>
                            </div>

                            <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <table className="w-full">
                                    <thead className="bg-gray-50/80 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Device / Categoria</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Descrição</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Empréstimo</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {filteredDeviceTypes.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                                    Nenhum tipo de device encontrado.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredDeviceTypes.map(t => (
                                                <tr key={t.id} className="hover:bg-gray-50/80 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <div className="p-2 bg-gray-100 rounded-lg mr-3 text-gray-600">
                                                                <Smartphone className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">{t.nome}</div>
                                                                <div className="text-xs text-gray-500">{t.categoria}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                        {t.descricao || <span className="text-gray-400 italic">Sem descrição</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {t.para_emprestimo ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-medium">
                                                                <CheckCircle className="w-3 h-3" />
                                                                Ativo
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-gray-50 text-gray-500 border border-gray-100 rounded-full text-xs font-medium">
                                                                Indisponível
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleEditDeviceType(t)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                                title="Editar"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteDeviceType(t.id)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                                title="Excluir"
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
                        </div>
                    )}

                    {/* System & Backup Tab */}
                    {activeTab === 'system' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                        <Database className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">Backup do Sistema</h3>
                                        <p className="text-sm text-gray-500">Exportar dados</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                                    Gere um arquivo SQL contendo todos os dados atuais do banco de dados (Alunos, Devices, Empréstimos, Usuários).
                                    Recomendado fazer semanalmente para segurança.
                                </p>
                                <a
                                    href="/api/system/backup"
                                    target="_blank"
                                    className="flex items-center justify-center w-full px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all font-medium group"
                                >
                                    <Download className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                                    Baixar Backup (.sql)
                                </a>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                                        <RefreshCw className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">Restaurar Dados</h3>
                                        <p className="text-sm text-gray-500">Importar dados</p>
                                    </div>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 mb-6 flex gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                    <p className="text-xs text-amber-800 font-medium">
                                        Atenção: A restauração substituirá todos os dados atuais. Certifique-se de ter um backup recente antes de prosseguir.
                                    </p>
                                </div>
                                <button
                                    onClick={() => document.getElementById('restorefs').click()}
                                    className="flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all font-medium shadow-lg shadow-amber-500/20"
                                >
                                    <Upload className="w-5 h-5 mr-2" />
                                    Selecionar Arquivo Restore
                                </button>
                                <input
                                    type="file"
                                    id="restorefs"
                                    className="hidden"
                                    accept=".sql"
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;

                                        if (!confirm("Tem certeza? Isso irá modificar o banco de dados!")) {
                                            e.target.value = '';
                                            return;
                                        }

                                        const formData = new FormData();
                                        formData.append('file', file);

                                        try {
                                            alert("Iniciando restauração... Aguarde o aviso de conclusão.");
                                            const res = await fetch('/api/system/restore', {
                                                method: 'POST',
                                                body: formData
                                            });
                                            const data = await res.json();
                                            alert(data.message);
                                            if (data.success) window.location.reload();
                                        } catch (err) {
                                            alert("Erro ao restaurar: " + err);
                                        }
                                        e.target.value = '';
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <UserModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                onSave={() => {
                    fetchUsers();
                    fetchStats();
                }}
                user={selectedUser}
            />

            <DeviceTypeModal
                isOpen={isDeviceTypeModalOpen}
                onClose={() => setIsDeviceTypeModalOpen(false)}
                onSave={() => {
                    fetchDeviceTypes();
                    fetchStats();
                }}
                deviceType={selectedDeviceType}
            />
        </div>
    );
}
