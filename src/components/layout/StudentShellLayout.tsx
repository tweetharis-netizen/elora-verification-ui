import React, { useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Gamepad2, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, Sparkles, TrendingUp, X } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useSidebarState } from '@/hooks/useSidebarState';
import { useDemoMode } from '@/hooks/useDemoMode';
import { shouldGateCopilotAccess } from '@/hooks/useAuthGate';
import { getRoleSidebarTheme, type RoleSidebarTheme } from '@/lib/roleTheme';
import { DashboardHeader } from '@/components/DashboardHeader';
import { EloraLogo } from '@/components/EloraLogo';
import { AuthGate } from '@/components/auth/AuthGate';
import { demoStudentName } from '@/demo/demoStudentScenarioA';
import { settingsService } from '@/services/settingsService';
import { useEloraTheme } from '@/theme/ThemeProvider';

type NavItemConfig = {
  id: string;
  label: string;
  icon: any;
  to: string;
  isActive: (pathname: string, hash: string) => boolean;
};

function SidebarItem({
  icon: Icon,
  label,
  to,
  active,
  collapsed,
  onNavigate,
  onClick,
  theme,
  roleAccent,
}: {
  icon: any;
  label: string;
  to?: string;
  active?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
  onClick?: (event: React.MouseEvent) => void;
  theme: RoleSidebarTheme;
  roleAccent: string;
}) {
  const activeClasses = `${theme.navActiveBg} ${theme.navActiveText}`;
  const inactiveClasses = `${theme.navInactiveText} ${theme.navHoverBg} ${theme.navHoverText}`;

  return (
    <Link
      to={to || '#'}
      onClick={(event) => {
        onClick?.(event);
        onNavigate?.();
      }}
      className={`group relative flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${active ? activeClasses : inactiveClasses} ${collapsed ? 'justify-center' : ''}`}
      title={collapsed ? label : undefined}
    >
      {/* Active Vertical Accent Bar */}
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 rounded-r-full shadow-[0_0_8px_rgba(255,255,255,0.35)]"
          style={{ backgroundColor: roleAccent }}
        />
      )}
      
      <Icon size={20} className="shrink-0 transition-transform group-hover:scale-110" />
      {!collapsed && <span className="whitespace-nowrap tracking-tight">{label}</span>}
    </Link>
  );
}

export default function StudentShellLayout() {
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();
  const { currentUser, logout, isGuest, isVerified } = useAuth();
  const isDemo = useDemoMode();
  const [isSidebarOpen, setIsSidebarOpen] = useSidebarState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sidebarTheme = getRoleSidebarTheme('student');
  const { theme } = useEloraTheme();

  const navItems: NavItemConfig[] = useMemo(() => {
    const base = isDemo ? '/student/demo' : '/dashboard/student';
    const classes = isDemo ? '/student/demo/classes' : '/student/classes';
    const assignments = isDemo ? '/student/demo/assignments' : '/student/assignments';
    const copilot = isDemo ? '/student/demo/copilot' : '/student/copilot';

    return [
      {
        id: 'overview',
        label: 'Overview',
        icon: LayoutDashboard,
        to: base,
        isActive: (p, h) => p === base && h !== '#practice' && h !== '#reports',
      },
      {
        id: 'classes',
        label: 'My Classes',
        icon: BookOpen,
        to: classes,
        isActive: (p) => p === classes || p.startsWith(isDemo ? '/student/demo/class/' : '/student/class/'),
      },
      {
        id: 'copilot',
        label: 'Copilot',
        icon: Sparkles,
        to: copilot,
        isActive: (p) => p.startsWith(copilot),
      },
      {
        id: 'practice',
        label: 'Practice & Quizzes',
        icon: Gamepad2,
        to: `${base}#practice`,
        isActive: (p, h) => p === base && h === '#practice',
      },
      {
        id: 'assignments',
        label: 'Assignments',
        icon: FileText,
        to: assignments,
        isActive: (p) => p === assignments,
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: TrendingUp,
        to: `${base}#reports`,
        isActive: (p, h) => p === base && h === '#reports',
      },
    ];
  }, [isDemo]);

  const [displayNameState, setDisplayNameState] = React.useState<string>(() => {
    if (isDemo) return demoStudentName;
    const ss = settingsService.getSettings('student');
    return ss.displayName || (currentUser?.preferredName ?? currentUser?.name ?? 'Student');
  });
  React.useEffect(() => {
    const onSettings = (e: Event) => {
      const ev = e as CustomEvent;
      const detail = ev.detail as any;
      if (detail && detail.role === 'student' && typeof detail.displayName === 'string') {
        setDisplayNameState(detail.displayName);
      }
    };
    window.addEventListener('elora-settings-updated', onSettings as EventListener);
    return () => window.removeEventListener('elora-settings-updated', onSettings as EventListener);
  }, []);
  const displayName = displayNameState;
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen overflow-x-hidden" style={{ backgroundColor: theme.appBg, color: theme.textPrimary }}>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        id="student-shell-sidebar"
        className={`fixed inset-y-0 left-0 z-[120] flex flex-col transition-all transition-colors duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'w-64' : 'w-20'} ${sidebarTheme.asideBg} shadow-xl md:sticky md:top-0 md:min-h-screen ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          backgroundColor: theme.roleSidebar.student,
          color: theme.sidebarText,
        }}
      >
        <div className={`h-16 flex items-center border-b ${sidebarTheme.headerBorder} px-8 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
          <Link to={isDemo ? '/student/demo' : '/dashboard/student'} className="flex items-center text-white/90 hover:text-white transition-colors overflow-hidden shrink-0">
            <EloraLogo className="w-10 h-10 text-current" withWordmark={isSidebarOpen} />
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            title="Close menu"
          >
            <X size={22} />
          </button>

          {isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="hidden md:flex items-center justify-center p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={22} />
            </button>
          )}
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto no-scrollbar custom-scrollbar">
          {navItems
            .map((item) => {
            const sidebarItem = (
              <SidebarItem
                icon={item.icon}
                label={item.label}
                to={item.to}
                active={item.isActive(pathname, hash)}
                collapsed={!isSidebarOpen}
                onNavigate={() => {
                  setIsMobileMenuOpen(false);
                }}
                theme={sidebarTheme}
                roleAccent={theme.roleAccents.student}
              />
            );

            if (item.id === 'copilot' && !isDemo && shouldGateCopilotAccess({ isVerified, isGuest })) {
              return (
                <AuthGate
                  key={item.id}
                  actionName="use Copilot"
                  forceGate={shouldGateCopilotAccess({ isVerified, isGuest })}
                >
                  {sidebarItem}
                </AuthGate>
              );
            }


            return <React.Fragment key={item.id}>{sidebarItem}</React.Fragment>;
          })}
        </nav>

        <div className={`mt-auto p-6 border-t ${sidebarTheme.footerBorder} space-y-2`}>
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center justify-center w-full p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all group mb-2"
              title="Expand sidebar"
            >
              <PanelLeftOpen size={22} className="group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden" style={{ backgroundColor: theme.appBgMuted }}>
        <DashboardHeader
          role="student"
          displayName={displayName}
          roleLabel="STUDENT"
          avatarInitials={initials || 'S'}
          onMobileMenuToggle={() => setIsMobileMenuOpen(true)}
          onLogout={() => {
            logout();
            navigate('/login');
          }}
        />
        <div className="flex-1 flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

