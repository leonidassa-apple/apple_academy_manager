import { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar, Plus, Edit2, Trash2, MapPin, Users, Clock, AlignLeft, Tag, X, Save } from 'lucide-react';

export default function Agenda() {
    const [events, setEvents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [formData, setFormData] = useState({
        titulo: '',
        descricao: '',
        data_inicio: '',
        data_fim: '',
        local: '',
        tipo: '',
        participantes: '',
        cor: '#3b82f6'
    });
    const calendarRef = useRef(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/eventos');
            const data = await res.json();
            if (data.success) {
                const formattedEvents = data.data.map(evento => ({
                    id: evento.id,
                    title: evento.titulo,
                    start: evento.data_inicio,
                    end: evento.data_fim,
                    backgroundColor: evento.cor || '#3b82f6',
                    borderColor: evento.cor || '#3b82f6',
                    extendedProps: {
                        descricao: evento.descricao,
                        local: evento.local,
                        tipo: evento.tipo,
                        participantes: evento.participantes
                    }
                }));
                setEvents(formattedEvents);
            }
        } catch (error) {
            console.error('Erro ao carregar eventos:', error);
        }
    };

    const handleEventClick = (clickInfo) => {
        const event = clickInfo.event;
        setSelectedEvent(event);
        setFormData({
            titulo: event.title,
            descricao: event.extendedProps.descricao || '',
            data_inicio: formatDateTimeLocal(event.start),
            data_fim: formatDateTimeLocal(event.end || event.start),
            local: event.extendedProps.local || '',
            tipo: event.extendedProps.tipo || '',
            participantes: event.extendedProps.participantes || '',
            cor: event.backgroundColor || '#3b82f6'
        });
        setIsModalOpen(true);
    };

    const handleDateSelect = (selectInfo) => {
        setSelectedEvent(null);
        setFormData({
            titulo: '',
            descricao: '',
            data_inicio: formatDateTimeLocal(selectInfo.start),
            data_fim: formatDateTimeLocal(selectInfo.end),
            local: '',
            tipo: '',
            participantes: '',
            cor: '#3b82f6'
        });
        setIsModalOpen(true);
    };

    const handleEventDrop = async (dropInfo) => {
        const event = dropInfo.event;
        await updateEvent(event.id, {
            titulo: event.title,
            descricao: event.extendedProps.descricao || '',
            data_inicio: event.start.toISOString(),
            data_fim: (event.end || event.start).toISOString(),
            local: event.extendedProps.local || '',
            tipo: event.extendedProps.tipo || '',
            participantes: event.extendedProps.participantes || '',
            cor: event.backgroundColor || '#3b82f6'
        });
    };

    const handleEventResize = async (resizeInfo) => {
        handleEventDrop(resizeInfo);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const url = selectedEvent
            ? `/api/eventos/${selectedEvent.id}`
            : '/api/eventos';
        const method = selectedEvent ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (data.success) {
                setIsModalOpen(false);
                fetchEvents();
                resetForm();
            } else {
                alert('Erro: ' + data.message);
            }
        } catch (error) {
            console.error('Erro ao salvar evento:', error);
            alert('Erro ao salvar evento');
        }
    };

    const handleDelete = async () => {
        if (!selectedEvent || !confirm('Deseja realmente excluir este evento?')) return;

        try {
            const res = await fetch(`/api/eventos/${selectedEvent.id}`, {
                method: 'DELETE'
            });
            const data = await res.json();

            if (data.success) {
                setIsModalOpen(false);
                fetchEvents();
                resetForm();
            } else {
                alert('Erro: ' + data.message);
            }
        } catch (error) {
            console.error('Erro ao excluir evento:', error);
        }
    };

    const updateEvent = async (id, eventData) => {
        try {
            await fetch(`/api/eventos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData)
            });
        } catch (error) {
            console.error('Erro ao atualizar evento:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            titulo: '',
            descricao: '',
            data_inicio: '',
            data_fim: '',
            local: '',
            tipo: '',
            participantes: '',
            cor: '#3b82f6'
        });
        setSelectedEvent(null);
    };

    const formatDateTimeLocal = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().slice(0, 16);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Premium Header Segment */}
            <div className="bg-white rounded-[2rem] p-8 mb-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/50 rounded-full -mr-48 -mt-48 blur-3xl"></div>

                <div className="relative z-10 flex items-center gap-6">
                    <div className="p-4 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl shadow-xl shadow-indigo-200">
                        <Calendar size={36} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Agenda Acadêmica</h1>
                        <div className="flex items-center gap-2 mt-1 text-slate-500 font-medium">
                            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            Sincronização de eventos e marcos
                        </div>
                    </div>
                </div>

                <div className="relative z-10">
                    <button
                        onClick={() => {
                            resetForm();
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-700 text-white rounded-2xl hover:from-indigo-700 hover:to-violet-800 transition-all font-black text-sm shadow-xl shadow-indigo-200 active:scale-95 group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        Novo Compromisso
                    </button>
                </div>
            </div>

            {/* Quick Insights Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group/card">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover/card:bg-indigo-600 group-hover/card:text-white transition-colors duration-300">
                        <Calendar size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Eventos</p>
                        <p className="text-3xl font-black text-slate-900 mt-1 leading-none">{events.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group/card">
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl group-hover/card:bg-rose-600 group-hover/card:text-white transition-colors duration-300">
                        <Clock size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Hoje</p>
                        <p className="text-3xl font-black text-slate-900 mt-1 leading-none">
                            {events.filter(e => new Date(e.start).toDateString() === new Date().toDateString()).length}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group/card">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover/card:bg-emerald-600 group-hover/card:text-white transition-colors duration-300">
                        <MapPin size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Locais Ativos</p>
                        <p className="text-3xl font-black text-slate-900 mt-1 leading-none">
                            {new Set(events.map(e => e.extendedProps.local).filter(Boolean)).size}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group/card">
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover/card:bg-amber-600 group-hover/card:text-white transition-colors duration-300">
                        <Tag size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Categorias</p>
                        <p className="text-3xl font-black text-slate-900 mt-1 leading-none">
                            {new Set(events.map(e => e.extendedProps.tipo).filter(Boolean)).size || 1}
                        </p>
                    </div>
                </div>
            </div>

            {/* Calendar Premium Container */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 overflow-hidden transform-gpu">
                <style>{`
                    .fc-toolbar-title { font-size: 1.5rem !important; font-weight: 900 !important; color: #0f172a !important; text-transform: capitalize !important; letter-spacing: -0.02em !important; }
                    .fc-button-primary { background: #ffffff !important; border: 1px solid #e2e8f0 !important; color: #64748b !important; padding: 10px 18px !important; font-weight: 800 !important; text-transform: uppercase !important; font-size: 11px !important; letter-spacing: 0.1em !important; border-radius: 14px !important; transition: all 0.2s !important; box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important; }
                    .fc-button-primary:hover { background: #f8fafc !important; color: #0f172a !important; border-color: #cbd5e1 !important; transform: translateY(-1px) !important; }
                    .fc-button-active { background: #4f46e5 !important; color: #ffffff !important; border-color: #4f46e5 !important; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2) !important; }
                    .fc-today-button { opacity: 1 !important; }
                    .fc-event { border-radius: 12px !important; padding: 4px 8px !important; font-weight: 700 !important; font-size: 11px !important; border: none !important; margin: 2px !important; box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important; transition: transform 0.2s !important; }
                    .fc-event:hover { transform: scale(1.02) !important; z-index: 50 !important; }
                    .fc-daygrid-day-number { color: #64748b !important; font-weight: 900 !important; padding: 10px !important; font-size: 13px !important; }
                    .fc-col-header-cell-cushion { color: #94a3b8 !important; font-weight: 900 !important; text-transform: uppercase !important; font-size: 10px !important; letter-spacing: 0.15em !important; padding: 15px 0 !important; }
                    .fc-day-today { background-color: rgba(79, 70, 229, 0.03) !important; }
                    .fc-theme-standard td, .fc-theme-standard th { border: 1px solid #f1f5f9 !important; }
                    .fc-theme-standard .fc-scrollgrid { border: none !important; }
                `}</style>
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale="pt-br"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
                    }}
                    buttonText={{
                        today: 'hoje',
                        month: 'mês',
                        week: 'semana',
                        day: 'dia',
                        list: 'lista'
                    }}
                    events={events}
                    editable={true}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    weekends={true}
                    eventClick={handleEventClick}
                    select={handleDateSelect}
                    eventDrop={handleEventDrop}
                    eventResize={handleEventResize}
                    height="auto"
                />
            </div>

            {/* Overhauled Event Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] overflow-y-auto">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setIsModalOpen(false)}></div>

                    <div className="flex min-h-screen items-center justify-center p-6">
                        <div className="relative transform overflow-hidden rounded-[2.5rem] bg-white text-left shadow-2xl transition-all sm:w-full sm:max-w-2xl border border-slate-100 flex flex-col">

                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-8 flex justify-between items-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                <div className="relative z-10 flex items-center gap-5">
                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-lg">
                                        <Calendar className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white leading-tight">
                                            {selectedEvent ? 'Agenda Academy' : 'Agendar Novo Evento'}
                                        </h3>
                                        <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-0.5">
                                            {selectedEvent ? 'Sincronizando compromisso' : 'Planejando cronograma'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="relative z-10 p-2 text-white/60 hover:text-white bg-black/10 hover:bg-black/20 rounded-full transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-slate-50/20">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Evento</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.titulo}
                                            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-700 font-bold placeholder:text-slate-300 shadow-sm"
                                            placeholder="Ex: Aula Magna - UX Design"
                                        />
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <AlignLeft size={14} className="text-slate-300" />
                                            Descrição e Detalhes
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={formData.descricao}
                                            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-700 font-bold placeholder:text-slate-300 shadow-sm resize-none"
                                            placeholder="Informações relevantes para os participantes..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Clock size={14} className="text-slate-300" />
                                            Início do Compromisso
                                        </label>
                                        <input
                                            type="datetime-local"
                                            required
                                            value={formData.data_inicio}
                                            onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                                            className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-700 font-bold shadow-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Clock size={14} className="text-slate-300" />
                                            Previsão de Término
                                        </label>
                                        <input
                                            type="datetime-local"
                                            required
                                            value={formData.data_fim}
                                            onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                                            className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-700 font-bold shadow-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <MapPin size={14} className="text-slate-300" />
                                            Localização Física
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.local}
                                            onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-700 font-bold placeholder:text-slate-300 shadow-sm"
                                            placeholder="Ex: Sala de Inovação"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Tag size={14} className="text-slate-300" />
                                            Categoria Acadêmica
                                        </label>
                                        <select
                                            value={formData.tipo}
                                            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-700 font-bold shadow-sm appearance-none cursor-pointer"
                                        >
                                            <option value="">Selecione o tipo...</option>
                                            <option value="Reunião">Reunião</option>
                                            <option value="Aula">Aula</option>
                                            <option value="Workshop">Workshop</option>
                                            <option value="Apresentação">Apresentação</option>
                                            <option value="Evento">Evento Acadêmico</option>
                                            <option value="Outro">Outro</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Users size={14} className="text-slate-300" />
                                            Grupo de Participantes
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.participantes}
                                            onChange={(e) => setFormData({ ...formData, participantes: e.target.value })}
                                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-700 font-bold placeholder:text-slate-300 shadow-sm"
                                            placeholder="Ex: Estudantes, Mentores, Staff..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identidade Visual</label>
                                        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                            <input
                                                type="color"
                                                value={formData.cor}
                                                onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                                                className="h-10 w-20 overflow-hidden rounded-xl border-none cursor-pointer"
                                            />
                                            <span className="text-xs font-black text-slate-400 font-mono tracking-widest">{formData.cor.toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-8 border-t border-slate-100">
                                    {selectedEvent ? (
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            className="flex items-center gap-2 px-6 py-3 text-rose-500 hover:bg-rose-50 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                                        >
                                            <Trash2 size={16} />
                                            Remover Registro
                                        </button>
                                    ) : <div></div>}
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all font-black text-xs uppercase tracking-widest"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-indigo-600 to-violet-700 text-white rounded-2xl hover:from-indigo-700 hover:to-violet-800 transition-all font-black text-sm shadow-xl shadow-indigo-100 active:scale-95 group"
                                        >
                                            <Save size={20} className="group-hover:scale-110 transition-transform" />
                                            Salvar Alterações
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
