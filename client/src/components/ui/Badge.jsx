import React from 'react';

/**
 * Command Center Badge
 * High Contrast, Static.
 */
export const Badge = ({
    children,
    variant = 'default',
    className = ''
}) => {
    const variants = {
        default: 'bg-white/10 text-[#E6EDF3] border-white/5',
        success: 'bg-[#16A34A]/20 text-[#16A34A] border-[#16A34A]/30',
        warning: 'bg-[#D97706]/20 text-[#D97706] border-[#D97706]/30',
        danger: 'bg-[#DC2626]/20 text-[#DC2626] border-[#DC2626]/30',
        info: 'bg-[#2563EB]/20 text-[#2563EB] border-[#2563EB]/30'
    };

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase border tracking-tighter ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};
