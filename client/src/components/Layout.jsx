import React, { useState, useEffect } from 'react';
import { Menu, X, Pill, Twitter, Github, Linkedin, Shield } from 'lucide-react';
import { Login } from './Login';
import { SignUp } from './SignUp';

export const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [showSignup, setShowSignup] = useState(false);
    const [user, setUser] = useState(null);

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

    return (
        <>
            <nav className="fixed w-full top-0 z-50 bg-[#0A0F14] border-b border-white/10">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="flex justify-between h-14">
                        {/* System ID */}
                        <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-blue-500" />
                            <span className="text-sm font-mono-data tracking-[0.3em] uppercase text-[#E6EDF3]">
                                PHARMATRACE / SYS_V1.0
                            </span>
                        </div>

                        {/* Operational Controls */}
                        <div className="hidden md:flex items-center gap-6">
                            {user ? (
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] uppercase tracking-widest text-[#9BA4AE]">Authenticated User</span>
                                        <span className="text-xs font-mono-data text-blue-400">{user.name} / {user.role.toUpperCase()}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="text-[10px] uppercase tracking-widest text-[#6B7280] font-semibold border border-white/10 px-3 py-1 bg-white/5"
                                    >
                                        TERMINATE
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setShowLogin(true)}
                                        className="text-[10px] uppercase tracking-widest text-[#E6EDF3] font-semibold"
                                    >
                                        LOGIN
                                    </button>
                                    <button
                                        onClick={() => setShowSignup(true)}
                                        className="text-[10px] uppercase tracking-widest bg-blue-600 text-white font-semibold px-4 py-1.5"
                                    >
                                        INITIALIZE
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Mobile Access */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="text-[#9BA4AE]"
                            >
                                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                {isOpen && (
                    <div className="md:hidden bg-[#0F1720] border-b border-white/10 px-6 py-6 space-y-4">
                        <button
                            onClick={() => { setIsOpen(false); setShowLogin(true); }}
                            className="w-full text-left text-[10px] uppercase tracking-widest text-[#E6EDF3] font-semibold"
                        >
                            LOGIN
                        </button>
                        <button
                            onClick={() => { setIsOpen(false); setShowSignup(true); }}
                            className="w-full text-left text-[10px] uppercase tracking-widest text-blue-400 font-semibold"
                        >
                            INITIALIZE SYSTEM
                        </button>
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
        <footer className="bg-[#0A0F14] border-t border-white/5 py-10 mt-20">
            <div className="max-w-[1400px] mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="h-4 w-4 text-blue-500" />
                            <span className="text-xs font-mono-data tracking-[0.2em] uppercase">PharmaTrace</span>
                        </div>
                        <p className="text-[10px] uppercase tracking-wider text-[#6B7280] leading-relaxed">
                            Cryptographic Supply Chain Terminal.<br />
                            Production Environment.
                        </p>
                    </div>

                    {['System', 'Compliance', 'Security'].map(title => (
                        <div key={title}>
                            <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#9BA4AE] font-bold mb-4">{title}</h4>
                            <ul className="space-y-2 text-[10px] uppercase tracking-widest text-[#6B7280]">
                                <li><a href="#">Gateway</a></li>
                                <li><a href="#">Audit Logs</a></li>
                                <li><a href="#">Protocols</a></li>
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center">
                    <p className="text-[10px] font-mono-data text-[#6B7280]">
                        COPYRIGHT © 2026 / ENCRYPTED_LEDGER
                    </p>
                    <div className="flex gap-4">
                        <Twitter className="h-3.5 w-3.5 text-[#6B7280]" />
                        <Github className="h-3.5 w-3.5 text-[#6B7280]" />
                        <Linkedin className="h-3.5 w-3.5 text-[#6B7280]" />
                    </div>
                </div>
            </div>
        </footer>
    );
};
