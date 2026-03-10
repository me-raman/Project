import React from 'react';
import { Calendar, Package, Hash, AlertCircle, Copy } from 'lucide-react';

export const ProductCard = ({ product }) => {
    return (
        <div className="bg-slate-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-700 overflow-hidden transform transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-slate-600">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-6 relative overflow-hidden">
                {/* Abstract pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <h2 className="text-3xl font-bold text-white tracking-tight">{product.name}</h2>
                        <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-mono text-white/80 border border-white/10">
                            Rx Only
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
                        Manufactured by <span className="text-white">{product.manufacturer?.companyName || product.manufacturer}</span>
                    </p>
                </div>
            </div>

            <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <DetailRow
                            icon={<Hash className="h-5 w-5 text-blue-500" />}
                            label="Batch Number"
                            value={product.batchNumber}
                            copyable
                        />
                        <DetailRow
                            icon={<Package className="h-5 w-5 text-purple-500" />}
                            label="Serial Number"
                            value={product.serialNumber}
                            copyable
                        />
                    </div>

                    <div className="space-y-6">
                        <DetailRow
                            icon={<Calendar className="h-5 w-5 text-emerald-500" />}
                            label="Manufacturing Date"
                            value={product.mfgDate ? new Date(product.mfgDate).toLocaleDateString() : '—'}
                        />
                        <DetailRow
                            icon={<AlertCircle className="h-5 w-5 text-amber-500" />}
                            label="Expiry Date"
                            value={product.expDate ? new Date(product.expDate).toLocaleDateString() : '—'}
                            isAlert
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const DetailRow = ({ icon, label, value, copyable, isAlert }) => (
    <div className="flex items-start gap-4 group">
        <div className={`mt-1 p-2 rounded-lg ${isAlert ? 'bg-amber-500/10' : 'bg-slate-800'} group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <div className="flex-1">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">{label}</p>
            <div className="flex items-center gap-2">
                <p className={`font-mono text-lg font-medium ${isAlert ? 'text-amber-500' : 'text-white'}`}>
                    {value}
                </p>
                {copyable && (
                    <button className="text-slate-500 hover:text-blue-400 transition-colors">
                        <Copy className="h-3 w-3" />
                    </button>
                )}
            </div>
        </div>
    </div>
);
