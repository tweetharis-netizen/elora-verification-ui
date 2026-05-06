import React from 'react';
import { ChevronRight, FileText } from 'lucide-react';

type AssignmentRowVariant = 'teacher' | 'student' | 'parent';

interface AssignmentRowProps {
  variant: AssignmentRowVariant;
  title: string;
  statusLabel: string;
  metadata: string; // e.g. "Math • Algebra 1"
  onClick: () => void;
  isAlert?: boolean;
  teacherStats?: {
    submissions: string;
    avgScore: string;
    showNeedsAttention?: boolean;
  };
  studentProgress?: {
    value: number;
    goal: number;
    ctaLabel?: string;
  };
  parentScore?: {
    score: string;
    goal: number;
    ctaLabel?: string;
  };
}

export function AssignmentRow({
  variant,
  title,
  statusLabel,
  metadata,
  onClick,
  isAlert = false,
  teacherStats,
  studentProgress,
  parentScore,
}: AssignmentRowProps) {
  const isCompleted = statusLabel.toLowerCase() === 'completed' || statusLabel.toLowerCase() === 'success';
  const isDueSoon = statusLabel.toLowerCase().includes('due soon');

  // Role-specific colors
  const roleColors = {
    teacher: 'teal',
    student: '#7C3AED',
    parent: '#DB844A',
  };

  const primaryColor = roleColors[variant];

  // Status Colors
  let statusToneClass = '';
  let statusDotClass = '';
  let statusLabelClass = '';

  if (isCompleted) {
    statusToneClass = 'bg-emerald-500 text-emerald-700';
    statusDotClass = 'bg-emerald-500';
    statusLabelClass = 'text-emerald-700';
  } else if (isAlert) {
    statusToneClass = 'bg-rose-500 text-rose-700';
    statusDotClass = 'bg-rose-500';
    statusLabelClass = 'text-rose-700';
  } else if (isDueSoon) {
    statusToneClass = 'bg-amber-500 text-amber-700';
    statusDotClass = 'bg-amber-500';
    statusLabelClass = 'text-amber-700';
  } else {
    // Default using primary color
    if (variant === 'teacher') {
      statusToneClass = 'bg-teal-500 text-teal-700';
      statusDotClass = 'bg-teal-600';
      statusLabelClass = 'text-teal-700';
    } else if (variant === 'student') {
      statusToneClass = 'bg-[#7C3AED]/20 text-[#68507B]';
      statusDotClass = 'bg-[#7C3AED]';
      statusLabelClass = 'text-[#68507B]';
    } else {
      statusToneClass = 'bg-[#DB844A]/20 text-[#B26532]';
      statusDotClass = 'bg-[#DB844A]';
      statusLabelClass = 'text-[#B26532]';
    }
  }

  // Parse metadata if possible (e.g., "Class • Topic" or "Class • Due Date")
  const metaParts = metadata.split('•').map(p => p.trim());
  const className = metaParts[0] || '';
  const topicOrDue = metaParts[1] || '';

  // Extract due date from string if it exists in metadata (for student/parent)
  let extractedDue = '--';
  if (topicOrDue.toLowerCase().startsWith('due ')) {
    extractedDue = topicOrDue.substring(4);
  }

  // Progress metrics
  let percent = 0;
  if (variant === 'student' && studentProgress) {
    percent = studentProgress.value;
  } else if (variant === 'parent' && parentScore) {
    percent = Number.parseInt(parentScore.score, 10) || 0;
  } else if (variant === 'teacher' && teacherStats) {
    const [sub, total] = teacherStats.submissions.split('/');
    if (total && parseInt(total) > 0) {
      percent = Math.round((parseInt(sub) / parseInt(total)) * 100);
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`group rounded-xl border border-[#EAEAEA] bg-white p-6 shadow-none transition-all duration-200 hover:-translate-y-[2px] cursor-pointer ${isCompleted ? 'bg-slate-50/[0.75]' : ''}`}
      style={{
        // Add dynamic border color on hover based on variant
        '--hover-border': variant === 'teacher' ? 'rgba(20, 184, 166, 0.4)' : variant === 'student' ? 'rgba(124, 58, 237, 0.4)' : 'rgba(219, 132, 74, 0.4)'
      } as React.CSSProperties}
    >
      <style>{`
        article:hover { border-color: var(--hover-border) !important; }
      `}</style>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${isAlert ? 'border-rose-200 bg-rose-50/80 text-rose-700' : 'border-slate-100 bg-slate-50 text-slate-500'}`}
              style={!isAlert ? { color: primaryColor, backgroundColor: `${primaryColor}1A`, borderColor: `${primaryColor}33` } : {}}
            >
              <FileText size={18} />
            </div>
            <div className="min-w-0 text-left">
              <h3 className="truncate text-[17px] font-semibold leading-6 tracking-tight text-slate-900">{title}</h3>
              <p className="mt-1 truncate text-[11px] font-bold uppercase tracking-widest text-slate-400">
                {className} {topicOrDue && !topicOrDue.toLowerCase().startsWith('due ') && `· ${topicOrDue}`}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end justify-center gap-2 text-[12px] font-medium">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass}`} />
              <span className={statusLabelClass}>{statusLabel}</span>
            </span>
            <button
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-[12px] font-semibold normal-case tracking-normal text-slate-600 transition-colors duration-200 hover:bg-slate-50"
            >
              {variant === 'student' ? (studentProgress?.ctaLabel || 'Start assignment') : variant === 'parent' ? (parentScore?.ctaLabel || 'View details') : 'View details'}
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 text-left">
          {variant === 'teacher' && teacherStats && (
            <>
              <div className="sm:pr-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Submissions</p>
                <p className="mt-1 text-lg font-bold tabular-nums font-mono [font-family:'JetBrains_Mono','Geist_Mono',ui-monospace,SFMono-Regular,Menlo,monospace] text-slate-800">{teacherStats.submissions}</p>
              </div>
              <div className="sm:px-4 sm:border-l sm:border-slate-100">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Avg score</p>
                <p className="mt-1 text-lg font-bold tabular-nums font-mono [font-family:'JetBrains_Mono','Geist_Mono',ui-monospace,SFMono-Regular,Menlo,monospace] text-slate-800">{teacherStats.avgScore}%</p>
              </div>
              <div className="sm:pl-4 sm:border-l sm:border-slate-100">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Due</p>
                <p className="mt-1 text-lg font-bold tabular-nums font-mono [font-family:'JetBrains_Mono','Geist_Mono',ui-monospace,SFMono-Regular,Menlo,monospace] text-slate-800">{topicOrDue.toLowerCase().startsWith('due ') ? extractedDue : '--'}</p>
              </div>
            </>
          )}

          {variant === 'student' && studentProgress && (
            <>
              <div className="sm:pr-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Progress</p>
                <p className="mt-1 text-lg font-bold tabular-nums font-mono [font-family:'JetBrains_Mono','Geist_Mono',ui-monospace,SFMono-Regular,Menlo,monospace] text-slate-800">{studentProgress.value}%</p>
              </div>
              <div className="sm:px-4 sm:border-l sm:border-slate-100">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Goal</p>
                <p className="mt-1 text-lg font-bold tabular-nums font-mono [font-family:'JetBrains_Mono','Geist_Mono',ui-monospace,SFMono-Regular,Menlo,monospace] text-slate-800">{studentProgress.goal}%</p>
              </div>
              <div className="sm:pl-4 sm:border-l sm:border-slate-100">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Due</p>
                <p className="mt-1 text-lg font-bold tabular-nums font-mono [font-family:'JetBrains_Mono','Geist_Mono',ui-monospace,SFMono-Regular,Menlo,monospace] text-slate-800">{topicOrDue.toLowerCase().startsWith('due ') ? extractedDue : '--'}</p>
              </div>
            </>
          )}

          {variant === 'parent' && parentScore && (
            <>
              <div className="sm:pr-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Score</p>
                <p className="mt-1 text-lg font-bold tabular-nums font-mono [font-family:'JetBrains_Mono','Geist_Mono',ui-monospace,SFMono-Regular,Menlo,monospace] text-slate-800">{parentScore.score}</p>
              </div>
              <div className="sm:px-4 sm:border-l sm:border-slate-100">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Goal</p>
                <p className="mt-1 text-lg font-bold tabular-nums font-mono [font-family:'JetBrains_Mono','Geist_Mono',ui-monospace,SFMono-Regular,Menlo,monospace] text-slate-800">{parentScore.goal}%</p>
              </div>
              <div className="sm:pl-4 sm:border-l sm:border-slate-100">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Due</p>
                <p className="mt-1 text-lg font-bold tabular-nums font-mono [font-family:'JetBrains_Mono','Geist_Mono',ui-monospace,SFMono-Regular,Menlo,monospace] text-slate-800">{topicOrDue.toLowerCase().startsWith('due ') ? extractedDue : '--'}</p>
              </div>
            </>
          )}
        </div>

        <div className="mt-1 border-t border-[#EAEAEA] pt-3 space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-slate-100" style={{ backgroundColor: `${primaryColor}1A` }}>
              <div
                className="h-full transition-all duration-200"
                style={{ width: `${Math.max(0, Math.min(100, percent))}%`, backgroundColor: primaryColor }}
              />
            </div>
            <span className="text-[11px] font-semibold tabular-nums font-mono [font-family:'JetBrains_Mono','Geist_Mono',ui-monospace,SFMono-Regular,Menlo,monospace] text-slate-500">{percent}%</span>
          </div>
        </div>
      </div>
    </article>
  );
}
