import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, CheckCircle, AlertCircle, Package, Truck, Calendar, Clock, Inbox, ThumbsUp, ThumbsDown, PlusSquare, QrCode, Send } from 'lucide-react';
import { Scanner } from './Scanner';
import { DashboardShell } from './layout/DashboardShell';
import { Button, Card, CardHeader, CardTitle, CardDescription, Input, Select, Textarea, Badge } from './ui';
import { LocationPermissionModal } from './ui/LocationPermissionModal';
import { useStrictLocation } from '../hooks/useStrictLocation';

export const PharmacyDashboard = () => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    const [error, setError] = useState(null);
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [recentActivity, setRecentActivity] = useState([]);
    const [pendingHandoffs, setPendingHandoffs] = useState([]);
    const [handoffLoading, setHandoffLoading] = useState(null);
    const [disputeReason, setDisputeReason] = useState('');
    const [disputeProductId, setDisputeProductId] = useState(null);
    const [scannedBatches, setScannedBatches] = useState([]);
    const [showHandoffScanner, setShowHandoffScanner] = useState(false);
    const [scanError, setScanError] = useState(null);
    const { requestLocation, locationModal } = useStrictLocation();

    useEffect(() => {
        fetchHistory();
        fetchPendingHandoffs();
    }, []);

    const fetchHistory = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch('/api/track/my-activity', {
                headers: { 'x-auth-token': token }
            });
            if (response.ok) {
                const data = await response.json();
                setRecentActivity(data);
            }
        } catch (err) {
            console.error('Failed to fetch activity:', err);
        }
    };

    const fetchPendingHandoffs = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch('/api/track/pending', {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setPendingHandoffs(data.handoffs || []);
            }
        } catch (err) {
            console.error('Failed to fetch pending handoffs:', err);
        }
    };

    const handleConfirmHandoff = async (batchNumber) => {
        // Gate: require live GPS before confirming receipt
        requestLocation(async ({ latitude, longitude }) => {
            setHandoffLoading(batchNumber);
            try {
                const token = sessionStorage.getItem('token');
                const res = await fetch(`/api/track/confirm-batch/${encodeURIComponent(batchNumber)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                    body: JSON.stringify({ notes: 'Confirmed receipt at pharmacy', latitude, longitude })
                });
                if (res.ok) {
                    fetchPendingHandoffs();
                    fetchHistory();
                } else {
                    const data = await res.json();
                    setError(data.message);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setHandoffLoading(null);
            }
        });
    };

    const handleDisputeHandoff = async (batchNumber) => {
        if (!disputeReason) { setError('Please enter a dispute reason'); return; }
        setHandoffLoading(batchNumber);
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`/api/track/dispute-batch/${encodeURIComponent(batchNumber)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ reason: disputeReason })
            });
            if (res.ok) {
                setDisputeReason('');
                setDisputeProductId(null);
                fetchPendingHandoffs();
                fetchHistory();
            } else {
                const data = await res.json();
                setError(data.message);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setHandoffLoading(null);
        }
    };

    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [canUpdate, setCanUpdate] = useState(false);
    const [updateStatus, setUpdateStatus] = useState('');
    const [updateNotes, setUpdateNotes] = useState('');

    const handleUpdateSubmit = async () => {
        if (!updateStatus) return;

        // Gate: require live GPS before updating tracking
        requestLocation(async ({ latitude, longitude }) => {
            setLoading(true);
            try {
                const token = sessionStorage.getItem('token');
                const res = await fetch(`/api/track/${verificationResult.product.productId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token
                    },
                    body: JSON.stringify({
                        status: updateStatus,
                        notes: updateNotes,
                        latitude,
                        longitude
                    })
                });

                if (!res.ok) throw new Error('Failed to update status');

                setVerificationResult(null);
                setUpdateSuccess(true);
                setShowUpdateForm(false);
                setUpdateStatus('');
                setUpdateNotes('');
                fetchHistory();
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        });
    };

    const extractProductId = (rawValue) => {
        if (!rawValue || !rawValue.includes('.')) return rawValue;
        const lastDotIndex = rawValue.lastIndexOf('.');
        const possibleSig = rawValue.substring(lastDotIndex + 1);
        if (possibleSig.length === 16 && /^[0-9a-f]+$/i.test(possibleSig)) {
            return rawValue.substring(0, lastDotIndex);
        }
        return rawValue;
    };

    const executeSearch = async (id) => {
        setLoading(true);
        setVerificationResult(null);
        setError(null);
        setUpdateSuccess(false);
        setShowUpdateForm(false);

        try {
            const productId = extractProductId(id);
            const response = await fetch(`/api/product/${encodeURIComponent(productId)}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Product not found');

            const product = data.product;
            const history = data.history || [];
            
            const isAuthentic = product && product.manufacturer && history.length > 0;

            const currentUserId = sessionStorage.getItem('userId');
            if (history.some(h => h.handler && h.handler._id === currentUserId && h.status === 'Received at Pharmacy')) {
                throw new Error('You have already processed this product as received');
            }

            setVerificationResult({ isAuthentic, product, history });
            setQuery(productId);
            setCanUpdate(isAuthentic);
        } catch (err) {
            setError(err.message);
            setQuery('');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) executeSearch(query);
    };

    const handleHandoffScan = async (decodedText) => {
        setShowHandoffScanner(false);
        setScanError(null);

        try {
            const productId = extractProductId(decodedText);
            const token = sessionStorage.getItem('token');
            const res = await fetch(`/api/product/${encodeURIComponent(productId)}`, {
                headers: { 'x-auth-token': token }
            });
            if (!res.ok) throw new Error('Product not found');
            const data = await res.json();
            const scannedBatch = data.product?.batchNumber;

            if (!scannedBatch) {
                setScanError('Could not determine batch number from scanned product');
                return;
            }

            const match = pendingHandoffs.find(h =>
                (h.batchNumber || h.product?.batchNumber) === scannedBatch
            );

            if (match) {
                const batchKey = match.batchNumber || match.product?.batchNumber;
                if (!scannedBatches.includes(batchKey)) {
                    setScannedBatches(prev => [...prev, batchKey]);
                }
            } else {
                setScanError('This batch is not assigned to you');
            }
        } catch (err) {
            setScanError(err.message || 'Failed to verify scanned QR code');
        }
    };

    const statusOptions = [
        { value: 'Received at Pharmacy', label: 'Received at pharmacy' },
        { value: 'Dispensed', label: 'Dispensed to patient' }
    ];

    return (
        <>
        <LocationPermissionModal {...locationModal} />
        <DashboardShell
            title="Pharmacy Portal"
            description="Verify and manage pharmaceutical inventory"
            icon={PlusSquare}
        >
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-down delay-100">
                <Card className="col-span-1 md:col-span-2 !bg-gradient-to-br !from-emerald-900/40 !to-teal-900/40 border-emerald-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="relative z-10 p-2">
                        <Badge variant="success" className="mb-3">Pharmacy Portal</Badge>
                        <h2 className="text-2xl font-bold text-white mb-2">Welcome back, {sessionStorage.getItem('userName')}</h2>
                        <p className="text-zinc-400">Verify medication authenticity and manage patient dispensing.</p>
                    </div>
                </Card>
                <Card className="!bg-gradient-to-br !from-blue-900/30 !to-indigo-900/30 border-blue-500/20 relative overflow-hidden flex items-center justify-center text-center">
                    <div className="relative z-10 p-2">
                        <div className="mx-auto w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-3">
                            <Inbox className="h-6 w-6 text-blue-400" />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">
                            {pendingHandoffs.length}
                        </h3>
                        <p className="text-zinc-400 text-sm">Incoming Shipments</p>
                    </div>
                </Card>
            </div>

            <Card padding="md">
                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Enter product ID to verify"
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <Button type="submit" loading={loading} className="bg-emerald-600 hover:bg-emerald-500">
                        Verify
                    </Button>
                </form>
                <p className="text-xs text-zinc-500 mt-2">Can’t scan QR? Type the product ID above to verify manually.</p>
            </Card>

            {/* Scan Error Banner */}
            {scanError && (
                <Card className="border-red-800 bg-red-900/20 animate-shake">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                            <div>
                                <p className="font-medium text-zinc-100">Scan Failed</p>
                                <p className="text-sm text-zinc-400">{scanError}</p>
                            </div>
                        </div>
                        <Button variant="secondary" onClick={() => setScanError(null)}>Dismiss</Button>
                    </div>
                </Card>
            )}

            {pendingHandoffs.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-emerald-400">
                            <Inbox className="h-5 w-5" />
                            Incoming Shipments
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                                {pendingHandoffs.length}
                            </span>
                        </CardTitle>
                        <CardDescription>Scan QR code to verify, then confirm receipt</CardDescription>
                    </CardHeader>
                    <div className="space-y-3">
                        {pendingHandoffs.map((handoff) => {
                            const batchKey = handoff.batchNumber || handoff.product?.batchNumber;
                            const isScanned = scannedBatches.includes(batchKey);

                            return (
                            <div key={handoff._id} className={`p-4 rounded-xl border ${isScanned ? 'border-emerald-500/30 bg-emerald-900/10' : 'border-blue-500/20 bg-blue-900/10'}`}>
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="font-medium text-zinc-100 flex items-center gap-2">
                                            {handoff.batchName || handoff.product?.name || 'Product'}
                                            {isScanned && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Scanned ✓
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-sm text-zinc-400">
                                            From: <span className="text-zinc-200">{handoff.sender?.companyName}</span>
                                            <span className="text-zinc-600 mx-1">·</span>
                                            Batch: <span className="font-mono text-xs">{batchKey}</span>
                                            {handoff.unitCount && (
                                                <span className="text-zinc-600 mx-1">·</span>)
                                            }
                                            {handoff.unitCount && (
                                                <span className="text-emerald-400 text-xs font-semibold">{handoff.unitCount} units</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            Shipped: {new Date(handoff.shippedAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <Badge variant={isScanned ? 'success' : 'info'}>
                                        {isScanned ? 'Verified' : 'Awaiting Scan'}
                                    </Badge>
                                </div>

                                {disputeProductId === (handoff.batchNumber || handoff.productId) ? (
                                    <div className="flex items-center gap-2 mt-3">
                                        <input
                                            type="text"
                                            placeholder="Reason for dispute..."
                                            className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                                            value={disputeReason}
                                            onChange={(e) => setDisputeReason(e.target.value)}
                                        />
                                        <Button
                                            variant="danger"
                                            onClick={() => handleDisputeHandoff(handoff.batchNumber || handoff.productId)}
                                            disabled={handoffLoading === (handoff.batchNumber || handoff.productId)}
                                        >
                                            Submit Dispute
                                        </Button>
                                        <Button variant="secondary" onClick={() => { setDisputeProductId(null); setDisputeReason(''); }}>
                                            Cancel
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 mt-3">
                                        <Button
                                            variant="secondary"
                                            onClick={() => setShowHandoffScanner(true)}
                                        >
                                            <QrCode className="h-4 w-4 mr-1" />
                                            Scan QR
                                        </Button>
                                        <div className="relative group">
                                            <Button
                                                onClick={() => handleConfirmHandoff(batchKey)}
                                                disabled={!isScanned || handoffLoading === batchKey}
                                                className="bg-emerald-600 hover:bg-emerald-500"
                                            >
                                                <ThumbsUp className="h-4 w-4 mr-1" />
                                                {handoffLoading === batchKey ? 'Processing...' : 'Confirm Receipt'}
                                            </Button>
                                            {!isScanned && (
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-zinc-800 border border-white/10 text-xs text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-10">
                                                    Scan QR code first to confirm
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-zinc-800 border-r border-b border-white/10 rotate-45"></div>
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            variant="danger"
                                            onClick={() => setDisputeProductId(handoff.batchNumber || handoff.productId)}
                                            className="bg-red-900/40 hover:bg-red-900/60"
                                        >
                                            Dispute
                                        </Button>
                                    </div>
                                )}
                            </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {error && (
                <Card className="border-red-800 bg-red-900/20 animate-shake">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <div>
                            <p className="font-medium text-zinc-100">Verification Error</p>
                            <p className="text-sm text-zinc-400">{error}</p>
                        </div>
                    </div>
                </Card>
            )}

            {updateSuccess && (
                <Card className="border-emerald-800 bg-emerald-900/20">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                        <div>
                            <p className="font-medium text-zinc-100">Status Updated</p>
                            <p className="text-sm text-zinc-400">The product status has been successfully recorded.</p>
                        </div>
                    </div>
                </Card>
            )}

            {verificationResult && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-white/10 glass">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-2xl">{verificationResult.product.name}</CardTitle>
                                        <CardDescription className="font-mono">
                                            Batch: {verificationResult.product.batchNumber}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={verificationResult.isAuthentic ? 'success' : 'warning'} className="px-4 py-1 text-sm">
                                        {verificationResult.isAuthentic ? 'Authentic Product' : 'Verification Required'}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-2 mt-4">
                                <RoleInfo label="Manufacturer" value={verificationResult.product.manufacturer?.companyName} />
                                <RoleInfo label="Mfg Date" value={new Date(verificationResult.product.mfgDate).toLocaleDateString()} />
                                <RoleInfo label="Expiry Date" value={new Date(verificationResult.product.expDate).toLocaleDateString()} />
                                <RoleInfo label="Current Status" value={verificationResult.product.currentStatus} highlight />
                            </div>
                        </Card>

                        <Card className="border-white/10 glass">
                            <CardHeader>
                                <CardTitle className="text-lg">Supply Chain Audit Trail</CardTitle>
                            </CardHeader>
                            <div className="space-y-6 px-2">
                                {verificationResult.history.map((event, idx) => (
                                    <div key={idx} className="flex gap-4 group">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-blue-500'} mt-1.5`} />
                                            {idx !== verificationResult.history.length - 1 && (
                                                <div className="w-0.5 flex-1 bg-zinc-800 group-hover:bg-zinc-700 transition-colors mt-2 mb-1" />
                                            )}
                                        </div>
                                        <div className="pb-6">
                                            <p className="text-sm font-semibold text-zinc-100">{event.status}</p>
                                            <p className="text-xs text-zinc-500 mt-1">
                                                {event.handler?.companyName || 'Registered Facility'} • {new Date(event.timestamp).toLocaleString()}
                                            </p>
                                            {event.notes && (
                                                <div className="mt-2 p-3 rounded-lg bg-white/5 border border-white/5 italic text-xs text-zinc-400">
                                                    "{event.notes}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {canUpdate && (
                        <div className="lg:col-span-1">
                            <Card className="border-emerald-500/20 bg-emerald-500/5 sticky top-24">
                                <CardHeader>
                                    <CardTitle className="text-emerald-400">Inventory Action</CardTitle>
                                    <CardDescription>Update product status for dispensing or local tracking</CardDescription>
                                </CardHeader>

                                {!showUpdateForm ? (
                                    <Button className="w-full bg-emerald-600 hover:bg-emerald-500 py-6 text-lg" onClick={() => setShowUpdateForm(true)}>
                                        Update Inventory
                                    </Button>
                                ) : (
                                    <div className="space-y-4">
                                        <Select
                                            label="Select Action"
                                            options={statusOptions}
                                            placeholder="Choose status..."
                                            value={updateStatus}
                                            onChange={(e) => setUpdateStatus(e.target.value)}
                                        />

                                        <Textarea
                                            label="Dispensing Notes"
                                            placeholder="Optional patient verification notes"
                                            rows={3}
                                            value={updateNotes}
                                            onChange={(e) => setUpdateNotes(e.target.value)}
                                        />

                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                variant="ghost"
                                                className="flex-1 hover:bg-white/5"
                                                onClick={() => setShowUpdateForm(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                                                onClick={handleUpdateSubmit}
                                                disabled={!updateStatus}
                                                loading={loading}
                                            >
                                                Process
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}
                </div>
            )}

            {!verificationResult && recentActivity.length > 0 && (
                <div className="mt-12 animate-fade-in">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Clock className="h-5 w-5 text-emerald-400" />
                            Recent Activity
                        </h3>
                    </div>
                    <div className="grid gap-3">
                        {recentActivity.map((activity) => {
                            const isSender = activity.userRole === 'sender';
                            const statusConfig = {
                                'SHIPPED': { iconClass: 'bg-blue-500/20 text-blue-400', icon: <Send className="h-4 w-4" />, label: 'Shipped' },
                                'CONFIRMED': { iconClass: 'bg-emerald-500/20 text-emerald-400', icon: <CheckCircle className="h-4 w-4" />, label: 'Confirmed' },
                                'DISPUTED': { iconClass: 'bg-red-500/20 text-red-400', icon: <AlertCircle className="h-4 w-4" />, label: 'Disputed' },
                                'EXPIRED': { iconClass: 'bg-zinc-500/20 text-zinc-400', icon: <Clock className="h-4 w-4" />, label: 'Expired' },
                            };
                            const config = statusConfig[activity.status] || statusConfig['SHIPPED'];

                            return (
                                <div key={activity._id} className="p-4 rounded-xl bg-zinc-800/30 border border-white/5 hover:border-emerald-500/10 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-3">
                                            <div className={`mt-1 p-1.5 rounded-full ${config.iconClass}`}>
                                                {config.icon}
                                            </div>
                                            <div>
                                                <p className="font-medium text-zinc-200 flex items-center gap-2">
                                                    {activity.batchName || 'Batch'}
                                                    {activity.unitCount && (
                                                        <span className="text-xs text-zinc-500 font-normal">{activity.unitCount} units</span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-zinc-400 mt-0.5">
                                                    {isSender ? (
                                                        <>Shipped to <span className="text-zinc-200">{activity.receiver?.companyName || 'Unknown'}</span></>
                                                    ) : (
                                                        <>Received from <span className="text-zinc-200">{activity.sender?.companyName || 'Unknown'}</span></>
                                                    )}
                                                </p>
                                                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                                                    {activity.batchNumber}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1.5">
                                            <Badge variant={
                                                activity.status === 'CONFIRMED' ? 'success' :
                                                activity.status === 'DISPUTED' ? 'danger' :
                                                activity.status === 'SHIPPED' ? 'warning' :
                                                'secondary'
                                            }>
                                                {isSender ? `Sent · ${config.label}` : `Received · ${config.label}`}
                                            </Badge>
                                            <div className="flex items-center text-xs text-zinc-500 gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(activity.shippedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Handoff Scanner Modal */}
            {showHandoffScanner && (
                <Scanner onScan={handleHandoffScan} onClose={() => setShowHandoffScanner(false)} />
            )}
        </DashboardShell>
        </>
    );
};

const RoleInfo = ({ label, value, highlight }) => (
    <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-600">{label}</p>
        <p className={`text-sm font-medium ${highlight ? 'text-emerald-400' : 'text-zinc-300'}`}>
            {value || 'Information unavailable'}
        </p>
    </div>
);
