import React, { useState } from 'react';
import { X, Phone, KeyRound, ArrowRight, Loader2, UserPlus } from 'lucide-react';

export const Login = ({ onClose, onLoginSuccess, onSignUpClick }) => {
    const [step, setStep] = useState('phone');
    const [formData, setFormData] = useState({
        phoneNumber: '',
        otp: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [flashSignUp, setFlashSignUp] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phoneNumber' || name === 'otp') {
            if (!/^\d*$/.test(value)) {
                setError('Only numbers are allowed');
                return;
            }
        }
        setFormData({ ...formData, [name]: value });
        setError('');
        if (name === 'phoneNumber') setFlashSignUp(false);
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setFlashSignUp(false);

        if (formData.phoneNumber.length !== 10) {
            setError('Please enter a valid 10-digit phone number.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/check-phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: formData.phoneNumber })
            });

            const data = await response.json();

            if (!data.exists) {
                setError('Account does not exist.');
                setFlashSignUp(true);
                setLoading(false);
                return;
            }

            const otpResponse = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: formData.phoneNumber })
            });

            if (!otpResponse.ok) {
                throw new Error('Failed to send OTP');
            }

            setStep('otp');
            setLoading(false);

        } catch (err) {
            setError(err.message || 'Failed to connect to server');
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userRole', data.role);
                localStorage.setItem('userName', data.name);
                localStorage.setItem('userId', data.userId);

                if (onLoginSuccess) {
                    onLoginSuccess(data);
                } else {
                    onClose();
                    window.location.reload();
                }
            } else {
                setError(data.message || 'Invalid OTP');
            }
        } catch (err) {
            setError('Failed to verify OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-md glass-purple rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="p-6 sm:p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400 mb-4 border border-blue-500/20">
                            {step === 'phone' ? <Phone className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
                        </div>
                        <h2 className="text-2xl font-bold text-white">
                            {step === 'phone' ? 'Welcome back' : 'Enter OTP'}
                        </h2>
                        <p className="text-zinc-400 mt-2">
                            {step === 'phone'
                                ? 'Sign in with your phone number'
                                : `Code sent to ${formData.phoneNumber}`}
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2"></span>
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={step === 'phone' ? handleSendOTP : handleVerifyOTP} className="space-y-5">
                        {step === 'phone' && (
                            <div className="space-y-1.5 animate-fade-in">
                                <label className="text-sm font-medium text-zinc-300">Phone number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        required
                                        maxLength="10"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl glass text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        placeholder="10-digit number"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        )}

                        {step === 'otp' && (
                            <div className="space-y-1.5 animate-fade-in">
                                <label className="text-sm font-medium text-zinc-300">One-time password</label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                                    <input
                                        type="text"
                                        name="otp"
                                        required
                                        maxLength="6"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl glass text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 tracking-widest text-lg font-bold text-center"
                                        placeholder="000000"
                                        value={formData.otp}
                                        onChange={handleChange}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setStep('phone')}
                                    className="text-xs text-blue-400 hover:text-blue-300 font-medium mt-2"
                                >
                                    Change phone number
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-semibold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-70"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    {step === 'phone' ? 'Send OTP' : 'Verify & sign in'}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Sign up link */}
                    {step === 'phone' && (
                        <div className="mt-6">
                            <button
                                onClick={onSignUpClick}
                                className={`w-full py-3 px-4 rounded-xl text-zinc-400 font-medium transition-all flex items-center justify-center gap-2 ${flashSignUp
                                        ? 'glass-accent text-blue-400 border-blue-500/30'
                                        : 'glass hover:bg-white/5'
                                    }`}
                            >
                                <UserPlus className="h-4 w-4" />
                                {flashSignUp ? 'Create account' : 'New user? Sign up'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
