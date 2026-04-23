import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Package, CheckCircle, AlertCircle, Printer, Plus, Send, Lock, Users, ArrowLeft, Search } from 'lucide-react';
import { DashboardShell } from './layout/DashboardShell';
import { Button, Card, CardHeader, CardTitle, CardDescription, Input, Badge } from './ui';
import { LocationPermissionModal } from './ui/LocationPermissionModal';
import { useStrictLocation } from '../hooks/useStrictLocation';

export const ManufacturerDashboard = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        batchNumber: '',
        mfgDate: '',
        expDate: '',
        count: ''
    });
    const [batchResults, setBatchResults] = useState([]);
    const [recentBatches, setRecentBatches] = useState([]);
    const [batchMeta, setBatchMeta] = useState(null); // auditStatus, quantityLocked, declaredQuantity
    const [shipModal, setShipModal] = useState(null);
    const [shipLoading, setShipLoading] = useState(false);
    const [receivers, setReceivers] = useState([]);
    const [receiverRole, setReceiverRole] = useState('Distributor');
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedReceiver, setSelectedReceiver] = useState('');
    const { requestLocation, locationModal } = useStrictLocation();

    useEffect(() => {
        fetchRecentBatches();
    }, []);

    const fetchRecentBatches = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch('/api/product/manufacturer/recent', {
                headers: { 'x-auth-token': token }
            });
            if (response.ok) {
                const data = await response.json();
                setRecentBatches(data);
            }
        } catch (err) {
            console.error('Failed to fetch recent batches:', err);
        }
    };
    const fetchReceivers = async (role) => {
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`/api/auth/users-by-role/${role}`, {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setReceivers(data);
            }
        } catch (err) {
            console.error(`Failed to fetch ${role}s:`, err);
        }
    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        const updated = { ...formData, [name]: value };

        // If manufacture date changes and is now after expiry date, clear expiry
        if (name === 'mfgDate' && updated.expDate && value > updated.expDate) {
            updated.expDate = '';
        }

        setFormData(updated);
        setError('');
        setSuccess(false);
    };

    const handleBatchSubmit = async (e) => {
        e.preventDefault();

        // Validate expiry date is after manufacture date
        if (formData.mfgDate && formData.expDate && formData.expDate <= formData.mfgDate) {
            setError('Expiry date must be after the manufacturing date');
            return;
        }

        // Gate: require live GPS before proceeding
        requestLocation(async ({ latitude, longitude }) => {
            setLoading(true);
            setError('');
            setSuccess(false);

            try {
                const token = sessionStorage.getItem('token');
                const response = await fetch('/api/product/batch', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    },
                    body: JSON.stringify({ ...formData, latitude, longitude })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Failed to register batch');

                setSuccess(true);
                setBatchResults(data.products);
                setBatchMeta({
                    auditStatus: data.auditStatus,
                    quantityLocked: data.quantityLocked,
                    declaredQuantity: data.declaredQuantity
                });
                setLoading(false);
                fetchRecentBatches();
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        });
    };

    const handlePrint = () => {
        const printWindow = document.createElement('iframe');
        printWindow.style.position = 'absolute';
        printWindow.style.top = '-1000px';
        printWindow.style.left = '-1000px';
        document.body.appendChild(printWindow);

        const printDocument = printWindow.contentDocument || printWindow.contentWindow.document;

        // Get all QR code SVG elements and labels
        const qrElements = Array.from(document.querySelectorAll('.printable-qr-grid > div'));

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Labels - PharmaTrace</title>
                <style>
                    body {
                        margin: 0;
                        padding: 10px;
                    }
                    .grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 20px;
                    }
                    .card {
                        border: 1px solid #ccc;
                        border-radius: 8px;
                        padding: 10px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        page-break-inside: avoid;
                    }
                    /* Ensure SVGs render properly */
                    svg {
                        width: 100%;
                        height: auto;
                        max-width: 100px;
                        display: block;
                    }
                </style>
            </head>
            <body>
                <div class="grid">
                    ${qrElements.map(el => {
            const svg = el.querySelector('svg').outerHTML;
            return `
                            <div class="card">
                                ${svg}
                            </div>
                        `;
        }).join('')}
                </div>
            </body>
            </html>
        `;

        printDocument.open();
        printDocument.write(html);
        printDocument.close();

        // Wait for rendering then print
        setTimeout(() => {
            printWindow.contentWindow.focus();
            printWindow.contentWindow.print();

            // Clean up after print dialog closes
            setTimeout(() => {
                document.body.removeChild(printWindow);
            }, 1000);
        }, 250);
    };

    const resetForm = () => {
        setBatchResults([]);
        setSuccess(false);
        setFormData({ name: '', batchNumber: '', mfgDate: '', expDate: '', count: '' });
        fetchRecentBatches();
    };

    return (
        <>
        <LocationPermissionModal {...locationModal} />
        <DashboardShell
            title="Create New Batch"
            description="Generate QR codes for your medicine batch"
            icon={Package}
            actions={batchResults.length > 0 && (
                <div className="flex gap-2">
                    <button
                        onClick={resetForm}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all group"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                        Back to Dashboard
                    </button>
                    <Button variant="secondary" onClick={resetForm}>
                        <Plus className="h-4 w-4 mr-2" />
                        New batch
                    </Button>
                    <Button onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print labels
                    </Button>
                </div>
            )}
        >
            {/* Welcome Card */}
            <div className="mb-6 animate-slide-down delay-100">
                <Card className="!bg-[#0A0E1A] border-white/5 relative overflow-hidden p-8">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <Badge variant="info" className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1 uppercase tracking-widest text-[10px] font-bold">Manufacturer Portal</Badge>
                            <h2 className="text-3xl font-bold text-white mb-2">Welcome back, {sessionStorage.getItem('userName')}</h2>
                            <p className="text-zinc-500 max-w-md leading-relaxed">System authenticated. Monitor your production batches and manage secure assets across the supply chain.</p>
                        </div>
                        
                        <div className="flex items-center bg-white/[0.02] p-6 rounded-2xl border border-white/5 shadow-inner">
                            <div className="text-center px-6">
                                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1.5 opacity-70">Total batches created</p>
                                <p className="text-3xl font-black text-white leading-none">{recentBatches.length}</p>
                            </div>
                            <div className="w-px h-12 bg-white/5 mx-2"></div>
                            <div className="text-center px-6">
                                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1.5 opacity-70">Total QR Codes Generated</p>
                                <p className="text-3xl font-black text-white leading-none">
                                    {recentBatches.reduce((acc, batch) => acc + (batch.unitCount || 0), 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Account Status Banner */}
            <div className="mb-8 animate-fade-in delay-200">
                {sessionStorage.getItem('licenceStatus') === 'Verified' && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-medium text-emerald-400">
                            Licence Verified ✓ <span className="text-zinc-500 font-mono ml-2">{sessionStorage.getItem('licenceNumber')}</span>
                        </span>
                    </div>
                )}
                {sessionStorage.getItem('licenceStatus') === 'Pending' && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 w-fit">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium text-amber-400">
                            Licence Pending Verification
                        </span>
                    </div>
                )}
                {sessionStorage.getItem('licenceStatus') === 'Rejected' && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 w-fit">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-red-400">
                            Licence Rejected — Contact Support
                        </span>
                    </div>
                )}
            </div>
            {/* Status Messages */}
            {success && (
                <Card className="border-green-800 bg-green-900/20">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        <div>
                            <p className="font-medium text-zinc-100">Batch registered successfully</p>
                            <p className="text-sm text-zinc-400">
                                {batchResults.length} products created
                                {batchMeta?.quantityLocked && (
                                    <span className="ml-2"><Lock className="h-3 w-3 inline" /> Quantity locked at {batchMeta.declaredQuantity}</span>
                                )}
                            </p>
                        </div>
                    </div>
                    {batchMeta?.auditStatus === 'PENDING_AUDIT' && (
                        <div className="mt-2 p-2 rounded-lg bg-amber-900/30 border border-amber-500/20">
                            <p className="text-sm text-amber-300">⚠ This batch has been randomly selected for audit. Products will be available after admin review.</p>
                        </div>
                    )}
                </Card>
            )}

            {error && (
                <Card className="border-red-800 bg-red-900/20">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <p className="text-zinc-100">{error}</p>
                    </div>
                </Card>
            )}

            {/* Results View */}
            {batchResults.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Generated product IDs</CardTitle>
                        <CardDescription>{batchResults.length} products ready for labeling</CardDescription>
                    </CardHeader>

                    <div className="printable-qr-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[500px] overflow-y-auto">
                        {batchResults.map((prod, idx) => (
                            <div
                                key={idx}
                                className="bg-zinc-800/50 p-3 rounded-lg flex flex-col items-center text-center"
                            >
                                <div className="bg-white p-2 rounded mb-2">
                                    <QRCode
                                        size={72}
                                        value={`${window.location.origin}/verify/${encodeURIComponent(prod.qrPayload || prod.productId)}`}
                                        style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                                        viewBox="0 0 256 256"
                                    />
                                </div>
                                <span className="text-xs font-mono text-zinc-400 truncate w-full">
                                    {prod.productId}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            ) : (
                /* Form View */
                <Card>
                    <CardHeader>
                        <CardTitle>Batch Information</CardTitle>
                        <CardDescription>Enter product information to generate secure cryptographic QR codes</CardDescription>
                    </CardHeader>

                    <form onSubmit={handleBatchSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Product name"
                                name="name"
                                placeholder="e.g. Amoxicillin 500mg"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                            <Input
                                label="Batch number"
                                name="batchNumber"
                                placeholder="e.g. BATCH-2024-001"
                                value={formData.batchNumber}
                                onChange={handleChange}
                                required
                            />
                            <Input
                                label="Manufacturing date"
                                name="mfgDate"
                                type="date"
                                value={formData.mfgDate}
                                onChange={handleChange}
                                min={new Date().toISOString().split('T')[0]}
                                required
                            />
                            <Input
                                label="Expiry date"
                                name="expDate"
                                type="date"
                                value={formData.expDate}
                                onChange={handleChange}
                                min={formData.mfgDate || undefined}
                                required
                            />
                        </div>

                        <Input
                            label="Quantity"
                            name="count"
                            type="text"
                            inputMode="numeric"
                            placeholder="Number of units to generate"
                            value={formData.count ? parseInt(formData.count).toLocaleString() : ''}
                            onChange={(e) => {
                                const raw = e.target.value.replace(/[^0-9]/g, '');
                                if (!raw) {
                                    handleChange({ target: { name: 'count', value: '' } });
                                    return;
                                }
                                const num = Math.min(parseInt(raw, 10), 1000000);
                                handleChange({ target: { name: 'count', value: String(num) } });
                            }}
                            required
                        />


                        <div className="flex justify-end pt-2">
                            <Button type="submit" loading={loading} size="lg">
                                {loading ? 'Generating...' : 'Generate QR codes'}
                            </Button>
                        </div>
                    </form>
                    {/* Recent Batches List */}
                    {recentBatches.length > 0 && (
                        <div className="mt-8 animate-fade-in">
                            <h3 className="text-lg font-medium text-white mb-4">Recent Batches</h3>
                            <div className="space-y-3">
                                {recentBatches.map((batch) => (
                                    <div key={batch._id} className="p-4 rounded-xl bg-zinc-800/50 border border-white/5 flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-zinc-200">{batch.name}</p>
                                            <p className="text-xs text-zinc-500 font-mono">
                                                {batch.batchNumber} &middot; {batch.unitCount} units
                                                {batch.quantityLocked && <span className="text-amber-400 ml-1"><Lock className="h-3 w-3 inline" /> Locked</span>}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {batch.currentStatus === 'Manufactured' && (
                                                <Button
                                                    variant="secondary"
                                                    onClick={async () => {
                                                        const role = 'Distributor';
                                                        setReceiverRole(role);
                                                        setSearchQuery('');
                                                        setSelectedReceiver('');
                                                        setShipModal(batch);
                                                        await fetchReceivers(role);
                                                    }}
                                                >
                                                    <Send className="h-3 w-3 mr-1" />
                                                    Ship
                                                </Button>
                                            )}
                                            <div className="text-right">
                                                <Badge variant={
                                                    batch.currentStatus === 'Manufactured' ? 'info' : 
                                                    batch.currentStatus === 'Pending Confirmation' ? 'warning' :
                                                    'success'
                                                }>
                                                    {batch.currentStatus || 'Manufactured'}
                                                </Badge>
                                                <p className="text-xs text-zinc-500 mt-1">
                                                    {new Date(batch.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            )}
        </DashboardShell>

        {/* Ship Modal */}
        {shipModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                <Card className="w-full max-w-md mx-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <Send className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-100">Ship Products</h3>
                            <p className="text-sm text-zinc-400">{shipModal.name} · Batch: {shipModal.batchNumber}</p>
                        </div>
                    </div>
                    <p className="text-sm text-zinc-400 mb-4">
                        Select the recipient you are shipping to. They must confirm receipt before the product status updates.
                    </p>

                    {/* Ship To Role Toggle */}
                    <div className="mb-4">
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
                            Ship To
                        </label>
                        <div className="flex p-1 bg-zinc-900 rounded-xl border border-white/5">
                            {['Distributor', 'Pharmacy'].map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => {
                                        setReceiverRole(role);
                                        setSelectedReceiver('');
                                        fetchReceivers(role);
                                    }}
                                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                                        receiverRole === role 
                                            ? 'bg-blue-500 text-white shadow-lg' 
                                            : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                                >
                                    {role === 'Pharmacy' ? 'Pharmacies' : `${role}s`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Receiver Selector with Search */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            <Users className="h-4 w-4 inline mr-1" />
                            Select {receiverRole} *
                        </label>
                        
                        <div className="space-y-3">
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder={`Search ${receiverRole.toLowerCase()} by name or location...`}
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        // Clear selection when search changes so user picks from filtered list
                                        if (e.target.value !== searchQuery) {
                                            setSelectedReceiver('');
                                        }
                                    }}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                />
                            </div>

                            {receivers.length === 0 ? (
                                <p className="text-sm text-zinc-500 italic py-2">Loading receivers...</p>
                            ) : (() => {
                                const filtered = receivers.filter(d => {
                                    if (!searchQuery.trim()) return true;
                                    const search = searchQuery.toLowerCase();
                                    return d.companyName.toLowerCase().includes(search) || 
                                           d.location.toLowerCase().includes(search);
                                });

                                if (filtered.length === 0) {
                                    return (
                                        <div className="py-4 text-center rounded-xl bg-zinc-900/50 border border-white/5">
                                            <p className="text-sm text-zinc-500">No {receiverRole.toLowerCase()}s found matching "<span className="text-zinc-300">{searchQuery}</span>"</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="max-h-48 overflow-y-auto rounded-xl border border-white/5 bg-zinc-900/50 divide-y divide-white/5 custom-scrollbar">
                                        {filtered.map((d) => (
                                            <button
                                                key={d._id}
                                                type="button"
                                                onClick={() => setSelectedReceiver(d._id)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/5 ${
                                                    selectedReceiver === d._id 
                                                        ? 'bg-blue-500/10 border-l-2 border-l-blue-500' 
                                                        : 'border-l-2 border-l-transparent'
                                                }`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                                    selectedReceiver === d._id 
                                                        ? 'bg-blue-500 text-white' 
                                                        : 'bg-zinc-800 text-zinc-400'
                                                }`}>
                                                    {d.companyName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`text-sm font-medium truncate ${
                                                        selectedReceiver === d._id ? 'text-blue-300' : 'text-zinc-200'
                                                    }`}>
                                                        {d.companyName}
                                                    </p>
                                                    <p className="text-xs text-zinc-500 truncate">{d.location}</p>
                                                </div>
                                                {selectedReceiver === d._id && (
                                                    <CheckCircle className="h-4 w-4 text-blue-400 ml-auto shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => { setShipModal(null); setSelectedReceiver(''); }}>Cancel</Button>
                        <Button
                            loading={shipLoading}
                            disabled={!selectedReceiver}
                            onClick={() => {
                                // Gate: require live GPS before shipping
                                requestLocation(async ({ latitude, longitude }) => {
                                    setShipLoading(true);
                                    try {
                                        const token = sessionStorage.getItem('token');
                                        const res = await fetch('/api/track/ship-batch', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                                            body: JSON.stringify({
                                                batchNumber: shipModal.batchNumber,
                                                receiverId: selectedReceiver,
                                                notes: `Shipped batch ${shipModal.batchNumber}`,
                                                latitude,
                                                longitude
                                            })
                                        });
                                        const data = await res.json();
                                        if (!res.ok) throw new Error(data.message || 'Failed to ship batch');
                                        setShipModal(null);
                                        setSelectedReceiver('');
                                        fetchRecentBatches();
                                    } catch (err) {
                                        setError(err.message);
                                    } finally {
                                        setShipLoading(false);
                                    }
                                });
                            }}
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Confirm Ship
                        </Button>
                    </div>
                </Card>
            </div>
        )}
    </>
    );
};
