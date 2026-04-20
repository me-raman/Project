import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button, Card, Input } from '../components/ui';

export const ChangePassword = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (!token) window.location.href = '/';
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setMessage({ type: '', text: '' });
    };

    const toggleShow = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const isNewValid = formData.newPassword.length >= 8;
    const isMatch = formData.newPassword === formData.confirmPassword;
    const isFormValid = formData.currentPassword && isNewValid && isMatch;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch('/api/auth/update-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                })
            });

            // Handle potential non-JSON responses gracefully
            const contentType = response.headers.get("content-type");
            let data;
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                data = { message: 'Unexpected server response' };
            }

            if (response.ok) {
                setMessage({ type: 'success', text: 'Password updated successfully' });
                setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update password' });
            }
        } catch (err) {
            console.error('[UpdatePassword Error]', err);
            setMessage({ type: 'error', text: 'Network or server error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0E1A] pt-28 pb-20 px-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

            <div className="max-w-[800px] mx-auto relative z-10 animate-fade-in">
                {/* Back Button */}
                <div className="mb-6">
                    <button 
                        onClick={() => window.location.href = '/'}
                        className="flex items-center gap-2 text-zinc-500 hover:text-blue-400 transition-colors w-fit group"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back to Dashboard</span>
                    </button>
                </div>

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 mb-4">
                        <ShieldCheck className="h-8 w-8 text-blue-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">Change Password</h1>
                    <p className="text-zinc-400 mt-2">Update your account security credentials</p>
                </div>

                <div className="max-w-md mx-auto">
                    <Card className="!bg-white/[0.02] border-white/10 backdrop-blur-md p-8">
                        {message.text && (
                            <div className={`mb-6 p-4 rounded-xl border flex gap-3 animate-slide-down ${
                                message.type === 'success' 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}>
                                {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
                                <p className="text-sm font-medium">{message.text}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <PasswordField
                                label="Current Password"
                                name="currentPassword"
                                value={formData.currentPassword}
                                show={showPasswords.current}
                                onToggle={() => toggleShow('current')}
                                onChange={handleChange}
                                placeholder="Enter current password"
                            />

                            <div className="space-y-2">
                                <PasswordField
                                    label="New Password"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    show={showPasswords.new}
                                    onToggle={() => toggleShow('new')}
                                    onChange={handleChange}
                                    placeholder="Minimum 8 characters"
                                />
                                {formData.newPassword && !isNewValid && (
                                    <p className="text-xs text-red-400 flex items-center gap-1 animate-fade-in">
                                        <AlertCircle className="h-3 w-3" />
                                        Minimum 8 characters required
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <PasswordField
                                    label="Confirm New Password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    show={showPasswords.confirm}
                                    onToggle={() => toggleShow('confirm')}
                                    onChange={handleChange}
                                    placeholder="Re-enter new password"
                                />
                                {formData.confirmPassword && !isMatch && (
                                    <p className="text-xs text-red-400 flex items-center gap-1 animate-fade-in">
                                        <AlertCircle className="h-3 w-3" />
                                        Passwords do not match
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={loading || !isFormValid}
                                loading={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 py-6 text-lg font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    Update Password
                                    <ArrowRight className="h-5 w-5" />
                                </div>
                            </Button>
                        </form>
                    </Card>
                    
                    <div className="mt-8 text-center">
                        <button 
                            onClick={() => window.location.href = '/profile'}
                            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            Return to Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PasswordField = ({ label, name, value, show, onToggle, onChange, placeholder }) => {
    return (
        <div className="relative group">
            <Lock className="absolute left-4 top-[38px] h-5 w-5 text-zinc-500 group-focus-within:text-blue-400 transition-colors z-20" />
            <Input
                label={label}
                type={show ? "text" : "password"}
                name={name}
                required
                className="pl-12 pr-12 bg-black/40 border-white/5 focus:border-blue-500/50"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />
            <button
                type="button"
                onClick={onToggle}
                className="absolute right-4 top-[38px] text-zinc-500 hover:text-zinc-300 transition-colors z-20"
            >
                {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
        </div>
    );
};
