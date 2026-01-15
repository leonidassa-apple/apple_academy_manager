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
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Agenda</h1>
                    <p className="text-gray-500 text-sm">Eventos e compromissos</p>
                </div>
                <button className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm">
                    <Plus className="w-5 h-5 mr-2" />
                    Novo Evento
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden p-6">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">Carregando eventos...</div>
                ) : events.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">Nenhum evento programado.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {events.map(event => (
                            <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative overflow-hidden">
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5`} style={{ backgroundColor: event.cor || '#3b82f6' }}></div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">{event.titulo}</h3>
                                {event.descricao && <p className="text-gray-500 text-sm mb-3 line-clamp-2">{event.descricao}</p>}

                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                        <span>{formatDate(event.data_inicio)}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                        <span>{formatTime(event.data_inicio)} - {formatTime(event.data_fim)}</span>
                                    </div>
                                    {event.local && (
                                        <div className="flex items-center">
                                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                            <span>{event.local}</span>
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
