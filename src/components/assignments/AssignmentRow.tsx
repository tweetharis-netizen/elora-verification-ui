import React from 'react';

type AssignmentRowVariant = 'teacher' | 'student' | 'parent';

interface AssignmentRowProps {
  variant: AssignmentRowVariant;
  title: string;
  statusLabel: string;
  metadata: string;
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
  };
}

const ROLE_ACCENT: Record<AssignmentRowVariant, string> = {
  teacher: '#14B8A6',
  student: '#7C3AED',
  parent: '#F97316',
};

const ALERT_ACCENT = '#9F1239';

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
  const accent = isAlert ? ALERT_ACCENT : ROLE_ACCENT[variant];

  return (
    <article
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className="group relative min-h-[72px] max-h-[90px] rounded-xl border border-white/10 bg-white/40 backdrop-blur-md px-5 py-2.5 transition-all duration-300 hover:bg-white/60 hover:shadow-lg cursor-pointer flex flex-col justify-center"
    >
      <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl opacity-80" style={{ backgroundColor: accent }} />

      <div className="flex h-full items-center justify-between gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em]"
              style={{
                color: accent,
                borderColor: `${accent}33`,
                backgroundColor: `${accent}1A`,
              }}
            >
              {statusLabel}
            </span>
            <h3 className="text-[15px] font-semibold tracking-tight text-slate-900 truncate editorial-header italic">{title}</h3>
          </div>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500 truncate font-sans">
            {metadata}
          </p>
        </div>

        {variant === 'teacher' && teacherStats && (
          <div className="w-[255px] shrink-0 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500 font-sans">
              <span className="editorial-mono">{teacherStats.submissions}</span> Submissions
            </p>
            <div className="mt-1 flex items-center justify-end gap-2">
              {teacherStats.showNeedsAttention && (
                <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9F1239] border-[#9F1239]/20 bg-[#9F1239]/10">
                  Needs Attention
                </span>
              )}
              <span className={`text-[11px] font-bold uppercase tracking-[0.15em] font-sans ${isAlert ? 'text-[#9F1239]' : 'text-teal-700'}`}>
                Avg <span className="editorial-mono text-base">{teacherStats.avgScore}</span>
              </span>
            </div>
          </div>
        )}

        {variant === 'student' && studentProgress && (
          <div className="w-[220px] shrink-0 text-right relative">
            <div className="h-1.5 w-full rounded-full bg-slate-200/50 overflow-hidden">
              <div
                className="h-full transition-all"
                style={{ width: `${Math.max(0, Math.min(100, studentProgress.value))}%`, backgroundColor: accent }}
              />
            </div>
            <div className="mt-1 flex items-center justify-end gap-3">
              <span className={`text-[11px] font-bold uppercase tracking-[0.15em] font-sans ${isAlert ? 'text-[#9F1239]' : 'text-slate-500'}`}>
                Goal: <span className="editorial-mono">{studentProgress.goal}%</span>
              </span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onClick();
                }}
                className={`rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] border transition-all hover:scale-105 active:scale-95 ${isAlert ? 'text-[#9F1239] border-[#9F1239]/20 bg-[#9F1239]/10' : 'text-[#7C3AED] border-[#7C3AED]/20 bg-[#7C3AED]/10'}`}
              >
                {studentProgress.ctaLabel || 'Submit'}
              </button>
            </div>
          </div>
        )}

        {variant === 'parent' && parentScore && (
          <div className="w-[250px] shrink-0 text-right">
            <p className={`text-[11px] font-bold uppercase tracking-[0.15em] font-sans ${isAlert ? 'text-[#9F1239]' : 'text-orange-700'}`}>
              Score: <span className="editorial-mono text-base">{parentScore.score}</span> / Goal: <span className="editorial-mono">{parentScore.goal}%</span>
            </p>
            <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200/50 overflow-hidden">
              <div
                className="h-full transition-all"
                style={{
                  width: `${Math.max(0, Math.min(100, Number.parseInt(parentScore.score, 10) || 0))}%`,
                  backgroundColor: Number.parseInt(parentScore.score, 10) < parentScore.goal ? ALERT_ACCENT : ROLE_ACCENT.parent,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
