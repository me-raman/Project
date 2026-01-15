import React, { useState } from 'react';
import { X, User, Building2, Truck, ArrowRight, Loader2, Phone, MapPin, CheckCircle2, ArrowLeft } from 'lucide-react';

export const SignUp = ({ onClose, onLoginClick, onRegisterSuccess }) => {
    const [step, setStep] = useState(1); // 1: Role Selection, 2: Details
    const [role, setRole] = useState('');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '', // Maps to companyName for simplicity
        location: '',
        phoneNumber: ''
    });
    const [error, setError] = useState('');

    const roles = [
        { id: 'Manufacturer', icon: Building2, label: 'Manufacturer', desc: 'Drug production & compliance' },
        { id: 'Distributor', icon: Truck, label: 'Distributor', desc: 'Supply chain & logistics' },
        { id: 'Customer', icon: User, label: 'Customer', desc: 'Purchase & verification' }
    ];

    const handleRoleSelect = (selectedRole) => {
        setRole(selectedRole);
        setStep(2);
        setError('');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Enforce numeric only for phoneNumber
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
                username: formData.phoneNumber // Use phone as username for uniqueness
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

            // Success
            localStorage.setItem('token', data.token);
            localStorage.setItem('userRole', data.role);
            localStorage.setItem('userName', data.name);

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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative animate-slide-up flex flex-col md:flex-row">

                {/* Sidebar / Header */}
                <div className="bg-slate-950 p-8 md:w-1/3 border-r border-slate-800 flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Sign Up</h2>
                        <p className="text-slate-400 text-sm">Join the secure pharmaceutical network.</p>

                        <div className="mt-8 space-y-4">
                            <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${step === 1 ? 'bg-slate-800 shadow-md ring-1 ring-slate-700' : 'text-slate-500'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-600'}`}>1</div>
                                <span className="font-medium">Select Role</span>
                            </div>
                            <div className={`flex items-center gap-3 p-3 rounded-xl transition-all ${step === 2 ? 'bg-slate-800 shadow-md ring-1 ring-slate-700' : 'text-slate-500'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-600'}`}>2</div>
                                <span className="font-medium">Details</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="p-8 md:w-2/3 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-900/20 border border-red-500/20 text-red-400 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-lg font-semibold text-white mb-4">I am a...</h3>
                            <div className="grid gap-4">
                                {roles.map((r) => (
                                    <button
                                        key={r.id}
                                        onClick={() => handleRoleSelect(r.id)}
                                        className="group flex items-center gap-4 p-4 rounded-xl border border-slate-700 hover:border-blue-500 hover:ring-1 hover:ring-blue-500 hover:bg-blue-900/20 transition-all text-left"
                                    >
                                        <div className="p-3 bg-slate-800 rounded-lg group-hover:bg-blue-500/20 text-slate-400 group-hover:text-blue-400 transition-colors">
                                            <r.icon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white group-hover:text-blue-400">{r.label}</div>
                                            <div className="text-xs text-slate-400 group-hover:text-blue-300/80">{r.desc}</div>
                                        </div>
                                        <ArrowRight className="h-5 w-5 ml-auto text-slate-600 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100" />
                                    </button>
                                ))}
                            </div>
                            <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                                <p className="text-sm text-slate-500">
                                    Already have an account?{' '}
                                    <button onClick={onLoginClick} className="text-blue-400 font-bold hover:underline">
                                        Login
                                    </button>
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
                            <div className="flex items-start gap-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="mt-1 p-2 -ml-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-full transition-colors"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <span className="text-blue-400">{role}</span> Details
                                    </h3>
                                    <p className="text-slate-400 text-sm">Please fill in your information.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-300 ml-1">
                                        {role === 'Customer' ? 'Full Name' : 'Company Name'}
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            {role === 'Customer' ? (
                                                <User className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                            ) : (
                                                <Building2 className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder={role === 'Customer' ? "John Doe" : "Acme Corp"}
                                            value={formData.name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
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
                                            className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder=""
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {role !== 'Customer' && (
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-300 ml-1">Location</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <MapPin className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                type="text"
                                                name="location"
                                                required
                                                className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                placeholder="City, Country"
                                                value={formData.location}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/20 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-bold transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            Complete Registration
                                            <CheckCircle2 className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
