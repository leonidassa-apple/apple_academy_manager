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
        <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Command Center Header */}
            <div className="bg-white rounded-[2rem] p-8 mb-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/50 rounded-full -mr-48 -mt-48 blur-3xl"></div>

                <div className="relative z-10 flex items-center gap-6">
                    <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-xl shadow-slate-200">
                        <Shield size={36} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase">Admin Center</h1>
                        <div className="flex items-center gap-2 mt-1 text-slate-500 font-medium">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Sistema em conformidade e atualizado
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex gap-3">
                    <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database</span>
                        <span className="text-sm font-bold text-slate-700">Production</span>
                    </div>
                </div>
            </div>

            {/* Navigation & Content Wrapper */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[600px] flex flex-col">

                {/* Modern Pill Navigation */}
                <div className="px-8 pt-8 flex border-b border-slate-50 overflow-x-auto gap-2 bg-slate-50/20">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: Activity },
                        { id: 'users', label: 'Equipe', icon: Users },
                        { id: 'types', label: 'Catálogo', icon: Smartphone },
                        { id: 'system', label: 'Infraestrutura', icon: Database }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-8 py-4 font-black text-xs uppercase tracking-widest transition-all rounded-t-3xl relative ${activeTab === tab.id
                                    ? 'bg-white text-indigo-600 border-x border-t border-slate-100 translate-y-[1px] z-10 shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.05)]'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <tab.icon size={16} className={activeTab === tab.id ? 'text-indigo-600' : 'text-slate-300'} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-10 flex-grow bg-white relative">
                    {/* Dashboard Segment */}
                    {activeTab === 'dashboard' && stats && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                                    <div className="relative z-10">
                                        <div className="p-3 bg-white/10 rounded-2xl w-fit mb-6 backdrop-blur-md">
                                            <Users size={24} />
                                        </div>
                                        <p className="text-indigo-100 font-black text-xs uppercase tracking-widest mb-1">Total de Colaboradores</p>
                                        <h3 className="text-5xl font-black tracking-tighter">{stats.total_usuarios}</h3>
                                        <div className="mt-8 flex items-center gap-2">
                                            <span className="px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-sm">
                                                {stats.admin_users} Super-Users
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                                    <div className="relative z-10">
                                        <div className="p-3 bg-white/10 rounded-2xl w-fit mb-6 backdrop-blur-md">
                                            <Shield size={24} />
                                        </div>
                                        <p className="text-slate-400 font-black text-xs uppercase tracking-widest mb-1">Privilégios Elevados</p>
                                        <h3 className="text-5xl font-black tracking-tighter">{stats.admin_users}</h3>
                                        <p className="text-slate-500 font-bold text-sm mt-2 tracking-tight">Administradores com acesso total</p>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-100 relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                                    <div className="relative z-10">
                                        <div className="p-3 bg-white/10 rounded-2xl w-fit mb-6 backdrop-blur-md">
                                            <Smartphone size={24} />
                                        </div>
                                        <p className="text-emerald-100 font-black text-xs uppercase tracking-widest mb-1">Tipos de Inventário</p>
                                        <h3 className="text-5xl font-black tracking-tighter">{stats.total_tipos}</h3>
                                        <p className="text-emerald-200 font-bold text-sm mt-2 tracking-tight">Segmentos de devices ativos</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Users Segment */}
                    {activeTab === 'users' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                                <div className="relative w-full md:max-w-xl">
                                    <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-300" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Filtrar por nome, email ou cargo..."
                                        className="w-full pl-14 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all text-slate-600 font-bold shadow-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={handleCreateUser}
                                    className="flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-indigo-600 to-violet-700 text-white rounded-3xl hover:from-indigo-700 hover:to-violet-800 transition-all shadow-xl shadow-indigo-100 font-black text-xs uppercase tracking-widest active:scale-95 group"
                                >
                                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                    Adicionar Colaborador
                                </button>
                            </div>

                            <div className="overflow-x-auto rounded-[2.5rem] border border-slate-50 bg-slate-50/10">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Colaborador</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Privilégios</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Controles</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredUsers.map(u => (
                                            <tr key={u.id} className="hover:bg-indigo-50/30 transition-all duration-300 group">
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center gap-5">
                                                        <div className="relative">
                                                            {u.foto_path ? (
                                                                <img
                                                                    src={`/${u.foto_path}`}
                                                                    alt=""
                                                                    className="w-14 h-14 rounded-2xl object-cover ring-4 ring-white shadow-lg"
                                                                />
                                                            ) : (
                                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 flex items-center justify-center text-indigo-600 font-black text-xl border-2 border-white shadow-md">
                                                                    {u.username?.[0]?.toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${u.role === 'admin' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
                                                        </div>
                                                        <div>
                                                            <p className="text-base font-black text-slate-900 leading-none">{u.username}</p>
                                                            <p className="text-xs font-bold text-slate-400 mt-1.5">{u.email || 'Sem email vinculado'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6">
                                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${u.role === 'admin'
                                                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                                                            : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                                        }`}>
                                                        {u.role === 'admin' && <Shield size={12} />}
                                                        {u.role === 'admin' ? 'Acesso Total (Root)' : u.role}
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6 text-right">
                                                    <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                        <button onClick={() => handleEditUser(u)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-none hover:shadow-lg transition-all">
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button onClick={() => handleDeleteUser(u.id)} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl shadow-none hover:shadow-lg transition-all">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Device Types Segment */}
                    {activeTab === 'types' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                                <div className="relative w-full md:max-w-xl">
                                    <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-300" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nome ou segmento..."
                                        className="w-full pl-14 pr-8 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:bg-white transition-all text-slate-600 font-bold shadow-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={handleCreateDeviceType}
                                    className="flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl hover:from-emerald-700 hover:to-teal-800 transition-all shadow-xl shadow-emerald-100 font-black text-xs uppercase tracking-widest active:scale-95 group"
                                >
                                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                    Novo Segmento
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredDeviceTypes.map(t => (
                                    <div key={t.id} className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden flex flex-col">
                                        <div className="p-4 bg-slate-50 rounded-2xl w-fit mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-500">
                                            <Smartphone size={32} strokeWidth={1.5} />
                                        </div>
                                        <div className="space-y-2 mb-8">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.categoria}</p>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t.nome}</h3>
                                            <p className="text-slate-500 text-sm font-medium line-clamp-2">{t.descricao || 'Sem descrição detalhada'}</p>
                                        </div>

                                        <div className="mt-auto flex justify-between items-center pt-8 border-t border-slate-50">
                                            <div className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest ${t.para_emprestimo ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                                                }`}>
                                                {t.para_emprestimo ? 'Elegível para empréstimo' : 'Uso Interno'}
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEditDeviceType(t)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDeleteDeviceType(t.id)} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-xl transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Infrastructure Segment (System & Backup) */}
                    {activeTab === 'system' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
                                    <div className="flex items-center gap-6 mb-10">
                                        <div className="p-6 bg-indigo-50 text-indigo-600 rounded-[2rem] group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500 shadow-lg shadow-indigo-100">
                                            <Database size={40} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Preservação de Dados</h3>
                                            <p className="text-slate-400 font-bold text-sm tracking-tight uppercase">Exportação SQL completa</p>
                                        </div>
                                    </div>
                                    <p className="text-slate-500 font-medium mb-12 leading-relaxed text-lg">
                                        Uma snapshot integral do ecossistema Apple Academy. Contém registros de estudantes, inventário histórico e configurações de usuários.
                                    </p>
                                    <a
                                        href="/api/system/backup"
                                        target="_blank"
                                        className="flex items-center justify-center w-full px-8 py-6 bg-slate-900 text-white rounded-3xl hover:bg-black transition-all font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 group/btn"
                                    >
                                        <Download className="w-5 h-5 mr-3 group-hover/btn:translate-y-1 transition-transform" />
                                        Consolidar Backup (.sql)
                                    </a>
                                </div>

                                <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
                                    <div className="flex items-center gap-6 mb-10">
                                        <div className="p-6 bg-rose-50 text-rose-600 rounded-[2rem] group-hover:bg-rose-600 group-hover:text-white transition-colors duration-500 shadow-lg shadow-rose-100">
                                            <RefreshCw size={40} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Restauração Crítica</h3>
                                            <p className="text-slate-400 font-bold text-sm tracking-tight uppercase">Recuperação de desastres</p>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100/50 mb-10 flex gap-4 items-center">
                                        <AlertTriangle className="w-8 h-8 text-rose-500 flex-shrink-0 animate-pulse" />
                                        <p className="text-xs text-rose-800 font-black uppercase tracking-wider leading-relaxed">
                                            Alerta: Este processo é destrutivo e substituirá o banco de dados atual instantaneamente.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => document.getElementById('restorefs').click()}
                                        className="flex items-center justify-center w-full px-8 py-6 bg-white border-2 border-slate-900 text-slate-900 rounded-3xl hover:bg-slate-900 hover:text-white transition-all font-black text-xs uppercase tracking-[0.2em]"
                                    >
                                        <Upload className="w-5 h-5 mr-3" />
                                        Carregar Snapshot SQL
                                    </button>
                                    <input
                                        type="file"
                                        id="restorefs"
                                        className="hidden"
                                        accept=".sql"
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;

                                            if (!confirm("CONFIRMAÇÃO DE SEGURANÇA: Deseja realmente sobrescrever todos os dados do sistema?")) {
                                                e.target.value = '';
                                                return;
                                            }

                                            const formData = new FormData();
                                            formData.append('file', file);

                                            try {
                                                alert("OPERACÃO INICIADA: Não feche esta janela...");
                                                const res = await fetch('/api/system/restore', {
                                                    method: 'POST',
                                                    body: formData
                                                });
                                                const data = await res.json();
                                                alert(data.message);
                                                if (data.success) window.location.reload();
                                            } catch (err) {
                                                alert("FALHA NA OPERAÇÃO: " + err);
                                            }
                                            e.target.value = '';
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Modals */}
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
