import React from 'react';

/**
 * DashboardShell - Clean layout wrapper
 * Provides consistent page structure with clear hierarchy
 */
export const DashboardShell = ({
    title,
    description,
    icon: Icon,
    children,
    actions
}) => {
    return (
        <div className="min-h-screen bg-[#111113] pt-20">
            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            {Icon && (
                                <div className="p-2 bg-zinc-800 rounded-lg">
                                    <Icon className="h-5 w-5 text-blue-400" />
                                </div>
                            )}
                            <div>
                                <h1 className="text-xl font-semibold text-zinc-100">
                                    {title}
                                </h1>
                                {description && (
                                    <p className="text-sm text-zinc-400 mt-0.5">
                                        {description}
                                    </p>
                                )}
                            </div>
                        </div>
                        {actions && (
                            <div className="flex items-center gap-2">
                                {actions}
                            </div>
                        )}
                    </div>
                </div>

                {/* Page Content */}
                <div className="space-y-6">
                    {children}
                </div>
            </div>
        </div>
    );
};
