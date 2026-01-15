import React, { useState } from 'react';
import { X, Phone, KeyRound, ArrowRight, Loader2, UserPlus } from 'lucide-react';

export const Login = ({ onClose, onLoginSuccess, onSignUpClick }) => {
    const [step, setStep] = useState('phone'); // 'phone' or 'otp'
    const [formData, setFormData] = useState({
        phoneNumber: '',
        otp: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [flashSignUp, setFlashSignUp] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Enforce numeric only for phoneNumber and otp
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
            // Check if phone number exists
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

            // Send OTP via API
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative animate-slide-up">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="p-8 pt-10">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 mb-4 border border-blue-500/20">
                            {step === 'phone' ? <Phone className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
                        </div>
                        <h2 className="text-2xl font-bold text-white">
                            {step === 'phone' ? 'Welcome Back' : 'Enter OTP'}
                        </h2>
                        <p className="text-slate-400 mt-2">
                            {step === 'phone'
                                ? 'Sign in with your registered phone number'
                                : `Verify code sent to ${formData.phoneNumber}`}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2"></span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={step === 'phone' ? handleSendOTP : handleVerifyOTP} className="space-y-5">

                        {step === 'phone' && (
                            <div className="space-y-1 animate-fade-in">
                                <label className="text-sm font-medium text-slate-300 ml-1">Phone Number</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        required
                                        maxLength="10"
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl leading-5 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        placeholder=""
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        )}

                        {step === 'otp' && (
                            <div className="space-y-1 animate-fade-in">
                                <label className="text-sm font-medium text-slate-300 ml-1">One-Time Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <KeyRound className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        name="otp"
                                        required
                                        maxLength="6"
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl leading-5 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all tracking-widest text-lg font-bold"
                                        placeholder="000000"
                                        value={formData.otp}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="flex justify-end mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep('phone')}
                                        className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                                    >
                                        Change Phone Number
                                    </button>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/20 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-bold transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    {step === 'phone' ? 'Send OTP' : 'Verify & Sign In'}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {step === 'phone' && (
                        <div className="mt-6 flex flex-col gap-3">
                            <button
                                onClick={onSignUpClick}
                                className={`w-full py-3 px-4 border border-slate-700 rounded-xl text-slate-400 font-medium hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group ${flashSignUp ? 'ring-2 ring-blue-500/50 border-blue-500/50 text-blue-400 bg-blue-900/20 shadow-md transform scale-[1.02]' : ''
                                    }`}
                            >
                                <UserPlus className={`h-4 w-4 text-slate-500 group-hover:text-blue-400 transition-colors ${flashSignUp ? 'text-blue-400' : ''}`} />
                                {flashSignUp ? 'Create Account for this Number' : 'New User? Sign Up'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
