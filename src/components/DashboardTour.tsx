import React from 'react';
import { 
  GraduationCap, 
  Users, 
  Zap, 
  X, 
  Gamepad2, 
  UserPlus, 
  MessageSquare, 
  BarChart2, 
  Play, 
  PlusCircle 
} from 'lucide-react';

export type UserRole = 'teacher' | 'parent' | 'student';

interface DashboardTourProps {
  role: UserRole;
  onAction1: () => void;
  onAction2: () => void;
  onDismiss: () => void;
  isVisible: boolean;
}

/**
 * Standardized Welcome Strip / Dashboard Tour component.
 * Reuses the visual pattern from the original Teacher dashboard onboarding.
 */
export const DashboardTour: React.FC<DashboardTourProps> = ({
  role,
  onAction1,
  onAction2,
  onDismiss,
  isVisible
}) => {
  if (!isVisible) return null;

  const config = {
    teacher: {
      icon: <GraduationCap size={18} className="text-teal-600" />,
      iconBg: 'bg-teal-50 border-teal-100',
      title: 'Welcome to Elora',
      body: 'To get the most out of your dashboard, start with one of these quick steps.',
      action1: {
        label: 'Set up your subjects',
        icon: <Gamepad2 size={13} />,
        className: 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100'
      },
      action2: {
        label: 'Invite a parent or student',
        icon: <UserPlus size={13} />,
        className: 'bg-slate-50 border-[#EAE7DD] text-slate-600 hover:bg-slate-100'
      }
    },
    parent: {
      icon: <Users size={18} className="text-[#DB844A]" />,
      iconBg: 'bg-orange-50 border-orange-100',
      title: 'Welcome to Elora',
      body: 'To get the most out of your dashboard, start with one of these quick steps.',
      action1: {
        label: "Ask about your child's learning",
        icon: <MessageSquare size={13} />,
        className: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
      },
      action2: {
        label: 'Review latest results',
        icon: <BarChart2 size={13} />,
        className: 'bg-slate-50 border-[#EAE7DD] text-slate-600 hover:bg-slate-100'
      }
    },
    student: {
      icon: <Zap size={18} className="text-[#68507B]" />,
      iconBg: 'bg-purple-50 border-purple-100',
      title: 'Welcome to Elora!',
      body: "Let's get started with your learning journey. Choose a quick action below.",
      action1: {
        label: 'Start a practice session',
        icon: <Play size={13} />,
        className: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
      },
      action2: {
        label: 'Join a class',
        icon: <PlusCircle size={13} />,
        className: 'bg-slate-50 border-[#EAE7DD] text-slate-600 hover:bg-slate-100'
      }
    }
  }[role];

  return (
    <div className="mb-5 bg-white border border-[#EAE7DD] rounded-2xl shadow-sm p-4 sm:p-5 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start justify-between gap-3">
        {/* Icon + Text */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center ${config.iconBg}`}>
            {config.icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900 leading-snug">
              {config.title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {config.body}
            </p>
            {/* Action chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={onAction1}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${config.action1.className}`}
              >
                {config.action1.icon}
                {config.action1.label}
              </button>
              <button
                onClick={onAction2}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${config.action2.className}`}
              >
                {config.action2.icon}
                {config.action2.label}
              </button>
            </div>
          </div>
        </div>
        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          aria-label="Dismiss welcome strip"
          className="shrink-0 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 mt-0.5"
          title="Dismiss welcome"
        >
          <X size={14} />
          <span className="hidden sm:inline">Dismiss</span>
        </button>
      </div>
    </div>
  );
};
