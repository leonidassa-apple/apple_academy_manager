import { useState, useEffect } from 'react';
import { Users, Smartphone, Shield, Activity, Plus, Edit2, Trash2, CheckCircle, Search, User, Filter, RefreshCw, Upload, Database, Download, AlertTriangle, Mail, Send, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import UserModal from '../components/UserModal';
import DeviceTypeModal from '../components/DeviceTypeModal';

export default function Admin() {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [deviceTypes, setDeviceTypes] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchTerm, setSearchTerm] = useState('');

    // Email config state
    const [emailConfig, setEmailConfig] = useState({
        mail_server: 'smtp.gmail.com',
        mail_port: 587,
        mail_use_tls: true,
        mail_username: '',
        mail_password: '',
        mail_default_sender: '',
        email_template_emprestimo: '',
        has_password: false,
        atualizado_em: null
    });
    const [emailSaving, setEmailSaving] = useState(false);
    const [emailTesting, setEmailTesting] = useState(false);
    const [emailMsg, setEmailMsg] = useState(null); // {type: 'success'|'error', text: ''}
    const [showPassword, setShowPassword] = useState(false);

    // Modal states
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isDeviceTypeModalOpen, setIsDeviceTypeModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedDeviceType, setSelectedDeviceType] = useState(null);

    useEffect(() => {
        fetchStats();
        fetchUsers();
        fetchDeviceTypes();
        fetchEmailConfig();
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

    const fetchEmailConfig = () => {
        fetch('/api/admin/email-config').then(res => res.json()).then(data => {
            if (data.success && data.data) {
                setEmailConfig(prev => ({ ...prev, ...data.data, mail_password: '' }));
            }
        });
    };

    const handleSaveEmail = async (e) => {
        e.preventDefault();
        setEmailSaving(true);
        setEmailMsg(null);
        try {
            const payload = { ...emailConfig };
            if (!payload.mail_password) delete payload.mail_password; // não sobrescrever se vazio
            const res = await fetch('/api/admin/email-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            setEmailMsg({ type: data.success ? 'success' : 'error', text: data.message });
            if (data.success) fetchEmailConfig();
        } catch (err) {
            setEmailMsg({ type: 'error', text: 'Erro de comunicação com o servidor.' });
        } finally {
            setEmailSaving(false);
        }
    };

    const handleTestEmail = async () => {
        setEmailTesting(true);
        setEmailMsg(null);
        try {
            const res = await fetch('/api/admin/email-config/testar', { method: 'POST' });
            const data = await res.json();
            setEmailMsg({ type: data.success ? 'success' : 'error', text: data.message });
        } catch (err) {
            setEmailMsg({ type: 'error', text: 'Erro ao enviar e-mail de teste.' });
        } finally {
            setEmailTesting(false);
        }
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
                        { id: 'email', label: 'E-mail', icon: Mail },
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

                    {/* Email Config Segment */}
                    {activeTab === 'email' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
                            <div className="flex items-center gap-5 mb-10">
                                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-xl shadow-blue-100">
                                    <Mail size={28} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Configuração de E-mail</h2>
                                    <p className="text-slate-400 font-medium text-sm mt-0.5">Defina o servidor SMTP para envio de notificações</p>
                                </div>
                            </div>

                            {/* Feedback message */}
                            {emailMsg && (
                                <div className={`flex items-center gap-3 p-4 rounded-2xl mb-6 text-sm font-bold
                                    ${emailMsg.type === 'success'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                    {emailMsg.type === 'success'
                                        ? <CheckCircle2 size={20} className="flex-shrink-0" />
                                        : <XCircle size={20} className="flex-shrink-0" />}
                                    {emailMsg.text}
                                </div>
                            )}

                            {/* Gmail hint */}
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-8 flex gap-4 items-start">
                                <Mail size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-blue-800 font-semibold leading-relaxed">
                                    <p className="font-black mb-1">Usando Gmail?</p>
                                    Use seu e-mail Gmail como usuário e crie uma <strong>Senha de App</strong> em:
                                    {' '}<a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="underline text-blue-700 hover:text-blue-900">myaccount.google.com/apppasswords</a>.
                                    <br />Servidor: <code className="bg-blue-100 px-1.5 py-0.5 rounded-md">smtp.gmail.com</code> &nbsp;|&nbsp; Porta: <code className="bg-blue-100 px-1.5 py-0.5 rounded-md">587</code> &nbsp;|&nbsp; TLS: <strong>Ativado</strong>
                                </div>
                            </div>

                            <form onSubmit={handleSaveEmail} className="space-y-6">
                                {/* Server + Port */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Servidor SMTP</label>
                                        <input
                                            type="text"
                                            value={emailConfig.mail_server}
                                            onChange={e => setEmailConfig(p => ({ ...p, mail_server: e.target.value }))}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 focus:bg-white transition-all text-slate-700 font-bold"
                                            placeholder="smtp.gmail.com"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Porta</label>
                                        <input
                                            type="number"
                                            value={emailConfig.mail_port}
                                            onChange={e => setEmailConfig(p => ({ ...p, mail_port: parseInt(e.target.value) }))}
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 focus:bg-white transition-all text-slate-700 font-bold"
                                            placeholder="587"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* TLS Toggle */}
                                <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4">
                                    <div>
                                        <p className="font-black text-slate-700 text-sm">Usar TLS (Recomendado)</p>
                                        <p className="text-xs text-slate-400 font-medium mt-0.5">Criptografia da conexão com o servidor SMTP</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setEmailConfig(p => ({ ...p, mail_use_tls: !p.mail_use_tls }))}
                                        className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none ${emailConfig.mail_use_tls ? 'bg-indigo-600' : 'bg-slate-200'
                                            }`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${emailConfig.mail_use_tls ? 'translate-x-7' : 'translate-x-0'
                                            }`} />
                                    </button>
                                </div>

                                {/* Username */}
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">E-mail Remetente (Usuário SMTP)</label>
                                    <input
                                        type="email"
                                        value={emailConfig.mail_username}
                                        onChange={e => setEmailConfig(p => ({ ...p, mail_username: e.target.value, mail_default_sender: e.target.value }))}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 focus:bg-white transition-all text-slate-700 font-bold"
                                        placeholder="seuemail@gmail.com"
                                        required
                                    />
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                        Senha de App / Token SMTP
                                        {emailConfig.has_password && (
                                            <span className="ml-2 text-emerald-600 normal-case font-bold">(já configurada — deixe vazio para manter)</span>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={emailConfig.mail_password}
                                            onChange={e => setEmailConfig(p => ({ ...p, mail_password: e.target.value }))}
                                            className="w-full px-5 py-4 pr-14 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 focus:bg-white transition-all text-slate-700 font-bold"
                                            placeholder={emailConfig.has_password ? '••••••••••••' : 'Senha de App do Google'}
                                        />
                                        <button type="button" onClick={() => setShowPassword(p => !p)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Template de Confirmação de Empréstimo */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                                            Mensagem de Confirmação de Empréstimo
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setEmailConfig(p => ({
                                                ...p, email_template_emprestimo:
                                                    `Olá, {aluno}!

Esse é o e-mail automático de confirmação do empréstimo do livro/device {item}, no dia {data}, autorizado por {responsavel}.

Caso você não tenha feito esse empréstimo, contate imediatamente a equipe de TI ou mentores.` }))}
                                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors"
                                        >
                                            ↩ Usar Modelo Padrão
                                        </button>
                                    </div>
                                    <textarea
                                        value={emailConfig.email_template_emprestimo || ''}
                                        onChange={e => setEmailConfig(p => ({ ...p, email_template_emprestimo: e.target.value }))}
                                        rows={8}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 focus:bg-white transition-all text-slate-700 font-mono text-sm resize-y"
                                        placeholder={`Olá, {aluno}!\n\nEsse é o e-mail automático de confirmação do empréstimo do livro/device {item}, no dia {data}, autorizado por {responsavel}.\n\nCaso você não tenha feito esse empréstimo, contate imediatamente a equipe de TI ou mentores.`}
                                    />
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {['{aluno}', '{item}', '{data}', '{data_devolucao}', '{responsavel}'].map(v => (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={() => setEmailConfig(p => ({ ...p, email_template_emprestimo: (p.email_template_emprestimo || '') + v }))}
                                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-black font-mono tracking-wider transition-colors"
                                            >
                                                {v}
                                            </button>
                                        ))}
                                        <span className="text-[10px] text-slate-400 font-medium self-center ml-1">clique para inserir a variável</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-4 pt-2">
                                    <button
                                        type="submit"
                                        disabled={emailSaving}
                                        className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-indigo-600 to-violet-700 text-white rounded-3xl hover:from-indigo-700 hover:to-violet-800 transition-all shadow-xl shadow-indigo-100 font-black text-xs uppercase tracking-widest active:scale-95 disabled:opacity-60"
                                    >
                                        {emailSaving ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                        {emailSaving ? 'Salvando...' : 'Salvar Configurações'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleTestEmail}
                                        disabled={emailTesting || !emailConfig.mail_username}
                                        className="flex items-center gap-2 px-8 py-5 bg-white border border-slate-200 rounded-3xl text-slate-700 hover:border-indigo-400 hover:text-indigo-700 transition-all font-black text-xs uppercase tracking-widest shadow-sm active:scale-95 disabled:opacity-40"
                                    >
                                        {emailTesting ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                                        Testar
                                    </button>
                                </div>

                                {emailConfig.atualizado_em && (
                                    <p className="text-center text-xs text-slate-400 font-medium">
                                        Última atualização: {new Date(emailConfig.atualizado_em).toLocaleString('pt-BR')}
                                    </p>
                                )}
                            </form>
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
                                        Uma snapshot integral do ecossistema CoreManager. Contém registros de estudantes, inventário histórico e configurações de usuários.
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
