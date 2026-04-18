import React, { useState, useEffect } from 'react';
import { Menu, X, ShieldCheck, ChevronRight } from 'lucide-react';
import { Login } from './Login';
import { SignUp } from './SignUp';

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
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <span className="text-sm text-zinc-300">{user.name}</span>
                                        <span className="text-xs text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">{user.role}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="text-sm text-zinc-400 hover:text-white transition-colors"
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
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{user.name}</p>
                                            <p className="text-xs text-zinc-500">{user.role}</p>
                                        </div>
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
    return (
        <footer className="relative mt-24 border-t border-white/5 bg-[#0a0a0c] overflow-hidden">
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
                            <li><a href="#" className="text-zinc-400 hover:text-blue-400 text-sm transition-colors">Features</a></li>
                            <li><a href="#" className="text-zinc-400 hover:text-blue-400 text-sm transition-colors">How it Works</a></li>
                            <li><a href="#" className="text-zinc-400 hover:text-blue-400 text-sm transition-colors">Security</a></li>
                            <li><a href="#" className="text-zinc-400 hover:text-blue-400 text-sm transition-colors">For Pharmacies</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-6 uppercase text-sm tracking-wider">Company</h4>
                        <ul className="space-y-3">
                            <li><a href="#" className="text-zinc-400 hover:text-blue-400 text-sm transition-colors">About Us</a></li>
                            <li><a href="#" className="text-zinc-400 hover:text-blue-400 text-sm transition-colors">Careers</a></li>
                            <li><a href="#" className="text-zinc-400 hover:text-blue-400 text-sm transition-colors">Contact Support</a></li>
                            <li><a href="#" className="text-zinc-400 hover:text-blue-400 text-sm transition-colors">Partners</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-6 uppercase text-sm tracking-wider">Stay Updated</h4>
                        <p className="text-zinc-400 text-sm mb-4">Get the latest news on supply chain security.</p>
                        <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                            <input 
                                type="email" 
                                placeholder="Enter your email" 
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                            />
                            <button className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-zinc-500 text-sm">
                        © {new Date().getFullYear()} PharmaTrace Networks Inc. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6 text-sm">
                        <a href="#" className="text-zinc-500 hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="text-zinc-500 hover:text-white transition-colors">Terms of Service</a>
                        <a href="#" className="text-zinc-500 hover:text-white transition-colors">Compliance</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
