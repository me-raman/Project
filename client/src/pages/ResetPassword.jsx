import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button, Input } from '../components/ui';

export const ResetPassword = () => {
    const [token, setToken] = useState('');
    const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
    const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const t = params.get('token');
        if (t) {
            setToken(t);
        } else {
            setError('Missing reset token. Please use the link from your email.');
        }
    }, []);

    const isNewValid = formData.newPassword.length >= 8;
    const isMatch = formData.newPassword === formData.confirmPassword;
    const isFormValid = token && isNewValid && isMatch;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    newPassword: formData.newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
            } else {
                setError(data.message || 'Failed to reset password');
            }
        } catch {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-12">
            {/* Background effects */}
            <div className="fixed inset-0 bg-mesh opacity-30 pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-md">
                {/* Card */}
                <div className="glass-accent rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative">
                    {/* Decorative gradients */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
                    <div className="absolute -top-32 -left-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>

                    <div className="p-8 relative z-10">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-8">
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25"></div>
                                <div className="relative p-2 bg-[#0c0d10] border border-white/10 rounded-lg">
                                    <ShieldCheck className="h-5 w-5 text-blue-400" />
                                </div>
                            </div>
                            <span className="text-xl font-extrabold font-brand tracking-tight-brand text-white">
                                PharmaTrace
                            </span>
                        </div>

                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                            {success ? 'Password Reset!' : 'Set New Password'}
                        </h1>
                        <p className="text-zinc-400 mb-8">
                            {success
                                ? 'Your password has been updated successfully'
                                : 'Choose a strong password for your account'}
                        </p>

                        {/* Error */}
                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
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
                                    <p className="text-zinc-300 text-sm leading-relaxed">
                                        Your password has been reset. You can now sign in with your new password.
                                    </p>
                                </div>

                                <Button
                                    variant="primary"
                                    onClick={() => window.location.href = '/'}
                                    className="w-full text-lg shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                                >
                                    Go to Sign In
                                </Button>
                            </div>
                        ) : (
                            /* Form */
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-4 animate-fade-in">
                                    {/* New Password */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-zinc-300">New Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                                            <Input
                                                type={showPasswords.new ? 'text' : 'password'}
                                                required
                                                className="pl-12 pr-12"
                                                placeholder="At least 8 characters"
                                                value={formData.newPassword}
                                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                            >
                                                {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                        {formData.newPassword && !isNewValid && (
                                            <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                                                <AlertTriangle className="h-3 w-3" />
                                                Must be at least 8 characters
                                            </p>
                                        )}
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-zinc-300">Confirm Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                                            <Input
                                                type={showPasswords.confirm ? 'text' : 'password'}
                                                required
                                                className="pl-12 pr-12"
                                                placeholder="Re-enter new password"
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                            >
                                                {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                        {formData.confirmPassword && !isMatch && (
                                            <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                                                <AlertTriangle className="h-3 w-3" />
                                                Passwords do not match
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={loading || !isFormValid}
                                        className="w-full text-lg shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                                    >
                                        {loading ? (
                                            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                                        ) : (
                                            'Reset Password'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
