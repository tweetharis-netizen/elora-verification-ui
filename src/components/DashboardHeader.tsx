import React from 'react';
import { Search, Menu } from 'lucide-react';
import { useDemoMode } from '../hooks/useDemoMode';

interface DashboardHeaderProps {
  role: 'student' | 'teacher' | 'parent';
  displayName: string;
  roleLabel: string;
  avatarInitials: string;
  searchPlaceholder?: string;
  onSearchChange?: (val: string) => void;
  onMobileMenuToggle?: () => void;
  notificationsNode?: React.ReactNode;
}

export function DashboardHeader({
  role,
  displayName,
  roleLabel,
  avatarInitials,
  searchPlaceholder = "Find lesson, quiz...",
  onSearchChange,
  onMobileMenuToggle,
  notificationsNode
}: DashboardHeaderProps) {
  const isDemo = useDemoMode();

  const roleColors = {
    student: {
      text: 'text-purple-500',
      focusRing: 'focus:ring-purple-500/10',
      focusBorder: 'focus:border-purple-500',
      iconFocus: 'group-focus-within:text-purple-500',
      avatarBg: 'bg-[#68507B]',
      shadow: 'shadow-[#68507B]/20'
    },
    teacher: {
      text: 'text-teal-600',
      focusRing: 'focus:ring-teal-500/10',
      focusBorder: 'focus:border-teal-500',
      iconFocus: 'group-focus-within:text-teal-500',
      avatarBg: 'bg-teal-600',
      shadow: 'shadow-teal-500/20'
    },
    parent: {
      text: 'text-orange-500',
      focusRing: 'focus:ring-orange-500/10',
      focusBorder: 'focus:border-orange-500',
      iconFocus: 'group-focus-within:text-orange-500',
      avatarBg: 'bg-orange-500',
      shadow: 'shadow-orange-500/20'
    }
  };

  const colors = roleColors[role];

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-[#FDFBF5]/80 border-b border-[#EAE7DD] w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-18 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Search */}
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          {onMobileMenuToggle && (
            <button
              onClick={onMobileMenuToggle}
              className={`md:hidden p-2 -ml-2 text-slate-500 hover:${colors.text} rounded-xl transition-all`}
            >
              <Menu size={24} />
            </button>
          )}
          {isDemo && (
            <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/70 px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest text-slate-400 whitespace-nowrap">
              DEMO EXPERIENCE
            </span>
          )}
          <div className="relative group flex-1 hidden md:block">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 ${colors.iconFocus} transition-colors`} size={18} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className={`w-full pl-12 pr-4 py-2.5 bg-white border border-[#EAE7DD] rounded-full text-sm outline-none ${colors.focusRing} ${colors.focusBorder} transition-all font-medium text-slate-600 shadow-sm`}
            />
          </div>
        </div>

        {/* Right: Notifications & Profile Pill */}
        <div className="flex items-center gap-4">
          {notificationsNode && (
            <div className="flex items-center p-1 px-2 border-r border-slate-100 mr-1">
              {notificationsNode}
            </div>
          )}
          
          <div className="inline-flex items-center gap-3 rounded-full bg-white shadow-sm px-4 py-1.5 border border-[#F1EEE4] hover:shadow-md transition-all">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-900 leading-tight">{displayName}</div>
              <div className={`text-[11px] font-semibold tracking-[0.18em] uppercase leading-tight ${colors.text}`}>{roleLabel}</div>
            </div>
            <div className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl ${colors.avatarBg} border-white text-white flex items-center justify-center font-bold border-2 shadow-lg ${colors.shadow} transform hover:scale-105 transition-transform`}>
              {avatarInitials}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
