import React from 'react';

/**
 * Command Center Card
 * Glass-morphism, Static, Sharp.
 */
export const Card = ({
    children,
    className = '',
    padding = 'md',
    ...props
}) => {
    const paddings = {
        none: '',
        sm: 'p-3',
        md: 'p-5',
        lg: 'p-8'
    };

    return (
        <div
            className={`glass-surface rounded-md shadow-sm ${paddings[padding]} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

/**
 * Card Header
 */
export const CardHeader = ({ children, className = '' }) => (
    <div className={`border-b border-white/5 pb-3 mb-4 ${className}`}>
        {children}
    </div>
);

/**
 * Card Title
 */
export const CardTitle = ({ children, className = '' }) => (
    <h3 className={`text-sm font-semibold text-[#E6EDF3] tracking-wide uppercase ${className}`}>
        {children}
    </h3>
);

/**
 * Card Description
 */
export const CardDescription = ({ children, className = '' }) => (
    <p className={`text-xs text-[#9BA4AE] mt-0.5 ${className}`}>
        {children}
    </p>
);
