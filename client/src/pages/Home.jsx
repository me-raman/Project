import React, { useState } from 'react';
import { Search, Shield, Globe, Zap, ScanLine, AlertCircle, Truck, Sparkles } from 'lucide-react';
import { ManufacturerDashboard } from '../components/ManufacturerDashboard';
import { DistributorDashboard } from '../components/DistributorDashboard';
import { Scanner } from '../components/Scanner';
import { Button, Card, Badge } from '../components/ui';

export const Home = ({ onSearch, error, onOpenLogin }) => {
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
        return <ManufacturerDashboard />;
    }

    if (userRole?.toLowerCase() === 'distributor') {
        return <DistributorDashboard />;
    }

    // Public verification page - Mobile first
    return (
        <div className="min-h-screen pt-16">
            {/* Hero Section */}
            <div className="px-4 sm:px-6 py-12 sm:py-20">
                <div className="max-w-3xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-accent mb-6 animate-fade-in">
                        <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-xs font-medium text-blue-300">Pharmaceutical Supply Chain Verification</span>
                    </div>

                    {/* Heading */}
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 animate-fade-in">
                        Verify product{' '}
                        <span className="gradient-text">authenticity</span>
                    </h1>
                    <p className="text-base sm:text-lg text-zinc-400 mb-8 max-w-xl mx-auto animate-fade-in">
                        Enter a product ID or scan a QR code to verify authenticity and trace the complete supply chain journey.
                    </p>

                    {/* Error States */}
                    {error && (
                        <div className="max-w-md mx-auto mb-8 animate-slide-up">
                            <div className={`p-4 rounded-xl glass flex items-start gap-3 text-left ${error.includes('supply chain') ? 'border-blue-500/30' : 'border-red-500/30'
                                }`}>
                                {error.includes('supply chain') ? (
                                    <>
                                        <Truck className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-white">Product in transit</p>
                                            <p className="text-sm text-zinc-400 mt-0.5">
                                                This product is still being delivered.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-white">Unable to verify</p>
                                            <p className="text-sm text-zinc-400 mt-0.5">{error}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Search Form */}
                    {localStorage.getItem('token') ? (
                        <div className="max-w-lg mx-auto animate-slide-up">
                            <form onSubmit={handleSubmit}>
                                {/* Mobile: Stack vertically */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                                        <input
                                            type="text"
                                            placeholder="Enter product ID"
                                            className="w-full pl-12 pr-4 py-3.5 rounded-xl glass text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-base"
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-3 sm:flex-shrink-0">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => setShowScanner(true)}
                                            className="flex-1 sm:flex-initial"
                                        >
                                            <ScanLine className="h-5 w-5 sm:mr-2" />
                                            <span className="sm:inline">Scan</span>
                                        </Button>
                                        <Button type="submit" className="flex-1 sm:flex-initial">
                                            Verify
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="max-w-sm mx-auto animate-slide-up">
                            <div className="p-6 rounded-2xl glass-purple text-center">
                                <p className="text-zinc-300 mb-4">Sign in to verify products</p>
                                <Button onClick={onOpenLogin} className="w-full sm:w-auto">
                                    Sign in to continue
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Features - Mobile first grid */}
            <div className="px-4 sm:px-6 pb-16">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FeatureCard
                            icon={<Shield className="h-5 w-5" />}
                            title="Verified origin"
                            description="Track from manufacture to delivery"
                            color="blue"
                        />
                        <FeatureCard
                            icon={<Globe className="h-5 w-5" />}
                            title="Full visibility"
                            description="Complete supply chain journey"
                            color="purple"
                        />
                        <FeatureCard
                            icon={<Zap className="h-5 w-5" />}
                            title="Instant results"
                            description="Verification in seconds"
                            color="cyan"
                        />
                    </div>
                </div>
            </div>

            {/* Scanner Modal */}
            {showScanner && (
                <Scanner onScan={handleScan} onClose={() => setShowScanner(false)} />
            )}
        </div>
    );
};

const FeatureCard = ({ icon, title, description, color }) => {
    const colors = {
        blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400',
        purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400',
        cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/20 text-cyan-400',
    };

    return (
        <div className={`p-5 rounded-xl bg-gradient-to-br ${colors[color]} border backdrop-blur-sm transition-all hover:scale-[1.02]`}>
            <div className="mb-3">{icon}</div>
            <h3 className="font-medium text-white mb-1">{title}</h3>
            <p className="text-sm text-zinc-400">{description}</p>
        </div>
    );
};
