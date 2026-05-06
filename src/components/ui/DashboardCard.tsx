import React, { ReactNode } from 'react';
import { useEloraTheme } from '@/theme/ThemeProvider';

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
    const { theme, themeName } = useEloraTheme();
    const cardClassName =
        variant === 'canonical'
            ? 'border rounded-xl overflow-hidden'
            : 'border rounded-2xl overflow-hidden';
    const headerClassName =
        variant === 'canonical'
            ? 'border-b'
            : 'border-b';

    const cardShadow =
        variant === 'canonical'
            ? themeName === 'dark'
                ? '0 12px 30px rgba(2, 6, 23, 0.45)'
                : '0 8px 30px rgb(0 0 0 / 0.04)'
            : themeName === 'dark'
                ? '0 8px 24px rgba(2, 6, 23, 0.38)'
                : '0 1px 2px rgb(0 0 0 / 0.06)';

    return (
        <Component
            className={`${cardClassName} ${className}`.trim()}
            style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.cardBorder,
                boxShadow: cardShadow,
            }}
        >
            {header && (
                <div
                    className={headerClassName}
                    style={{
                        borderColor: theme.cardBorder,
                        backgroundColor: variant === 'canonical' ? undefined : theme.cardBgMuted,
                    }}
                >
                    {header}
                </div>
            )}
            <div className={bodyClassName}>{children}</div>
        </Component>
    );
}
