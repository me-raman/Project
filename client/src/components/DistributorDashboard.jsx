import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, CheckCircle, AlertCircle, Package, Truck, Calendar, Clock, Inbox, ThumbsUp, ThumbsDown, Send } from 'lucide-react';
import { Scanner } from './Scanner';
import { DashboardShell } from './layout/DashboardShell';
import { Button, Card, CardHeader, CardTitle, CardDescription, Input, Select, Textarea, Badge } from './ui';

export const DistributorDashboard = () => {
    const [query, setQuery] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [loading, setLoading] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    const [error, setError] = useState(null);
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [recentActivity, setRecentActivity] = useState([]);
    const [geoCoords, setGeoCoords] = useState(null);
    const [pendingHandoffs, setPendingHandoffs] = useState([]);
    const [handoffLoading, setHandoffLoading] = useState(null);
    const [disputeReason, setDisputeReason] = useState('');
    const [disputeProductId, setDisputeProductId] = useState(null);

    useEffect(() => {
        fetchHistory();
        fetchPendingHandoffs();
        // Request geolocation on mount
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setGeoCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                },
                (err) => {
                    console.log('Geolocation not available:', err.message);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        }
    }, []);

    const fetchHistory = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch('/api/track/user/history', {
                headers: { 'x-auth-token': token }
            });
            if (response.ok) {
                const data = await response.json();
                setRecentActivity(data);
            }
        } catch (err) {
            console.error('Failed to fetch history:', err);
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

    const handleConfirmHandoff = async (productId) => {
        setHandoffLoading(productId);
        try {
            let latitude, longitude;
            try {
                const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                });
                latitude = pos.coords.latitude;
                longitude = pos.coords.longitude;
            } catch (geoErr) {
                if (geoCoords) { latitude = geoCoords.latitude; longitude = geoCoords.longitude; }
            }

            const token = sessionStorage.getItem('token');
            const res = await fetch(`/api/track/confirm/${encodeURIComponent(productId)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ notes: 'Confirmed receipt', latitude, longitude })
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
    };

    const handleDisputeHandoff = async (productId) => {
        if (!disputeReason) { setError('Please enter a dispute reason'); return; }
        setHandoffLoading(productId);
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`/api/track/dispute/${encodeURIComponent(productId)}`, {
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
        setLoading(true);
        try {
            // Capture geolocation
            let latitude, longitude;
            try {
                const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                });
                latitude = pos.coords.latitude;
                longitude = pos.coords.longitude;
                setGeoCoords({ latitude, longitude });
            } catch (geoErr) {
                console.log('Geolocation not available:', geoErr.message);
                // Fall back to previously acquired coordinates
                if (geoCoords) {
                    latitude = geoCoords.latitude;
                    longitude = geoCoords.longitude;
                }
            }

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
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Extract plain productId from a potentially signed QR payload
    // Signed payloads have format: "PROD-BATCH-xxx-yyy.16charsignature"
    const extractProductId = (rawValue) => {
        if (!rawValue || !rawValue.includes('.')) return rawValue;
        const lastDotIndex = rawValue.lastIndexOf('.');
        const possibleSig = rawValue.substring(lastDotIndex + 1);
        // Signature is always 16 hex characters
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
            // Strip QR signature if present to get the plain productId
            const productId = extractProductId(id);

            const response = await fetch(`/api/product/${encodeURIComponent(productId)}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Product not found');

            const product = data.product;
            const history = data.history || [];
            const isAuthentic = product && product.manufacturer && history.length > 0 &&
                history[history.length - 1].status === 'Manufactured';

            if (history.some(h => h.status === 'Received at Pharmacy')) {
                throw new Error('This product has already been received at its destination');
            }

            const currentUserId = sessionStorage.getItem('userId');
            if (history.some(h => h.handler && h.handler._id === currentUserId)) {
                throw new Error('You have already processed this product');
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

    const handleScan = (decodedText) => {
        setShowScanner(false);
        executeSearch(decodedText);
    };

    const statusOptions = [
        { value: 'In Transit', label: 'In transit' },
        { value: 'Received at Pharmacy', label: 'Received at pharmacy' }
    ];

    return (
        <DashboardShell
            title="Verify products"
            description="Scan or search to verify incoming products"
            icon={ShieldCheck}
        >
            {/* Welcome Stats Card */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-down delay-100">
                <Card className="col-span-1 md:col-span-2 !bg-gradient-to-br !from-purple-900/40 !to-indigo-900/40 border-purple-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="relative z-10 p-2">
                        <Badge variant="info" className="mb-3">Distributor Portal</Badge>
                        <h2 className="text-2xl font-bold text-white mb-2">Welcome back, {sessionStorage.getItem('userName')}</h2>
                        <p className="text-zinc-400">Manage incoming shipments and verify pharmaceutical authenticity.</p>
                    </div>
                </Card>
                <Card className="!bg-gradient-to-br !from-amber-900/30 !to-orange-900/30 border-amber-500/20 relative overflow-hidden flex items-center justify-center text-center">
                    <div className="relative z-10 p-2">
                        <div className="mx-auto w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mb-3">
                            <Inbox className="h-6 w-6 text-amber-400" />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">
                            {pendingHandoffs.length}
                        </h3>
                        <p className="text-zinc-400 text-sm">Pending Handoffs</p>
                    </div>
                </Card>
            </div>

            {/* Search */}
            <Card padding="md">
                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Enter product ID"
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <Button type="button" variant="secondary" onClick={() => setShowScanner(true)}>
                        Scan QR
                    </Button>
                    <Button type="submit" loading={loading}>
                        Verify
                    </Button>
                </form>
            </Card>

            {/* Pending Handoffs */}
            {pendingHandoffs.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Inbox className="h-5 w-5 text-blue-400" />
                            Incoming Shipments
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">
                                {pendingHandoffs.length}
                            </span>
                        </CardTitle>
                        <CardDescription>Shipments awaiting your confirmation</CardDescription>
                    </CardHeader>
                    <div className="space-y-3">
                        {pendingHandoffs.map((handoff) => (
                            <div key={handoff._id} className="p-4 rounded-xl border border-blue-500/20 bg-blue-900/10">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="font-medium text-zinc-100">
                                            {handoff.product?.name || 'Product'}
                                        </p>
                                        <p className="text-sm text-zinc-400">
                                            From: <span className="text-zinc-200">{handoff.sender?.companyName}</span>
                                            <span className="text-zinc-600 mx-1">·</span>
                                            <span className="font-mono text-xs">{handoff.productId}</span>
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            Shipped: {new Date(handoff.shippedAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <Badge variant="info">Awaiting Confirmation</Badge>
                                </div>

                                {disputeProductId === handoff.productId ? (
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
                                            onClick={() => handleDisputeHandoff(handoff.productId)}
                                            disabled={handoffLoading === handoff.productId}
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
                                            onClick={() => handleConfirmHandoff(handoff.productId)}
                                            disabled={handoffLoading === handoff.productId}
                                        >
                                            <ThumbsUp className="h-4 w-4 mr-1" />
                                            {handoffLoading === handoff.productId ? 'Processing...' : 'Confirm Receipt'}
                                        </Button>
                                        <Button
                                            variant="danger"
                                            onClick={() => setDisputeProductId(handoff.productId)}
                                        >
                                            <ThumbsDown className="h-4 w-4 mr-1" />
                                            Dispute
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Status Messages */}
            {error && (
                <Card className="border-red-800 bg-red-900/20">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <div>
                            <p className="font-medium text-zinc-100">Unable to process</p>
                            <p className="text-sm text-zinc-400">{error}</p>
                        </div>
                    </div>
                </Card>
            )}

            {updateSuccess && (
                <Card className="border-green-800 bg-green-900/20">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        <div>
                            <p className="font-medium text-zinc-100">Status updated</p>
                            <p className="text-sm text-zinc-400">The product status has been recorded</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Verification Result */}
            {verificationResult && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Product Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>{verificationResult.product.name}</CardTitle>
                                        <CardDescription>
                                            Batch: {verificationResult.product.batchNumber}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={verificationResult.isAuthentic ? 'success' : 'warning'}>
                                        {verificationResult.isAuthentic ? 'Verified' : 'Review required'}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">Manufacturer</p>
                                    <p className="text-sm text-zinc-200">
                                        {verificationResult.product.manufacturer?.companyName || 'Unknown'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">Manufactured</p>
                                    <p className="text-sm text-zinc-200">
                                        {new Date(verificationResult.product.mfgDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">Expires</p>
                                    <p className="text-sm text-zinc-200">
                                        {new Date(verificationResult.product.expDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">Current status</p>
                                    <p className="text-sm text-zinc-200">
                                        {verificationResult.product.currentStatus}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Activity History */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Activity history</CardTitle>
                            </CardHeader>
                            <div className="space-y-4">
                                {verificationResult.history.map((event, idx) => (
                                    <div key={idx} className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                                            {idx !== verificationResult.history.length - 1 && (
                                                <div className="w-0.5 flex-1 bg-zinc-700 mt-1" />
                                            )}
                                        </div>
                                        <div className="pb-4">
                                            <p className="text-sm font-medium text-zinc-200">{event.status}</p>
                                            <p className="text-xs text-zinc-500">
                                                {event.handler?.companyName || 'System'} · {new Date(event.timestamp).toLocaleString()}
                                            </p>
                                            {event.notes && (
                                                <p className="text-xs text-zinc-400 mt-1">{event.notes}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Update Form Sidebar */}
                    {canUpdate && (
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Update status</CardTitle>
                                    <CardDescription>Record the current location of this product</CardDescription>
                                </CardHeader>

                                {!showUpdateForm ? (
                                    <Button className="w-full" onClick={() => setShowUpdateForm(true)}>
                                        <Truck className="h-4 w-4 mr-2" />
                                        Update tracking
                                    </Button>
                                ) : (
                                    <div className="space-y-4">
                                        <Select
                                            label="Status"
                                            options={statusOptions}
                                            placeholder="Select status"
                                            value={updateStatus}
                                            onChange={(e) => setUpdateStatus(e.target.value)}
                                        />

                                        <Textarea
                                            label="Notes (optional)"
                                            placeholder="Add any relevant notes"
                                            rows={3}
                                            value={updateNotes}
                                            onChange={(e) => setUpdateNotes(e.target.value)}
                                        />


                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                className="flex-1"
                                                onClick={() => setShowUpdateForm(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                className="flex-1"
                                                onClick={handleUpdateSubmit}
                                                disabled={!updateStatus}
                                                loading={loading}
                                            >
                                                Confirm
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}
                </div>
            )}

            {/* Scanner Modal */}
            {showScanner && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
                    <div className="w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-medium text-zinc-100">Scan QR code</h2>
                            <button
                                onClick={() => setShowScanner(false)}
                                className="text-zinc-400 hover:text-zinc-100"
                            >
                                Close
                            </button>
                        </div>
                        <div className="bg-zinc-900 rounded-xl overflow-hidden aspect-square">
                            <Scanner onScan={handleScan} onClose={() => setShowScanner(false)} />
                        </div>
                    </div>
                </div>
            )}
            {/* Recent Activity List */}
            {!verificationResult && recentActivity.length > 0 && (
                <div className="mt-8 animate-fade-in">
                    <h3 className="text-lg font-medium text-white mb-4">Your Recent Activity</h3>
                    <div className="grid gap-3">
                        {recentActivity.map((activity) => (
                            <div key={activity._id} className="p-4 rounded-xl bg-zinc-800/30 border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <div className={`mt-1 p-1.5 rounded-full ${activity.status === 'In Transit' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                                            {activity.status === 'In Transit' ? <Truck className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-zinc-200">
                                                {activity.status}
                                            </p>
                                            <p className="text-sm text-zinc-400">
                                                {activity.product?.name} <span className="text-zinc-600">•</span> <span className="font-mono text-zinc-500">{activity.product?.productId}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center text-xs text-zinc-500 gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(activity.timestamp).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                {activity.notes && (
                                    <p className="mt-2 text-sm text-zinc-500 pl-11">"{activity.notes}"</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </DashboardShell>
    );
};
