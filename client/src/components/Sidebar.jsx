import { LayoutDashboard, Users, Smartphone, BookOpen, Calendar, Settings, LogOut, Archive, X, Library, Repeat, HardDrive, ShieldCheck, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ onClose }) {
    const { user, logout } = useAuth();

    const menuSections = user?.role === 'professor' ? [
        {
            label: 'Biblioteca',
            items: [
                { to: '/biblioteca', icon: Library, label: 'Biblioteca' },
                { to: '/emprestimos-livros', icon: Repeat, label: 'Circulação' },
                { to: '/livros', icon: Settings, label: 'Ger. Acervo' },
            ]
        },
        {
            label: 'Usuário',
            items: [
                { to: '/perfil', icon: User, label: 'Meu Perfil' }
            ]
        }
    ] : [
        {
            label: 'Principal',
            items: [
                { to: '/dashboard', icon: LayoutDashboard, label: 'Painel' },
                { to: '/alunos', icon: Users, label: 'Alunos' },
                { to: '/agenda', icon: Calendar, label: 'Agenda' },
            ]
        },
        {
            label: 'Biblioteca',
            items: [
                { to: '/biblioteca', icon: Library, label: 'Biblioteca' },
                { to: '/emprestimos-livros', icon: Repeat, label: 'Circulação' },
                ...(user?.role === 'admin' ? [{ to: '/livros', icon: Settings, label: 'Ger. Acervo' }] : []),
            ]
        },
        {
            label: 'Equipamentos',
            items: [
                { to: '/devices', icon: Smartphone, label: 'Devices' },
                { to: '/emprestimos', icon: BookOpen, label: 'Empréstimos' },
                ...(user?.role === 'admin' ? [
                    { to: '/dispositivos', icon: HardDrive, label: 'Controle Equip.' },
                    { to: '/inventario', icon: Archive, label: 'Inventário' }
                ] : []),
            ]
        },
        {
            label: 'Usuário',
            items: [
                { to: '/perfil', icon: User, label: 'Meu Perfil' }
            ]
        },
        ...(user?.role === 'admin' ? [{
            label: 'Sistema',
            items: [
                { to: '/admin', icon: ShieldCheck, label: 'Administração' },
            ]
        }] : [])
    ];

    const handleNavClick = () => {
        if (window.innerWidth < 1024 && onClose) {
            onClose();
        }
    };

    return (
        <div className="flex flex-col w-72 h-screen bg-slate-900 text-slate-100 shadow-2xl z-10 transition-all duration-300 border-r border-slate-800">
            {/* Brand Section */}
            <div className="flex items-center justify-between px-6 h-24 border-b border-slate-800/50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                            <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
                        </svg>
                    </div>
                    <div>
                        <span className="text-xl font-black tracking-tight text-white block leading-none">CoreManager</span>
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mt-1 block">Academy Hub</span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 overflow-y-auto py-8 custom-scrollbar">
                <div className="space-y-10 px-4">
                    {menuSections.map((section) => (
                        <div key={section.label}>
                            <h3 className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">
                                {section.label}
                            </h3>
                            <ul className="space-y-2">
                                {section.items.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <li key={item.to}>
                                            <NavLink
                                                to={item.to}
                                                onClick={handleNavClick}
                                                className={({ isActive }) =>
                                                    `flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 group relative ${isActive
                                                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 active-nav-handle'
                                                        : 'hover:bg-slate-800/50 hover:text-blue-400 text-slate-400'
                                                    }`
                                                }
                                            >
                                                {({ isActive }) => (
                                                    <>
                                                        {isActive && <div className="absolute left-0 w-1.5 h-6 bg-white rounded-r-full"></div>}
                                                        <Icon size={20} className={`mr-4 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:translate-x-1 group-hover:text-blue-400'}`} />
                                                        <span className="font-bold text-sm tracking-tight">{item.label}</span>
                                                    </>
                                                )}
                                            </NavLink>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            </nav>

            {/* Profile Section */}
            <div className="p-6 border-t border-slate-800/50 bg-slate-900/80 backdrop-blur-md">
                <div className="flex items-center mb-6 bg-slate-800/30 p-3 rounded-[1.5rem] border border-slate-700/30">
                    <div className="relative">
                        {user?.foto_path ? (
                            <img
                                src={user.foto_path.startsWith('http') ? user.foto_path : `/${user.foto_path.replace('uploads/', 'uploads/')}`}
                                alt={user.username}
                                className="w-12 h-12 rounded-[1rem] object-cover shadow-xl border-2 border-white/10"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl border-2 border-white/10">
                                <span className="font-black text-white text-xl">{user?.username?.[0]?.toUpperCase()}</span>
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-slate-900"></div>
                    </div>
                    <div className="ml-4 overflow-hidden">
                        <p className="text-sm font-black text-white truncate tracking-tight">{user?.username}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{user?.role}</p>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="flex items-center justify-center w-full px-4 py-4 text-xs font-black text-rose-400 uppercase tracking-[0.2em] bg-rose-500/5 hover:bg-rose-500 hover:text-white border border-rose-500/10 rounded-2xl transition-all duration-300 active:scale-95 gap-3"
                >
                    <LogOut size={16} />
                    Sair do Sistema
                </button>
            </div>
        </div>

    );
}
