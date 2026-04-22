import React, { useState } from 'react';
import { X, ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react';
import { Button, Input } from './ui';

export const ForgotPassword = ({ onClose, onBackToLogin }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
            } else {
                setError(data.message || 'Something went wrong');
            }
        } catch {
            setError('Failed to connect to server');
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
                            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
                                {success ? 'Check your email' : 'Reset Password'}
                            </h2>
                            <p className="text-zinc-400">
                                {success
                                    ? 'We\'ve sent you a password reset link'
                                    : 'Enter your email to receive a reset link'}
                            </p>
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

                    {success ? (
                        /* Success State */
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex flex-col items-center text-center py-4">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                                    <CheckCircle className="h-8 w-8 text-emerald-400" />
                                </div>
                                <p className="text-zinc-300 text-sm leading-relaxed max-w-sm">
                                    If an account with <span className="text-white font-medium">{email}</span> exists, 
                                    you'll receive an email with instructions to reset your password.
                                </p>
                                <p className="text-zinc-500 text-xs mt-3">
                                    The link expires in 1 hour. Check your spam folder if you don't see it.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    variant="primary"
                                    onClick={onBackToLogin}
                                    className="w-full"
                                >
                                    Back to Sign In
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* Form */
                        <form onSubmit={handleSubmit} className="space-y-5">
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
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={loading}
                                    className="w-full text-lg shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                                >
                                    {loading ? (
                                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </Button>

                                <button
                                    type="button"
                                    onClick={onBackToLogin}
                                    className="w-full flex items-center justify-center gap-2 text-sm text-zinc-400 hover:text-white py-2 transition-colors"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Sign In
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
