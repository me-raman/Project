import React from 'react';

/**
 * Badge - Subtle status indicators
 * Used sparingly for key status information
 */
export const Badge = ({
    children,
    variant = 'default',
    className = ''
}) => {
    const variants = {
        default: 'bg-zinc-800/80 text-zinc-300 border-zinc-700/50',
        success: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
        warning: 'bg-amber-900/40 text-amber-400 border-amber-800/50 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
        danger: 'bg-rose-900/40 text-rose-400 border-rose-800/50 shadow-[0_0_10px_rgba(225,29,72,0.1)]',
        info: 'bg-blue-900/40 text-blue-400 border-blue-800/50 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
    };
    
    // Dot colors matching text
    const dots = {
        default: 'bg-zinc-400',
        success: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
        warning: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
        danger: 'bg-rose-400 shadow-[0_0_8px_rgba(225,29,72,0.8)]',
        info: 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]'
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium backdrop-blur-sm transition-all ${variants[variant]} ${className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dots[variant]} ${variant !== 'default' ? 'animate-pulse' : ''}`}></span>
            {children}
        </span>
    );
};
