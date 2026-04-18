import React from 'react';

/**
 * Input - Clear, accessible form inputs
 */
export const Input = ({
    label,
    error,
    className = '',
    ...props
}) => {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-sm font-medium text-zinc-300">
                    {label}
                </label>
            )}
            <input
                className={`
                    block w-full px-4 py-3 rounded-xl
                    bg-zinc-900/50 backdrop-blur-sm border border-zinc-700/50
                    text-zinc-100 placeholder:text-zinc-600
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-zinc-900/80
                    hover:border-zinc-600/50 transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${error ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500' : ''}
                    ${className}
                `}
                {...props}
            />
            {error && (
                <p className="text-sm text-red-400">{error}</p>
            )}
        </div>
    );
};

/**
 * Select - Dropdown with consistent styling
 */
export const Select = ({
    label,
    options = [],
    placeholder = 'Select an option',
    className = '',
    ...props
}) => {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-sm font-medium text-zinc-300">
                    {label}
                </label>
            )}
            <select
                className={`
                    block w-full px-4 py-3 rounded-xl
                    bg-zinc-900/50 backdrop-blur-sm border border-zinc-700/50
                    text-zinc-100
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-zinc-900/80
                    hover:border-zinc-600/50 transition-all duration-200
                    ${className}
                `}
                {...props}
            >
                <option value="" className="bg-zinc-900">{placeholder}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-zinc-900">
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

/**
 * Textarea - Multi-line input
 */
export const Textarea = ({
    label,
    className = '',
    ...props
}) => {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-sm font-medium text-zinc-300">
                    {label}
                </label>
            )}
            <textarea
                className={`
                    block w-full px-4 py-3 rounded-xl
                    bg-zinc-900/50 backdrop-blur-sm border border-zinc-700/50
                    text-zinc-100 placeholder:text-zinc-600
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-zinc-900/80
                    hover:border-zinc-600/50 transition-all duration-200
                    resize-none
                    ${className}
                `}
                {...props}
            />
        </div>
    );
};
