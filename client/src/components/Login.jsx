import React, { useState } from 'react';
import { X, Phone, KeyRound, ArrowRight, Loader2, UserPlus, Info } from 'lucide-react';
import { Button, Input } from './ui';

export const Login = ({ onClose, onLoginSuccess, onSignUpClick }) => {
    const [step, setStep] = useState('phone');
    const [formData, setFormData] = useState({
        phoneNumber: '',
        otp: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [flashSignUp, setFlashSignUp] = useState(false);
    const [displayOtp, setDisplayOtp] = useState(''); 

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
        setDisplayOtp('');

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

            const otpData = await otpResponse.json();

            if (!otpResponse.ok) {
                throw new Error('Failed to send OTP');
            }

            if (otpData.otp) {
                setDisplayOtp(otpData.otp);
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
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('userRole', data.role);
                sessionStorage.setItem('userName', data.name);
                sessionStorage.setItem('userId', data.userId);

                if (onLoginSuccess) {
                    onLoginSuccess(data);
                } else {
                    onClose();
                    window.location.reload();
                }
            } else {
                setError(data.message || 'Invalid OTP');
            }
        } catch {
            setError('Failed to verify OTP');
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
                    <form onSubmit={step === 'phone' ? handleSendOTP : handleVerifyOTP} className="space-y-5">
                        {step === 'phone' && (
                            <div className="space-y-1.5 animate-fade-in">
                                <label className="text-sm font-medium text-zinc-300">Phone number</label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                                    <Input
                                        type="tel"
                                        name="phoneNumber"
                                        required
                                        maxLength="10"
                                        className="pl-12"
                                        placeholder="10-digit number"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        )}

                        {step === 'otp' && (
                            <div className="space-y-4 animate-fade-in">
                                {displayOtp && (
                                    <div className="p-4 rounded-xl glass-accent flex items-start gap-3">
                                        <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-blue-400">Dev Mode: Your OTP</p>
                                            <p className="text-2xl font-bold text-white tracking-widest mt-1">{displayOtp}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-300">One-time password</label>
                                    <div className="relative group">
                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                                        <Input
                                            type="text"
                                            name="otp"
                                            required
                                            maxLength="6"
                                            className="pl-12 tracking-widest text-lg font-bold text-center"
                                            placeholder="000 000"
                                            value={formData.otp}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setStep('phone')}
                                        className="text-sm text-blue-400 hover:text-blue-300 font-medium mt-3"
                                    >
                                        Change phone number
                                    </button>
                                </div>
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading}
                            className="w-full text-lg mt-4 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    {step === 'phone' ? 'Send Access Code' : 'Secure Login'}
                                    <ArrowRight className="h-5 w-5" />
                                </div>
                            )}
                        </Button>
                    </form>

                    {/* Sign up link */}
                    {step === 'phone' && (
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
                    )}
                </div>
            </div>
        </div>
    );
};
