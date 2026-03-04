
import React, { useState } from 'react';
import { User, Mail, Lock, Upload, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Perfil = () => {
    const { user, fetchUser } = useAuth();
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [signature, setSignature] = useState(null);
    const [signaturePreview, setSignaturePreview] = useState(user?.assinatura_path ? `/${user.assinatura_path}` : null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSignatureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSignature(file);
            setSignaturePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password && password !== confirmPassword) {
            setMessage({ type: 'error', text: 'As senhas não coincidem!' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const formData = new FormData();
            formData.append('email', email);
            if (password) formData.append('password', password);
            if (signature) formData.append('assinatura', signature);

            const response = await fetch('/api/user/perfil', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
                setPassword('');
                setConfirmPassword('');
                // Refresh user data in context
                if (fetchUser) fetchUser();
            } else {
                setMessage({ type: 'error', text: data.message || 'Erro ao atualizar perfil' });
            }
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            setMessage({ type: 'error', text: 'Erro de conexão com o servidor' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-700">
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl relative overflow-hidden group">
                            {user?.foto_path ? (
                                <img src={`/${user.foto_path}`} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={48} className="text-white" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">{user?.username}</h1>
                            <p className="text-blue-100 font-bold uppercase text-xs tracking-[0.2em] mt-1">{user?.role}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8">
                    {message.text && (
                        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            <p className="font-bold text-sm">{message.text}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Basic Info */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <User size={16} /> Dados Pessoais
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">E-mail</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="seu@email.com"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-700"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nova Senha (deixe vazio para não alterar)</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-700"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Confirmar Nova Senha</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-700"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Signature Section */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <ImageIcon size={16} /> Assinatura Digital
                            </h3>

                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 border-dashed relative group hover:bg-slate-100 transition-all text-center">
                                {signaturePreview ? (
                                    <div className="relative inline-block w-full h-48 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-inner">
                                        <img src={signaturePreview} alt="Assinatura" className="w-full h-full object-contain p-4" />
                                        <button
                                            type="button"
                                            onClick={() => { setSignature(null); setSignaturePreview(null); }}
                                            className="absolute top-2 right-2 p-2 bg-rose-50 text-rose-500 rounded-full hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                        >
                                            <AlertCircle size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="py-12 flex flex-col items-center">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                            <Upload size={32} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-500">Arraste ou clique para carregar sua assinatura</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">PNG ou JPG com fundo branco/transparente</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleSignatureChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-800 transition-all font-black text-sm shadow-xl shadow-blue-200 active:scale-95 flex items-center gap-2"
                        >
                            {loading ? (
                                <RefreshCw className="animate-spin" size={20} />
                            ) : (
                                <CheckCircle size={20} />
                            )}
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Perfil;
