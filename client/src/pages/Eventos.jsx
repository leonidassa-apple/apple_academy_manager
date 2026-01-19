import { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, MapPin } from 'lucide-react';

export default function Eventos() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/eventos')
            .then(res => res.json())
            .then(data => {
                if (data.success) setEvents(data.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    // Helper to format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Helper to format time if available
    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Premium Header Segment */}
            <div className="bg-white rounded-[2rem] p-8 mb-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/50 rounded-full -mr-48 -mt-48 blur-3xl"></div>

                <div className="relative z-10 flex items-center gap-6">
                    <div className="p-4 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl shadow-xl shadow-indigo-200">
                        <Calendar size={36} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Painel de Eventos</h1>
                        <div className="flex items-center gap-2 mt-1 text-slate-500 font-medium">
                            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            Próximas atividades e compromissos
                        </div>
                    </div>
                </div>

                <div className="relative z-10">
                    <button className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-700 text-white rounded-2xl hover:from-indigo-700 hover:to-violet-800 transition-all font-black text-sm shadow-xl shadow-indigo-100 active:scale-95 group">
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        Novo Registro
                    </button>
                </div>
            </div>

            {/* Event Metrics Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group/card">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover/card:bg-indigo-600 group-hover/card:text-white transition-colors duration-300">
                        <Calendar size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Registrados</p>
                        <p className="text-3xl font-black text-slate-900 mt-1 leading-none">{events.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group/card">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover/card:bg-emerald-600 group-hover/card:text-white transition-colors duration-300">
                        <Clock size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Próximas 24h</p>
                        <p className="text-3xl font-black text-slate-900 mt-1 leading-none">
                            {events.filter(e => {
                                const start = new Date(e.data_inicio);
                                const now = new Date();
                                const diff = start - now;
                                return diff > 0 && diff < 24 * 60 * 60 * 1000;
                            }).length}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group/card">
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl group-hover/card:bg-rose-600 group-hover/card:text-white transition-colors duration-300">
                        <MapPin size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Locais Distintos</p>
                        <p className="text-3xl font-black text-slate-900 mt-1 leading-none">
                            {new Set(events.map(e => e.local).filter(Boolean)).size}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group/card">
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover/card:bg-amber-600 group-hover/card:text-white transition-colors duration-300">
                        <Clock size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Ciclo Atual</p>
                        <p className="text-3xl font-black text-slate-900 mt-1 leading-none">2025</p>
                    </div>
                </div>
            </div>

            {/* Event Registry - High Fidelity Feed */}
            <div className="bg-slate-50/30 rounded-[2.5rem] p-8 border border-slate-100 shadow-inner">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-[2rem] p-8 h-64 animate-pulse border border-slate-100 shadow-sm"></div>
                        ))}
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar size={48} strokeWidth={1} className="text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Vazio por aqui</h3>
                        <p className="text-slate-500 font-medium">Não há eventos registrados no sistema até o momento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {events.map(event => (
                            <div key={event.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 group relative flex flex-col items-start h-full">
                                {/* Theme Bar */}
                                <div className="absolute left-0 top-12 bottom-12 w-1.5 rounded-full" style={{ backgroundColor: event.cor || '#4f46e5' }}></div>

                                <div className="flex justify-between items-start w-full mb-6">
                                    <div className="px-4 py-2 bg-slate-50 rounded-2xl flex flex-col items-center min-w-[64px] group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500 shadow-sm">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">DIA</span>
                                        <span className="text-xl font-black leading-none">{new Date(event.data_inicio).getDate()}</span>
                                    </div>
                                    <div className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-sm ${new Date(event.data_inicio) > new Date() ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'
                                        }`}>
                                        {new Date(event.data_inicio) > new Date() ? 'Agendado' : 'Finalizado'}
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-slate-900 mb-3 leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                                    {event.titulo}
                                </h3>

                                {event.descricao && (
                                    <p className="text-slate-500 text-sm font-medium mb-6 line-clamp-3 flex-grow">
                                        {event.descricao}
                                    </p>
                                )}

                                <div className="mt-auto w-full space-y-3 pt-6 border-t border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            <Calendar size={14} strokeWidth={2.5} />
                                        </div>
                                        <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                                            {formatDate(event.data_inicio)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <Clock size={14} strokeWidth={2.5} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            {formatTime(event.data_inicio)} — {formatTime(event.data_fim)}
                                        </span>
                                    </div>
                                    {event.local && (
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
                                                <MapPin size={14} strokeWidth={2.5} />
                                            </div>
                                            <span className="text-xs font-black text-slate-700 uppercase tracking-tight truncate">
                                                {event.local}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
