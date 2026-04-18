import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'elora-gold' | 'teacher' | 'student' | 'parent' | 'success' | 'warning' | 'error' | 'info' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, asChild, ...props }, ref) => {
    const baseClasses = cn(
      'inline-flex items-center justify-center gap-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-elora-primary/20 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
      {
        'bg-elora-primary text-surface-white hover:bg-elora-deep': variant === 'primary',
        'bg-surface-white text-text-primary border border-border-subtle hover:bg-surface-cream': variant === 'secondary',
        'text-text-secondary hover:bg-surface-cream': variant === 'ghost',
        'bg-accent-pink text-surface-white hover:opacity-90': variant === 'danger',
        'bg-elora-100 text-surface-white hover:bg-elora-200 font-semibold': variant === 'elora-gold',
        'bg-state-success-bg text-state-success-text border border-state-success-text/20': variant === 'success',
        'bg-state-warning-bg text-state-warning-text border border-state-warning-text/20': variant === 'warning',
        'bg-state-error-bg text-state-error-text border border-state-error-text/20': variant === 'error',
        'bg-state-info-bg text-state-info-text border border-state-info-text/20': variant === 'info',
        'bg-elora-primary/10 text-elora-deep border border-elora-primary/20': variant === 'purple',
        'bg-sidebar-teacher text-surface-white hover:bg-sidebar-teacher/90': variant === 'teacher',
        'bg-sidebar-student text-surface-white hover:bg-sidebar-student/90': variant === 'student',
        'bg-accent-orange text-surface-white hover:bg-accent-orange/90': variant === 'parent',
        'h-8 px-3 text-sm': size === 'sm',
        'h-10 px-4 text-base': size === 'md',
        'h-12 px-6 text-lg': size === 'lg',
      },
      className
    );

    if (asChild) {
      const child = React.Children.only(children) as React.ReactElement;
      return React.cloneElement(child, {
        className: cn(baseClasses, child.props.className),
        ...props
      });
    }

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={baseClasses}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="inline-flex">{leftIcon}</span>}
        <span className="truncate">{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
