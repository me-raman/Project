import React, { useState } from 'react';
import { X, User, Building2, Truck, ArrowRight, Loader2, Phone, MapPin, CheckCircle2, ArrowLeft } from 'lucide-react';

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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg glass-purple rounded-2xl overflow-hidden shadow-2xl animate-scale-in">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="p-6 sm:p-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white">Create account</h2>
                        <p className="text-zinc-400 mt-1">Join the pharmaceutical supply chain network</p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-3 mb-6">
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
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
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
                                    className="w-full flex items-center gap-4 p-4 rounded-xl glass hover:bg-white/5 transition-all text-left group"
                                >
                                    <div className={`p-3 rounded-lg bg-gradient-to-br ${r.color === 'blue' ? 'from-blue-500/20 to-blue-600/10 text-blue-400' :
                                        r.color === 'purple' ? 'from-purple-500/20 to-purple-600/10 text-purple-400' :
                                            'from-cyan-500/20 to-cyan-600/10 text-cyan-400'
                                        }`}>
                                        <r.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-white">{r.label}</div>
                                        <div className="text-xs text-zinc-500">{r.desc}</div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-white transition-colors" />
                                </button>
                            ))}

                            <div className="pt-4 text-center">
                                <p className="text-sm text-zinc-500">
                                    Already have an account?{' '}
                                    <button onClick={onLoginClick} className="text-blue-400 font-medium hover:underline">
                                        Sign in
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
                                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-4"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to role selection
                            </button>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-300">
                                        {role === 'Customer' ? 'Full name' : 'Company name'}
                                    </label>
                                    <div className="relative">
                                        {role === 'Customer' ? (
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                                        ) : (
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                                        )}
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            className="w-full pl-10 pr-4 py-3 rounded-xl glass text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                            placeholder={role === 'Customer' ? "John Doe" : "Acme Corp"}
                                            value={formData.name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
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

                                {role !== 'Customer' && (
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-zinc-300">Location</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                                            <input
                                                type="text"
                                                name="location"
                                                required
                                                className="w-full pl-10 pr-4 py-3 rounded-xl glass text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                placeholder="City, Country"
                                                value={formData.location}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-semibold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-70"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        Create account
                                        <CheckCircle2 className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
