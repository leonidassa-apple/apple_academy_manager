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
        <div className="space-y-8 animate-fade-in-up">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                        <Calendar className="w-8 h-8 text-blue-600" />
                        Agenda Acadêmica
                    </h1>
                    <p className="text-gray-500 mt-1">Gerencie eventos, aulas e compromissos importantes</p>
                </div>
                <div>
                    <button
                        onClick={() => {
                            resetForm();
                            setIsModalOpen(true);
                        }}
                        className="flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all duration-200 font-medium shadow-lg shadow-blue-500/30 active:scale-95 hover:shadow-xl group"
                    >
                        <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                        Novo Evento
                    </button>
                </div>
            </div>

            {/* Calendar Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden">
                <style>{`
                    .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 600 !important; color: #1f2937 !important; }
                    .fc-button-primary { background-color: #3b82f6 !important; border-color: #3b82f6 !important; text-transform: capitalize !important; }
                    .fc-button-active { background-color: #2563eb !important; border-color: #2563eb !important; }
                    .fc-today-button { background-color: #fff !important; color: #374151 !important; border-color: #d1d5db !important; font-weight: 500 !important; }
                    .fc-event { border-radius: 4px !important; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important; border: none !important; }
                    .fc-daygrid-day-number { color: #4b5563 !important; font-weight: 500 !important; }
                    .fc-col-header-cell-cushion { color: #6b7280 !important; font-weight: 600 !important; text-transform: uppercase !important; font-size: 0.85rem !important; padding-top: 10px !important; padding-bottom: 10px !important; }
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
                        today: 'Hoje',
                        month: 'Mês',
                        week: 'Semana',
                        day: 'Dia',
                        list: 'Lista'
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>

                    <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-gray-100">

                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                                        <Calendar className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold leading-6 text-white">{selectedEvent ? 'Editar Evento' : 'Novo Evento'}</h3>
                                        <p className="text-blue-100 text-sm mt-0.5">Detalhes do compromisso</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-blue-100 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700 ml-1">Título do Evento</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.titulo}
                                            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                                            className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                            placeholder="Ex: Reunião de Planejamento"
                                        />
                                    </div>

                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                            <AlignLeft className="w-4 h-4 mr-1.5 text-gray-400" />
                                            Descrição
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={formData.descricao}
                                            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                            className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm resize-none"
                                            placeholder="Detalhes adicionais sobre o evento..."
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                            <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                                            Início
                                        </label>
                                        <input
                                            type="datetime-local"
                                            required
                                            value={formData.data_inicio}
                                            onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                                            className="block w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                            <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                                            Fim
                                        </label>
                                        <input
                                            type="datetime-local"
                                            required
                                            value={formData.data_fim}
                                            onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                                            className="block w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                            <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                                            Local
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.local}
                                            onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                                            className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                            placeholder="Ex: Auditório"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                            <Tag className="w-4 h-4 mr-1.5 text-gray-400" />
                                            Tipo
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={formData.tipo}
                                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                                className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm appearance-none"
                                            >
                                                <option value="">Selecione...</option>
                                                <option value="Reunião">Reunião</option>
                                                <option value="Aula">Aula</option>
                                                <option value="Workshop">Workshop</option>
                                                <option value="Apresentação">Apresentação</option>
                                                <option value="Evento">Evento</option>
                                                <option value="Outro">Outro</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700 ml-1 flex items-center">
                                            <Users className="w-4 h-4 mr-1.5 text-gray-400" />
                                            Participantes
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.participantes}
                                            onChange={(e) => setFormData({ ...formData, participantes: e.target.value })}
                                            className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                            placeholder="Nomes separados por vírgula"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700 ml-1">Cor do Evento</label>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="color"
                                                value={formData.cor}
                                                onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                                                className="h-10 w-20 overflow-hidden rounded-lg border border-gray-200 p-1 cursor-pointer"
                                            />
                                            <span className="text-sm text-gray-500">{formData.cor}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                                    <div>
                                        {selectedEvent && (
                                            <button
                                                type="button"
                                                onClick={handleDelete}
                                                className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                                            >
                                                <Trash2 className="w-4 h-4 mr-1.5" />
                                                Excluir Evento
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
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
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
