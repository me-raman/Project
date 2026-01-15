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
                    block w-full px-3 py-2 rounded-lg
                    bg-zinc-900 border border-zinc-700
                    text-zinc-100 placeholder:text-zinc-500
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${error ? 'border-red-500 focus:ring-red-500' : ''}
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
                    block w-full px-3 py-2 rounded-lg
                    bg-zinc-900 border border-zinc-700
                    text-zinc-100
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
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
                    block w-full px-3 py-2 rounded-lg
                    bg-zinc-900 border border-zinc-700
                    text-zinc-100 placeholder:text-zinc-500
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    resize-none
                    ${className}
                `}
                {...props}
            />
        </div>
    );
};
