import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Package, CheckCircle, AlertCircle, Printer, Plus, Send, Lock, Users } from 'lucide-react';
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
    const [recentBatches, setRecentBatches] = useState([]);
    const [geoCoords, setGeoCoords] = useState(null);
    const [batchMeta, setBatchMeta] = useState(null); // auditStatus, quantityLocked, declaredQuantity
    const [shipModal, setShipModal] = useState(null);
    const [shipLoading, setShipLoading] = useState(false);
    const [distributors, setDistributors] = useState([]);
    const [selectedReceiver, setSelectedReceiver] = useState('');

    useEffect(() => {
        fetchRecentBatches();
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

        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            // Capture fresh geolocation at submit time
            let latitude, longitude;
            try {
                const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 5000
                    });
                });
                latitude = pos.coords.latitude;
                longitude = pos.coords.longitude;
                setGeoCoords({ latitude, longitude });
            } catch (geoErr) {
                console.log('Geolocation not available at submit:', geoErr.message);
                // Fall back to previously acquired coordinates
                if (geoCoords) {
                    latitude = geoCoords.latitude;
                    longitude = geoCoords.longitude;
                }
            }

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
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
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
        <DashboardShell
            title="Register products"
            description="Generate unique identifiers for your product batch"
            icon={Package}
            actions={batchResults.length > 0 && (
                <div className="flex gap-2">
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
                                        value={prod.qrPayload || prod.productId}
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
                        <CardTitle>Batch details</CardTitle>
                        <CardDescription>Enter product information to generate QR codes</CardDescription>
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
                            type="number"
                            min="1"
                            max="1000"
                            placeholder="Number of units to generate"
                            value={formData.count}
                            onChange={handleChange}
                            required
                        />
                        <p className="text-xs text-zinc-500 -mt-3">
                            Maximum 1000 units per batch
                        </p>


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
                                                        // Fetch distributors for the receiver picker
                                                        try {
                                                            const token = sessionStorage.getItem('token');
                                                            const res = await fetch('/api/auth/users-by-role/Distributor', {
                                                                headers: { 'x-auth-token': token }
                                                            });
                                                            if (res.ok) {
                                                                const data = await res.json();
                                                                setDistributors(data);
                                                            }
                                                        } catch (err) {
                                                            console.error('Failed to fetch distributors:', err);
                                                        }
                                                        setShipModal(batch);
                                                    }}
                                                >
                                                    <Send className="h-3 w-3 mr-1" />
                                                    Ship
                                                </Button>
                                            )}
                                            <div className="text-right">
                                                <Badge variant={batch.currentStatus === 'Manufactured' ? 'info' : 'success'}>
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
                        Select the distributor you are shipping to. They must confirm receipt before the product status updates.
                    </p>

                    {/* Receiver Selector */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            <Users className="h-4 w-4 inline mr-1" />
                            Ship to (Distributor) *
                        </label>
                        {distributors.length === 0 ? (
                            <p className="text-sm text-zinc-500 italic">Loading distributors...</p>
                        ) : (
                            <select
                                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={selectedReceiver}
                                onChange={(e) => setSelectedReceiver(e.target.value)}
                            >
                                <option value="">-- Select a distributor --</option>
                                {distributors.map((d) => (
                                    <option key={d._id} value={d._id}>
                                        {d.companyName} ({d.location})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => { setShipModal(null); setSelectedReceiver(''); }}>Cancel</Button>
                        <Button
                            loading={shipLoading}
                            disabled={!selectedReceiver}
                            onClick={async () => {
                                setShipLoading(true);
                                try {
                                    const token = sessionStorage.getItem('token');
                                    // Get products from the batch to ship
                                    const prodRes = await fetch(`/api/product/batch/${encodeURIComponent(shipModal.batchNumber)}`, {
                                        headers: { 'x-auth-token': token }
                                    });
                                    if (prodRes.ok) {
                                        const products = await prodRes.json();
                                        let shipped = 0, failed = 0;
                                        for (const prod of products.slice(0, 10)) {
                                            const shipRes = await fetch(`/api/track/ship/${encodeURIComponent(prod.productId)}`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                                                body: JSON.stringify({
                                                    receiverId: selectedReceiver,
                                                    notes: `Shipped batch ${shipModal.batchNumber}`,
                                                    latitude: geoCoords?.latitude,
                                                    longitude: geoCoords?.longitude
                                                })
                                            });
                                            if (shipRes.ok) shipped++; else failed++;
                                        }
                                        if (failed > 0) setError(`${shipped} shipped, ${failed} failed`);
                                    }
                                    setShipModal(null);
                                    setSelectedReceiver('');
                                    fetchRecentBatches();
                                } catch (err) {
                                    setError(err.message);
                                } finally {
                                    setShipLoading(false);
                                }
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
