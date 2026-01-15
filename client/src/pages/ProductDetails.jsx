import React from 'react';
import { ProductCard } from '../components/ProductCard';
import { Timeline } from '../components/Timeline';
import { CheckCircle2, AlertTriangle, ArrowLeft, Download, Share2 } from 'lucide-react';

export const ProductDetails = ({ product, events, onBack }) => {
    const isAuthentic = true; // Hardcoded for demo

    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto animate-fade-in">

                <button
                    onClick={onBack}
                    className="group flex items-center text-slate-400 hover:text-blue-400 mb-8 transition-colors font-medium"
                >
                    <div className="p-2 rounded-full bg-slate-900 border border-slate-700 group-hover:border-blue-500/30 mr-3 shadow-sm transition-all">
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    </div>
                    Back to Search
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Authenticity Banner */}
                        <div className={`relative overflow-hidden p-6 rounded-2xl shadow-sm border ${isAuthentic ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-red-900/10 border-red-500/20'
                            }`}>
                            {/* Animated background glow */}
                            <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 ${isAuthentic ? 'bg-emerald-500' : 'bg-red-500'
                                }`}></div>

                            <div className="relative flex items-start gap-4">
                                <div className={`p-3 rounded-xl ${isAuthentic ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {isAuthentic ? <CheckCircle2 className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
                                </div>
                                <div>
                                    <h2 className={`text-2xl font-bold mb-1 ${isAuthentic ? 'text-emerald-100' : 'text-red-100'}`}>
                                        {isAuthentic ? 'Verified Authentic' : 'Verification Failed'}
                                    </h2>
                                    <p className={`text-base ${isAuthentic ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {isAuthentic
                                            ? 'This product has a valid cryptographic signature and follows the established supply chain protocol.'
                                            : 'Warning: This product ID does not match our records or has been flagged for review.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <ProductCard product={product} />
                        <Timeline events={events} />
                    </div>

                    {/* Sidebar Column */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">

                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
                                <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                                    Supply Chain Stats
                                </h3>
                                <div className="space-y-5">
                                    <Stat label="Total Scans" value="1,204" />
                                    <div className="h-px bg-slate-800"></div>
                                    <Stat label="Current Location" value="Chicago, IL" highlight />
                                    <div className="h-px bg-slate-800"></div>
                                    <Stat label="Last Updated" value="2h ago" />
                                    <div className="h-px bg-slate-800"></div>
                                    <Stat label="Quality Score" value="98/100" />
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
                                <h3 className="font-bold text-white mb-4">Actions</h3>
                                <div className="space-y-3">
                                    <button className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                                        <Download className="h-4 w-4" /> Download Certificate
                                    </button>
                                    <button className="w-full py-3 px-4 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                                        <Share2 className="h-4 w-4" /> Share Report
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Stat = ({ label, value, highlight }) => (
    <div className="flex justify-between items-center group">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        <span className={`font-semibold ${highlight ? 'text-blue-400' : 'text-white'}`}>{value}</span>
    </div>
);
