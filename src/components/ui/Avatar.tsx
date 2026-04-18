import React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: React.MouseEventHandler;
}

const Avatar = ({ src, alt = '', fallback, size = 'md', className, ...props }: AvatarProps) => {
  const [error, setError] = React.useState(false);

  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-[12px]',
    md: 'w-10 h-10 text-[14px]',
    lg: 'w-12 h-12 text-[16px]',
    xl: 'w-16 h-16 text-[20px]',
  };

  const getFallback = () => {
    if (fallback) return fallback.substring(0, 1).toUpperCase();
    if (alt) return alt.substring(0, 1).toUpperCase();
    return '?';
  };

  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full bg-elora-primary/10 flex items-center justify-center text-elora-deep font-semibold',
        sizes[size],
        className
      )}
    >
      {src && !error ? (
        <img
          src={src}
          alt={alt}
          onError={() => setError(true)}
          className="h-full w-full aspect-square object-cover"
          {...props}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded-full bg-elora-primary/10">
          {getFallback()}
        </span>
      )}
    </div>
  );
};

export { Avatar };
