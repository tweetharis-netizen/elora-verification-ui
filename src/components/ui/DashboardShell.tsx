import React, { ReactNode } from 'react';

interface DashboardShellProps {
    children: ReactNode;
    className?: string;
    contentClassName?: string;
}

export function DashboardShell({
    children,
    className = '',
    contentClassName = '',
}: DashboardShellProps) {
    return (
        <div className={`flex-1 overflow-y-auto p-6 lg:p-8 ${className}`.trim()}>
            <div className={`mx-auto max-w-7xl space-y-6 ${contentClassName}`.trim()}>
                {children}
            </div>
        </div>
    );
}
