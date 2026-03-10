import React, { useState, useEffect } from 'react';
import { Shield, Users, Package, Truck, Edit, Trash2, X, RefreshCw, Search, CheckCircle, AlertCircle, QrCode, Layers, BarChart3, ChevronDown, ChevronRight } from 'lucide-react';
import { Scanner } from './Scanner';
import { DashboardShell } from './layout/DashboardShell';
import { Button, Card, CardHeader, CardTitle, CardDescription, Input, Select, Textarea, Badge } from './ui';

export const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [productStats, setProductStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Scan Product state
    const [query, setQuery] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [scanLoading, setScanLoading] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    const [scanError, setScanError] = useState(null);
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [updateStatus, setUpdateStatus] = useState('');
    const [updateNotes, setUpdateNotes] = useState('');

    // All Batches state
    const [allBatches, setAllBatches] = useState([]);
    const [batchesLoading, setBatchesLoading] = useState(false);
    const [expandedBatch, setExpandedBatch] = useState(null);
    const [batchUnits, setBatchUnits] = useState([]);
    const [unitsLoading, setUnitsLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (activeTab === 'batches') fetchAllBatches();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const token = sessionStorage.getItem('token');
            const headers = { 'x-auth-token': token };

            const [usersRes, statsRes, productStatsRes] = await Promise.all([
                fetch('/api/auth/admin/users', { headers }),
                fetch('/api/auth/admin/stats', { headers }),
                fetch('/api/product/admin/stats', { headers })
            ]);

            if (!usersRes.ok || !statsRes.ok) throw new Error('Failed to fetch admin data');

            const [usersData, statsData] = await Promise.all([
                usersRes.json(),
                statsRes.json()
            ]);

            setUsers(usersData);
            setStats(statsData);

            if (productStatsRes.ok) {
                setProductStats(await productStatsRes.json());
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`/api/auth/admin/users/${editingUser._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({
                    role: editingUser.role,
                    companyName: editingUser.companyName,
                    location: editingUser.location
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message);
            }

            setEditingUser(null);
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`/api/auth/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': token }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message);
            }

            setDeleteConfirm(null);
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    // Scan Product functions
    const executeSearch = async (id) => {
        setScanLoading(true);
        setVerificationResult(null);
        setScanError(null);
        setUpdateSuccess(false);
        setShowUpdateForm(false);

        try {
            const response = await fetch(`/api/product/${encodeURIComponent(id)}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Product not found');

            const product = data.product;
            const history = data.history || [];
            const isAuthentic = product && product.manufacturer && history.length > 0 &&
                history[history.length - 1].status === 'Manufactured';

            setVerificationResult({ isAuthentic, product, history });
            setQuery(id);
        } catch (err) {
            setScanError(err.message);
            setQuery('');
        } finally {
            setScanLoading(false);
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

    const handleUpdateSubmit = async () => {
        if (!updateStatus) return;
        setScanLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`/api/track/${verificationResult.product.productId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ status: updateStatus, notes: updateNotes })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update status');
            }

            setVerificationResult(null);
            setUpdateSuccess(true);
            setShowUpdateForm(false);
            setUpdateStatus('');
            setUpdateNotes('');
        } catch (err) {
            setScanError(err.message);
        } finally {
            setScanLoading(false);
        }
    };

    // Batch click to expand details
    const handleBatchClick = async (batchNumber) => {
        if (expandedBatch === batchNumber) {
            setExpandedBatch(null);
            setBatchUnits([]);
            return;
        }

        setExpandedBatch(batchNumber);
        setUnitsLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`/api/product/admin/batch/${encodeURIComponent(batchNumber)}`, {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) setBatchUnits(await res.json());
        } catch (err) {
            console.error('Failed to fetch batch units:', err);
        } finally {
            setUnitsLoading(false);
        }
    };

    // All Batches
    const fetchAllBatches = async () => {
        setBatchesLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch('/api/product/admin/batches', {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) setAllBatches(await res.json());
        } catch (err) {
            console.error('Failed to fetch batches:', err);
        } finally {
            setBatchesLoading(false);
        }
    };

    const getRoleBadgeVariant = (role) => {
        const variants = { Admin: 'error', Manufacturer: 'info', Distributor: 'warning', Customer: 'success', Pharmacy: 'success', Retailer: 'warning' };
        return variants[role] || 'default';
    };

    const adminStatusOptions = [
        { value: 'In Transit', label: 'In Transit' },
        { value: 'Received at Pharmacy', label: 'Received at Pharmacy' },
        { value: 'Recalled', label: 'Recalled' },
        { value: 'Flagged', label: 'Flagged' },
        { value: 'Manufactured', label: 'Reset to Manufactured' }
    ];

    const tabs = [
        { id: 'users', label: 'Users', icon: Users },
        { id: 'scan', label: 'Scan Product', icon: QrCode },
        { id: 'batches', label: 'All Batches', icon: Layers }
    ];

    return (
        <DashboardShell
            title="Admin Dashboard"
            description="Manage users, scan products, and view all batches"
            icon={Shield}
            actions={
                <Button variant="secondary" onClick={fetchData} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            }
        >
            {error && (
                <Card className="border-red-800 bg-red-900/20">
                    <p className="text-red-400">{error}</p>
                </Card>
            )}

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="text-center">
                        <div className="flex flex-col items-center gap-2">
                            <Users className="h-8 w-8 text-blue-400" />
                            <p className="text-3xl font-bold text-zinc-100">{stats.totalUsers}</p>
                            <p className="text-sm text-zinc-400">Total Users</p>
                        </div>
                    </Card>
                    <Card className="text-center">
                        <div className="flex flex-col items-center gap-2">
                            <Package className="h-8 w-8 text-green-400" />
                            <p className="text-3xl font-bold text-zinc-100">{productStats?.totalProducts || 0}</p>
                            <p className="text-sm text-zinc-400">Total Products</p>
                        </div>
                    </Card>
                    <Card className="text-center">
                        <div className="flex flex-col items-center gap-2">
                            <Layers className="h-8 w-8 text-yellow-400" />
                            <p className="text-3xl font-bold text-zinc-100">{productStats?.totalBatches || 0}</p>
                            <p className="text-sm text-zinc-400">Total Batches</p>
                        </div>
                    </Card>
                    <Card className="text-center">
                        <div className="flex flex-col items-center gap-2">
                            <Truck className="h-8 w-8 text-purple-400" />
                            <p className="text-3xl font-bold text-zinc-100">{productStats?.byStatus?.['In Transit'] || 0}</p>
                            <p className="text-sm text-zinc-400">In Transit</p>
                        </div>
                    </Card>
                </div>
            )}

            {/* Product Status Breakdown */}
            {productStats?.byStatus && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-400" />
                            Products by Status
                        </CardTitle>
                    </CardHeader>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(productStats.byStatus).map(([status, count]) => (
                            <div key={status} className="p-3 rounded-lg bg-zinc-800/50 border border-white/5">
                                <p className="text-2xl font-bold text-zinc-100">{count}</p>
                                <p className="text-xs text-zinc-400">{status}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ========== USERS TAB ========== */}
            {activeTab === 'users' && (
                <Card>
                    <CardHeader>
                        <CardTitle>All Users</CardTitle>
                        <CardDescription>{users.length} users registered</CardDescription>
                    </CardHeader>

                    {loading ? (
                        <div className="text-center py-8 text-zinc-400">Loading...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-zinc-800">
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Company</th>
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Phone</th>
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Role</th>
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Location</th>
                                        <th className="text-right py-3 px-4 text-zinc-400 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user._id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                            <td className="py-3 px-4 text-zinc-200">{user.companyName}</td>
                                            <td className="py-3 px-4 text-zinc-400 font-mono text-sm">{user.phoneNumber}</td>
                                            <td className="py-3 px-4">
                                                <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                                            </td>
                                            <td className="py-3 px-4 text-zinc-400">{user.location}</td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => setEditingUser({ ...user })}
                                                    className="p-2 hover:bg-zinc-700 rounded-lg transition-colors mr-1"
                                                >
                                                    <Edit className="h-4 w-4 text-blue-400" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(user)}
                                                    className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-400" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            {/* ========== SCAN PRODUCT TAB ========== */}
            {activeTab === 'scan' && (
                <>
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
                            <Button type="submit" loading={scanLoading}>
                                Verify
                            </Button>
                        </form>
                    </Card>

                    {scanError && (
                        <Card className="border-red-800 bg-red-900/20">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-red-400" />
                                <div>
                                    <p className="font-medium text-zinc-100">Unable to process</p>
                                    <p className="text-sm text-zinc-400">{scanError}</p>
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

                    {verificationResult && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                            <div className="lg:col-span-1">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Admin: Update status</CardTitle>
                                        <CardDescription>Override the product's current status</CardDescription>
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
                                                options={adminStatusOptions}
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
                                                <Button variant="ghost" className="flex-1" onClick={() => setShowUpdateForm(false)}>
                                                    Cancel
                                                </Button>
                                                <Button className="flex-1" onClick={handleUpdateSubmit} disabled={!updateStatus} loading={scanLoading}>
                                                    Confirm
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* Scanner Modal */}
                    {showScanner && (
                        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
                            <div className="w-full max-w-md">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-medium text-zinc-100">Scan QR code</h2>
                                    <button onClick={() => setShowScanner(false)} className="text-zinc-400 hover:text-zinc-100">
                                        Close
                                    </button>
                                </div>
                                <div className="bg-zinc-900 rounded-xl overflow-hidden aspect-square">
                                    <Scanner onScan={handleScan} onClose={() => setShowScanner(false)} />
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ========== ALL BATCHES TAB ========== */}
            {activeTab === 'batches' && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>All Batches</CardTitle>
                                <CardDescription>{allBatches.length} batches from all manufacturers</CardDescription>
                            </div>
                            <Button variant="secondary" onClick={fetchAllBatches} disabled={batchesLoading}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${batchesLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </CardHeader>

                    {batchesLoading ? (
                        <div className="text-center py-8 text-zinc-400">Loading...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-zinc-800">
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Product</th>
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Batch No.</th>
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Manufacturer</th>
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Units</th>
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Status</th>
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allBatches.map((batch) => (
                                        <React.Fragment key={batch._id}>
                                            <tr
                                                className="border-b border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer transition-colors"
                                                onClick={() => handleBatchClick(batch.batchNumber)}
                                            >
                                                <td className="py-3 px-4 text-zinc-200 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {expandedBatch === batch.batchNumber
                                                            ? <ChevronDown className="h-4 w-4 text-blue-400" />
                                                            : <ChevronRight className="h-4 w-4 text-zinc-500" />}
                                                        {batch.name}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-zinc-400 font-mono text-sm">{batch.batchNumber}</td>
                                                <td className="py-3 px-4 text-zinc-300">{batch.manufacturerName || '—'}</td>
                                                <td className="py-3 px-4">
                                                    <Badge variant="info">{batch.unitCount}</Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge variant={batch.currentStatus === 'Manufactured' ? 'info' : batch.currentStatus === 'In Transit' ? 'warning' : 'success'}>
                                                        {batch.currentStatus}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-zinc-400 text-sm">
                                                    {new Date(batch.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                            {expandedBatch === batch.batchNumber && (
                                                <tr>
                                                    <td colSpan={6} className="p-0">
                                                        <div className="bg-zinc-800/40 border-y border-zinc-700/50 p-4">
                                                            {unitsLoading ? (
                                                                <div className="text-center py-4 text-zinc-400">Loading units...</div>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-3">
                                                                        {batchUnits.length} units in batch {batch.batchNumber}
                                                                    </p>
                                                                    <div className="overflow-x-auto">
                                                                        <table className="w-full">
                                                                            <thead>
                                                                                <tr className="border-b border-zinc-700">
                                                                                    <th className="text-left py-2 px-3 text-xs text-zinc-500 font-medium">Product ID</th>
                                                                                    <th className="text-left py-2 px-3 text-xs text-zinc-500 font-medium">Serial No.</th>
                                                                                    <th className="text-left py-2 px-3 text-xs text-zinc-500 font-medium">Mfg Date</th>
                                                                                    <th className="text-left py-2 px-3 text-xs text-zinc-500 font-medium">Exp Date</th>
                                                                                    <th className="text-left py-2 px-3 text-xs text-zinc-500 font-medium">Status</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {batchUnits.map((unit) => (
                                                                                    <tr key={unit._id} className="border-b border-zinc-700/30 hover:bg-zinc-700/20">
                                                                                        <td className="py-2 px-3 text-xs text-zinc-300 font-mono">{unit.productId}</td>
                                                                                        <td className="py-2 px-3 text-xs text-zinc-400 font-mono">{unit.serialNumber}</td>
                                                                                        <td className="py-2 px-3 text-xs text-zinc-400">
                                                                                            {unit.mfgDate ? new Date(unit.mfgDate).toLocaleDateString() : '—'}
                                                                                        </td>
                                                                                        <td className="py-2 px-3 text-xs text-amber-400">
                                                                                            {unit.expDate ? new Date(unit.expDate).toLocaleDateString() : '—'}
                                                                                        </td>
                                                                                        <td className="py-2 px-3">
                                                                                            <Badge variant={unit.currentStatus === 'Manufactured' ? 'info' : unit.currentStatus === 'In Transit' ? 'warning' : 'success'}>
                                                                                                {unit.currentStatus}
                                                                                            </Badge>
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                            {allBatches.length === 0 && (
                                <div className="text-center py-12 text-zinc-500">No batches found</div>
                            )}
                        </div>
                    )}
                </Card>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-zinc-100">Edit User</h3>
                            <button onClick={() => setEditingUser(null)} className="p-1 hover:bg-zinc-700 rounded">
                                <X className="h-5 w-5 text-zinc-400" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <Input
                                label="Company Name"
                                value={editingUser.companyName}
                                onChange={(e) => setEditingUser({ ...editingUser, companyName: e.target.value })}
                            />
                            <Input
                                label="Location"
                                value={editingUser.location}
                                onChange={(e) => setEditingUser({ ...editingUser, location: e.target.value })}
                            />
                            <Select
                                label="Role"
                                value={editingUser.role}
                                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                options={[
                                    { value: 'Admin', label: 'Admin' },
                                    { value: 'Manufacturer', label: 'Manufacturer' },
                                    { value: 'Distributor', label: 'Distributor' },
                                    { value: 'Pharmacy', label: 'Pharmacy' },
                                    { value: 'Retailer', label: 'Retailer' },
                                    { value: 'Customer', label: 'Customer' }
                                ]}
                            />
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="secondary" onClick={() => setEditingUser(null)}>Cancel</Button>
                                <Button onClick={handleUpdateUser}>Save Changes</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <Card className="w-full max-w-sm mx-4">
                        <h3 className="text-lg font-semibold text-zinc-100 mb-2">Delete User?</h3>
                        <p className="text-zinc-400 mb-4">
                            Are you sure you want to delete <strong>{deleteConfirm.companyName}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                            <Button variant="danger" onClick={() => handleDeleteUser(deleteConfirm._id)}>Delete</Button>
                        </div>
                    </Card>
                </div>
            )}
        </DashboardShell>
    );
};
