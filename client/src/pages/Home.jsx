import React, { useState } from 'react';
import { Search, ShieldCheck, Globe, Zap, ScanLine, XCircle, AlertTriangle, Truck, ArrowRight } from 'lucide-react';
import { ManufacturerDashboard } from '../components/ManufacturerDashboard';
import { DistributorDashboard } from '../components/DistributorDashboard';
import { Scanner } from '../components/Scanner';
import { Button, Card, Badge } from '../components/ui';

export const Home = ({ onSearch, error }) => {
    const [query, setQuery] = useState('');
    const [showScanner, setShowScanner] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) onSearch(query);
    };

    const handleScan = (decodedText) => {
        setQuery('');
        setShowScanner(false);
        onSearch(decodedText);
    };

    const userRole = localStorage.getItem('userRole');

    // Role-based dashboard routing
    if (userRole?.toLowerCase() === 'manufacturer') {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-slate-50 py-6">
                <ManufacturerDashboard />
            </div>
        );
    }

    if (userRole?.toLowerCase() === 'distributor') {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-slate-50 py-6">
                <DistributorDashboard />
            </div>
        );
    }

    // Public Landing Page
    return (
        <div className="min-h-[calc(100vh-64px)] bg-slate-50">
            {/* Hero Section */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                    <Badge variant="info" className="mb-4">Pharmaceutical Track & Trace</Badge>

                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                        Verify Medicine Authenticity
                    </h1>

                    <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
                        Scan the QR code or enter the product ID to verify your medication is genuine and track its journey from manufacturer to pharmacy.
                    </p>

                    {/* Error States */}
                    {error === 'Product in supply chain (not yet at pharmacy)' ? (
                        <Card className="max-w-md mx-auto border-blue-200 bg-blue-50 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-blue-100">
                                    <Truck className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-blue-800">In Transit</h3>
                                    <p className="text-sm text-blue-600">
                                        This product is still in the supply chain
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ) : error ? (
                        <Card className="max-w-md mx-auto border-red-200 bg-red-50 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-red-100">
                                    <XCircle className="h-6 w-6 text-red-600" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-red-800">Verification Failed</h3>
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            </div>
                        </Card>
                    ) : null}

                    {/* Search Form */}
                    {localStorage.getItem('token') ? (
                        <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Enter Product ID (e.g., PROD-BATCH-123456)"
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                    />
                                </div>
                                <Button type="button" variant="secondary" onClick={() => setShowScanner(true)}>
                                    <ScanLine className="h-5 w-5" />
                                </Button>
                                <Button type="submit">
                                    Verify
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <Card className="max-w-md mx-auto">
                            <p className="text-slate-600">Please login to access the verification system.</p>
                        </Card>
                    )}
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-5xl mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FeatureCard
                        icon={<ShieldCheck className="h-6 w-6 text-emerald-600" />}
                        title="Verified Origin"
                        description="Every product is cryptographically signed at manufacture."
                    />
                    <FeatureCard
                        icon={<Globe className="h-6 w-6 text-blue-600" />}
                        title="Full Chain Visibility"
                        description="Track movement from factory to pharmacy."
                    />
                    <FeatureCard
                        icon={<Zap className="h-6 w-6 text-amber-600" />}
                        title="Instant Results"
                        description="Scan and get verification in seconds."
                    />
                </div>
            </div>

            {/* Scanner Modal */}
            {showScanner && (
                <Scanner onScan={handleScan} onClose={() => setShowScanner(false)} />
            )}
        </div>
    );
};

const FeatureCard = ({ icon, title, description }) => (
    <Card className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-slate-100 mb-4">
            {icon}
        </div>
        <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600">{description}</p>
    </Card>
);
