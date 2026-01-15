import React from 'react';

/**
 * Card - Glass morphism surface
 */
export const Card = ({
    children,
    className = '',
    padding = 'md',
    ...props
}) => {
    const paddings = {
        none: '',
        sm: 'p-4',
        md: 'p-5',
        lg: 'p-6'
    };

    return (
        <div
            className={`glass rounded-xl ${paddings[padding]} ${className}`}
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
    <div className={`mb-4 ${className}`}>
        {children}
    </div>
);

/**
 * Card Title
 */
export const CardTitle = ({ children, className = '' }) => (
    <h3 className={`text-base font-semibold text-white ${className}`}>
        {children}
    </h3>
);

/**
 * Card Description
 */
export const CardDescription = ({ children, className = '' }) => (
    <p className={`text-sm text-zinc-400 mt-1 ${className}`}>
        {children}
    </p>
);
