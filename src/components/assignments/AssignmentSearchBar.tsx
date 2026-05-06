import React from 'react';
import { Search } from 'lucide-react';

interface AssignmentSearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function AssignmentSearchBar({
    value,
    onChange,
    placeholder = "Search assignments, classes, topics, status, or due date"
}: AssignmentSearchBarProps) {
    return (
        <div className="rounded-full border border-slate-200 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04),_0_8px_20px_rgba(15,23,42,0.06)]">
            <label className="relative flex items-center">
                <Search size={14} strokeWidth={1.5} className="pointer-events-none absolute left-3 text-slate-400" />
                <input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    className="h-10 w-full rounded-full bg-transparent pl-8 pr-16 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
                <kbd className="pointer-events-none absolute right-2 inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold font-mono text-slate-400">
                    Ctrl+K
                </kbd>
            </label>
        </div>
    );
}
