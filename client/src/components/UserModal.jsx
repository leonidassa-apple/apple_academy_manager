import { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Shield, Save, Upload } from 'lucide-react';

export default function UserModal({ isOpen, onClose, onSave, user }) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'user'
    });

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                email: user.email || '',
                password: '',
                role: user.role || 'user'
            });
        } else {
            setFormData({
                username: '',
                email: '',
                password: '',
                role: 'user'
            });
        }
    }, [user, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const url = user ? `/api/admin/users/${user.id}` : '/api/admin/users';
        const method = user ? 'PUT' : 'POST';

        // Don't send password if empty on edit
        const payload = { ...formData };
        if (user && !payload.password) {
            delete payload.password;
        }

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.success) {
                onSave();
                onClose();
            } else {
                alert(data.message || 'Erro ao salvar usuário');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Erro ao salvar usuário');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-100">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                <User className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold leading-6 text-white">
                                    {user ? 'Editar Usuário' : 'Novo Usuário'}
                                </h3>
                                <p className="text-blue-100 text-sm mt-0.5">Gerenciamento de acesso</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                <User className="w-4 h-4 mr-1.5 text-gray-400" />
                                Username *
                            </label>
                            <input
                                type="text"
                                required
                                className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                placeholder="Digite o username"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                <Mail className="w-4 h-4 mr-1.5 text-gray-400" />
                                Email
                            </label>
                            <input
                                type="email"
                                className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="email@exemplo.com"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                <Lock className="w-4 h-4 mr-1.5 text-gray-400" />
                                Senha {user && <span className="text-xs font-normal text-gray-400 ml-1">(deixe vazio para manter)</span>}
                            </label>
                            <input
                                type="password"
                                required={!user}
                                className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder={user ? "Nova senha (opcional)" : "Digite a senha"}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                <Shield className="w-4 h-4 mr-1.5 text-gray-400" />
                                Perfil de Acesso *
                            </label>
                            <div className="relative">
                                <select
                                    required
                                    className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm appearance-none"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="user">Usuário Padrão</option>
                                    <option value="admin">Administrador</option>
                                    <option value="professor">Professor</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                <Upload className="w-4 h-4 mr-1.5 text-gray-400" />
                                Foto de Perfil
                            </label>
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-all group">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Clique para enviar</span></p>
                                    <p className="text-xs text-gray-400">SVG, PNG, JPG (MAX. 800x400px)</p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file || !user) {
                                            console.log("Upload aborted: file or user missing", { file, user });
                                            if (!user) alert("Salve o usuário primeiro antes de adicionar foto.");
                                            return;
                                        }

                                        const formData = new FormData();
                                        formData.append('foto', file);

                                        const uploadUrl = `/api/admin/users/${user.id}/foto`;
                                        console.log(`Starting upload to: ${uploadUrl}`, { userId: user.id });

                                        try {
                                            const res = await fetch(uploadUrl, {
                                                method: 'POST',
                                                body: formData
                                            });

                                            // More detailed error handling
                                            if (!res.ok) {
                                                const text = await res.text();
                                                alert(`Erro do servidor (${res.status}): ${text}`);
                                                console.error("Server error response:", text, "Status:", res.status);
                                                return;
                                            }

                                            const data = await res.json();
                                            if (data.success) {
                                                alert('Foto atualizada com sucesso!');
                                            } else {
                                                alert('Erro: ' + data.message);
                                            }
                                        } catch (error) {
                                            console.error('Fetch error:', error);
                                            alert('Erro de conexão ao fazer upload da foto. Verifique o console.');
                                        }
                                    }}
                                />
                            </label>
                            {!user && <p className="text-xs text-amber-600 mt-1 ml-1">Crie o usuário primeiro para adicionar foto.</p>}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex items-center px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all shadow-md hover:shadow-lg transform active:scale-95"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Salvar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
