import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, GraduationCap, UserRound, Heart, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

type DemoRole = 'teacher' | 'student' | 'parent';

interface RoleConfig {
  id: DemoRole;
  label: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  accent: string;
  bgColor: string;
  hoverBg: string;
  textColor: string;
}

const ROLE_CONFIGS: Record<DemoRole, RoleConfig> = {
  teacher: {
    id: 'teacher',
    label: 'Teacher',
    icon: GraduationCap,
    accent: 'text-teal-600',
    bgColor: 'bg-teal-50',
    hoverBg: 'hover:bg-teal-100',
    textColor: 'text-teal-900',
  },
  student: {
    id: 'student',
    label: 'Student',
    icon: UserRound,
    accent: 'text-purple-600',
    bgColor: 'bg-purple-50',
    hoverBg: 'hover:bg-purple-100',
    textColor: 'text-purple-900',
  },
  parent: {
    id: 'parent',
    label: 'Parent',
    icon: Heart,
    accent: 'text-orange-600',
    bgColor: 'bg-orange-50',
    hoverBg: 'hover:bg-orange-100',
    textColor: 'text-orange-900',
  },
};

interface DemoRoleNavProps {
  currentRole: DemoRole;
  onRoleChange?: (role: DemoRole) => void;
  compact?: boolean;
}

/**
 * Demo Role Navigation - Clean, accessible role switcher for demo mode
 * Appears in the top navigation bar for easy role switching
 */
export const DemoRoleNav: React.FC<DemoRoleNavProps> = ({
  currentRole,
  onRoleChange,
  compact = false,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();

  const currentConfig = ROLE_CONFIGS[currentRole];
  const CurrentIcon = currentConfig.icon;
  const otherRoles = (Object.keys(ROLE_CONFIGS) as DemoRole[]).filter(
    (role) => role !== currentRole
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleRoleSwitch = (role: DemoRole) => {
    setIsOpen(false);
    onRoleChange?.(role);
    navigate(`/${role}/demo`);
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/');
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white">
        <CurrentIcon size={16} className={currentConfig.accent} />
        <span className="text-sm font-semibold text-slate-700">
          {currentConfig.label}
        </span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 border-slate-200 transition-all ${
          isOpen
            ? 'bg-slate-50 border-slate-300 shadow-sm'
            : 'bg-white hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${currentConfig.bgColor} flex items-center justify-center`}>
            <CurrentIcon size={16} className={currentConfig.accent} />
          </div>
          <div className="text-left">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Role
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {currentConfig.label}
            </div>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white border-2 border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Role options */}
          <div className="p-2">
            {otherRoles.map((role) => {
              const config = ROLE_CONFIGS[role];
              const RoleIcon = config.icon;
              return (
                <button
                  key={role}
                  onClick={() => handleRoleSwitch(role)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-all ${config.hoverBg} text-slate-700`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}
                  >
                    <RoleIcon size={15} className={config.accent} />
                  </div>
                  <span>Switch to {config.label}</span>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-100" />

          {/* Logout option */}
          <div className="p-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium hover:bg-red-50 text-red-700 transition-all"
            >
              <LogOut size={15} />
              <span>Exit Demo</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoRoleNav;
