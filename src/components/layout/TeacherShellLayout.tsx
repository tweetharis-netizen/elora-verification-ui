import React, { useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, Settings, Sparkles, Target, TrendingUp, X } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useDemoMode } from '../../hooks/useDemoMode';
import { useSidebarState } from '../../hooks/useSidebarState';
import { getRoleSidebarTheme, type RoleSidebarTheme } from '../../lib/roleTheme';
import { DashboardHeader } from '../DashboardHeader';
import { EloraLogo } from '../EloraLogo';
import { demoTeacherName } from '../../demo/demoTeacherScenarioA';

type NavItemConfig = {
  id: string;
  label: string;
  icon: any;
  to: string;
  end?: boolean;
};

function SidebarLink({
  icon: Icon,
  label,
  to,
  active = false,
  collapsed,
  onNavigate,
  theme,
}: {
  icon: any;
  label: string;
  to: string;
  active?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
  theme: RoleSidebarTheme;
}) {
  const navigate = useNavigate();
  const activeClasses = `${theme.navActiveBg} ${theme.navActiveText}`;
  const inactiveClasses = `${theme.navInactiveText} ${theme.navHoverBg} ${theme.navHoverText}`;

  return (
    <button
      type="button"
      onClick={() => {
        navigate(to);
        onNavigate?.();
      }}
      className={`group relative flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${active ? activeClasses : inactiveClasses} ${collapsed ? 'justify-center' : ''}`}
      title={collapsed ? label : undefined}
    >
      <Icon size={20} className="shrink-0 transition-transform group-hover:scale-110" />
      {!collapsed && <span className="whitespace-nowrap tracking-tight">{label}</span>}
      {active && !collapsed && <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-current" />}
    </button>
  );
}

export default function TeacherShellLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const isDemo = useDemoMode();
  const [isSidebarOpen, setIsSidebarOpen] = useSidebarState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sidebarTheme = getRoleSidebarTheme('teacher');

  const navItems: NavItemConfig[] = useMemo(() => {
    const dashboard = isDemo ? '/teacher/demo' : '/dashboard/teacher';
    const classes = isDemo ? '/teacher/demo/classes' : '/teacher/classes';
    const assignments = isDemo ? '/teacher/demo/assignments' : '/teacher/assignments';
    const practice = isDemo ? '/teacher/demo/practice' : '/teacher/practice';
    const copilot = isDemo ? '/teacher/demo/copilot' : '/teacher/copilot';

    return [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        to: dashboard,
        end: true,
      },
      {
        id: 'classes',
        label: 'My Classes',
        icon: BookOpen,
        to: classes,
      },
      {
        id: 'assignments',
        label: 'Assignments',
        icon: FileText,
        to: assignments,
        end: true,
      },
      {
        id: 'practice',
        label: 'Practice & quizzes',
        icon: Target,
        to: practice,
        end: true,
      },
      {
        id: 'copilot',
        label: 'Copilot',
        icon: Sparkles,
        to: copilot,
        end: true,
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: TrendingUp,
        to: `${dashboard}#reports`,
      },
    ];
  }, [isDemo]);

  const displayName = isDemo ? demoTeacherName : (currentUser?.preferredName ?? currentUser?.name ?? 'Teacher');
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#FDFBF5] text-slate-900 overflow-x-hidden">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        id="teacher-shell-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex flex-col transition-all transition-colors duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'w-64' : 'w-20'} ${sidebarTheme.asideBg} shadow-xl md:sticky md:top-0 md:min-h-screen ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className={`h-24 flex items-center border-b ${sidebarTheme.headerBorder} px-8 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
          <Link to="/" className="flex items-center text-white/90 hover:text-white transition-colors overflow-hidden shrink-0">
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
              className="hidden md:flex p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={18} />
            </button>
          )}
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto no-scrollbar custom-scrollbar">
          {navItems
            .filter((item) => !(isDemo && (item.id === 'copilot' || item.id === 'reports')))
            .map((item) => (
              <React.Fragment key={item.id}>
                <SidebarLink
                  icon={item.icon}
                  label={item.label}
                  to={item.to}
                  active={
                    item.id === 'dashboard'
                      ? pathname === (isDemo ? '/teacher/demo' : '/dashboard/teacher')
                      : item.id === 'classes'
                        ? pathname === (isDemo ? '/teacher/demo/classes' : '/teacher/classes') || pathname.startsWith(isDemo ? '/teacher/demo/class/' : '/teacher/classes/')
                        : item.id === 'assignments'
                          ? pathname === (isDemo ? '/teacher/demo/assignments' : '/teacher/assignments')
                          : item.id === 'practice'
                            ? pathname === (isDemo ? '/teacher/demo/practice' : '/teacher/practice')
                            : item.id === 'copilot'
                              ? pathname.startsWith(isDemo ? '/teacher/demo/copilot' : '/teacher/copilot')
                              : false
                  }
                  collapsed={!isSidebarOpen}
                  onNavigate={() => setIsMobileMenuOpen(false)}
                  theme={sidebarTheme}
                />
              </React.Fragment>
            ))}
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

          <SidebarLink
            icon={Settings}
            label="Settings"
            to={pathname}
            active={false}
            collapsed={!isSidebarOpen}
            theme={sidebarTheme}
          />

          <button
            onClick={logout}
            className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors ${!isSidebarOpen ? 'justify-center' : ''}`}
            title={!isSidebarOpen ? 'Sign out' : undefined}
          >
            <LogOut size={20} className="shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">Sign out</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#FDFBF5]/50 overflow-x-hidden">
        <DashboardHeader
          role="teacher"
          displayName={displayName}
          roleLabel="TEACHER"
          avatarInitials={initials || 'T'}
          onMobileMenuToggle={() => setIsMobileMenuOpen(true)}
        />
        <div className="flex-1 transition-opacity duration-300 ease-out motion-safe:animate-in motion-safe:fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
