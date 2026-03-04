import { useEffect, useState } from 'react';
import { Users, Smartphone, TrendingUp, Activity, ArrowUp, ArrowDown, Package, AlertCircle, Book, Calendar, CheckCircle, LayoutDashboard, Clock, MapPin } from 'lucide-react';
import { useAuth } from './context/AuthContext';

export default function Dashboard() {
    const { user: currentUser } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/dashboard')
            .then(res => {
                if (res.status === 401) {
                    window.location.href = '/login';
                    return null;
                }
                return res.json();
            })
            .then(data => {
                if (data && data.success) {
                    setStats(data.data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    Erro ao carregar estatísticas do dashboard.
                </div>
            </div>
        );
    }

    const MetricCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = "blue" }) => {
        const colorClasses = {
            blue: "bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-600 group-hover:text-white",
            green: "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white",
            purple: "bg-purple-50 text-purple-600 border-purple-100 group-hover:bg-purple-600 group-hover:text-white",
            orange: "bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-600 group-hover:text-white",
            red: "bg-rose-50 text-rose-600 border-rose-100 group-hover:bg-rose-600 group-hover:text-white"
        };

        return (
            <div className="premium-card p-8 group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-white/10 transition-colors duration-500"></div>

                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <div className={`p-4 rounded-2xl transition-all duration-300 border ${colorClasses[color]}`}>
                            <Icon size={28} />
                        </div>
                        {trend && trendValue !== undefined && (
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {trend === 'up' ? <ArrowUp size={12} strokeWidth={3} /> : <ArrowDown size={12} strokeWidth={3} />}
                                {trendValue}
                            </div>
                        )}
                    </div>

                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-slate-900 tracking-tight">{value}</span>
                        {subtitle && <span className="text-xs font-bold text-slate-400 truncate">{subtitle}</span>}
                    </div>
                </div>
            </div>
        );
    };

    const ProgressBar = ({ label, current, total, color = "blue" }) => {
        const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
        const colorClasses = {
            blue: "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)]",
            green: "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]",
            red: "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]",
            orange: "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
        };

        return (
            <div className="mb-6 last:mb-0">
                <div className="flex justify-between items-end mb-3">
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Indicador</span>
                        <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{label}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-lg font-black text-slate-900 leading-none">{percentage}%</span>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-tighter">{current} / {total}</span>
                    </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClasses[color]}`}
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            </div>
        );
    };

    const totalDevices = (stats.devices?.disponiveis || 0) + (stats.devices?.emprestados || 0);
    const totalAlunos = stats.alunos?.total || 0;
    const foundationAlunos = stats.alunos?.foundation || 0;
    const regularAlunos = totalAlunos - foundationAlunos;

    return (
        <div className="animate-in-up">
            {/* Premium Header */}
            <div className="premium-card p-10 mb-10 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full -mr-64 -mt-64 blur-3xl"></div>

                <div className="relative z-10 flex items-center gap-8">
                    <div className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] shadow-2xl shadow-blue-200">
                        <TrendingUp size={40} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2">Monitor Acadêmico</h1>
                        <div className="flex items-center gap-3 text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">
                            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                            Gestão de Fluxo • Academy Manager v2.0
                        </div>
                    </div>
                </div>

                <div className="relative z-10 hidden sm:flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Data do Sistema</p>
                        <p className="text-sm font-black text-slate-900">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>
            </div>
            {/* Main Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
                <MetricCard
                    title="Matrículas Totais"
                    value={totalAlunos}
                    subtitle={`${foundationAlunos} Foundation`}
                    icon={Users}
                    trend="up"
                    trendValue={stats.alunos?.foundation_ano || 0}
                    color="blue"
                />
                <MetricCard
                    title="Tecnologia (Disponível)"
                    value={stats.devices?.disponiveis || 0}
                    subtitle={`${totalDevices} No Inventário`}
                    icon={Smartphone}
                    color="green"
                />
                <MetricCard
                    title="Acervo (Disponível)"
                    value={stats.biblioteca?.disponiveis || 0}
                    subtitle={`${stats.biblioteca?.total_livros || 0} Obras`}
                    icon={Book}
                    color="purple"
                />
                <MetricCard
                    title="Em Uso (Circular)"
                    value={(stats.devices?.emprestados || 0) + (stats.biblioteca?.emprestados || 0)}
                    subtitle={`${(stats.devices?.emprestados || 0)} Equip. | ${(stats.biblioteca?.emprestados || 0)} Livros`}
                    icon={Package}
                    color="orange"
                />
                <MetricCard
                    title="Alertas Ativos"
                    value={stats.alertas?.atrasados || 0}
                    subtitle={`${stats.alertas?.vencendo_hoje || 0} Hoje`}
                    icon={AlertCircle}
                    color={stats.alertas?.atrasados > 0 ? "red" : "blue"}
                />
            </div>

            {/* Middle Section: Alerts & Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                {/* Analytics Columns */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Loan Alerts Section */}
                    {(stats.alertas?.atrasados > 0 || stats.alertas?.vencendo_hoje > 0 || stats.alertas?.vencendo_breve > 0) && (
                        <div className="premium-card p-10 border-rose-100 mb-8">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-5">
                                    <div className="p-4 bg-rose-50 text-rose-600 rounded-3xl shadow-lg shadow-rose-100">
                                        <AlertCircle size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Controle de Prazos</h2>
                                        <p className="status-badge bg-rose-50 text-rose-700 border-rose-100">Monitoramento Crítico</p>
                                    </div>
                                </div>
                                <div className="hidden sm:flex items-center gap-3">
                                    {stats.alertas?.atrasados > 0 && <span className="bg-rose-500 text-white text-[9px] font-black uppercase px-4 py-2 rounded-full shadow-lg shadow-rose-200">{stats.alertas.atrasados} Atrasos</span>}
                                    {stats.alertas?.vencendo_hoje > 0 && <span className="bg-amber-500 text-white text-[9px] font-black uppercase px-4 py-2 rounded-full shadow-lg shadow-amber-200">{stats.alertas.vencendo_hoje} Hoje</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {stats.alertas?.lista?.map((alerta, idx) => (
                                    <div key={idx} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all border-l-4 border-l-rose-500 group">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{alerta.tipo_item}</div>
                                            <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg uppercase">{alerta.data_vencimento}</span>
                                        </div>
                                        <h3 className="font-black text-slate-900 text-lg leading-tight mb-4 group-hover:text-blue-600 transition-colors uppercase tracking-tighter truncate">{alerta.item_nome}</h3>
                                        <div className="flex items-center gap-3 pt-4 border-t border-slate-200/60">
                                            <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-300 flex items-center justify-center text-[10px] font-black text-slate-600">
                                                {alerta.aluno_nome?.charAt(0)}
                                            </div>
                                            <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{alerta.aluno_nome}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upcoming Events Section */}
                    {stats.proximos_eventos && stats.proximos_eventos.length > 0 && (
                        <div className="premium-card p-10 border-indigo-100">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-5">
                                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl shadow-lg shadow-indigo-100">
                                        <Calendar size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Próximos Eventos</h2>
                                        <p className="status-badge bg-indigo-50 text-indigo-700 border-indigo-100">Agenda Acadêmica</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {stats.proximos_eventos.map((evento, idx) => (
                                    <div key={idx} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all flex items-center justify-between group">
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-slate-100 shadow-sm min-w-[70px]">
                                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{new Date(evento.data_inicio).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                                                <span className="text-2xl font-black text-slate-900 leading-none">{new Date(evento.data_inicio).getDate()}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tighter">{evento.titulo}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {new Date(evento.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {evento.local && (
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                            <MapPin size={12} />
                                                            {evento.local}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`w-3 h-3 rounded-full shadow-sm`} style={{ backgroundColor: evento.cor }}></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {(!stats.alertas?.atrasados && !stats.alertas?.vencendo_hoje && !stats.alertas?.vencendo_breve && (!stats.proximos_eventos || stats.proximos_eventos.length === 0)) && (
                        <div className="premium-card p-10 flex flex-col items-center justify-center text-center h-full">
                            <div className="p-6 bg-emerald-50 text-emerald-600 rounded-full mb-6">
                                <CheckCircle size={48} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">Monitoramento Ativo</h2>
                            <p className="text-slate-500 font-medium">Não há alertas ou eventos imediatos para reportar.</p>
                        </div>
                    )}
                </div>

                {/* Vertical Analytics Column */}
                <div className="space-y-8">
                    <div className="premium-card p-10 h-full">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                <Activity size={24} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Métricas Educacionais</h2>
                        </div>

                        <div className="space-y-10">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Distribuição de Alunos</h3>
                                <ProgressBar label="Apple Foundation" current={foundationAlunos} total={totalAlunos} color="blue" />
                                <ProgressBar label="Cursos Regulares" current={regularAlunos} total={totalAlunos} color="green" />
                            </div>

                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Distribuição Acadêmica</h3>
                                <ProgressBar label="Estudantes Regular" current={stats.alunos?.regular || 0} total={totalAlunos} color="blue" />
                                <ProgressBar label="Estudantes Foundation" current={foundationAlunos} total={totalAlunos} color="indigo" />
                            </div>

                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Ocupação de Devices</h3>
                                <ProgressBar label="Devices Alocados" current={stats.devices?.emprestados || 0} total={totalDevices} color="orange" />
                                <ProgressBar label="Disponibilidade" current={stats.devices?.disponiveis || 0} total={totalDevices} color="green" />
                            </div>

                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Ocupação Literária</h3>
                                <ProgressBar label="Livros em Circulação" current={stats.biblioteca?.emprestados || 0} total={stats.biblioteca?.total_exemplares || 0} color="purple" />
                                <ProgressBar label="Exemplares Disponíveis" current={stats.biblioteca?.disponiveis || 0} total={stats.biblioteca?.total_exemplares || 0} color="blue" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Recent Activity */}
            {stats.recent_activity && stats.recent_activity.length > 0 && (
                <div className="premium-card p-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shadow-lg shadow-purple-50">
                            <LayoutDashboard size={24} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Fluxo Recente</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {stats.recent_activity.slice(0, 5).map((activity, idx) => (
                            <div key={idx} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:shadow-xl hover:shadow-slate-200/50 hover:bg-white transition-all transform hover:-translate-y-1 group">
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${activity.categoria === 'Device' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                        {activity.categoria}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activity.data_retirada}</span>
                                </div>
                                <p className="font-black text-slate-900 text-sm mb-1 uppercase tracking-tighter line-clamp-1 group-hover:text-blue-600 transition-colors">{activity.aluno_nome}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">{activity.item_nome}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

    );
}
