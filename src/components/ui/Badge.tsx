import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

const Badge = ({ className, variant = 'default', size = 'md', children, ...props }: BadgeProps) => {
  const variants = {
    default: 'bg-surface-cream text-text-secondary border border-border-subtle',
    success: 'bg-state-success-bg text-state-success-text border border-state-success-text/20',
    warning: 'bg-state-warning-bg text-state-warning-text border border-state-warning-text/20',
    error: 'bg-state-error-bg text-state-error-text border border-state-error-text/20',
    info: 'bg-state-info-bg text-state-info-text border border-state-info-text/20',
    purple: 'bg-elora-primary/10 text-elora-deep border border-elora-primary/20',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export { Badge };
