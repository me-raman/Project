import React from 'react';

/**
 * Button - Clean, professional with gradient options
 */
export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    className = '',
    ...props
}) => {
    const baseStyles = `
        inline-flex items-center justify-center
        font-medium rounded-xl
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0d10]
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
    `;

    const variants = {
        primary: 'bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] shimmer-btn',
        secondary: 'glass hover:bg-white/10 text-zinc-200 border border-white/10',
        ghost: 'text-zinc-400 hover:text-white hover:bg-white/5',
        success: 'bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] shimmer-btn',
        danger: 'bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 text-white shadow-[0_0_20px_rgba(225,29,72,0.3)] shimmer-btn'
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )}
            {children}
        </button>
    );
};
