import React, { useState, useEffect } from 'react';
import { Shield, Users, Package, Truck, Edit, Trash2, X, RefreshCw, Search, CheckCircle, AlertCircle, QrCode, Layers, BarChart3, ChevronDown, ChevronRight, AlertTriangle, Activity, ClipboardCheck, FlaskConical, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
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

    // Anomalies state
    const [anomalies, setAnomalies] = useState([]);
    const [anomaliesLoading, setAnomaliesLoading] = useState(false);

    // Recall state
    const [recallModal, setRecallModal] = useState(null);
    const [recallReason, setRecallReason] = useState('');

    // Audit Queue state
    const [auditQueue, setAuditQueue] = useState([]);
    const [auditLoading, setAuditLoading] = useState(false);
    const [auditActionLoading, setAuditActionLoading] = useState(null);
    const [auditNotes, setAuditNotes] = useState('');

    // Lab Tests state
    const [labTests, setLabTests] = useState([]);
    const [labTestStats, setLabTestStats] = useState({});
    const [labTestsLoading, setLabTestsLoading] = useState(false);

    // Reputation state
    const [reputationData, setReputationData] = useState(null);
    const [reputationLoading, setReputationLoading] = useState(false);
    const [recallLoading, setRecallLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (activeTab === 'batches') fetchAllBatches();
        if (activeTab === 'anomalies') fetchAnomalies();
        if (activeTab === 'audit') fetchAuditQueue();
        if (activeTab === 'labtests') fetchLabTests();
        if (activeTab === 'reputation') fetchReputation();
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
    // Extract plain productId from a potentially signed QR payload
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
        setScanLoading(true);
        setVerificationResult(null);
        setScanError(null);
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

            setVerificationResult({ isAuthentic, product, history });
            setQuery(productId);
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

    // Anomalies
    const fetchAnomalies = async () => {
        setAnomaliesLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch('/api/product/admin/anomalies', {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setAnomalies(data.anomalies || []);
            }
        } catch (err) {
            console.error('Failed to fetch anomalies:', err);
        } finally {
            setAnomaliesLoading(false);
        }
    };

    // Recall batch
    const handleRecallBatch = async () => {
        if (!recallModal) return;
        setRecallLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch('/api/product/admin/recall', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({
                    batchNumber: recallModal,
                    reason: recallReason
                })
            });
            if (res.ok) {
                setRecallModal(null);
                setRecallReason('');
                fetchAllBatches();
                fetchData();
            } else {
                const data = await res.json();
                setError(data.message || 'Failed to recall batch');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setRecallLoading(false);
        }
    };

    // Audit Queue
    const fetchAuditQueue = async () => {
        setAuditLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch('/api/product/admin/audit-queue', {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setAuditQueue(data.batches || []);
            }
        } catch (err) {
            console.error('Failed to fetch audit queue:', err);
        } finally {
            setAuditLoading(false);
        }
    };

    const handleAuditAction = async (batchNumber, result) => {
        setAuditActionLoading(batchNumber);
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`/api/product/admin/audit/${encodeURIComponent(batchNumber)}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ result, notes: auditNotes })
            });
            if (res.ok) {
                setAuditNotes('');
                fetchAuditQueue();
                fetchData();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setAuditActionLoading(null);
        }
    };

    // Lab Tests
    const fetchLabTests = async () => {
        setLabTestsLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch('/api/product/admin/lab-tests', {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setLabTests(data.labTests || []);
                setLabTestStats(data.resultCounts || {});
            }
        } catch (err) {
            console.error('Failed to fetch lab tests:', err);
        } finally {
            setLabTestsLoading(false);
        }
    };

    // Reputation
    const fetchReputation = async () => {
        setReputationLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch('/api/auth/admin/reputation', {
                headers: { 'x-auth-token': token }
            });
            if (res.ok) {
                const data = await res.json();
                setReputationData(data);
            }
        } catch (err) {
            console.error('Failed to fetch reputation:', err);
        } finally {
            setReputationLoading(false);
        }
    };

    const handleRecalculateReputation = async () => {
        setReputationLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            await fetch('/api/auth/admin/reputation/recalculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
            });
            fetchReputation();
        } catch (err) {
            setError(err.message);
        } finally {
            setReputationLoading(false);
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
        { id: 'batches', label: 'All Batches', icon: Layers },
        { id: 'anomalies', label: 'Anomalies', icon: Activity, badge: anomalies.length || null },
        { id: 'audit', label: 'Audit Queue', icon: ClipboardCheck, badge: auditQueue.length || null },
        { id: 'labtests', label: 'Lab Tests', icon: FlaskConical },
        { id: 'reputation', label: 'Reputation', icon: Star }
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
                            {tab.badge && (
                                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                                    {tab.badge}
                                </span>
                            )}
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
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Actions</th>
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
                                                <td className="py-3 px-4">
                                                    {batch.currentStatus === 'Recalled' ? (
                                                        <Badge variant="error">Recalled</Badge>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setRecallModal(batch.batchNumber); }}
                                                            className="px-3 py-1 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                                                        >
                                                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                                                            Recall
                                                        </button>
                                                    )}
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

            {/* Anomalies Tab */}
            {activeTab === 'anomalies' && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Anomaly Detection</CardTitle>
                                <CardDescription>Suspicious activities and supply chain anomalies</CardDescription>
                            </div>
                            <Button variant="secondary" onClick={fetchAnomalies}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </CardHeader>

                    {anomaliesLoading ? (
                        <div className="text-center py-8 text-zinc-400">Analyzing anomalies...</div>
                    ) : anomalies.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
                            <p className="text-zinc-400">No anomalies detected. System is healthy.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 p-4">
                            {anomalies.map((anomaly, idx) => {
                                const severityColors = {
                                    critical: { border: 'border-red-500/30', bg: 'bg-red-900/20', text: 'text-red-400', badge: 'bg-red-500/20 text-red-300 border-red-500/30' },
                                    warning: { border: 'border-amber-500/30', bg: 'bg-amber-900/20', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
                                    info: { border: 'border-blue-500/30', bg: 'bg-blue-900/20', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' }
                                };
                                const colors = severityColors[anomaly.severity] || severityColors.info;
                                const typeLabels = {
                                    DUPLICATE_SCAN: 'Duplicate Scan',
                                    IMPOSSIBLE_TRAVEL: 'Impossible Travel',
                                    EXPIRED_IN_TRANSIT: 'Expired in Transit'
                                };

                                return (
                                    <div key={idx} className={`p-4 rounded-xl border ${colors.border} ${colors.bg}`}>
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className={`h-4 w-4 ${colors.text}`} />
                                                <span className={`text-sm font-semibold ${colors.text}`}>
                                                    {typeLabels[anomaly.type] || anomaly.type}
                                                </span>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${colors.badge} uppercase font-bold`}>
                                                {anomaly.severity}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-300 mb-2">{anomaly.details}</p>
                                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                                            <span>Product: <span className="font-mono text-zinc-400">{anomaly.productId}</span></span>
                                            {anomaly.batchNumber && <span>Batch: <span className="font-mono text-zinc-400">{anomaly.batchNumber}</span></span>}
                                            {anomaly.timestamp && <span>{new Date(anomaly.timestamp).toLocaleString()}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            )}

            {/* ========== AUDIT QUEUE TAB ========== */}
            {activeTab === 'audit' && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <ClipboardCheck className="h-5 w-5 text-amber-400" />
                                    Audit Queue
                                </CardTitle>
                                <CardDescription>{auditQueue.length} batches pending audit</CardDescription>
                            </div>
                            <Button variant="secondary" onClick={fetchAuditQueue} disabled={auditLoading}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${auditLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </CardHeader>

                    {auditLoading ? (
                        <div className="text-center py-8 text-zinc-400">Loading audit queue...</div>
                    ) : auditQueue.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
                            <p className="text-zinc-400">No batches pending audit</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {auditQueue.map((batch) => (
                                <div key={batch._id} className="p-4 rounded-xl border border-amber-500/20 bg-amber-900/10">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-medium text-zinc-100">{batch.name}</p>
                                            <p className="text-sm text-zinc-400">
                                                Batch: <span className="font-mono">{batch.batchNumber}</span> · {batch.unitCount} units
                                            </p>
                                            <p className="text-xs text-zinc-500 mt-1">
                                                Manufacturer: {batch.manufacturerName || 'Unknown'} · Flagged: {new Date(batch.auditFlaggedAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <Badge variant="warning">Pending Audit</Badge>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3">
                                        <input
                                            type="text"
                                            placeholder="Audit notes (optional)"
                                            className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                            value={auditNotes}
                                            onChange={(e) => setAuditNotes(e.target.value)}
                                        />
                                        <Button
                                            variant="secondary"
                                            onClick={() => handleAuditAction(batch.batchNumber, 'AUDIT_PASSED')}
                                            disabled={auditActionLoading === batch.batchNumber}
                                        >
                                            <ThumbsUp className="h-4 w-4 mr-1" />
                                            Pass
                                        </Button>
                                        <Button
                                            variant="danger"
                                            onClick={() => handleAuditAction(batch.batchNumber, 'AUDIT_FAILED')}
                                            disabled={auditActionLoading === batch.batchNumber}
                                        >
                                            <ThumbsDown className="h-4 w-4 mr-1" />
                                            Fail
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {/* ========== LAB TESTS TAB ========== */}
            {activeTab === 'labtests' && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <FlaskConical className="h-5 w-5 text-purple-400" />
                                    Lab Test Results
                                </CardTitle>
                                <CardDescription>
                                    {labTests.length} tests recorded · {labTestStats.PASS || 0} passed · {labTestStats.FAIL || 0} failed
                                </CardDescription>
                            </div>
                            <Button variant="secondary" onClick={fetchLabTests} disabled={labTestsLoading}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${labTestsLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </CardHeader>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/20 text-center">
                            <p className="text-2xl font-bold text-emerald-400">{labTestStats.PASS || 0}</p>
                            <p className="text-xs text-zinc-400">Passed</p>
                        </div>
                        <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/20 text-center">
                            <p className="text-2xl font-bold text-red-400">{labTestStats.FAIL || 0}</p>
                            <p className="text-xs text-zinc-400">Failed</p>
                        </div>
                        <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-500/20 text-center">
                            <p className="text-2xl font-bold text-amber-400">{labTestStats.INCONCLUSIVE || 0}</p>
                            <p className="text-xs text-zinc-400">Inconclusive</p>
                        </div>
                    </div>

                    {labTestsLoading ? (
                        <div className="text-center py-8 text-zinc-400">Loading lab tests...</div>
                    ) : labTests.length === 0 ? (
                        <div className="text-center py-12">
                            <FlaskConical className="h-12 w-12 mx-auto text-zinc-600 mb-3" />
                            <p className="text-zinc-400">No lab tests submitted yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-zinc-800">
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Product</th>
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Batch</th>
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Test</th>
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Result</th>
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Lab</th>
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Ingredient</th>
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {labTests.map((test) => (
                                        <tr key={test._id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                            <td className="py-3 px-4 text-zinc-300 font-mono text-xs">{test.productId}</td>
                                            <td className="py-3 px-4 text-zinc-400 font-mono text-sm">{test.batchNumber}</td>
                                            <td className="py-3 px-4"><Badge variant="info">{test.testType}</Badge></td>
                                            <td className="py-3 px-4">
                                                <Badge variant={test.result === 'PASS' ? 'success' : test.result === 'FAIL' ? 'error' : 'warning'}>
                                                    {test.result}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-zinc-300 text-sm">{test.labName}</td>
                                            <td className="py-3 px-4 text-sm">
                                                {test.activeIngredientDeclared && (
                                                    <span className="text-zinc-400">
                                                        {test.activeIngredientFound || '?'}
                                                        {test.concentrationFound && ` (${test.concentrationFound}mg)`}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-zinc-400 text-sm">
                                                {new Date(test.testedAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}

            {/* ========== REPUTATION TAB ========== */}
            {activeTab === 'reputation' && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Star className="h-5 w-5 text-yellow-400" />
                                    Reputation Scores
                                </CardTitle>
                                <CardDescription>Trust metrics for manufacturers and distributors</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={handleRecalculateReputation} disabled={reputationLoading}>
                                    <RefreshCw className={`h-4 w-4 mr-2 ${reputationLoading ? 'animate-spin' : ''}`} />
                                    Recalculate
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    {/* Tier Summary */}
                    {reputationData?.stats && (
                        <div className="grid grid-cols-4 gap-3 mb-4">
                            <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/20 text-center">
                                <p className="text-xl font-bold text-emerald-400">{reputationData.stats.trusted}</p>
                                <p className="text-xs text-zinc-400">Trusted</p>
                            </div>
                            <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-500/20 text-center">
                                <p className="text-xl font-bold text-amber-400">{reputationData.stats.monitored}</p>
                                <p className="text-xs text-zinc-400">Monitored</p>
                            </div>
                            <div className="p-3 rounded-lg bg-orange-900/20 border border-orange-500/20 text-center">
                                <p className="text-xl font-bold text-orange-400">{reputationData.stats.restricted}</p>
                                <p className="text-xs text-zinc-400">Restricted</p>
                            </div>
                            <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/20 text-center">
                                <p className="text-xl font-bold text-red-400">{reputationData.stats.suspended}</p>
                                <p className="text-xs text-zinc-400">Suspended</p>
                            </div>
                        </div>
                    )}

                    {reputationLoading ? (
                        <div className="text-center py-8 text-zinc-400">Loading reputation data...</div>
                    ) : !reputationData ? (
                        <div className="text-center py-12 text-zinc-500">No reputation data available</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-zinc-800">
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Company</th>
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Role</th>
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Score</th>
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Tier</th>
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Anomalies</th>
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Disputes</th>
                                        <th className="text-left py-3 px-4 text-zinc-400 font-medium">Handoffs</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(reputationData.users || []).map((user) => {
                                        const tierColors = {
                                            TRUSTED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                                            MONITORED: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                                            RESTRICTED: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
                                            SUSPENDED: 'bg-red-500/20 text-red-300 border-red-500/30'
                                        };
                                        const scoreColor = user.reputationScore > 80 ? 'text-emerald-400' :
                                            user.reputationScore > 50 ? 'text-amber-400' :
                                            user.reputationScore > 25 ? 'text-orange-400' : 'text-red-400';
                                        return (
                                            <tr key={user._id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                                <td className="py-3 px-4 text-zinc-200 font-medium">{user.companyName}</td>
                                                <td className="py-3 px-4">
                                                    <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`text-xl font-bold ${scoreColor}`}>{user.reputationScore}</span>
                                                    <span className="text-zinc-500 text-xs">/100</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${tierColors[user.tier] || ''}`}>
                                                        {user.tier}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-zinc-400">{user.totalAnomalies || 0}</td>
                                                <td className="py-3 px-4 text-zinc-400">{user.totalDisputes || 0}</td>
                                                <td className="py-3 px-4 text-zinc-400">{user.totalHandoffs || 0}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
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

            {/* Recall Confirmation Modal */}
            {recallModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-red-500/10">
                                <AlertTriangle className="h-5 w-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-zinc-100">Recall Batch</h3>
                                <p className="text-sm text-zinc-400">Batch: <span className="font-mono">{recallModal}</span></p>
                            </div>
                        </div>
                        <p className="text-zinc-400 text-sm mb-4">
                            This will recall all products in this batch. Products will be marked as recalled and consumers will be warned during verification.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Recall Reason</label>
                                <textarea
                                    value={recallReason}
                                    onChange={(e) => setRecallReason(e.target.value)}
                                    placeholder="Enter reason for recall..."
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:ring-2 focus:ring-red-500/50 focus:border-red-500 resize-none"
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="secondary" onClick={() => { setRecallModal(null); setRecallReason(''); }}>Cancel</Button>
                                <Button
                                    variant="danger"
                                    onClick={handleRecallBatch}
                                    disabled={recallLoading}
                                >
                                    {recallLoading ? 'Recalling...' : 'Confirm Recall'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </DashboardShell>
    );
};
