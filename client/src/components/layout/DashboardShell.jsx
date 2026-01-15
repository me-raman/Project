import React from 'react';

/**
 * Command Center Dashboard Shell
 * High Density, Static, Heavy.
 */
export const DashboardShell = ({
    title,
    description,
    icon: Icon,
    children,
    actions
}) => {
    return (
        <div className="max-w-[1400px] mx-auto px-6 py-6 min-h-screen">
            {/* System Header */}
            <div className="mb-10 border-b border-white/10 pb-6 flex items-end justify-between">
                <div className="flex items-center gap-4">
                    {Icon && (
                        <div className="p-2.5 bg-white/5 border border-white/10 rounded-sm">
                            <Icon className="h-5 w-5 text-blue-500" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-xl font-mono-data uppercase tracking-[0.2em] text-[#E6EDF3]">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-[10px] uppercase tracking-widest text-[#6B7280] mt-1">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                {actions && (
                    <div className="flex items-center gap-3">
                        {actions}
                    </div>
                )}
            </div>

            {/* Terminal Content Area */}
            <div className="grid grid-cols-12 gap-6">
                <main className="col-span-12 space-y-6">
                    {children}
                </main>
            </div>
        </div>
    );
};
