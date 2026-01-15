import React from 'react';

/**
 * Command Center Input
 * Dark Glass, High Contrast.
 */
export const Input = ({
    label,
    error,
    className = '',
    mono = false,
    ...props
}) => {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#9BA4AE]">
                    {label}
                </label>
            )}
            <input
                className={`
                    block w-full px-3 py-2 rounded-sm border
                    bg-white/5 border-white/10
                    text-[#E6EDF3] placeholder:text-[#6B7280]
                    focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50
                    disabled:opacity-30
                    ${mono ? 'font-mono-data text-xs' : 'text-sm'}
                    ${error ? 'border-red-500/50' : 'border-white/10'}
                    ${className}
                `}
                {...props}
            />
            {error && (
                <p className="text-[10px] text-red-500 uppercase tracking-tighter">{error}</p>
            )}
        </div>
    );
};

export const Select = ({
    label,
    options = [],
    placeholder = 'SELECT...',
    className = '',
    ...props
}) => {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#9BA4AE]">
                    {label}
                </label>
            )}
            <select
                className={`
                    block w-full px-3 py-2 rounded-sm border
                    bg-[#0F1720] border-white/10
                    text-[#E6EDF3] text-sm
                    focus:outline-none focus:ring-1 focus:ring-blue-500/50
                    ${className}
                `}
                {...props}
            >
                <option value="" className="bg-[#0A0F14]">{placeholder}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#0A0F14]">
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export const Textarea = ({
    label,
    className = '',
    ...props
}) => {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#9BA4AE]">
                    {label}
                </label>
            )}
            <textarea
                className={`
                    block w-full px-3 py-2 rounded-sm border
                    bg-white/5 border-white/10
                    text-[#E6EDF3] text-sm placeholder:text-[#6B7280]
                    focus:outline-none focus:ring-1 focus:ring-blue-500/50
                    resize-none
                    ${className}
                `}
                {...props}
            />
        </div>
    );
};
