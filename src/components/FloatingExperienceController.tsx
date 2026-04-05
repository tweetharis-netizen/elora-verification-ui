import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, UserRound, Heart } from 'lucide-react';

const SIDEBAR_STATE_KEY = 'elora_sidebar_open';
const SIDEBAR_OPEN_WIDTH_PX = 256;
const SIDEBAR_COLLAPSED_WIDTH_PX = 80;

export const FloatingExperienceController = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 768px)').matches;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(SIDEBAR_STATE_KEY) !== 'false';
  });
  const [isInitialRender, setIsInitialRender] = useState(true);

  const roles = [
    { id: 'teacher', label: 'Teacher', path: '/teacher/demo', person: 'Mr. Michael Lee', icon: GraduationCap, accent: 'text-teal-700' },
    { id: 'student', label: 'Student', path: '/student/demo', person: 'Jordan Lee', icon: UserRound, accent: 'text-[#7C3AED]' },
    { id: 'parent', label: 'Parent', path: '/parent/demo', person: 'Shaik Haris', icon: Heart, accent: 'text-[#F97316]' },
  ] as const;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const syncDesktop = (event?: MediaQueryListEvent) => {
      setIsDesktop(event ? event.matches : mediaQuery.matches);
    };
    const syncSidebar = () => {
      setIsSidebarOpen(window.localStorage.getItem(SIDEBAR_STATE_KEY) !== 'false');
    };

    syncDesktop();
    syncSidebar();

    mediaQuery.addEventListener('change', syncDesktop);
    window.addEventListener('storage', syncSidebar);

    return () => {
      mediaQuery.removeEventListener('change', syncDesktop);
      window.removeEventListener('storage', syncSidebar);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const interval = window.setInterval(() => {
      setIsSidebarOpen(window.localStorage.getItem(SIDEBAR_STATE_KEY) !== 'false');
    }, 300);

    return () => window.clearInterval(interval);
  }, []);

  const controllerLeft = useMemo(() => {
    if (!isDesktop) return '50%';
    const sidebarOffset = (isSidebarOpen ? SIDEBAR_OPEN_WIDTH_PX : SIDEBAR_COLLAPSED_WIDTH_PX) / 2;
    return `calc(50% + ${sidebarOffset}px)`;
  }, [isDesktop, isSidebarOpen]);

  const runCrossFade = () => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.remove('demo-role-switching');
    requestAnimationFrame(() => {
      document.documentElement.classList.add('demo-role-switching');
      window.setTimeout(() => {
        document.documentElement.classList.remove('demo-role-switching');
      }, 300);
    });
  };

  useEffect(() => {
    if (isInitialRender) {
      setIsInitialRender(false);
      return;
    }
    runCrossFade();
  }, [pathname, isInitialRender]);

  const handleNavigate = (path: string) => {
    if (path === pathname) return;
    navigate(path);
  };

  return (
    <div className="fixed bottom-6 z-[100] -translate-x-1/2 pointer-events-auto" style={{ left: controllerLeft }}>
      <div className="rounded-xl border border-white/40 bg-white/70 px-2 py-2 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-1.5">
          {roles.map((role) => {
            const Icon = role.icon;
            const active = pathname.startsWith(role.path);

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => handleNavigate(role.path)}
                title={`${role.label} view - ${role.person}`}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold tracking-tight transition-all duration-300 ${
                  active
                    ? `${role.accent} bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] opacity-100`
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/20 opacity-80 hover:opacity-100'
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{role.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FloatingExperienceController;
