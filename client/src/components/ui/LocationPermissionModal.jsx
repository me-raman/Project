import React from 'react';
import { MapPin, ShieldAlert, RefreshCw, X, Loader2 } from 'lucide-react';

/**
 * LocationPermissionModal — Displays contextual geolocation permission UI.
 *
 * Props:
 *   - visible: boolean
 *   - mode: 'prompt' | 'denied' | 'fetching' | 'error'
 *   - errorMessage: string | null
 *   - onAllow: () => void  (triggers getCurrentPosition / retry)
 *   - onDismiss: () => void  (closes the modal without action)
 */
export const LocationPermissionModal = ({ visible, mode, errorMessage, onAllow, onDismiss }) => {
    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md mx-4 rounded-2xl glass border border-white/10 shadow-2xl animate-scale-in overflow-hidden">
                {/* Header */}
                <div className="relative px-6 pt-6 pb-4">
                    <button
                        onClick={onDismiss}
                        className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    {/* Icon */}
                    <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                        mode === 'denied' 
                            ? 'bg-red-500/15 border border-red-500/20'
                            : mode === 'error'
                            ? 'bg-amber-500/15 border border-amber-500/20'
                            : mode === 'fetching'
                            ? 'bg-blue-500/15 border border-blue-500/20'
                            : 'bg-blue-500/15 border border-blue-500/20'
                    }`}>
                        {mode === 'fetching' ? (
                            <Loader2 className="h-7 w-7 text-blue-400 animate-spin" />
                        ) : mode === 'denied' ? (
                            <ShieldAlert className="h-7 w-7 text-red-400" />
                        ) : mode === 'error' ? (
                            <ShieldAlert className="h-7 w-7 text-amber-400" />
                        ) : (
                            <MapPin className="h-7 w-7 text-blue-400" />
                        )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-white text-center">
                        {mode === 'fetching' && 'Acquiring GPS Coordinates...'}
                        {mode === 'prompt' && 'Location Access Required'}
                        {mode === 'denied' && 'Location Access Blocked'}
                        {mode === 'error' && 'Location Unavailable'}
                    </h3>
                </div>

                {/* Body */}
                <div className="px-6 pb-6">
                    {/* Prompt mode */}
                    {mode === 'prompt' && (
                        <>
                            <p className="text-sm text-zinc-400 text-center mb-4 leading-relaxed">
                                PharmaTrace requires your <span className="text-zinc-200 font-medium">exact GPS location</span> to 
                                cryptographically anchor this supply chain action. This prevents counterfeit products from 
                                entering the pharmaceutical pipeline.
                            </p>
                            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 mb-5">
                                <p className="text-xs text-blue-300/80 text-center">
                                    📍 Your coordinates are stored only for this transaction and are used exclusively for supply chain integrity verification.
                                </p>
                            </div>
                            <button
                                onClick={onAllow}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 text-white font-semibold text-sm shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all duration-300"
                            >
                                <MapPin className="h-4 w-4 inline mr-2 -mt-0.5" />
                                Allow Location Access
                            </button>
                        </>
                    )}

                    {/* Fetching mode */}
                    {mode === 'fetching' && (
                        <p className="text-sm text-zinc-400 text-center leading-relaxed">
                            Please wait while we capture your GPS coordinates for this supply chain action...
                        </p>
                    )}

                    {/* Denied mode */}
                    {mode === 'denied' && (
                        <>
                            <p className="text-sm text-zinc-400 text-center mb-4 leading-relaxed">
                                Location access has been blocked. PharmaTrace <span className="text-red-400 font-medium">cannot process this action</span> without 
                                verified GPS coordinates. Please enable location access in your browser:
                            </p>

                            <div className="space-y-2 mb-5">
                                <BrowserInstruction
                                    browser="Chrome"
                                    steps="Click the lock icon (🔒) in the address bar → Site settings → Location → Allow"
                                />
                                <BrowserInstruction
                                    browser="Firefox"
                                    steps='Click the lock icon (🔒) → Clear permissions → Reload the page'
                                />
                                <BrowserInstruction
                                    browser="Safari"
                                    steps="Safari → Settings → Websites → Location → Find this site → Allow"
                                />
                            </div>

                            <button
                                onClick={onAllow}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-sm shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all duration-300"
                            >
                                <RefreshCw className="h-4 w-4 inline mr-2 -mt-0.5" />
                                Retry Location Access
                            </button>
                        </>
                    )}

                    {/* Error mode (timeout, position unavailable) */}
                    {mode === 'error' && (
                        <>
                            <p className="text-sm text-zinc-400 text-center mb-4 leading-relaxed">
                                {errorMessage || 'An unexpected error occurred while acquiring your location.'}
                            </p>
                            <button
                                onClick={onAllow}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-sm shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all duration-300"
                            >
                                <RefreshCw className="h-4 w-4 inline mr-2 -mt-0.5" />
                                Retry
                            </button>
                        </>
                    )}

                    {/* Cancel link (all modes except fetching) */}
                    {mode !== 'fetching' && (
                        <button
                            onClick={onDismiss}
                            className="w-full mt-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
                        >
                            Cancel Action
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Small helper for browser-specific instructions in denied mode.
 */
const BrowserInstruction = ({ browser, steps }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
        <span className="text-xs font-bold text-zinc-300 shrink-0 mt-0.5 w-14">{browser}</span>
        <p className="text-xs text-zinc-500 leading-relaxed">{steps}</p>
    </div>
);
