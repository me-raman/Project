import React, { useState } from 'react';
import { ShieldCheck, Search, CheckCircle, AlertTriangle, Box, Truck, Calendar, XCircle } from 'lucide-react';
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

    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [canUpdate, setCanUpdate] = useState(false);
    const [updateStatus, setUpdateStatus] = useState('');
    const [updateNotes, setUpdateNotes] = useState('');

    const handleUpdateSubmit = async () => {
        if (!updateStatus) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/track/${verificationResult.product.productId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({
                    status: updateStatus,
                    notes: updateNotes
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

    const executeSearch = async (id) => {
        setLoading(true);
        setVerificationResult(null);
        setError(null);
        setUpdateSuccess(false);
        setShowUpdateForm(false);

        try {
            const response = await fetch(`/api/product/${encodeURIComponent(id)}`);
            const contentType = response.headers.get('content-type');

            let data;
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                throw new Error('Product not found');
            }

            if (!response.ok) throw new Error(data.message || 'Product not found');

            const product = data.product;
            const history = data.history || [];
            const isAuthentic = product && product.manufacturer && history.length > 0 &&
                history[history.length - 1].status === 'Manufactured';

            if (history.some(h => h.status === 'Received at Pharmacy')) {
                throw new Error('Product already received at pharmacy');
            }

            const currentUserId = localStorage.getItem('userId');
            if (history.some(h => h.handler && h.handler._id === currentUserId)) {
                throw new Error('You have already processed this product');
            }

            setVerificationResult({ isAuthentic, product, history });
            setQuery(id);
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
        { value: 'In Transit', label: 'In Transit' },
        { value: 'Received at Pharmacy', label: 'Received at Pharmacy' }
    ];

    return (
        <DashboardShell
            title="Verification Portal"
            description="Scan incoming units to verify authenticity"
            icon={ShieldCheck}
        >
            {/* Search Bar */}
            <Card padding="md">
                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="flex-1">
                        <Input
                            placeholder="Enter or scan Product ID..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <Button type="button" variant="secondary" onClick={() => setShowScanner(true)}>
                        Scan QR
                    </Button>
                    <Button type="submit" loading={loading}>
                        <Search className="h-4 w-4 mr-2" />
                        Verify
                    </Button>
                </form>
            </Card>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
                    <p className="text-slate-500">Verifying...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <Card className={error.includes('already') ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${error.includes('already') ? 'bg-blue-100' : 'bg-red-100'}`}>
                            {error.includes('already') ? (
                                <CheckCircle className="h-6 w-6 text-blue-600" />
                            ) : (
                                <XCircle className="h-6 w-6 text-red-600" />
                            )}
                        </div>
                        <div>
                            <h3 className={`font-semibold ${error.includes('already') ? 'text-blue-800' : 'text-red-800'}`}>
                                {error.includes('already') ? 'Already Processed' : 'Verification Failed'}
                            </h3>
                            <p className={`text-sm ${error.includes('already') ? 'text-blue-600' : 'text-red-600'}`}>
                                {error}
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Success State */}
            {updateSuccess && (
                <Card className="border-emerald-200 bg-emerald-50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-emerald-100">
                            <CheckCircle className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-emerald-800">Update Complete</h3>
                            <p className="text-sm text-emerald-600">Product status updated successfully</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Verification Result */}
            {verificationResult && (
                <div className="space-y-4">
                    {/* Product Info Card */}
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
                                    {verificationResult.isAuthentic ? 'Authentic' : 'Suspicious'}
                                </Badge>
                            </div>
                        </CardHeader>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Manufacturer</p>
                                <p className="text-sm text-slate-800 flex items-center gap-1 mt-1">
                                    <Box className="h-4 w-4 text-slate-400" />
                                    {verificationResult.product.manufacturer?.companyName || 'Unknown'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Mfg Date</p>
                                <p className="text-sm text-slate-800 flex items-center gap-1 mt-1">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    {new Date(verificationResult.product.mfgDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Expiry</p>
                                <p className="text-sm text-slate-800 flex items-center gap-1 mt-1">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    {new Date(verificationResult.product.expDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-medium">Status</p>
                                <p className="text-sm text-slate-800 mt-1">
                                    {verificationResult.product.currentStatus}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Update Form */}
                    {canUpdate && (
                        <Card>
                            {!showUpdateForm ? (
                                <Button size="lg" className="w-full" onClick={() => setShowUpdateForm(true)}>
                                    <Truck className="h-4 w-4 mr-2" />
                                    Update Tracking Status
                                </Button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Log Movement</CardTitle>
                                        <Button variant="ghost" size="sm" onClick={() => setShowUpdateForm(false)}>
                                            Cancel
                                        </Button>
                                    </div>

                                    <Select
                                        label="Status"
                                        options={statusOptions}
                                        placeholder="Select status..."
                                        value={updateStatus}
                                        onChange={(e) => setUpdateStatus(e.target.value)}
                                    />

                                    <Textarea
                                        label="Notes (Optional)"
                                        placeholder="e.g. Batch verified, condition good"
                                        rows={2}
                                        value={updateNotes}
                                        onChange={(e) => setUpdateNotes(e.target.value)}
                                    />

                                    <Button
                                        variant="success"
                                        size="lg"
                                        className="w-full"
                                        onClick={handleUpdateSubmit}
                                        disabled={!updateStatus}
                                        loading={loading}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Confirm Update
                                    </Button>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Activity Timeline */}
                    <Card>
                        <CardTitle className="mb-4">Recent Activity</CardTitle>
                        <div className="space-y-3">
                            {verificationResult.history.slice(0, 5).map((event, idx) => (
                                <div key={idx} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                        {idx !== verificationResult.history.slice(0, 5).length - 1 && (
                                            <div className="w-0.5 flex-1 bg-slate-200 mt-1" />
                                        )}
                                    </div>
                                    <div className="pb-3">
                                        <p className="text-sm font-medium text-slate-800">{event.status}</p>
                                        <p className="text-xs text-slate-500">
                                            {event.handler?.companyName || 'Unknown'} • {new Date(event.timestamp).toLocaleString()}
                                        </p>
                                        {event.notes && (
                                            <p className="text-xs text-slate-400 mt-1 italic">"{event.notes}"</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* Scanner Modal */}
            {showScanner && (
                <Scanner onScan={handleScan} onClose={() => setShowScanner(false)} />
            )}
        </DashboardShell>
    );
};
