import React, { useState, useEffect } from 'react';
import { Menu, X, Pill, ChevronRight } from 'lucide-react';
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
            const token = localStorage.getItem('token');
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
                        localStorage.removeItem('token');
                        localStorage.removeItem('userRole');
                        localStorage.removeItem('userName');
                        localStorage.removeItem('userId');
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
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
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
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex justify-between items-center h-16">
                        {/* Brand */}
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                                <Pill className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-base font-semibold text-white">
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
        <footer className="border-t border-white/5 py-8 mt-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1 bg-gradient-to-br from-blue-500 to-purple-600 rounded">
                            <Pill className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm font-medium text-zinc-500">PharmaTrace</span>
                    </div>
                    <p className="text-sm text-zinc-600">
                        © 2026 PharmaTrace. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};
