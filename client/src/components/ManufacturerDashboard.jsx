import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { Package, Calendar, Hash, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { DashboardShell } from './layout/DashboardShell';
import { Button, Card, CardHeader, CardTitle, CardDescription, Input, Badge } from './ui';

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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
        setSuccess(false);
    };

    const handleBatchSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        if (!formData.name || !formData.batchNumber || !formData.mfgDate || !formData.expDate || !formData.count) {
            setError('Please fill in all required fields');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/product/batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to register batch');
            }

            setSuccess(true);
            setBatchResults(data.products);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const resetForm = () => {
        setBatchResults([]);
        setSuccess(false);
        setFormData({
            name: '',
            batchNumber: '',
            mfgDate: '',
            expDate: '',
            count: ''
        });
    };

    return (
        <DashboardShell
            title="Register Product Batch"
            description="Generate unique IDs for every unit in your batch"
            icon={Package}
        >
            {/* Status Messages */}
            {success && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <div>
                        <p className="font-medium text-emerald-800">Batch Generated Successfully</p>
                        <p className="text-sm text-emerald-600">{batchResults.length} units recorded</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            {/* Results View */}
            {batchResults.length > 0 ? (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Generated IDs</CardTitle>
                                <CardDescription>{batchResults.length} units created</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={resetForm}>
                                    New Batch
                                </Button>
                                <Button onClick={() => window.print()}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Print Labels
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[500px] overflow-y-auto">
                        {batchResults.map((prod, idx) => (
                            <div
                                key={idx}
                                className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col items-center text-center"
                            >
                                <div className="bg-white p-2 rounded border border-slate-100 mb-2">
                                    <QRCode
                                        size={80}
                                        value={prod.productId}
                                        style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                                        viewBox="0 0 256 256"
                                    />
                                </div>
                                <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded w-full truncate">
                                    {prod.productId}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            ) : (
                /* Form View */
                <Card>
                    <form onSubmit={handleBatchSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Product Name"
                                name="name"
                                placeholder="e.g. Amoxicillin 500mg"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                            <Input
                                label="Batch Number"
                                name="batchNumber"
                                placeholder="e.g. BATCH-2024-001"
                                value={formData.batchNumber}
                                onChange={handleChange}
                                required
                            />
                            <Input
                                label="Manufacturing Date"
                                name="mfgDate"
                                type="date"
                                value={formData.mfgDate}
                                onChange={handleChange}
                                required
                            />
                            <Input
                                label="Expiry Date"
                                name="expDate"
                                type="date"
                                value={formData.expDate}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <Input
                            label="Quantity (Units to Generate)"
                            name="count"
                            type="number"
                            min="1"
                            max="1000"
                            placeholder="e.g. 100"
                            value={formData.count}
                            onChange={handleChange}
                            required
                        />
                        <p className="text-xs text-slate-500 -mt-4">
                            Maximum 1000 units per batch
                        </p>

                        <div className="flex justify-end pt-2">
                            <Button type="submit" loading={loading} size="lg">
                                {loading ? 'Generating...' : `Generate ${formData.count || ''} QR Codes`}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}
        </DashboardShell>
    );
};
