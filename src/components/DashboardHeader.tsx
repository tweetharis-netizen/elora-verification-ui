import React, { useState, useRef, useEffect } from 'react';
import { Search, Menu, Settings, LogOut, User, ChevronDown } from 'lucide-react';
import { useDemoMode } from '../hooks/useDemoMode';
import { useNavigate } from 'react-router-dom';
import { settingsService } from '../services/settingsService';

interface DashboardHeaderProps {
  role: 'student' | 'teacher' | 'parent';
  displayName: string;
  roleLabel: string;
  avatarInitials: string;
  searchPlaceholder?: string;
  onSearchChange?: (val: string) => void;
  onMobileMenuToggle?: () => void;
  onLogout?: () => void;
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
  onLogout,
  notificationsNode
}: DashboardHeaderProps) {
  const isDemo = useDemoMode();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [localDisplayName, setLocalDisplayName] = useState<string>(() => {
    if (displayName && displayName.trim()) return displayName;
    try {
      const stored = settingsService.getSettings(role).displayName;
      return stored || displayName || '';
    } catch {
      return displayName || '';
    }
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const onSettings = (e: Event) => {
      const ev = e as CustomEvent;
      const detail = ev.detail as any;
      if (detail && detail.role === role && detail.displayName) {
        setLocalDisplayName(detail.displayName);
      }
    };
    window.addEventListener('elora-settings-updated', onSettings as EventListener);
    return () => window.removeEventListener('elora-settings-updated', onSettings as EventListener);
  }, [role]);

  const roleColors = {
    student: {
      text: 'text-purple-500',
      focusRing: 'focus:ring-purple-500/10',
      focusBorder: 'focus:border-purple-500',
      iconFocus: 'group-focus-within:text-purple-500',
      avatarBg: 'bg-purple-400',
      shadow: 'shadow-purple-400/15',
      hoverBg: 'hover:bg-purple-50'
    },
    teacher: {
      text: 'text-teal-600',
      focusRing: 'focus:ring-teal-500/10',
      focusBorder: 'focus:border-teal-500',
      iconFocus: 'group-focus-within:text-teal-500',
      avatarBg: 'bg-teal-500',
      shadow: 'shadow-teal-500/15',
      hoverBg: 'hover:bg-teal-50'
    },
    parent: {
      text: 'text-orange-500',
      focusRing: 'focus:ring-orange-500/10',
      focusBorder: 'focus:border-orange-500',
      iconFocus: 'group-focus-within:text-orange-500',
      avatarBg: 'bg-orange-400',
      shadow: 'shadow-orange-400/15',
      hoverBg: 'hover:bg-orange-50'
    }
  };

  const colors = roleColors[role];

  const handleSettingsClick = () => {
    setIsDropdownOpen(false);
    const prefix = isDemo ? `/${role}/demo` : `/${role}`;
    navigate(`${prefix}/settings`);
  };

  const handleSignOut = () => {
    setIsDropdownOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      // Fallback if no logout provided
      navigate('/login');
    }
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-[var(--elora-surface-main)] border-b border-[var(--elora-border-subtle)] w-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Search */}
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          {onMobileMenuToggle && (
            <button
              onClick={onMobileMenuToggle}
              className={`md:hidden p-2 -ml-2 text-slate-500 hover:${colors.text} rounded-lg transition-all`}
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
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-[var(--elora-text-muted)] ${colors.iconFocus} transition-colors`} size={18} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className={`w-full pl-12 pr-16 py-2.5 bg-[var(--elora-surface-main)] border-[0.5px] border-[var(--elora-border-subtle)] rounded-full text-sm outline-none ${colors.focusRing} ${colors.focusBorder} transition-all font-medium text-[var(--elora-text-strong)] shadow-sm`}
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center rounded-md border border-[var(--elora-border-subtle)] bg-[var(--elora-surface-alt)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--elora-text-muted)]">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Notifications & Profile Pill */}
        <div className="flex items-center gap-4">
          {notificationsNode && (
            <div className="flex items-center p-1 px-2 border-r border-[var(--elora-border-subtle)] mr-1">
              {notificationsNode}
            </div>
          )}
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="group inline-flex items-center gap-3 rounded-full bg-[var(--elora-surface-main)] shadow-sm px-4 py-1.5 border border-[var(--elora-border-subtle)] hover:shadow-md hover:border-[var(--elora-border-muted)] transition-all active:scale-95"
            >
              <div className="min-w-0 text-right">
                  <div className="truncate text-sm font-semibold text-[var(--elora-text-strong)] leading-tight group-hover:text-[var(--elora-text-strong)]">{localDisplayName || displayName}</div>
                <div className={`text-[10px] font-medium tracking-[0.15em] uppercase leading-tight text-[var(--elora-text-muted)] opacity-70`}>{roleLabel}</div>
              </div>
              <div className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl ${colors.avatarBg} border-white text-white flex items-center justify-center font-bold border-2 shadow-lg ${colors.shadow} transform group-hover:scale-105 transition-transform`}>
                {avatarInitials}
              </div>
              <ChevronDown size={16} className={`text-[var(--elora-text-muted)] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
              {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 origin-top-right bg-[var(--elora-surface-main)] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-[var(--elora-border-subtle)] py-2 focus:outline-none animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--elora-border-subtle-alt)] mb-1">
                  <p className="text-[10px] font-bold text-[var(--elora-text-muted)] uppercase tracking-widest mb-0.5">Account</p>
                  <p className="text-sm font-semibold text-[var(--elora-text-strong)] truncate">{localDisplayName || displayName}</p>
                </div>

                <button
                  onClick={handleSettingsClick}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-[var(--elora-text-secondary)] ${colors.hoverBg} transition-colors text-left`}
                >
                  <Settings size={18} className="text-[var(--elora-text-muted)]" />
                  Profile & Settings
                </button>

                <div className="my-1 border-t border-[var(--elora-border-subtle)]" />

                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut size={18} className="text-red-400" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
