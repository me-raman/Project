import React, { useState } from 'react';
import { X, User, Building2, Truck, ArrowRight, Loader2, Phone, MapPin, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button, Input } from './ui';

export const SignUp = ({ onClose, onLoginClick, onRegisterSuccess }) => {
    const [step, setStep] = useState(1);
    const [role, setRole] = useState('');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        phoneNumber: ''
    });
    const [error, setError] = useState('');

    const roles = [
        { id: 'Manufacturer', icon: Building2, label: 'Manufacturer', desc: 'Drug production & compliance', color: 'blue' },
        { id: 'Distributor', icon: Truck, label: 'Distributor', desc: 'Supply chain & logistics', color: 'purple' },
        { id: 'Customer', icon: User, label: 'Customer', desc: 'Purchase & verification', color: 'cyan' }
    ];

    const handleRoleSelect = (selectedRole) => {
        setRole(selectedRole);
        setStep(2);
        setError('');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phoneNumber') {
            if (!/^\d*$/.test(value)) {
                setError('Only numbers are allowed');
                return;
            }
        }
        setFormData({ ...formData, [name]: value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.phoneNumber.length !== 10) {
            setError('Please enter a valid 10-digit phone number.');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                role,
                companyName: formData.name,
                phoneNumber: formData.phoneNumber,
                location: role === 'Customer' ? 'Not Applicable' : formData.location,
                username: formData.phoneNumber
            };

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('userRole', data.role);
            sessionStorage.setItem('userName', data.name);

            if (onRegisterSuccess) {
                onRegisterSuccess(data);
            } else {
                onClose();
                window.location.reload();
            }

        } catch (err) {
            setError(err.message);
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
            <div className="relative z-10 w-full max-w-lg glass-purple rounded-3xl overflow-hidden shadow-2xl animate-scale-in border border-white/10">
                {/* Decorative gradients */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
                <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>

                <div className="p-8 relative z-10">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Create account</h2>
                            <p className="text-zinc-400">Join the pharmaceutical supply chain network</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${step === 1 ? 'glass-accent text-blue-400' : 'text-zinc-500'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-blue-500 text-white' : 'bg-zinc-700 text-zinc-400'}`}>1</div>
                            <span>Role</span>
                        </div>
                        <div className="w-4 h-px bg-zinc-700"></div>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${step === 2 ? 'glass-accent text-blue-400' : 'text-zinc-500'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-blue-500 text-white' : 'bg-zinc-700 text-zinc-400'}`}>2</div>
                            <span>Details</span>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2"></span>
                            {error}
                        </div>
                    )}

                    {/* Step 1: Role Selection */}
                    {step === 1 && (
                        <div className="space-y-3 animate-fade-in">
                            {roles.map((r) => (
                                <button
                                    key={r.id}
                                    onClick={() => handleRoleSelect(r.id)}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl glass hover:bg-white/5 transition-all text-left group border border-transparent hover:border-white/10"
                                >
                                    <div className={`p-3 rounded-xl bg-gradient-to-br shadow-inner ${
                                        r.color === 'blue' ? 'from-blue-500/20 to-blue-600/10 text-blue-400 border border-blue-500/20' :
                                        r.color === 'purple' ? 'from-purple-500/20 to-purple-600/10 text-purple-400 border border-purple-500/20' :
                                        'from-cyan-500/20 to-cyan-600/10 text-cyan-400 border border-cyan-500/20'
                                        }`}>
                                        <r.icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-white mb-0.5">{r.label}</div>
                                        <div className="text-sm text-zinc-400">{r.desc}</div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                        <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-white" />
                                    </div>
                                </button>
                            ))}

                            <div className="pt-6 text-center">
                                <p className="text-sm text-zinc-400">
                                    Already have an account?{' '}
                                    <button onClick={onLoginClick} className="text-blue-400 font-medium hover:text-blue-300">
                                        Sign in instead
                                    </button>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Details Form */}
                    {step === 2 && (
                        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-4 inline-block hover:bg-white/5 px-3 py-1.5 rounded-lg -ml-3"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to role selection
                            </button>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-300">
                                        {role === 'Customer' ? 'Full name' : 'Company name'}
                                    </label>
                                    <div className="relative group">
                                        {role === 'Customer' ? (
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                                        ) : (
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                                        )}
                                        <Input
                                            type="text"
                                            name="name"
                                            required
                                            className="pl-12"
                                            placeholder={role === 'Customer' ? "John Doe" : "Acme Corp"}
                                            value={formData.name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-300">Phone number</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
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

                                {role !== 'Customer' && (
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-zinc-300">Location</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                                            <Input
                                                type="text"
                                                name="location"
                                                required
                                                className="pl-12"
                                                placeholder="City, Country"
                                                value={formData.location}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                disabled={loading}
                                className="w-full text-lg mt-4 !bg-gradient-to-r !from-purple-600 !via-pink-500 !to-red-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        Complete Registration
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                )}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
