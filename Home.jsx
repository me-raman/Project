import React, { useState } from 'react';
import { Search, ShieldCheck, Globe, Zap, ArrowRight } from 'lucide-react';
import { ManufacturerDashboard } from '../components/ManufacturerDashboard';

export const Home = ({ onSearch }) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
        }
    };

    const userRole = localStorage.getItem('userRole');

    if (userRole && userRole.toLowerCase() === 'manufacturer') {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-slate-50 py-10">
                <ManufacturerDashboard />
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden min-h-[calc(100vh-64px)] bg-gradient-to-b from-blue-50/50 via-white to-blue-50/30">

            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '0s' }}></div>
                <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-teal-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-[10%] left-[20%] w-[35%] h-[35%] bg-indigo-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 pt-32 pb-20">

                <div className="text-center max-w-3xl animate-slide-up">

                    <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
                        Trust in Every <br />
                        <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">Prescription.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-600 mb-12 leading-relaxed max-w-2xl mx-auto">
                        Verify the authenticity of your medication instantly. From the manufacturing plant to your local pharmacy, track the entire journey with immutable security.
                    </p>

                    {localStorage.getItem('token') ? (
                        <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto relative mb-20 group">
                            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl group-hover:bg-blue-500/30 transition-all duration-300 transform group-hover:scale-105"></div>
                            <input
                                type="text"
                                placeholder="Enter Product ID (e.g., PROD-88219-X)"
                                className="relative w-full pl-8 pr-16 py-5 rounded-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 shadow-xl text-lg text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="absolute right-3 top-3 bottom-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center cursor-pointer"
                            >
                                <Search className="h-5 w-5" />
                            </button>
                        </form>
                    ) : (
                        <div className="w-full max-w-lg mx-auto mb-20 p-6 bg-white/50 backdrop-blur-sm border border-slate-200/50 rounded-2xl text-center">
                            <p className="text-slate-600 mb-4 font-medium">Please login to access the tracking system.</p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <Feature
                        icon={<ShieldCheck className="h-6 w-6 text-emerald-500" />}
                        title="Cryptographic Security"
                        desc="Every step is cryptographically signed and immutable."
                        color="emerald"
                    />
                    <Feature
                        icon={<Globe className="h-6 w-6 text-blue-500" />}
                        title="Global Supply Chain"
                        desc="Real-time tracking across international borders."
                        color="blue"
                    />
                    <Feature
                        icon={<Zap className="h-6 w-6 text-amber-500" />}
                        title="Instant Verification"
                        desc="Scan a QR code or ID for immediate results."
                        color="amber"
                    />
                </div>

            </div>
        </div>
    );
};

const Feature = ({ icon, title, desc, color }) => (
    <div className="group p-8 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1">
        <div className={`mb-5 w-12 h-12 rounded-xl flex items-center justify-center bg-${color}-50 group-hover:scale-110 transition-transform duration-300`}>
            {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-500 leading-relaxed">{desc}</p>

        <div className="mt-4 flex items-center text-sm font-semibold text-slate-400 group-hover:text-slate-600 transition-colors cursor-pointer">
            Learn more <ArrowRight className="h-4 w-4 ml-1 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
        </div>
    </div>
);
