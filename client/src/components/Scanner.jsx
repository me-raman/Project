import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Loader2 } from 'lucide-react';

export const Scanner = ({ onScan, onClose }) => {
    const [loading, setLoading] = useState(true);
    const scannerRef = useRef(null);

    useEffect(() => {
        let scanner = null;
        let mounted = true;

        const startScanner = async () => {
            try {
                // Ensure element exists
                if (!document.getElementById("reader")) return;

                scanner = new Html5Qrcode("reader");
                scannerRef.current = scanner;

                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    (decodedText) => {
                        if (mounted) {
                            onScan(decodedText);
                        }
                    },
                    () => {
                        // ignore scan failures
                    }
                );

                if (mounted) setLoading(false);

            } catch (err) {
                console.error("Error starting scanner:", err);
                if (mounted) setLoading(false);
            }
        };

        // Small delay to ensure DOM is ready and previous instances cleared
        const timer = setTimeout(startScanner, 100);

        return () => {
            mounted = false;
            clearTimeout(timer);
            if (scanner && scanner.isScanning) {
                scanner.stop()
                    .then(() => scanner.clear())
                    .catch(error => console.error("Failed to stop scanner", error));
            }
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
            <div className="glass-purple rounded-2xl w-full max-w-md overflow-hidden border border-white/10 shadow-2xl relative animate-scale-in">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 glass hover:bg-white/10 rounded-full transition-colors"
                >
                    <X className="h-5 w-5 text-white" />
                </button>

                <div className="p-6">
                    <h3 className="text-xl font-bold text-center mb-4 text-white">Scan QR Code</h3>

                    <div className="relative overflow-hidden rounded-xl bg-black/40 min-h-[320px] border border-white/5">
                        {loading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400">
                                <Loader2 className="h-8 w-8 animate-spin mb-2 text-blue-400" />
                                <span className="text-sm">Initializing Camera...</span>
                            </div>
                        )}
                        <div id="reader" className="w-full h-full"></div>
                    </div>

                    <p className="text-center text-sm text-zinc-400 mt-4 px-4">
                        Center the QR code within the frame to verify product authenticity.
                    </p>
                </div>
            </div>
        </div>
    );
};
