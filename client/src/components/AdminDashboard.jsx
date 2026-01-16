import React, { useState, useEffect } from 'react';
import { Shield, Users, Package, Truck, Edit, Trash2, X, RefreshCw } from 'lucide-react';
import { DashboardShell } from './layout/DashboardShell';
import { Button, Card, CardHeader, CardTitle, CardDescription, Input, Select, Badge } from './ui';

export const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const headers = { 'x-auth-token': token };

            const [usersRes, statsRes] = await Promise.all([
                fetch('/api/auth/admin/users', { headers }),
                fetch('/api/auth/admin/stats', { headers })
            ]);

            if (!usersRes.ok || !statsRes.ok) {
                throw new Error('Failed to fetch admin data');
            }

            const [usersData, statsData] = await Promise.all([
                usersRes.json(),
                statsRes.json()
            ]);

            setUsers(usersData);
            setStats(statsData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async () => {
        try {
            const token = localStorage.getItem('token');
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
            const token = localStorage.getItem('token');
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

    const getRoleBadgeVariant = (role) => {
        const variants = {
            Admin: 'error',
            Manufacturer: 'info',
            Distributor: 'warning',
            Customer: 'success',
            Pharmacy: 'success',
            Retailer: 'warning'
        };
        return variants[role] || 'default';
    };

    return (
        <DashboardShell
            title="Admin Dashboard"
            description="Manage users and view system statistics"
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
                            <p className="text-3xl font-bold text-zinc-100">{stats.usersByRole?.Manufacturer || 0}</p>
                            <p className="text-sm text-zinc-400">Manufacturers</p>
                        </div>
                    </Card>
                    <Card className="text-center">
                        <div className="flex flex-col items-center gap-2">
                            <Truck className="h-8 w-8 text-yellow-400" />
                            <p className="text-3xl font-bold text-zinc-100">{stats.usersByRole?.Distributor || 0}</p>
                            <p className="text-sm text-zinc-400">Distributors</p>
                        </div>
                    </Card>
                    <Card className="text-center">
                        <div className="flex flex-col items-center gap-2">
                            <Users className="h-8 w-8 text-purple-400" />
                            <p className="text-3xl font-bold text-zinc-100">{stats.usersByRole?.Customer || 0}</p>
                            <p className="text-sm text-zinc-400">Customers</p>
                        </div>
                    </Card>
                </div>
            )}

            {/* Users Table */}
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

            {/* Edit Modal */}
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
