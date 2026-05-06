import React from 'react';
import { ChevronRight, FileText, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

export type AssignmentRowRole = 'teacher' | 'student' | 'parent';

interface AssignmentRowBaseProps {
    role: AssignmentRowRole;
    title: string;
    typeLabel: string;
    className: string;
    topic: string;
    statusLabel: string;
    status: 'overdue' | 'due_soon' | 'completed' | 'active' | 'attention';
    dueDate: string;
    metrics: {
        label1: string;
        value1: string;
        label2: string;
        value2: string;
        label3: string;
        value3: string;
    };
    progressPercent: number;
    onClick: () => void;
}

export function AssignmentRowBase({
    role,
    title,
    typeLabel,
    className,
    topic,
    statusLabel,
    status,
    dueDate,
    metrics,
    progressPercent,
    onClick
}: AssignmentRowBaseProps) {
    const roleConfig = {
        teacher: {
            primary: 'text-teal-700',
            bg: 'bg-teal-500/10',
            hoverBorder: 'hover:border-teal-600/40',
            progress: 'bg-teal-600'
        },
        student: {
            primary: 'text-[#68507B]',
            bg: 'bg-[#68507B]/10',
            hoverBorder: 'hover:border-[#68507B]/40',
            progress: 'bg-[#68507B]'
        },
        parent: {
            primary: 'text-[#DB844A]',
            bg: 'bg-[#DB844A]/10',
            hoverBorder: 'hover:border-[#DB844A]/40',
            progress: 'bg-[#DB844A]'
        }
    };

    const config = roleConfig[role];

    const statusIcons = {
        overdue: <AlertCircle size={14} className="text-rose-500" />,
        due_soon: <Clock size={14} className="text-amber-500" />,
        completed: <CheckCircle2 size={14} className="text-emerald-500" />,
        active: <div className={`h-1.5 w-1.5 rounded-full ${config.progress}`} />,
        attention: <AlertCircle size={14} className="text-amber-500" />
    };

    const statusColors = {
        overdue: 'bg-rose-50 text-rose-700 border-rose-100',
        due_soon: 'bg-amber-50 text-amber-700 border-amber-100',
        completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        active: 'bg-slate-50 text-slate-700 border-slate-100',
        attention: 'bg-amber-50 text-amber-700 border-amber-100'
    };

    return (
        <article
            onClick={onClick}
            className={`group rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-none transition-all duration-200 hover:-translate-y-[2px] cursor-pointer ${config.hoverBorder} ${status === 'completed' ? 'bg-slate-50/[0.75]' : ''}`}
        >
            <div className="flex flex-col gap-4">
                {/* Status Header */}
                <div className="flex items-start justify-end gap-2">
                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColors[status]}`}>
                        {statusIcons[status]}
                        <span>{statusLabel}</span>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto] gap-4 md:gap-0 items-center">
                    {/* Left: Info */}
                    <div className="min-w-0 flex items-start gap-3 h-full md:pr-4 md:mr-4 md:border-r md:border-[#E2E8F0]">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${status === 'overdue' ? 'bg-rose-50/50' : config.bg}`}>
                            <FileText size={18} className={status === 'overdue' ? 'text-rose-600' : config.primary} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{typeLabel}</p>
                            <h3 className="mt-0.5 text-base font-semibold tracking-tight text-slate-900 truncate group-hover:text-slate-800 transition-colors">{title}</h3>
                            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 truncate">{className} · {topic}</p>
                        </div>
                    </div>

                    {/* Middle: Metrics */}
                    <div className="h-full md:px-4 md:border-r md:border-[#E2E8F0]">
                        <div className="grid h-full grid-cols-3 gap-0">
                            <div className="pr-3">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{metrics.label1}</p>
                                <p className="mt-1 text-lg font-bold text-slate-800 tabular-nums font-mono [font-family:'JetBrains_Mono','Geist_Mono',ui-monospace,SFMono-Regular,Menlo,monospace]">{metrics.value1}</p>
                            </div>
                            <div className="px-3 border-l border-slate-100">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{metrics.label2}</p>
                                <p className="mt-1 text-lg font-bold text-slate-800 tabular-nums font-mono [font-family:'JetBrains_Mono','Geist_Mono',ui-monospace,SFMono-Regular,Menlo,monospace]">{metrics.value2}</p>
                            </div>
                            <div className="pl-3 border-l border-slate-100">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{metrics.label3}</p>
                                <p className="mt-1 text-lg font-bold text-slate-800 tabular-nums font-mono [font-family:'JetBrains_Mono','Geist_Mono',ui-monospace,SFMono-Regular,Menlo,monospace]">{metrics.value3}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col items-end justify-center gap-2 pl-3">
                        <button
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-50 group-hover:border-slate-300"
                        >
                            View details
                            <ChevronRight size={13} />
                        </button>
                    </div>
                </div>

                {/* Progress Bar Footer */}
                <div className="mt-1 border-t border-[#E2E8F0] pt-3 space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="h-[3px] w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ease-out ${config.progress}`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 tabular-nums font-mono [font-family:'JetBrains_Mono','Geist_Mono',ui-monospace,SFMono-Regular,Menlo,monospace]">{progressPercent}%</span>
                    </div>
                </div>
            </div>
        </article>
    );
}
