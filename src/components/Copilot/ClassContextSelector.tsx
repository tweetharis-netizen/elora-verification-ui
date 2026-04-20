import React from 'react';
import { BookOpen, ChevronDown, UserRound, Users } from 'lucide-react';

type Option = {
    id: string | null;
    label: string;
};

type ClassContextSelectorProps = {
    label: string;
    options: Option[];
    selectedId: string | null;
    onChange: (id: string | null) => void;
    disabled?: boolean;
};

export function ClassContextSelector({
    label,
    options,
    selectedId,
    onChange,
    disabled = false,
}: ClassContextSelectorProps) {
    const normalizedLabel = label.trim().toLowerCase();
    const SelectedIcon = normalizedLabel.includes('child')
        ? UserRound
        : normalizedLabel.includes('subject')
            ? BookOpen
            : Users;

    return (
        <div className="relative w-full max-w-[360px]">
            <label className="sr-only">{label}</label>

            <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-[#DFF4F2] p-2.5 text-[#18A79B]">
                <SelectedIcon size={18} />
            </div>

            <select
                aria-label={label}
                value={selectedId ?? ''}
                onChange={(e) => onChange(e.target.value || null)}
                disabled={disabled}
                className="h-16 w-full appearance-none rounded-2xl border border-[#D5DDE8] bg-[#F3F6FA] pr-12 pl-16 text-left text-[13px] font-extrabold uppercase tracking-[0.14em] text-[#1E3A61] shadow-[0_1px_0_rgba(255,255,255,0.6)_inset] outline-none transition-colors hover:border-[#BCC9D8] focus:border-[#9EB2CA] disabled:cursor-not-allowed disabled:opacity-60"
            >
                {options.map((opt) => (
                    <option key={opt.id ?? '__none__'} value={opt.id ?? ''}>
                        {opt.label}
                    </option>
                ))}
            </select>

            <ChevronDown
                size={20}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#7C8FA7]"
            />
        </div>
    );
}