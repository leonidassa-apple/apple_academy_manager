import { useEffect, useState } from 'react';
import { Users, Smartphone, TrendingUp, Activity, ArrowUp, ArrowDown, Package, AlertCircle, Book, Calendar, CheckCircle } from 'lucide-react';
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
            blue: "bg-blue-50 text-blue-600 border-blue-100",
            green: "bg-green-50 text-green-600 border-green-100",
            purple: "bg-purple-50 text-purple-600 border-purple-100",
            orange: "bg-orange-50 text-orange-600 border-orange-100"
        };

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
                        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                        {trend && trendValue !== undefined && (
                            <div className="flex items-center gap-1 mt-2">
                                {trend === 'up' ? (
                                    <ArrowUp className="w-4 h-4 text-green-500" />
                                ) : (
                                    <ArrowDown className="w-4 h-4 text-red-500" />
                                )}
                                <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                    {trendValue} este ano
                                </span>
                            </div>
                        )}
                    </div>
                    <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>
            </div>
        );
    };

    const ProgressBar = ({ label, current, total, color = "blue" }) => {
        const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
        const colorClasses = {
            blue: "bg-blue-500",
            green: "bg-green-500",
            red: "bg-red-500",
            orange: "bg-orange-500"
        };

        return (
            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    <span className="text-sm font-semibold text-gray-900">{current}/{total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all ${colorClasses[color]}`}
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
        <div className="bg-gray-50">
            {/* Header */}
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                <p className="text-sm md:text-base text-gray-500">Visão geral do sistema de gerenciamento da Academy</p>
            </div>

            {/* Main Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                    title="Total de Alunos"
                    value={totalAlunos}
                    subtitle={`${regularAlunos} Regular • ${foundationAlunos} Foundation`}
                    icon={Users}
                    trend="up"
                    trendValue={stats.alunos?.foundation_ano || 0}
                    color="blue"
                />
                <MetricCard
                    title="Devices Disponíveis"
                    value={stats.devices?.disponiveis || 0}
                    subtitle={`${totalDevices} devices no total`}
                    icon={Smartphone}
                    color="green"
                />
                <MetricCard
                    title="Emprestados"
                    value={stats.devices?.emprestados || 0}
                    subtitle={`${totalDevices > 0 ? Math.round((stats.devices?.emprestados / totalDevices) * 100) : 0}% em uso`}
                    icon={Package}
                    color="orange"
                />
                <MetricCard
                    title="Concluídos"
                    value={stats.concluidos || 0}
                    subtitle="Total histórico"
                    icon={CheckCircle}
                    color="green"
                />
                <MetricCard
                    title="Alertas de Prazo"
                    value={stats.alertas?.atrasados || 0}
                    subtitle={`${stats.alertas?.vencendo_hoje || 0} vencendo hoje`}
                    icon={AlertCircle}
                    color={stats.alertas?.atrasados > 0 ? "red" : "orange"}
                />
            </div>

            {/* Loan Alerts Section (New) */}
            {(stats.alertas?.atrasados > 0 || stats.alertas?.vencendo_hoje > 0 || stats.alertas?.vencendo_breve > 0) && (
                <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 mb-8 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Monitoramento de Devoluções</h2>
                                <p className="text-sm text-gray-500">Itens com prazo expirado ou vencendo em breve</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {stats.alertas?.atrasados > 0 && (
                                <span className="px-3 py-1 bg-red-500 text-white text-[10px] font-black uppercase rounded-full">
                                    {stats.alertas.atrasados} Atrasados
                                </span>
                            )}
                            {stats.alertas?.vencendo_hoje > 0 && (
                                <span className="px-3 py-1 bg-orange-500 text-white text-[10px] font-black uppercase rounded-full">
                                    {stats.alertas.vencendo_hoje} Hoje
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stats.alertas?.lista?.map((alerta, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border transition-all hover:shadow-md ${alerta.status === 'Atrasado' ? 'bg-red-50/30 border-red-100' : 'bg-gray-50/50 border-gray-100'}`}>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {alerta.tipo_item === 'Livro' ? <Book className="w-4 h-4 text-purple-600" /> : <Smartphone className="w-4 h-4 text-blue-600" />}
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{alerta.tipo_item}</span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm ${alerta.status === 'Atrasado' ? 'bg-red-500 text-white' : 'bg-orange-100 text-orange-700'}`}>
                                        {alerta.data_vencimento}
                                    </span>
                                </div>
                                <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{alerta.item_nome}</h3>
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100/50">
                                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold">
                                        {alerta.aluno_nome?.charAt(0)}
                                    </div>
                                    <span className="text-xs text-gray-600 font-medium truncate">{alerta.aluno_nome}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Detailed Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Students Breakdown */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Alunos por Categoria</h2>
                    </div>
                    <ProgressBar
                        label="Foundation Program"
                        current={foundationAlunos}
                        total={totalAlunos}
                        color="blue"
                    />
                    <ProgressBar
                        label="Regular Program"
                        current={regularAlunos}
                        total={totalAlunos}
                        color="green"
                    />
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                            <span className="font-semibold text-gray-700">{stats.alunos?.foundation_ano || 0}</span> novos alunos Foundation este ano
                        </p>
                    </div>
                </div>

                {/* Device Status */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Smartphone className="w-5 h-5 text-green-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Status dos Devices</h2>
                    </div>
                    <ProgressBar
                        label="Disponíveis para Empréstimo"
                        current={stats.devices?.disponiveis || 0}
                        total={totalDevices}
                        color="green"
                    />
                    <ProgressBar
                        label="Emprestados Atualmente"
                        current={stats.devices?.emprestados || 0}
                        total={totalDevices}
                        color="orange"
                    />
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                            Taxa de utilização: <span className="font-semibold text-gray-700">
                                {totalDevices > 0 ? Math.round((stats.devices?.emprestados / totalDevices) * 100) : 0}%
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Recent Activity Section */}
            {stats.recent_activity && stats.recent_activity.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-purple-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Atividades Recentes</h2>
                    </div>
                    <div className="space-y-3">
                        {stats.recent_activity.slice(0, 5).map((activity, idx) => (
                            <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-700">{activity.aluno_nome}</p>
                                    <p className="text-xs text-gray-500">{activity.item_nome} • {activity.data_retirada}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
