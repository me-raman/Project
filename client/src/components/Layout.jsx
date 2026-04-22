import React, { useState, useEffect } from 'react';
import { Menu, X, ShieldCheck, ChevronRight, User } from 'lucide-react';
import { Login } from './Login';
import { SignUp } from './SignUp';
import { Button } from './ui';

export const Navbar = ({ onLoginClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [showSignup, setShowSignup] = useState(false);
    const [user, setUser] = useState(null);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            const token = sessionStorage.getItem('token');
            if (token) {
                try {
                    const response = await fetch('/api/auth/verify', {
                        method: 'GET',
                        headers: { 'x-auth-token': token }
                    });

                    if (response.ok) {
                        const userData = await response.json();
                        setUser({ role: userData.role, name: userData.name });
                    } else {
                        sessionStorage.removeItem('token');
                        sessionStorage.removeItem('userRole');
                        sessionStorage.removeItem('userName');
                        sessionStorage.removeItem('userId');
                        setUser(null);
                    }
                } catch (err) {
                    console.error('Auth verification error:', err);
                    setUser(null);
                }
            }
        };
        checkAuth();
    }, []);

    const handleLoginSuccess = (userData) => {
        setUser({ role: userData.role, name: userData.name });
        setShowLogin(false);
        setShowSignup(false);
        window.location.reload();
    };

    const handleLogout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('userName');
        setUser(null);
        window.location.reload();
    };

    const openLogin = () => {
        setIsOpen(false);
        setShowLogin(true);
    };

    const openSignup = () => {
        setIsOpen(false);
        setShowSignup(true);
    };

    // Expose openLogin to parent via onLoginClick callback
    useEffect(() => {
        if (onLoginClick) {
            window.openLoginModal = openLogin;
        }
    }, [onLoginClick]);

    return (
        <>
            <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${scrolled
                ? 'bg-[#0c0d10]/90 backdrop-blur-xl border-b border-white/5'
                : 'bg-transparent'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex justify-between items-center h-16">
                        {/* Brand */}
                        <div className="flex items-center gap-2.5 group cursor-pointer hover:scale-[1.02] transition-all duration-300" onClick={() => window.location.href = '/'}>
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-60 transition duration-500"></div>
                                <div className="relative p-2 bg-[#0c0d10] border border-white/10 rounded-lg shadow-lg group-hover:border-blue-500/50 transition-colors">
                                    <ShieldCheck className="h-5 w-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
                                </div>
                            </div>
                            <span className="text-xl font-extrabold font-brand tracking-tight-brand text-white">
                                PharmaTrace
                            </span>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-3">
                            {user ? (
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => window.location.href = '/profile'}
                                            title="Profile"
                                            className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
                                        >
                                            <User className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <span className="text-sm text-zinc-300 font-medium">{user.name}</span>
                                    <button
                                        onClick={handleLogout}
                                        className="text-sm text-zinc-400 hover:text-white transition-colors ml-1"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={openLogin}
                                        className="text-sm text-zinc-300 hover:text-white px-4 py-2 transition-colors"
                                    >
                                        Sign in
                                    </button>
                                    <button
                                        onClick={openSignup}
                                        className="text-sm font-medium text-white px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        Get started
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <div className="md:hidden absolute top-16 left-0 right-0 glass border-b border-white/5 animate-slide-down">
                        <div className="p-4 space-y-2">
                            {user ? (
                                <>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                                    <button
                                        onClick={() => { window.location.href = '/profile'; setIsOpen(false); }}
                                        className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full"
                                        title="Profile"
                                    >
                                        <User className="h-5 w-5" />
                                    </button>
                                    <span className="text-sm text-zinc-300 font-medium">{user.name}</span>
                                </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left text-sm text-zinc-400 p-3 rounded-lg hover:bg-white/5 transition-colors"
                                    >
                                        Sign out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={openLogin}
                                        className="w-full flex items-center justify-between text-sm text-zinc-300 p-3 rounded-lg hover:bg-white/5 transition-colors"
                                    >
                                        Sign in
                                        <ChevronRight className="h-4 w-4 text-zinc-500" />
                                    </button>
                                    <button
                                        onClick={openSignup}
                                        className="w-full text-sm font-medium text-white p-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 transition-all"
                                    >
                                        Get started
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {showLogin && (
                <Login
                    onClose={() => setShowLogin(false)}
                    onLoginSuccess={handleLoginSuccess}
                    onSignUpClick={() => { setShowLogin(false); setShowSignup(true); }}
                />
            )}

            {showSignup && (
                <SignUp
                    onClose={() => setShowSignup(false)}
                    onRegisterSuccess={handleLoginSuccess}
                    onLoginClick={() => { setShowSignup(false); setShowLogin(true); }}
                />
            )}
        </>
    );
};

export const Footer = () => {
    const [activePopup, setActivePopup] = useState(null);

    const popups = {
        features: {
            title: "Platform Features",
            content: "PharmaTrace delivers end-to-end supply chain visibility through unique QR code generation and real-time tracking. Every scan triggers cryptographic verification against an immutable ledger, ensuring product authenticity at every touchpoint."
        },
        howItWorks: {
            title: "How it Works",
            content: "1. Registration: Manufacturers securely register new batches onto the ledger.\n2. Validation: Distributors verify handoffs through geo-tracked scans.\n3. Verification: Patients scan the final QR code to instantly confirm authenticity."
        },
        security: {
            title: "Security Protocols",
            content: "The supply chain is defended via advanced anti-clone QR hashing to prevent digital duplication. Integrated geo-fencing and AI auditing actively block anomalies, while an instant batch kill-switch isolates compromised shipments immediately."
        },
        aboutUs: {
            title: "About PharmaTrace",
            content: "PharmaTrace is a secure cryptographic network with a single mission: to eliminate counterfeit medicines globally. We empower manufacturers, distributors, pharmacies, and regulators with an unbreakable chain of custody for life-saving pharmaceuticals."
        }
    };

    return (
        <footer className="relative border-t border-white/5 bg-[#0a0a0c] overflow-hidden">
            <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
            
            <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 group cursor-pointer inline-flex transition-transform hover:scale-[1.02]">
                            <div className="p-2 bg-white/5 border border-white/10 rounded-lg group-hover:border-blue-500/30 transition-colors">
                                <ShieldCheck className="h-5 w-5 text-blue-400" />
                            </div>
                            <span className="text-xl font-extrabold font-brand tracking-tight-brand text-white">PharmaTrace</span>
                        </div>
                        <p className="text-zinc-500 text-sm leading-relaxed max-w-xs font-light">
                            Securing the global pharmaceutical supply chain with advanced cryptographic verification and real-time tracking.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-6 uppercase text-sm tracking-wider">Product</h4>
                        <ul className="space-y-3">
                            <li><button onClick={() => setActivePopup('features')} className="text-zinc-400 hover:text-blue-400 text-sm transition-colors text-left">Features</button></li>
                            <li><button onClick={() => setActivePopup('howItWorks')} className="text-zinc-400 hover:text-blue-400 text-sm transition-colors text-left">How it Works</button></li>
                            <li><button onClick={() => setActivePopup('security')} className="text-zinc-400 hover:text-blue-400 text-sm transition-colors text-left">Security</button></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-6 uppercase text-sm tracking-wider">Company</h4>
                        <ul className="space-y-3">
                            <li><button onClick={() => setActivePopup('aboutUs')} className="text-zinc-400 hover:text-blue-400 text-sm transition-colors text-left">About Us</button></li>
                            <li><a href="mailto:support@pharmatrace.com" className="text-zinc-400 hover:text-blue-400 text-sm transition-colors">Contact Support</a></li>
                        </ul>
                    </div>

                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-zinc-500 text-sm">
                        © {new Date().getFullYear()} PharmaTrace Networks Inc. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6 text-sm">
                        <a href="/privacy-policy" className="text-zinc-500 hover:text-white transition-colors">Privacy Policy</a>
                        <a href="/terms-of-service" className="text-zinc-500 hover:text-white transition-colors">Terms of Service</a>
                        <a href="/compliance" className="text-zinc-500 hover:text-white transition-colors">Compliance</a>
                    </div>
                </div>
            </div>

            {/* Modal Popup */}
            {activePopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-[#0a0a0c]/80 backdrop-blur-xl transition-opacity" onClick={() => setActivePopup(null)}></div>
                    <div className="relative z-10 w-full max-w-[480px] glass-accent rounded-3xl overflow-hidden shadow-2xl animate-scale-in border border-white/10 p-8">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-bold text-white tracking-tight">{popups[activePopup].title}</h2>
                            <button
                                onClick={() => setActivePopup(null)}
                                className="p-2 -mr-2 -mt-2 text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line">
                            {popups[activePopup].content}
                        </p>
                    </div>
                </div>
            )}
        </footer>
    );
};
