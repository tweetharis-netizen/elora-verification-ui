import React, { ReactNode } from 'react';

interface DashboardCardProps {
    children: ReactNode;
    className?: string;
    header?: ReactNode;
    bodyClassName?: string;
    as?: 'section' | 'div';
    variant?: 'default' | 'canonical';
}

export function DashboardCard({
    children,
    className = '',
    header,
    bodyClassName = 'p-5 lg:p-6',
    as: Component = 'section',
    variant = 'default',
}: DashboardCardProps) {
    const cardClassName =
        variant === 'canonical'
            ? 'bg-white border border-[#EAEAEA] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden'
            : 'bg-white border border-[#EAE7DD] rounded-2xl shadow-sm overflow-hidden';
    const headerClassName =
        variant === 'canonical'
            ? 'border-b border-[#EAEAEA]'
            : 'border-b border-[#EAE7DD] bg-slate-50/30';

    return (
        <Component className={`${cardClassName} ${className}`.trim()}>
            {header && <div className={headerClassName}>{header}</div>}
            <div className={bodyClassName}>{children}</div>
        </Component>
    );
}
