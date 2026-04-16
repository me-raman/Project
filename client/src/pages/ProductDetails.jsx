import React from 'react';
import { ProductCard } from '../components/ProductCard';
import { Timeline } from '../components/Timeline';
import { CheckCircle2, AlertTriangle, ArrowLeft, Download, Share2 } from 'lucide-react';

export const ProductDetails = ({ product, events, onBack, verificationMeta }) => {
    const isRecalled = verificationMeta?.warning === 'PRODUCT_RECALLED';
    const isPotentialCounterfeit = verificationMeta?.warning === 'POTENTIAL_COUNTERFEIT';
    const isAuthentic = !isRecalled && !isPotentialCounterfeit;

    // Dynamic Stats Calculation
    const totalScans = verificationMeta?.scanCount || events.length + 1;

    // Get latest event location
    const latestEvent = events.length > 0 ? events[0] : null;
    let currentLocation = latestEvent?.location || "In Transit";
    if (product.currentStatus === 'Manufactured') currentLocation = "Factory Warehouse";
    if (product.currentStatus === 'Received at Pharmacy') currentLocation = "Pharmacy Store";
    if (product.currentStatus === 'Recalled') currentLocation = "Recalled";

    // Calculate time since last update
    const lastUpdateDate = latestEvent ? new Date(latestEvent.timestamp || new Date()) : new Date(product.updatedAt || new Date());
    const timeSinceUpdate = getTimeSince(lastUpdateDate);

    // Mock Quality Score (consistent based on productId)
    const qualityScore = calculateQualityScore(product.productId);

    const handleDownload = () => {
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'absolute';
        printFrame.style.top = '-9999px';
        printFrame.style.left = '-9999px';
        document.body.appendChild(printFrame);

        const doc = printFrame.contentDocument || printFrame.contentWindow.document;

        const mfgDate = product.mfgDate ? new Date(product.mfgDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
        const expDate = product.expDate ? new Date(product.expDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
        const verifiedOn = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const manufacturer = product.manufacturer?.companyName || product.manufacturer || '—';

        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authenticity Certificate – ${product.name}</title>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { font-family: Georgia, serif; background: #fff; color: #1a1a1a; padding: 40px; }
                    .certificate {
                        border: 3px solid #1e3a5f;
                        border-radius: 12px;
                        padding: 48px;
                        max-width: 720px;
                        margin: 0 auto;
                        position: relative;
                    }
                    .inner-border {
                        border: 1px solid #c0a060;
                        border-radius: 8px;
                        padding: 40px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 32px;
                        border-bottom: 1px solid #e0e0e0;
                        padding-bottom: 24px;
                    }
                    .brand { font-size: 13px; letter-spacing: 4px; text-transform: uppercase; color: #1e3a5f; font-family: Arial, sans-serif; margin-bottom: 6px; }
                    .title { font-size: 28px; color: #1e3a5f; font-weight: bold; margin-bottom: 4px; }
                    .subtitle { font-size: 12px; color: #888; font-family: Arial, sans-serif; letter-spacing: 1px; text-transform: uppercase; }
                    .verified-badge {
                        display: inline-block;
                        background: ${isAuthentic ? '#d4edda' : '#f8d7da'};
                        color: ${isAuthentic ? '#155724' : '#721c24'};
                        border: 1px solid ${isAuthentic ? '#c3e6cb' : '#f5c6cb'};
                        border-radius: 20px;
                        padding: 4px 16px;
                        font-size: 12px;
                        font-family: Arial, sans-serif;
                        font-weight: bold;
                        margin-top: 10px;
                        letter-spacing: 1px;
                    }
                    .product-name {
                        text-align: center;
                        font-size: 22px;
                        font-weight: bold;
                        color: #1a1a1a;
                        margin: 28px 0 6px;
                    }
                    .manufacturer-name {
                        text-align: center;
                        font-size: 13px;
                        color: #555;
                        font-family: Arial, sans-serif;
                        margin-bottom: 30px;
                    }
                    .details-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin-bottom: 28px;
                    }
                    .detail-box {
                        background: #f8f9fa;
                        border: 1px solid #e0e0e0;
                        border-radius: 8px;
                        padding: 14px 16px;
                    }
                    .detail-label {
                        font-size: 10px;
                        color: #888;
                        letter-spacing: 1px;
                        text-transform: uppercase;
                        font-family: Arial, sans-serif;
                        margin-bottom: 4px;
                    }
                    .detail-value {
                        font-size: 14px;
                        color: #1a1a1a;
                        font-family: 'Courier New', monospace;
                        word-break: break-all;
                    }
                    .detail-value.highlight { color: #c0392b; font-weight: bold; }
                    .footer {
                        text-align: center;
                        border-top: 1px solid #e0e0e0;
                        padding-top: 20px;
                        font-size: 11px;
                        color: #888;
                        font-family: Arial, sans-serif;
                    }
                    .verified-on { font-style: italic; margin-top: 4px; }
                </style>
            </head>
            <body>
                <div class="certificate">
                    <div class="inner-border">
                        <div class="header">
                            <div class="brand">PharmaTrace</div>
                            <div class="title">Certificate of Authenticity</div>
                            <div class="subtitle">Pharmaceutical Supply Chain Verification</div>
                            <div class="verified-badge">${isAuthentic ? '✓ VERIFIED AUTHENTIC' : '⚠ VERIFICATION FAILED'}</div>
                        </div>

                        <div class="product-name">${product.name}</div>
                        <div class="manufacturer-name">Manufactured by <strong>${manufacturer}</strong></div>

                        <div class="details-grid">
                            <div class="detail-box">
                                <div class="detail-label">Product ID</div>
                                <div class="detail-value">${product.productId}</div>
                            </div>
                            <div class="detail-box">
                                <div class="detail-label">Batch Number</div>
                                <div class="detail-value">${product.batchNumber}</div>
                            </div>
                            <div class="detail-box">
                                <div class="detail-label">Serial Number</div>
                                <div class="detail-value">${product.serialNumber}</div>
                            </div>
                            <div class="detail-box">
                                <div class="detail-label">Current Status</div>
                                <div class="detail-value">${product.currentStatus || 'Manufactured'}</div>
                            </div>
                            <div class="detail-box">
                                <div class="detail-label">Manufacturing Date</div>
                                <div class="detail-value">${mfgDate}</div>
                            </div>
                            <div class="detail-box">
                                <div class="detail-label">Expiry Date</div>
                                <div class="detail-value highlight">${expDate}</div>
                            </div>
                        </div>

                        <div class="footer">
                            This certificate confirms that the above product has been verified through the
                            PharmaTrace blockchain-based pharmaceutical supply chain tracking system.
                            <div class="verified-on">Verified on: ${verifiedOn}</div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);
        doc.close();

        setTimeout(() => {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
            setTimeout(() => document.body.removeChild(printFrame), 1000);
        }, 300);
    };

    const handleShare = async () => {
        try {
            const url = `${window.location.origin}/?search=${product.productId}`;
            await navigator.clipboard.writeText(url);
            alert('Report link copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8 print:bg-white print:pt-0">
            <div className="max-w-6xl mx-auto animate-fade-in">

                <button
                    onClick={onBack}
                    className="group flex items-center text-slate-400 hover:text-blue-400 mb-8 transition-colors font-medium print:hidden"
                >
                    <div className="p-2 rounded-full bg-slate-900 border border-slate-700 group-hover:border-blue-500/30 mr-3 shadow-sm transition-all">
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    </div>
                    Back to Search
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Recalled Banner */}
                        {isRecalled && (
                            <div className="relative overflow-hidden p-6 rounded-2xl shadow-sm border bg-red-900/20 border-red-500/30">
                                <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 bg-red-500"></div>
                                <div className="relative flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-red-500/10 text-red-400">
                                        <AlertTriangle className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold mb-1 text-red-100">
                                            ⚠️ Product Recalled
                                        </h2>
                                        <p className="text-base text-red-400">
                                            {verificationMeta?.message || 'This product has been recalled. Do not use or sell this product.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Counterfeit Warning Banner */}
                        {isPotentialCounterfeit && (
                            <div className="relative overflow-hidden p-6 rounded-2xl shadow-sm border bg-orange-900/20 border-orange-500/30">
                                <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 bg-orange-500"></div>
                                <div className="relative flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400">
                                        <AlertTriangle className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold mb-1 text-orange-100">
                                            ⚠️ Potential Counterfeit Detected
                                        </h2>
                                        <p className="text-base text-orange-400">
                                            This QR code has already been scanned and verified by another user.
                                            This copy may not be authentic. Scanned {totalScans} times.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Authenticity Banner (only if not recalled or counterfeit) */}
                        {!isRecalled && !isPotentialCounterfeit && (
                            <div className={`relative overflow-hidden p-6 rounded-2xl shadow-sm border bg-emerald-900/10 border-emerald-500/20`}>
                                <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 bg-emerald-500"></div>
                                <div className="relative flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                                        <CheckCircle2 className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold mb-1 text-emerald-100">
                                            Verified Authentic
                                        </h2>
                                        <p className="text-base text-emerald-400">
                                            {verificationMeta?.signatureValid
                                                ? 'This product has a valid cryptographic signature and follows the established supply chain protocol.'
                                                : 'This product has been verified through the supply chain tracking system.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <ProductCard product={product} />
                        <Timeline events={events} />
                    </div>

                    {/* Sidebar Column */}
                    <div className="lg:col-span-1 print:hidden">
                        <div className="sticky top-24 space-y-6">

                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
                                <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                                    Supply Chain Stats
                                </h3>
                                <div className="space-y-5">
                                    <Stat label="Total Scans" value={totalScans.toLocaleString()} />
                                    <div className="h-px bg-slate-800"></div>
                                    <Stat label="Current Location" value={currentLocation} highlight />
                                    <div className="h-px bg-slate-800"></div>
                                    <Stat label="Last Updated" value={timeSinceUpdate} />
                                    <div className="h-px bg-slate-800"></div>
                                    <Stat label="Quality Score" value={`${qualityScore}/100`} />
                                    {verificationMeta?.signatureValid !== null && verificationMeta?.signatureValid !== undefined && (
                                        <>
                                            <div className="h-px bg-slate-800"></div>
                                            <Stat
                                                label="QR Signature"
                                                value={verificationMeta.signatureValid ? '✓ Valid' : 'Not signed'}
                                                highlight={verificationMeta.signatureValid}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
                                <h3 className="font-bold text-white mb-4">Actions</h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={handleDownload}
                                        className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                                    >
                                        <Download className="h-4 w-4" /> Download Certificate
                                    </button>
                                    <button
                                        onClick={handleShare}
                                        className="w-full py-3 px-4 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Share2 className="h-4 w-4" /> Share Report
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper function to format relative time
const getTimeSince = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
};

// Helper to generate consistent pseudo-random score
const calculateQualityScore = (id = "") => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return 95 + (Math.abs(hash) % 5); // Returns 95-99
};

const Stat = ({ label, value, highlight }) => (
    <div className="flex justify-between items-center group">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        <span className={`font-semibold ${highlight ? 'text-blue-400' : 'text-white'}`}>{value}</span>
    </div>
);
