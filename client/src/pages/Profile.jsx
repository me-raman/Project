import React, { useState, useEffect } from 'react';
import { User, Mail, MapPin, Shield, Calendar, Lock, ArrowRight, Loader2, CheckCircle2, AlertTriangle, XCircle, TrendingUp, BarChart3, Activity, ArrowLeft } from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';

export const Profile = () => {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = sessionStorage.getItem('token');
                if (!token) {
                    window.location.href = '/';
                    return;
                }

                // Fetch expanded user data
                const userRes = await fetch('/api/auth/verify', {
                    headers: { 'x-auth-token': token }
                });
                
                if (!userRes.ok) throw new Error('Failed to fetch profile data');
                const userData = await userRes.json();
                setUser(userData);

                // Fetch user stats
                const statsRes = await fetch('/api/track/user/stats', {
                    headers: { 'x-auth-token': token }
                });
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData);
                }

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-6 text-center">
                <Card className="max-w-md border-red-500/20 bg-red-500/5">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Error Loading Profile</h2>
                    <p className="text-zinc-400 mb-6">{error || 'Session expired or invalid.'}</p>
                    <Button onClick={() => window.location.href = '/'}>Return Home</Button>
                </Card>
            </div>
        );
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Verified':
                return <Badge variant="success" className="gap-1.5"><CheckCircle2 className="h-3 w-3" /> Verified ✓</Badge>;
            case 'Pending':
                return <Badge variant="warning" className="gap-1.5"><AlertTriangle className="h-3 w-3" /> Pending Verification</Badge>;
            case 'Rejected':
                return <Badge variant="danger" className="gap-1.5"><XCircle className="h-3 w-3" /> Rejected — Contact Support</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0E1A] pt-28 pb-20 px-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

            <div className="max-w-[800px] mx-auto relative z-10 space-y-8 animate-fade-in">
                <div className="flex flex-col gap-6 border-b border-white/5 pb-8">
                    <button 
                        onClick={() => window.location.href = '/'}
                        className="flex items-center gap-2 text-zinc-500 hover:text-blue-400 transition-colors w-fit group"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back to Dashboard</span>
                    </button>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                            <User className="h-8 w-8 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">My Profile</h1>
                            <p className="text-zinc-400 mt-1">Manage your supply chain identity and credentials</p>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <Badge variant="info" className="px-4 py-1.5 text-sm font-semibold tracking-wider uppercase border-blue-500/30">
                            {user.role}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Account Information Card */}
            <Card className="!bg-white/[0.02] border-white/10 backdrop-blur-md overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                        <Shield className="w-32 h-32" />
                    </div>
                    
                    <div className="p-6 border-b border-white/5">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-400" />
                            Account Information
                        </h2>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        <InfoItem 
                            icon={Activity} 
                            label="Business Name" 
                            value={user.name} 
                        />
                        <InfoItem 
                            icon={Mail} 
                            label="Email Address" 
                            value={user.email} 
                        />
                        <InfoItem 
                            icon={MapPin} 
                            label="Operational Location" 
                            value={user.location} 
                        />
                        <InfoItem 
                            icon={Calendar} 
                            label="Member Since" 
                            value={user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'} 
                        />
                        <InfoItem 
                            icon={Shield} 
                            label="Licence Number" 
                            value={user.licenceNumber} 
                            isLocked
                        />
                        <div className="space-y-3">
                            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 opacity-80">Verification Status</label>
                            <div className="flex items-center">
                                {getStatusBadge(user.licenceStatus || 'Pending')}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Stats Card (Role Specific) */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {user.role === 'Manufacturer' && (
                            <>
                                <StatCard icon={TrendingUp} label="Total Batches Created" value={stats.totalBatches} color="blue" />
                                <StatCard icon={BarChart3} label="Total QR Codes Generated" value={stats.totalUnits} color="purple" />
                            </>
                        )}
                        {user.role === 'Distributor' && (
                            <>
                                <StatCard icon={TrendingUp} label="Total Batches Validated" value={stats.totalBatches} color="blue" />
                                <StatCard icon={Activity} label="Total Handoffs Completed" value={stats.totalHandoffs} color="indigo" />
                            </>
                        )}
                        {user.role === 'Pharmacy' && (
                            <>
                                <StatCard icon={TrendingUp} label="Total Batches Received" value={stats.totalReceived} color="emerald" />
                                <StatCard icon={CheckCircle2} label="Total Units Dispensed" value={stats.totalDispensed} color="teal" />
                            </>
                        )}
                    </div>
                )}

                {/* Change Password Button */}
                <div className="pt-8 flex justify-center">
                    <button
                        onClick={() => window.location.href = '/change-password'}
                        className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 hover:border-white/20 transition-all shadow-xl hover:shadow-2xl"
                    >
                        <Lock className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform" />
                        Change Password
                        <ArrowRight className="h-5 w-5 text-zinc-500 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const InfoItem = ({ icon: Icon, label, value, isLocked }) => {
    return (
        <div className="space-y-2 group/item">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 group-hover/item:text-zinc-400 transition-colors">
                {label}
            </label>
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 shadow-inner">
                    {Icon && <Icon className={`h-4 w-4 ${isLocked ? 'text-zinc-500' : 'text-blue-400'}`} />}
                </div>
                <p className="text-zinc-200 font-semibold tracking-wide truncate">
                    {value || 'Not provided'}
                </p>
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color = 'blue' }) => {
    const colors = {
        blue: "from-blue-500/20 to-indigo-500/10 border-blue-500/20 text-blue-400",
        purple: "from-purple-500/20 to-pink-500/10 border-purple-500/20 text-purple-400",
        emerald: "from-emerald-500/20 to-teal-500/10 border-emerald-500/20 text-emerald-400",
        indigo: "from-indigo-500/20 to-blue-500/10 border-indigo-500/20 text-indigo-400",
        teal: "from-teal-500/20 to-emerald-500/10 border-teal-500/20 text-teal-400"
    };

    const colorClass = colors[color] || colors.blue;

    return (
        <Card className={`relative overflow-hidden !bg-gradient-to-br ${colorClass} border shadow-lg group`}>
            <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                {Icon && <Icon className="w-16 h-16" />}
            </div>
            <div className="p-2 relative z-10">
                <p className="text-zinc-400 text-sm font-medium mb-1">{label}</p>
                <p className="text-4xl font-black text-white tracking-tight">
                    {value || 0}
                </p>
            </div>
        </Card>
    );
};

