// components/ui/LoadingStates.js
// Skeleton loading screens for all page types

import { motion } from 'framer-motion';

/**
 * Generic skeleton box
 */
export function Skeleton({ width = '100%', height = '20px', className = '' }) {
    return (
        <div
            className={`skeleton ${className}`}
            style={{ width, height, borderRadius: 'var(--radius-md)' }}
        />
    );
}

/**
 * Dashboard loading skeleton
 */
export function DashboardSkeleton() {
    return (
        <div className="space-y-6 p-8 animate-fade-in">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton width="200px" height="32px" />
                    <Skeleton width="300px" height="20px" />
                </div>
                <Skeleton width="120px" height="40px" />
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="card p-6 space-y-3">
                        <Skeleton width="100px" height="16px" />
                        <Skeleton width="80px" height="40px" />
                        <Skeleton width="120px" height="14px" />
                    </div>
                ))}
            </div>

            {/* Chart skeleton */}
            <div className="card p-6 space-y-4">
                <Skeleton width="150px" height="24px" />
                <Skeleton width="100%" height="300px" />
            </div>

            {/* List skeleton */}
            <div className="card p-6 space-y-4">
                <Skeleton width="180px" height="24px" />
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton width="48px" height="48px" className="rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton width="60%" height="18px" />
                            <Skeleton width="40%" height="14px" />
                        </div>
                        <Skeleton width="80px" height="32px" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Chat loading skeleton
 */
export function ChatSkeleton() {
    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b border-border-primary p-4">
                <Skeleton width="200px" height="24px" />
            </div>

            {/* Messages */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] space-y-2 ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
                            <Skeleton width="200px" height="60px" className="rounded-2xl" />
                            <Skeleton width="80px" height="12px" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Input */}
            <div className="border-t border-border-primary p-4">
                <Skeleton width="100%" height="48px" />
            </div>
        </div>
    );
}

/**
 * Assignment list skeleton
 */
export function AssignmentListSkeleton() {
    return (
        <div className="space-y-4 p-6">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="card p-6 space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                            <Skeleton width="300px" height="24px" />
                            <Skeleton width="200px" height="16px" />
                        </div>
                        <Skeleton width="100px" height="32px" />
                    </div>
                    <div className="flex gap-4">
                        <Skeleton width="80px" height="20px" />
                        <Skeleton width="100px" height="20px" />
                        <Skeleton width="90px" height="20px" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Class list skeleton
 */
export function ClassListSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="card p-6 space-y-4">
                    <Skeleton width="100%" height="120px" className="rounded-xl" />
                    <Skeleton width="70%" height="24px" />
                    <Skeleton width="50%" height="16px" />
                    <div className="flex gap-2">
                        <Skeleton width="60px" height="28px" />
                        <Skeleton width="80px" height="28px" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Spinner loading indicator
 */
export function LoadingSpinner({ size = 'md', className = '' }) {
    const sizes = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4',
    };

    return (
        <div
            className={`${sizes[size]} ${className} border-current border-t-transparent rounded-full animate-spin`}
            style={{ borderTopColor: 'transparent' }}
        />
    );
}

/**
 * Full page loading
 */
export function FullPageLoading({ message = 'Loading...' }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900"
        >
            <div className="text-center space-y-6">
                <div className="relative">
                    <LoadingSpinner size="lg" className="text-primary-600 dark:text-primary-400 mx-auto" />
                    <div className="absolute inset-0 animate-pulse-glow rounded-full opacity-30 bg-primary-500" />
                </div>
                <p className="text-text-secondary text-lg font-medium">{message}</p>
            </div>
        </motion.div>
    );
}
