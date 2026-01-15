import { useState, useEffect, useRef } from 'react';
import { X, Save, Upload, User, Mail, FileText, Phone, BookOpen, CreditCard, Apple, Camera } from 'lucide-react';

export default function AlunoModal({ isOpen, onClose, onSave, student = null }) {
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        cpf: '',
        telefone: '',
        curso: '',
        tipo_aluno: 'Regular',
        status_aluno: 'Ativo',
        tem_apple_id: false,
        apple_id: ''
    });
    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (student) {
            setFormData({
                ...student,
                tem_apple_id: student.tem_apple_id === true || student.tem_apple_id === 1 || student.tem_apple_id === '1',
                telefone: student.telefone || '',
                cpf: student.cpf || '',
                apple_id: student.apple_id || ''
            });
            if (student.foto_path) {
                // Adjust path for preview if it exists on server
                const cleanPath = student.foto_path.replace('uploads/', '');
                setPreviewUrl(`/uploads/${cleanPath}`);
            } else {
                setPreviewUrl(null);
            }
        } else {
            setFormData({
                nome: '',
                email: '',
                cpf: '',
                telefone: '',
                curso: '',
                tipo_aluno: 'Regular',
                status_aluno: 'Ativo',
                tem_apple_id: false,
                apple_id: ''
            });
            setPreviewUrl(null);
        }
    }, [student, isOpen]);

    // Handle drag events
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    // Handle drop
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    // Handle file selection manually
    const handleChangeFile = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file) => {
        setFormData({ ...formData, foto: file });
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };


    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = student ? `/api/alunos/${student.id}` : '/api/alunos';
            const method = student ? 'PUT' : 'POST';

            const formPayload = new FormData();

            Object.keys(formData).forEach(key => {
                if (key === 'foto') {
                    if (formData[key]) {
                        formPayload.append('foto', formData[key]);
                    }
                } else {
                    formPayload.append(key, formData[key] === null ? '' : formData[key]);
                }
            });

            const response = await fetch(url, {
                method: method,
                body: formPayload
            });

            const data = await response.json();

            if (data.success) {
                onSave();
                onClose();
            } else {
                alert(data.message || 'Erro ao salvar aluno');
            }
        } catch (error) {
            console.error('Error saving student:', error);
            alert('Erro ao conectar com o servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop with blur */}
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-4xl border border-gray-100">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                <User className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold leading-6 text-white" id="modal-title">
                                    {student ? 'Editar Aluno' : 'Novo Cadastro'}
                                </h3>
                                <p className="text-blue-100 text-sm mt-0.5">Preencha os dados do estudante</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="px-8 py-8" onDragEnter={handleDrag}>
                        <div className="flex flex-col lg:flex-row gap-8">

                            {/* Left Column: Photo Upload Section */}
                            <div className="w-full lg:w-1/3 flex flex-col items-center space-y-4">
                                <div className="relative group">
                                    <div
                                        onClick={triggerFileInput}
                                        className={`
                                            relative w-48 h-48 rounded-full border-4 border-dashed cursor-pointer overflow-hidden transition-all duration-300 shadow-inner
                                            ${dragActive ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'}
                                        `}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                    >
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-400 group-hover:text-blue-500">
                                                <Camera className="w-12 h-12 mb-2" />
                                                <span className="text-xs font-medium text-center px-4">Arraste ou clique para foto</span>
                                            </div>
                                        )}

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Upload className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleChangeFile}
                                    />
                                    <div className="absolute bottom-2 right-4 bg-white rounded-full p-2 shadow-lg border border-gray-100">
                                        <Camera className="w-4 h-4 text-gray-600" />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 text-center max-w-[200px]">
                                    Formatos aceitos: JPG, PNG. Máx 5MB. Preferência por proporção 1:1.
                                </p>
                            </div>

                            {/* Right Column: Form Fields */}
                            <div className="w-full lg:w-2/3 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* Nome */}
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Nome Completo</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <User className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                                placeholder="Ex: João da Silva"
                                                value={formData.nome || ''}
                                                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Email Institucional</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                                placeholder="aluno@academy.apple.com"
                                                value={formData.email || ''}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Telefone */}
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Telefone / Celular</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Phone className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                                placeholder="(XX) 9XXXX-XXXX"
                                                value={formData.telefone || ''}
                                                onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* CPF */}
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">CPF</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <CreditCard className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                                placeholder="000.000.000-00"
                                                value={formData.cpf || ''}
                                                onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Curso */}
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Curso / Formação</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <BookOpen className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                                placeholder="Ex: Ciência da Computação"
                                                value={formData.curso || ''}
                                                onChange={e => setFormData({ ...formData, curso: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Tipo e Status */}
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Categoria do Aluno</label>
                                        <select
                                            className="block w-full pl-3 pr-10 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm appearance-none"
                                            value={formData.tipo_aluno}
                                            onChange={e => setFormData({ ...formData, tipo_aluno: e.target.value })}
                                        >
                                            <option value="Regular">Regular</option>
                                            <option value="Bolsista">Bolsista</option>
                                            <option value="Foundation">Foundation</option>
                                        </select>
                                    </div>

                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Status Acadêmico</label>
                                        <select
                                            className="block w-full pl-3 pr-10 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm appearance-none"
                                            value={formData.status_aluno}
                                            onChange={e => setFormData({ ...formData, status_aluno: e.target.value })}
                                        >
                                            <option value="Ativo">🟢 Ativo</option>
                                            <option value="Inativo">🟡 Inativo</option>
                                            <option value="Desligado">🔴 Desligado (Egress)</option>
                                        </select>
                                    </div>

                                    {/* Seção Apple ID */}
                                    <div className="col-span-2 bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <div className="flex items-start space-x-3">
                                            <div className="flex items-center h-6">
                                                <input
                                                    id="apple_id_check"
                                                    type="checkbox"
                                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    checked={formData.tem_apple_id}
                                                    onChange={e => setFormData({ ...formData, tem_apple_id: e.target.checked })}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label htmlFor="apple_id_check" className="font-semibold text-gray-800 cursor-pointer flex items-center">
                                                    <Apple className="w-4 h-4 mr-1.5 mb-0.5" />
                                                    Possui Apple ID Gerenciado?
                                                </label>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Marque esta opção se o aluno tiver uma conta Apple ID corporativa ou educacional.
                                                </p>

                                                {/* Apple ID Input com animação */}
                                                <div className={`mt-4 transition-all duration-300 overflow-hidden ${formData.tem_apple_id ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                                                    <div className="relative">
                                                        <input
                                                            type="email"
                                                            className="block w-full pl-3 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                                                            placeholder="exemplo@apple.com"
                                                            value={formData.apple_id || ''}
                                                            onChange={e => setFormData({ ...formData, apple_id: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="bg-gray-50 -mx-8 -mb-8 mt-8 px-8 py-5 flex justify-end gap-3 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:z-10 focus:ring-2 focus:ring-gray-300 transition-all shadow-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Salvar Alterações
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
