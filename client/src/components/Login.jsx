import React, { useState } from 'react';
import { X, ArrowRight, Loader2, UserPlus, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button, Input } from './ui';

export const Login = ({ onClose, onLoginSuccess, onSignUpClick }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [flashSignUp, setFlashSignUp] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setError('');
        if (name === 'email') setFlashSignUp(false);
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (response.ok) {
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('userRole', data.role);
                sessionStorage.setItem('userName', data.name);
                sessionStorage.setItem('userId', data.userId);
                sessionStorage.setItem('licenceNumber', data.licenceNumber || '');
                sessionStorage.setItem('licenceStatus', data.licenceStatus || 'Verified');

                if (onLoginSuccess) {
                    onLoginSuccess(data);
                } else {
                    onClose();
                    window.location.reload();
                }
            } else {
                setError(data.message || 'Invalid email or password');
            }
        } catch {
            setError('Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-[#0a0a0c]/80 backdrop-blur-xl transition-opacity z-0" onClick={onClose}></div>
            <div className="absolute inset-0 bg-mesh opacity-50 z-0 pointer-events-none"></div>

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md glass-accent rounded-3xl overflow-hidden shadow-2xl animate-scale-in border border-white/10">
                {/* Decorative gradients */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
                <div className="absolute -top-32 -left-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>

                <div className="p-8 relative z-10">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome Back</h2>
                            <p className="text-zinc-400">Sign in to your supply chain account</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2"></span>
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleEmailLogin} className="space-y-5">
                        <div className="space-y-4 animate-fade-in">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-zinc-300">Email address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                                    <Input
                                        type="email"
                                        name="email"
                                        required
                                        className="pl-12"
                                        placeholder="name@company.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-zinc-300">Password</label>
                                    <button type="button" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</button>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        required
                                        className="pl-12 pr-12"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={loading}
                                className="w-full text-lg shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        Sign In
                                        <ArrowRight className="h-5 w-5" />
                                    </div>
                                )}
                            </Button>
                        </div>
                    </form>

                    {/* Sign up link */}
                    <div className="mt-8">
                        <Button
                            variant="secondary"
                            onClick={onSignUpClick}
                            className={`w-full text-zinc-300 font-medium ${flashSignUp ? '!border-blue-500/50 !text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.15)] bg-blue-500/10' : ''}`}
                        >
                            <UserPlus className="h-5 w-5 mr-2" />
                            {flashSignUp ? 'Create new account' : 'New user? Sign up here'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
