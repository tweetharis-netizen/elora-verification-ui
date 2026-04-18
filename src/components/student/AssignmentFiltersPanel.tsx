import React from 'react';
import {
  AlertCircle,
  Clock,
  ListTodo,
} from 'lucide-react';

type StatusFilterValue = 'all' | 'overdue' | 'in_progress' | 'not_started' | 'completed';

interface NormalisedItem {
  status: string;
  className?: string;
  dueDate?: string;
}

interface AssignmentFiltersPanelProps {
  normalisedAssignments: NormalisedItem[];
  activeClassFilter: string | null;
  setActiveClassFilter: (v: string | null) => void;
  assignmentStatusFilter: StatusFilterValue;
  setAssignmentStatusFilter: (v: StatusFilterValue) => void;
}

function countByStatus(items: NormalisedItem[], status: string | string[]): number {
  const statuses = Array.isArray(status) ? status : [status];
  return items.filter((a) => statuses.includes(a.status)).length;
}

function countDueThisWeek(items: NormalisedItem[]): number {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  return items.filter((a) => {
    if (a.status === 'completed' || a.status === 'success') return false;
    const due = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
    return due >= now && due <= now + weekMs;
  }).length;
}

export function AssignmentFiltersPanel({
  normalisedAssignments,
  activeClassFilter,
  setActiveClassFilter,
  assignmentStatusFilter,
  setAssignmentStatusFilter,
}: AssignmentFiltersPanelProps) {
  const overdueCount   = countByStatus(normalisedAssignments, 'danger');
  const thisWeekCount  = countDueThisWeek(normalisedAssignments);
  const todoCount      = normalisedAssignments.filter(
    (a) => a.status !== 'completed' && a.status !== 'success',
  ).length;

  const uniqueClasses = Array.from(
    new Set(normalisedAssignments.map((a) => a.className).filter(Boolean)),
  ) as string[];

  const statusOptions: {
    value: StatusFilterValue;
    label: string;
    count?: number;
    activeClass: string;
  }[] = [
    {
      value: 'all',
      label: 'All',
      activeClass: 'bg-[#68507B] border-[#68507B] text-white shadow-sm',
    },
    {
      value: 'overdue',
      label: `Overdue${overdueCount > 0 ? ` (${overdueCount})` : ''}`,
      count: overdueCount,
      activeClass: 'bg-rose-600 border-rose-600 text-white shadow-sm',
    },
    {
      value: 'in_progress',
      label: `In Progress${countByStatus(normalisedAssignments, 'warning') > 0 ? ` (${countByStatus(normalisedAssignments, 'warning')})` : ''}`,
      activeClass: 'bg-[#7C3AED] border-[#7C3AED] text-white shadow-sm',
    },
    {
      value: 'not_started',
      label: `Not Started${countByStatus(normalisedAssignments, 'info') > 0 ? ` (${countByStatus(normalisedAssignments, 'info')})` : ''}`,
      activeClass: 'bg-slate-600 border-slate-600 text-white shadow-sm',
    },
    {
      value: 'completed',
      label: `Completed${countByStatus(normalisedAssignments, ['completed', 'success']) > 0 ? ` (${countByStatus(normalisedAssignments, ['completed', 'success'])})` : ''}`,
      activeClass: 'bg-emerald-600 border-emerald-600 text-white shadow-sm',
    },
  ];

  const chipBase =
    'px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer select-none';
  const chipInactive =
    'bg-white border-[#EAE7DD] text-slate-600 hover:border-[#68507B]/40 hover:text-[#68507B]';

  return (
    <aside className="rounded-xl border border-[#EAE7DD] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6 lg:sticky lg:top-6 overflow-hidden">
      {/* Active Tasks Summary */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-4 pt-4 pb-2">
          Summary
        </p>
        <div className="divide-y divide-slate-100 px-4">
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              <AlertCircle className="w-4 h-4 text-[#9F1239]" />
              Overdue
            </div>
            <span className="text-base font-bold tabular-nums text-[#9F1239]">
              {overdueCount}
            </span>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              <Clock className="w-4 h-4 text-orange-500" />
              Due soon
            </div>
            <span className="text-base font-bold tabular-nums text-orange-500">
              {thisWeekCount}
            </span>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              <ListTodo className="w-4 h-4 text-[#68507B]" />
              To-do
            </div>
            <span className="text-base font-bold tabular-nums text-[#68507B]">
              {todoCount}
            </span>
          </div>
        </div>
      </div>

      {/* Subject filter */}
      <div className="px-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
          Subject
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveClassFilter(null)}
            className={`${chipBase} ${
              activeClassFilter === null
                ? 'bg-[#68507B] border-[#68507B] text-white shadow-sm'
                : chipInactive
            }`}
          >
            All
          </button>
          {uniqueClasses.map((cls) => (
            <button
              key={cls}
              onClick={() => setActiveClassFilter(cls)}
              className={`${chipBase} ${
                activeClassFilter === cls
                  ? 'bg-[#68507B] border-[#68507B] text-white shadow-sm'
                  : chipInactive
              }`}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      {/* Status filter */}
      <div className="px-4 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
          Status
        </p>
        <div className="flex flex-wrap gap-1.5">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setAssignmentStatusFilter(opt.value)}
              className={`${chipBase} ${
                assignmentStatusFilter === opt.value ? opt.activeClass : chipInactive
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
