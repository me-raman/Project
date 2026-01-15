import React from 'react';

/**
 * Command Center Button
 * Static, Heavy, Flat. No Animations.
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
    // Base styles: Heavy, static, no transitions
    const baseStyles = 'inline-flex items-center justify-center font-medium border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-[#0A0F14] disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wider text-xs';

    const variants = {
        primary: 'bg-[#E6EDF3] text-[#0A0F14]', // High contrast white
        secondary: 'bg-[#1f2937] text-[#E6EDF3] border border-white/10',
        success: 'bg-[#16A34A] text-white',
        danger: 'bg-[#DC2626] text-white',
        ghost: 'bg-transparent text-[#9BA4AE] border border-white/5'
    };

    const sizes = {
        sm: 'px-3 py-1',
        md: 'px-6 py-2.5',
        lg: 'px-8 py-3 text-sm'
    };

    const borderRadius = 'rounded-sm'; // Sharp but not brutal

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${borderRadius} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )}
            {children}
        </button>
    );
};
