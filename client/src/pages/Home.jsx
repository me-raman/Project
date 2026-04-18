import React, { useState, useEffect } from 'react';
import { Search, Shield, Globe, Zap, ScanLine, AlertCircle, Truck, Sparkles, Building2, UserCheck, Activity, ArrowRight, CheckCircle2, QrCode } from 'lucide-react';
import { ManufacturerDashboard } from '../components/ManufacturerDashboard';
import { DistributorDashboard } from '../components/DistributorDashboard';
import { AdminDashboard } from '../components/AdminDashboard';
import { Scanner } from '../components/Scanner';
import { Button, Card, Badge } from '../components/ui';

export const Home = ({ onSearch, error, onOpenLogin }) => {
    const [query, setQuery] = useState('');
    const [showScanner, setShowScanner] = useState(false);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const searchQuery = searchParams.get('search');
        if (searchQuery) {
            onSearch(searchQuery);
        }
    }, [onSearch]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) onSearch(query);
    };

    const handleScan = (decodedText) => {
        setQuery('');
        setShowScanner(false);
        onSearch(decodedText);
    };

    const userRole = sessionStorage.getItem('userRole');

    // Role-based dashboard routing
    if (userRole?.toLowerCase() === 'admin') {
        return <AdminDashboard />;
    }

    if (userRole?.toLowerCase() === 'manufacturer') {
        return <ManufacturerDashboard />;
    }

    if (userRole?.toLowerCase() === 'distributor') {
        return <DistributorDashboard />;
    }

    // Public verification page - Advanced Design
    return (
        <div 
            className="min-h-screen bg-[#0A0E1A] relative overflow-hidden bg-mesh"
            onMouseMove={(e) => {
                const x = (e.clientX / window.innerWidth) * 100;
                const y = (e.clientY / window.innerHeight) * 100;
                document.documentElement.style.setProperty('--mouse-x', `${x}%`);
                document.documentElement.style.setProperty('--mouse-y', `${y}%`);
            }}
        >
            {/* Edge Glows - To eliminate black spaces */}
            <div className="edge-glow-left"></div>
            <div className="edge-glow-right"></div>
            
            {/* Noise Overlay */}
            <div className="absolute inset-0 bg-noise pointer-events-none opacity-[0.05]"></div>

            {/* Navbar Padding */}
            <div className="h-20 lg:h-24"></div>

            {/* Hero Section - Full Width Perspective */}
            <section className="relative px-6 py-12 lg:py-24 z-10 flex flex-col items-center">
                {/* Radial Glow Behind Headline */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] hero-glow opacity-60 pointer-events-none -z-10"></div>
                
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    
                    {/* Hero Text */}
                    <div className="lg:col-span-7 text-left">
                        
                        <h1 className="text-5xl md:text-6xl lg:text-8xl font-black tracking-tight-brand text-white mb-6 leading-[0.85] animate-slide-up font-brand">
                            SECURE <span className="gradient-text tracking-tight-brand">TRUST</span> <br />
                            FOR PHARMA
                        </h1>
                        
                        <p className="text-xl md:text-2xl font-medium text-white/80 mb-8 animate-slide-up delay-75 font-brand">
                            Built for manufacturers, distributors, and regulators worldwide.
                        </p>

                        <p className="text-lg lg:text-xl text-zinc-400 mb-12 max-w-xl animate-slide-up delay-100 font-light leading-relaxed">
                            Securing the global pharmaceutical supply chain with unbreakable cryptographic verification. Scan, track, and trust every dose.
                        </p>

                        {/* Search & Action Area */}
                        <div className="animate-slide-up delay-200">
                            {sessionStorage.getItem('token') ? (
                                <form onSubmit={handleSubmit} className="relative group max-w-xl">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/50 to-purple-600/50 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition duration-500"></div>
                                    <div className="relative flex flex-col sm:flex-row gap-2 p-2 bg-[#0c0d10]/80 backdrop-blur-2xl rounded-2xl border border-white/10 items-center">
                                        <div className="flex-1 relative w-full">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                                            <input
                                                type="text"
                                                placeholder="Input Product Serial ID..."
                                                className="w-full pl-12 pr-4 py-4 bg-transparent text-white placeholder:text-zinc-600 focus:outline-none text-base"
                                                value={query}
                                                onChange={(e) => setQuery(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={() => setShowScanner(true)}
                                                className="aspect-square p-0 w-14 h-14 rounded-xl border-white/5 bg-white/5 hover:bg-white/10"
                                            >
                                                <ScanLine className="h-6 w-6" />
                                            </Button>
                                            <Button type="submit" className="flex-1 sm:flex-initial px-8 h-14 rounded-xl text-base font-bold shadow-lg shadow-blue-500/25">
                                                Verify
                                            </Button>
                                        </div>
                                    </div>
                                    {error && (
                                        <div className="mt-4 p-4 rounded-xl glass border-red-500/20 bg-red-500/5 flex items-center gap-3 animate-fade-in shadow-xl blur-load">
                                            <AlertCircle className="h-5 w-5 text-red-400" />
                                            <span className="text-sm text-red-200 font-medium">{error}</span>
                                        </div>
                                    )}
                                </form>
                            ) : (
                                <Button onClick={onOpenLogin} size="lg" className="rounded-2xl px-10 h-16 text-lg tracking-tight group">
                                    Access Network <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Hero Visual - Pharma-Specific Supply Chain Mockup */}
                    <div className="lg:col-span-5 hidden lg:flex justify-center relative">
                        <div className="w-full aspect-square relative animate-float">
                            {/* Ambient Glows */}
                            <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-[100px]"></div>
                            <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-[80px] -rotate-45"></div>
                            
                            {/* Main UI Mockup Card */}
                            <div className="absolute inset-4 glass rounded-[2.5rem] border border-blue-500/20 backdrop-blur-3xl overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.15)] p-8 flex flex-col gap-8 group/mockup">
                                {/* Product Section */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="relative group-hover/mockup:scale-110 transition-transform duration-500">
                                            <div className="absolute -inset-2 bg-blue-500/20 blur-xl opacity-0 group-hover/mockup:opacity-100 transition-opacity"></div>
                                            <div className="relative w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                                                <span className="text-4xl">💊</span>
                                                <div className="absolute inset-0 border-2 border-blue-400/30 rounded-2xl animate-[pulse_2s_infinite]"></div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-lg leading-tight">Amoxicillin 500mg</h4>
                                            <p className="text-zinc-500 text-xs font-mono mt-1">Batch: #AX-2026-04</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            Verified
                                        </Badge>
                                        <span className="text-[10px] font-mono text-zinc-500">0x3f1a...a91c</span>
                                    </div>
                                </div>

                                {/* Supply Chain Timeline Visual */}
                                <div className="bg-black/40 rounded-3xl border border-white/5 p-6 flex flex-col gap-6">
                                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 mb-2">Chain of Custody</p>
                                    <div className="flex items-center justify-between relative px-2">
                                        {/* Background Track */}
                                        <div className="absolute left-8 right-8 top-5 h-[1px] bg-white/10"></div>
                                        
                                        {/* Node 1: Manufacturer */}
                                        <div className="relative flex flex-col items-center gap-3 z-10">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/50 flex items-center justify-center text-blue-400">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                            <span className="text-[10px] font-medium text-white/60">Factory</span>
                                        </div>

                                        {/* Node 2: Distributor */}
                                        <div className="relative flex flex-col items-center gap-3 z-10">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/50 flex items-center justify-center text-blue-400">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                            <span className="text-[10px] font-medium text-white/60">Distributor</span>
                                        </div>

                                        {/* Node 3: Pharmacy */}
                                        <div className="relative flex flex-col items-center gap-3 z-10">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                            <span className="text-[10px] font-medium text-white/60">Pharmacy</span>
                                        </div>
                                    </div>
                                </div>

                                {/* QR Scan Animation Overlay Simulation */}
                                <div className="relative h-24 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl border border-white/5 flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.1)_0%,_transparent_70%)]"></div>
                                    <div className="flex items-center gap-4 relative z-10">
                                        <QrCode className="h-10 w-10 text-white/40" />
                                        <div className="h-px w-20 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent relative">
                                            <div className="absolute inset-0 bg-blue-400/30 blur-sm"></div>
                                            <div className="absolute -top-10 bottom-10 left-0 right-0 animate-[scan_2s_ease-in-out_infinite]">
                                                <div className="h-px w-full bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,1)]"></div>
                                            </div>
                                        </div>
                                        <ScanLine className="h-10 w-10 text-white/40" />
                                    </div>
                                </div>

                                {/* Card Footer */}
                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Safe for consumption</span>
                                    </div>
                                    <span className="text-[11px] text-zinc-500 font-medium italic">Last verified: 2 min ago</span>
                                </div>
                            </div>

                            {/* Decorative Floating Element */}
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/10 blur-[120px] rounded-full animate-pulse"></div>
                            <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/10 blur-[120px] rounded-full animate-pulse delay-1000"></div>
                        </div>
                    </div>
                </div>

                {/* Stats Bar - Full Bleed Design */}
                <div className="w-full max-w-7xl mx-auto mt-20 lg:mt-32 px-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-1 rounded-3xl glass border-white/5 overflow-hidden">
                      <div className="p-6 text-center hover:bg-white/5 transition-colors border-r border-white/5">
                          <p className="text-3xl font-bold text-white mb-1">500K+</p>
                          <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Verified</p>
                      </div>
                      <div className="p-6 text-center hover:bg-white/5 transition-colors border-r border-white/5">
                          <p className="text-3xl font-bold text-white mb-1">99.9%</p>
                          <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Accuracy</p>
                      </div>
                      <div className="p-6 text-center hover:bg-white/5 transition-colors md:border-r border-white/5">
                          <p className="text-3xl font-bold text-white mb-1">20min</p>
                          <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Batch Time</p>
                      </div>
                      <div className="p-6 text-center hover:bg-white/5 transition-colors">
                          <p className="text-3xl font-bold text-white mb-1">Global</p>
                          <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Footprint</p>
                      </div>
                  </div>
                </div>
            </section>

            {/* How it works section - Interactive Connectors */}
            <section className="py-24 relative z-10 overflow-hidden">
                <div className="edge-glow-left opacity-10"></div>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-6">
                        <div className="max-w-xl">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">Securing the loop, <br /><span className="text-zinc-500">end-to-end.</span></h2>
                            <p className="text-zinc-400 text-lg font-light"><span className="font-brand font-semibold text-white">PharmaTrace</span> creates a seamless cryptographic bridge from the factory floor to the patient.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="p-4 rounded-2xl glass border-blue-500/20"><Globe className="h-6 w-6 text-blue-400" /></div>
                            <div className="p-4 rounded-2xl glass border-purple-500/20"><Zap className="h-6 w-6 text-purple-400" /></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-blue-500/0 via-indigo-500/50 to-purple-500/0 -translate-y-1/2"></div>
                        
                        {/* Step 1 */}
                        <div className="group relative z-10">
                            <div className="w-20 h-20 bg-[#0c0d10] ring-1 ring-white/10 rounded-3xl flex items-center justify-center mb-8 shadow-2xl group-hover:ring-blue-500/50 transition-all duration-500 group-hover:scale-110">
                                <Building2 className="h-8 w-8 text-blue-400" />
                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-blue-600/90 backdrop-blur-md flex items-center justify-center text-xs font-bold text-white border border-white/20">01</div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">Registration</h3>
                            <p className="text-zinc-400 leading-relaxed">Manufacturers generate unique cryptographic signatures for every batch, logged on the secure audit ledger.</p>
                        </div>

                        {/* Step 2 */}
                        <div className="group relative z-10">
                            <div className="w-20 h-20 bg-[#0c0d10] ring-1 ring-white/10 rounded-3xl flex items-center justify-center mb-8 shadow-2xl group-hover:ring-purple-500/50 transition-all duration-500 group-hover:scale-110">
                                <Truck className="h-8 w-8 text-purple-400" />
                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-purple-600/90 backdrop-blur-md flex items-center justify-center text-xs font-bold text-white border border-white/20">02</div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">Validation</h3>
                            <p className="text-zinc-400 leading-relaxed">Logistics partners verify handoffs in real-time. Any geo-anomalies trigger instant network alerts.</p>
                        </div>

                        {/* Step 3 */}
                        <div className="group relative z-10">
                            <div className="w-20 h-20 bg-[#0c0d10] ring-1 ring-white/10 rounded-3xl flex items-center justify-center mb-8 shadow-2xl group-hover:ring-emerald-500/50 transition-all duration-500 group-hover:scale-110">
                                <UserCheck className="h-8 w-8 text-emerald-400" />
                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-emerald-600/90 backdrop-blur-md flex items-center justify-center text-xs font-bold text-white border border-white/20">03</div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">Verification</h3>
                            <p className="text-zinc-400 leading-relaxed">Final consumers perform instant scans to confirm authenticity and view the complete audit trail.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Features - Bento Grid Style */}
            <section className="px-6 py-24 relative z-10 bg-mesh overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Network Protocols</h2>
                        <p className="text-zinc-500 text-lg">Advanced security mechanisms protecting the global pharmaceutical grid.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <div className="md:col-span-2 lg:col-span-3">
                            <FeatureCard
                                icon={<Shield className="h-7 w-7" />}
                                title="Anti-Clone Shield"
                                description="Deep cryptographic hashing ensures QR codes are unique and cannot be digitally replicated."
                                color="blue"
                            />
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                            <FeatureCard
                                icon={<Globe className="h-7 w-7" />}
                                title="Geo-Fencing"
                                description="Blocks scans from unauthorized jurisdictions or statistically impossible transit speeds."
                                color="purple"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <FeatureCard
                                icon={<Activity className="h-7 w-7" />}
                                title="AI Auditing"
                                description="Continuous network monitoring for shipping pattern anomalies."
                                color="cyan"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <FeatureCard
                                icon={<Zap className="h-7 w-7" />}
                                title="Instant Cut-off"
                                description="Killswitch for compromised batches to prevent distribution."
                                color="pink"
                            />
                        </div>
                        <div className="md:col-span-4 lg:col-span-2">
                            <FeatureCard
                                icon={<AlertCircle className="h-7 w-7" />}
                                title="Crisis Alert"
                                description="Real-time broadcast for critical safety recalls."
                                color="amber"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Global CTA - Immersive Banner */}
            <section className="py-24 px-6 relative z-10">
                <div className="max-w-7xl mx-auto rounded-[3rem] overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-800/90 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center brightness-[0.3]"></div>
                    <div className="relative z-10 p-16 lg:p-24 flex flex-col items-center text-center">
                        <h2 className="text-4xl lg:text-6xl font-black text-white mb-8 tracking-tighter leading-tight">
                            STRENGTHEN YOUR <br />SUPPLY CHAIN TODAY
                        </h2>
                        <p className="text-white/70 text-lg lg:text-xl max-w-2xl mb-12 font-light">
                            Join the network of verified manufacturers and distributors securing the future of global medicine.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                            <Button className="bg-white text-black hover:bg-zinc-200 px-12 h-16 rounded-2xl text-lg font-bold">
                                Get Started
                            </Button>
                            <Button variant="secondary" className="px-12 h-16 rounded-2xl text-lg glass border-white/20">
                                Technical Overview
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Scanner Modal */}
            {showScanner && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-fade-in">
                    <div className="w-full max-w-md animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Active Scan Mode</h2>
                            <button
                                onClick={() => setShowScanner(false)}
                                className="w-10 h-10 rounded-full glass flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="bg-[#0c0d10] border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.2)]">
                            <Scanner onScan={handleScan} onClose={() => setShowScanner(false)} />
                        </div>
                        <p className="mt-6 text-center text-zinc-500 text-sm">Position QR code within the frame to verify.</p>
                    </div>
                </div>
            )}
            
            {/* Footer Padding */}
            <div className="py-12 border-t border-white/5 mt-20 text-center">
                <p className="text-zinc-600 text-xs tracking-widest uppercase font-bold">Secure Gateway Infrastructure • 2026</p>
            </div>
        </div>
    );
};
    ;
    

const FeatureCard = ({ icon, title, description, color }) => {
    const colors = {
        blue: 'from-blue-500/10 to-blue-500/5 group-hover:from-blue-500/20 outline-blue-500/20 text-blue-400',
        purple: 'from-purple-500/10 to-purple-500/5 group-hover:from-purple-500/20 outline-purple-500/20 text-purple-400',
        cyan: 'from-cyan-500/10 to-cyan-500/5 group-hover:from-cyan-500/20 outline-cyan-500/20 text-cyan-400',
        pink: 'from-pink-500/10 to-pink-500/5 group-hover:from-pink-500/20 outline-pink-500/20 text-pink-400',
        emerald: 'from-emerald-500/10 to-emerald-500/5 group-hover:from-emerald-500/20 outline-emerald-500/20 text-emerald-400',
        amber: 'from-amber-500/10 to-amber-500/5 group-hover:from-amber-500/20 outline-amber-500/20 text-amber-400',
    };

    return (
        <div className={`p-8 rounded-2xl bg-gradient-to-br ${colors[color]} outline outline-1 outline-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group relative overflow-hidden backdrop-blur-md`}>
            <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 group-hover:-rotate-6`}>
                {icon}
            </div>
            <div className="mb-6 p-4 bg-[#12141a] rounded-xl inline-block shadow-inner ring-1 ring-white/10">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">{description}</p>
        </div>
    );
};
