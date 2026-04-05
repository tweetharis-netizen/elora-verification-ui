import React, { ReactNode } from 'react';

interface DashboardSectionHeaderProps {
    title: string;
    subtitle?: string;
    badge?: ReactNode;
    action?: ReactNode;
    icon?: ReactNode;
    className?: string;
    variant?: 'default' | 'canonical';
}

export function DashboardSectionHeader({
    title,
    subtitle,
    badge,
    action,
    icon,
    className = '',
    variant = 'default',
}: DashboardSectionHeaderProps) {
    const titleClassName = variant === 'canonical'
        ? 'text-[22px] leading-tight font-semibold tracking-tight text-slate-800'
        : 'text-sm font-semibold tracking-tight text-slate-800';
    const subtitleClassName = variant === 'canonical'
        ? 'mt-1 text-sm text-slate-500 leading-relaxed'
        : 'mt-1 text-xs text-slate-500 leading-relaxed';

    return (
        <div className={`flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between ${className}`.trim()}>
            <div className="min-w-0 flex items-start gap-3">
                {icon && <div className="shrink-0 mt-0.5 text-slate-500">{icon}</div>}
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className={titleClassName}>{title}</h3>
                        {badge}
                    </div>
                    {subtitle && <p className={subtitleClassName}>{subtitle}</p>}
                </div>
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}
