import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, CheckCircle, AlertCircle, Package, Truck, Calendar, Clock, Inbox, ThumbsUp, ThumbsDown, Send, QrCode, Users } from 'lucide-react';
import { Scanner } from './Scanner';
import { DashboardShell } from './layout/DashboardShell';
import { Button, Card, CardHeader, CardTitle, CardDescription, Input, Select, Textarea, Badge } from './ui';
import { LocationPermissionModal } from './ui/LocationPermissionModal';
import { useStrictLocation } from '../hooks/useStrictLocation';

export const DistributorDashboard = () => {
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
    // Inventory & forward-ship state
    const [inventory, setInventory] = useState([]);
    const [shipModal, setShipModal] = useState(null);
    const [shipLoading, setShipLoading] = useState(false);
    const [receivers, setReceivers] = useState([]);
    const [receiverRole, setReceiverRole] = useState('Pharmacy');
    const [selectedReceiver, setSelectedReceiver] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const { requestLocation, locationModal } = useStrictLocation();

    useEffect(() => {
        fetchHistory();
        fetchPendingHandoffs();
        fetchInventory();
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

    const fetchInventory = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch('/api/track/my-inventory', {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setInventory(data.inventory || []);
            }
        } catch (err) {
            console.error('Failed to fetch inventory:', err);
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
                const currentUserId = sessionStorage.getItem('userId');
                setReceivers(data.filter(d => d._id !== currentUserId));
            }
        } catch (err) {
            console.error(`Failed to fetch ${role}s:`, err);
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
                    body: JSON.stringify({ notes: 'Confirmed receipt', latitude, longitude })
                });
                if (res.ok) {
                    fetchPendingHandoffs();
                    fetchHistory();
                    fetchInventory();
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
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        });
    };

    // Extract plain productId from a potentially signed QR payload
    // Handles both formats:
    //   Old: "PROD-BATCH-xxx-yyy.16charsignature"
    //   New: "http://host/verify/PROD-BATCH-xxx-yyy.16charsignature"
    const extractProductId = (rawValue) => {
        if (!rawValue) return rawValue;
        // Strip URL prefix if present (e.g. http://localhost:5173/verify/...)
        let value = rawValue;
        const verifyIdx = value.indexOf('/verify/');
        if (verifyIdx !== -1) {
            value = decodeURIComponent(value.substring(verifyIdx + '/verify/'.length));
        }
        // Strip QR signature if present (16 hex chars after last dot)
        if (value.includes('.')) {
            const lastDotIndex = value.lastIndexOf('.');
            const possibleSig = value.substring(lastDotIndex + 1);
            if (possibleSig.length === 16 && /^[0-9a-f]+$/i.test(possibleSig)) {
                return value.substring(0, lastDotIndex);
            }
        }
        return value;
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

    const handleHandoffScan = async (decodedText) => {
        setShowHandoffScanner(false);
        setScanError(null);

        try {
            // Strip QR signature if present
            const productId = extractProductId(decodedText);

            // Look up the product to get its batchNumber
            const response = await fetch(`/api/product/${encodeURIComponent(productId)}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Product not found');

            const scannedBatch = data.product?.batchNumber;
            if (!scannedBatch) throw new Error('Could not determine batch number from scanned QR code');

            // Check if this batch matches any pending handoff
            const match = pendingHandoffs.find(h => {
                const handoffBatch = h.batchNumber || h.product?.batchNumber;
                return handoffBatch === scannedBatch;
            });

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
        { value: 'In Transit', label: 'In transit' },
        { value: 'Received at Pharmacy', label: 'Received at pharmacy' }
    ];

    return (
        <>
        <LocationPermissionModal {...locationModal} />
        <DashboardShell
            title="Verify products"
            description="Scan or search to verify incoming products"
            icon={ShieldCheck}
        >
            {/* Welcome Stats Card */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 animate-slide-down delay-100">
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
                <Card className="!bg-gradient-to-br !from-emerald-900/30 !to-green-900/30 border-emerald-500/20 relative overflow-hidden flex items-center justify-center text-center">
                    <div className="relative z-10 p-2">
                        <div className="mx-auto w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-3">
                            <Package className="h-6 w-6 text-emerald-400" />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-1">
                            {inventory.length}
                        </h3>
                        <p className="text-zinc-400 text-sm">In Inventory</p>
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
                                                <span className="text-blue-400 text-xs font-semibold">{handoff.unitCount} units</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            Shipped: {new Date(handoff.shippedAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <Badge variant={isScanned ? 'success' : 'info'}>
                                        {isScanned ? 'Verified' : 'Awaiting Confirmation'}
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
                                        >
                                            <ThumbsDown className="h-4 w-4 mr-1" />
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

            {/* Scan Error */}
            {scanError && (
                <Card className="border-red-800 bg-red-900/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                            <div>
                                <p className="font-medium text-zinc-100">Scan Failed</p>
                                <p className="text-sm text-zinc-400">{scanError}</p>
                            </div>
                        </div>
                        <button onClick={() => setScanError(null)} className="text-zinc-500 hover:text-zinc-300 text-sm">Dismiss</button>
                    </div>
                </Card>
            )}

            {/* Your Inventory — batches received, ready to ship onward */}
            {inventory.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-emerald-400" />
                            Your Inventory
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                                {inventory.length}
                            </span>
                        </CardTitle>
                        <CardDescription>Batches in your possession — ready to ship onward</CardDescription>
                    </CardHeader>
                    <div className="space-y-3">
                        {inventory.map((item) => {
                            const batchKey = item.batchNumber || item.product?.batchNumber;
                            return (
                                <div key={item._id} className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-900/10">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-medium text-zinc-100">
                                                {item.batchName || item.product?.name || 'Product'}
                                            </p>
                                            <p className="text-sm text-zinc-400">
                                                Batch: <span className="font-mono text-xs">{batchKey}</span>
                                                {item.unitCount && (
                                                    <><span className="text-zinc-600 mx-1">·</span>
                                                    <span className="text-emerald-400 text-xs font-semibold">{item.unitCount} units</span></>
                                                )}
                                                <span className="text-zinc-600 mx-1">·</span>
                                                From: <span className="text-zinc-200">{item.sender?.companyName || 'Unknown'}</span>
                                            </p>
                                            <p className="text-xs text-zinc-500 mt-1">
                                                Received: {new Date(item.confirmedAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <Badge variant="success">In Stock</Badge>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3">
                                        <Button
                                            variant="secondary"
                                            onClick={async () => {
                                                const role = 'Pharmacy';
                                                setReceiverRole(role);
                                                setSearchQuery('');
                                                setSelectedReceiver('');
                                                setShipModal(item);
                                                await fetchReceivers(role);
                                            }}
                                        >
                                            <Send className="h-3 w-3 mr-1" />
                                            Ship
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
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

            {/* Scanner Modal — handoff / incoming shipment verification */}
            {showHandoffScanner && (
                <Scanner onScan={handleHandoffScan} onClose={() => setShowHandoffScanner(false)} />
            )}
            {/* Recent Activity List */}
            {!verificationResult && recentActivity.length > 0 && (
                <div className="mt-8 animate-fade-in">
                    <h3 className="text-lg font-medium text-white mb-4">Recent Activity</h3>
                    <div className="grid gap-3">
                        {recentActivity.map((activity) => {
                            const isSender = activity.userRole === 'sender';
                            const statusConfig = {
                                'SHIPPED': { iconClass: 'bg-blue-500/20 text-blue-400', icon: <Send className="h-4 w-4" />, label: 'Shipped' },
                                'CONFIRMED': { iconClass: 'bg-green-500/20 text-green-400', icon: <CheckCircle className="h-4 w-4" />, label: 'Confirmed' },
                                'DISPUTED': { iconClass: 'bg-red-500/20 text-red-400', icon: <AlertCircle className="h-4 w-4" />, label: 'Disputed' },
                                'EXPIRED': { iconClass: 'bg-zinc-500/20 text-zinc-400', icon: <Clock className="h-4 w-4" />, label: 'Expired' },
                            };
                            const config = statusConfig[activity.status] || statusConfig['SHIPPED'];

                            return (
                                <div key={activity._id} className="p-4 rounded-xl bg-zinc-800/30 border border-white/5 hover:border-white/10 transition-colors">
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
                            <h3 className="text-lg font-semibold text-zinc-100">Forward Shipment</h3>
                            <p className="text-sm text-zinc-400">{shipModal.batchName || shipModal.product?.name} · Batch: {shipModal.batchNumber || shipModal.product?.batchNumber}</p>
                        </div>
                    </div>
                    <p className="text-sm text-zinc-400 mb-4">
                        Select the recipient to ship this batch to. They must confirm receipt before the product status updates.
                    </p>

                    {/* Ship To Role Toggle */}
                    <div className="mb-4">
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
                            Ship To
                        </label>
                        <div className="flex p-1 bg-zinc-900 rounded-xl border border-white/5">
                            {['Pharmacy', 'Distributor'].map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => {
                                        setReceiverRole(role);
                                        setSelectedReceiver('');
                                        setSearchQuery('');
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
                        <Button variant="secondary" onClick={() => { setShipModal(null); setSelectedReceiver(''); setSearchQuery(''); }}>Cancel</Button>
                        <Button
                            loading={shipLoading}
                            disabled={!selectedReceiver}
                            onClick={() => {
                                requestLocation(async ({ latitude, longitude }) => {
                                    setShipLoading(true);
                                    try {
                                        const token = sessionStorage.getItem('token');
                                        const batchNumber = shipModal.batchNumber || shipModal.product?.batchNumber;
                                        const res = await fetch('/api/track/ship-batch', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                                            body: JSON.stringify({
                                                batchNumber,
                                                receiverId: selectedReceiver,
                                                notes: `Forwarded batch ${batchNumber}`,
                                                latitude,
                                                longitude
                                            })
                                        });
                                        const data = await res.json();
                                        if (!res.ok) throw new Error(data.message || 'Failed to ship batch');
                                        setShipModal(null);
                                        setSelectedReceiver('');
                                        setSearchQuery('');
                                        fetchInventory();
                                        fetchHistory();
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
