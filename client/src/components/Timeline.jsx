import React from 'react';
import { CheckCircle, Truck, Package, Factory, MapPin, Clock } from 'lucide-react';

const StatusIcon = ({ status }) => {
    switch (status) {
        case 'Manufacturing': return <Factory className="h-5 w-5 text-white" />;
        case 'Distribution': return <Truck className="h-5 w-5 text-white" />;
        case 'Retail': return <Package className="h-5 w-5 text-white" />;
        default: return <CheckCircle className="h-5 w-5 text-white" />;
    }
};

const getStatusColor = (status) => {
    switch (status) {
        case 'Manufacturing': return 'bg-blue-500 shadow-blue-200';
        case 'Distribution': return 'bg-indigo-500 shadow-indigo-200';
        case 'Retail': return 'bg-purple-500 shadow-purple-200';
        default: return 'bg-emerald-500 shadow-emerald-200';
    }
};

export const Timeline = ({ events }) => {
    return (
        <div className="py-4">
            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                Tracking History
                <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">{events.length} Events</span>
            </h3>

            <div className="relative border-l-2 border-slate-800 ml-4 space-y-10">

                {events.map((event, index) => (
                    <div key={index} className="relative pl-10 group">
                        {/* Timeline Dot with Icon */}
                        <div className={`
              absolute -left-[21px] flex h-11 w-11 items-center justify-center rounded-full ring-4 ring-slate-950 shadow-lg transition-transform group-hover:scale-110
              ${getStatusColor(event.stage)}
            `}>
                            <StatusIcon status={event.stage} />
                        </div>

                        {/* Content Card */}
                        <div className="bg-slate-900 p-6 rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border border-slate-700 hover:shadow-[0_8px_24px_rgba(59,130,246,0.1)] hover:border-slate-600 transition-all duration-300">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3">
                                <div>
                                    <h4 className="text-lg font-bold text-white">{event.stage}</h4>
                                    <p className="text-sm font-medium text-blue-400 mb-1">{event.handler}</p>
                                </div>
                                <div className="flex items-center text-xs font-medium text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 mt-2 sm:mt-0">
                                    <Clock className="h-3 w-3 mr-1.5" />
                                    {event.timestamp}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5 mb-4">
                                <div className="flex items-start gap-2 text-sm text-slate-300 bg-slate-800/50 p-2 rounded-lg w-fit border border-slate-700/50">
                                    <MapPin className="h-4 w-4 mt-0.5 text-slate-500" />
                                    <span>{event.location}</span>
                                </div>
                                {event.latitude && event.longitude && (
                                    <a
                                        href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/5 border border-blue-500/10 px-2.5 py-1 rounded-lg w-fit"
                                    >
                                        <MapPin className="h-3 w-3" />
                                        <span>GPS: {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}</span>
                                        <span className="text-blue-500/50">↗</span>
                                    </a>
                                )}
                            </div>

                            {event.notes && (
                                <p className="text-sm text-slate-400 border-t border-slate-800 pt-3 italic leading-relaxed">
                                    "{event.notes}"
                                </p>
                            )}
                        </div>
                    </div>
                ))}

                {/* Start Dot */}
                <div className="absolute bottom-0 -left-[5px] w-3 h-3 bg-slate-800 rounded-full border-2 border-slate-950 translate-y-full"></div>

            </div>
        </div>
    );
};
