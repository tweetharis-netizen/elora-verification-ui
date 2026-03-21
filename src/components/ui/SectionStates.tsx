/**
 * SectionStates.tsx
 *
 * Shared, reusable components for loading/empty/error states across all dashboards.
 * Extracted from Teacher, Student, and Parent dashboard pages for consistency.
 */

import React, { ReactNode } from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';

/**
 * SectionSkeleton
 *
 * Animated skeleton rows shown while a section is loading.
 * Props:
 *   - rows: Number of skeleton rows to display (default: 3)
 */
export const SectionSkeleton = ({ rows = 3 }: { rows?: number }) => (
    <div className="space-y-3 py-2">
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="animate-pulse flex gap-3 items-center">
                <div className="w-8 h-8 bg-slate-200 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-2/3" />
                    <div className="h-2.5 bg-slate-100 rounded w-full" />
                </div>
            </div>
        ))}
    </div>
);

/**
 * SectionEmpty
 *
 * Generic empty state with an icon and two lines of copy.
 * Props:
 *   - headline: Required headline text
 *   - detail: Optional detail/subtext
 *   - icon: Optional custom icon (defaults to Inbox)
 */
export const SectionEmpty = ({
    headline,
    detail,
    icon,
}: {
    headline: string;
    detail?: string;
    icon?: ReactNode;
}) => (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
        {icon !== undefined ? icon : <Inbox size={28} className="text-slate-300" />}
        <p className="text-sm font-semibold text-slate-600">{headline}</p>
        {detail && <p className="text-xs text-slate-400 max-w-xs">{detail}</p>}
    </div>
);

/**
 * SectionError
 *
 * Compact error card with an optional retry action.
 * Props:
 *   - message: Error message to display
 *   - onRetry: Optional callback for retry button
 */
export const SectionError = ({
    message,
    onRetry,
}: {
    message: string;
    onRetry?: () => void;
}) => (
    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm">
        <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
            <p className="text-red-700 leading-relaxed">{message}</p>
        </div>
        {onRetry && (
            <button
                onClick={onRetry}
                className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800 shrink-0 ml-2"
            >
                <RefreshCw size={12} /> Retry
            </button>
        )}
    </div>
);
