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
import { useAuth } from '../auth/AuthContext';
import { useDemoMode } from '../hooks/useDemoMode';

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
  const { currentUser, isGuest, isVerified } = useAuth();
  const isDemo = useDemoMode();

  if (!isVisible || isDemo || !isVerified || !currentUser || isGuest) return null;

  const config = {
    teacher: {
      icon: <GraduationCap size={18} className="text-teal-600" />,
      iconBg: 'bg-teal-50 border-teal-100',
      cardClass: 'border-teal-200/70 bg-teal-50/30',
      title: 'Welcome to Elora',
      body: 'To get the most out of your dashboard, start with one of these quick steps.',
      action1: {
        label: 'Set up your subjects',
        icon: <Gamepad2 size={13} />,
        className: 'bg-teal-600 border-transparent text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20'
      },
      action2: {
        label: 'Invite a parent or student',
        icon: <UserPlus size={13} />,
        className: 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
      }
    },
    parent: {
      icon: <Users size={18} className="text-[#DB844A]" />,
      iconBg: 'bg-orange-50 border-orange-100',
      cardClass: 'border-orange-200/70 bg-orange-50/30',
      title: 'Welcome to Elora',
      body: 'To get the most out of your dashboard, start with one of these quick steps.',
      action1: {
        label: "Ask about your child's learning",
        icon: <MessageSquare size={13} />,
        className: 'bg-orange-500 border-transparent text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20'
      },
      action2: {
        label: 'Review latest results',
        icon: <BarChart2 size={13} />,
        className: 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
      }
    },
    student: {
      icon: <Zap size={18} className="text-[#68507B]" />,
      iconBg: 'bg-purple-50 border-purple-100',
      cardClass: 'border-purple-200/70 bg-purple-50/30',
      title: 'Welcome to Elora!',
      body: "Let's get started with your learning journey. Choose a quick action below.",
      action1: {
        label: 'Start a practice session',
        icon: <Play size={13} />,
        className: 'bg-[#68507B] border-transparent text-white hover:bg-[#59436b] shadow-lg shadow-purple-900/20'
      },
      action2: {
        label: 'Join a class',
        icon: <PlusCircle size={13} />,
        className: 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
      }
    }
  }[role];

  return (
    <div className={`mb-6 rounded-3xl border shadow-sm p-6 md:p-8 animate-in fade-in slide-in-from-top-2 duration-300 ${config.cardClass}`}>
      <div className="flex items-start justify-between gap-3">
        {/* Icon + Text */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`shrink-0 w-11 h-11 rounded-2xl border flex items-center justify-center ${config.iconBg}`}>
            {config.icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-[18px] lg:text-[20px] font-semibold tracking-tight text-slate-900 leading-tight">
              {config.title}
            </h2>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed max-w-2xl">
              {config.body}
            </p>
            {/* Action chips */}
            <div className="flex flex-wrap gap-2.5 mt-4">
              <button
                onClick={onAction1}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all active:scale-[0.98] ${config.action1.className}`}
              >
                {config.action1.icon}
                {config.action1.label}
              </button>
              <button
                onClick={onAction2}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all active:scale-[0.98] ${config.action2.className}`}
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
          className="shrink-0 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1 mt-0.5"
          title="Dismiss welcome"
        >
          <X size={14} />
          <span className="hidden sm:inline">Dismiss</span>
        </button>
      </div>
    </div>
  );
};
