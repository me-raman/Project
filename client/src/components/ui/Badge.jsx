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
        default: 'bg-zinc-800 text-zinc-300',
        success: 'bg-green-900/50 text-green-400 border border-green-800',
        warning: 'bg-amber-900/50 text-amber-400 border border-amber-800',
        danger: 'bg-red-900/50 text-red-400 border border-red-800',
        info: 'bg-blue-900/50 text-blue-400 border border-blue-800'
    };

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};
