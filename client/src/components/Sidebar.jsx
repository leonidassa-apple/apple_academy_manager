import { LayoutDashboard, Users, Smartphone, BookOpen, Calendar, Settings, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
    const { user, logout } = useAuth();

    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Painel' },
        { to: '/alunos', icon: Users, label: 'Alunos' },
        { to: '/dispositivos', icon: Smartphone, label: 'Dispositivos' },
        { to: '/emprestimos', icon: BookOpen, label: 'Empréstimos' },
        { to: '/agenda', icon: Calendar, label: 'Agenda' },
        { to: '/biblioteca', icon: BookOpen, label: 'Biblioteca' },
        { to: '/emprestimos-livros', icon: BookOpen, label: 'Circulação' },
        { to: '/livros', icon: Settings, label: 'Ger. Acervo' },
    ];

    if (user?.role === 'admin') {
        navItems.push({ to: '/admin', icon: Settings, label: 'Administração' });
    }

    return (
        <div className="flex flex-col w-64 h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-gray-100 shadow-2xl z-10 transition-all duration-300">
            <div className="flex items-center justify-center h-16 border-b border-slate-700 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-600">
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="3" />
                            <line x1="12" y1="2" x2="12" y2="9" />
                            <line x1="12" y1="15" x2="12" y2="22" />
                            <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
                            <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
                            <line x1="2" y1="12" x2="9" y2="12" />
                            <line x1="15" y1="12" x2="22" y2="12" />
                            <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
                            <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold tracking-wide text-white">CoreManager</span>
                </div>
            </div>
            <nav className="flex-1 overflow-y-auto py-6">
                <ul className="space-y-2 px-3">
                    {navItems.map((item) => (
                        <li key={item.to}>
                            <NavLink
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'hover:bg-slate-800 hover:text-white text-gray-400'
                                    }`
                                }
                            >
                                <item.icon className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110`} />
                                <span className="font-medium">{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t border-slate-700 bg-slate-900/50">
                <div className="flex items-center mb-4 px-2">
                    {user?.foto_path ? (
                        <img
                            src={`/${user.foto_path.replace('uploads/', 'uploads/')}`}
                            alt={user.username}
                            className="w-10 h-10 rounded-full object-cover mr-3 shadow-lg border-2 border-blue-500"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center mr-3 shadow-lg">
                            <span className="font-bold text-white text-lg">{user?.username?.[0]?.toUpperCase()}</span>
                        </div>
                    )}
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
                        <p className="text-xs text-gray-400 capitalize truncate">{user?.role}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition-all duration-200"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Encerrar Sessão
                </button>
            </div>
        </div>
    );
}
