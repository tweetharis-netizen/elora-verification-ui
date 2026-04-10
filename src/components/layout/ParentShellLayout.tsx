import React, { useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BarChart2, FileText, LayoutDashboard, LogOut, MessageSquare, PanelLeftClose, PanelLeftOpen, Settings, Sparkles, Users, X } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useDemoMode } from '../../hooks/useDemoMode';
import { useSidebarState } from '../../hooks/useSidebarState';
import { getRoleSidebarTheme, type RoleSidebarTheme } from '../../lib/roleTheme';
import { DashboardHeader } from '../DashboardHeader';
import { EloraLogo } from '../EloraLogo';

type ParentNavItem = {
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
  theme,
}: {
  icon: any;
  label: string;
  to?: string;
  active?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
  theme: RoleSidebarTheme;
}) {
  const activeClasses = `${theme.navActiveBg} ${theme.navActiveText}`;
  const inactiveClasses = `${theme.navInactiveText} ${theme.navHoverBg} ${theme.navHoverText}`;

  return (
    <Link
      to={to || '#'}
      onClick={() => onNavigate?.()}
      className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full ${active ? activeClasses : inactiveClasses} ${collapsed ? 'justify-center' : ''}`}
      title={collapsed ? label : undefined}
    >
      {/* Elora Gold Vertical Accent Bar */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 bg-accent-yellow rounded-r-full shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
      )}
      
      <Icon size={20} className="shrink-0 transition-transform group-hover:scale-110" />
      {!collapsed && <span className="whitespace-nowrap tracking-tight">{label}</span>}
    </Link>
  );
}

export default function ParentShellLayout() {
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();
  const { currentUser, logout } = useAuth();
  const isDemo = useDemoMode();
  const [isSidebarOpen, setIsSidebarOpen] = useSidebarState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sidebarTheme = getRoleSidebarTheme('parent');

  const dashboardPath = isDemo ? '/parent/demo' : '/dashboard/parent';

  const navItems: ParentNavItem[] = useMemo(() => {
    return [
      {
        id: 'overview',
        label: 'Overview',
        icon: LayoutDashboard,
        to: `${dashboardPath}#overview`,
        isActive: (p, h) => p === dashboardPath && (!h || h === '#overview'),
      },
      {
        id: 'copilot',
        label: 'Copilot',
        icon: Sparkles,
        to: isDemo ? '/parent/demo/copilot' : '/parent/copilot',
        isActive: (p) => p.startsWith(isDemo ? '/parent/demo/copilot' : '/parent/copilot'),
      },
      {
        id: 'children',
        label: 'Children',
        icon: Users,
        to: `${dashboardPath}#children`,
        isActive: (p, h) => p === dashboardPath && h === '#children',
      },
      {
        id: 'progress',
        label: 'Progress & Reports',
        icon: BarChart2,
        to: `${dashboardPath}#progress`,
        isActive: (p, h) => p === dashboardPath && h === '#progress',
      },
      {
        id: 'assignments',
        label: 'Assignments & Quizzes',
        icon: FileText,
        to: `${dashboardPath}#assignments`,
        isActive: (p, h) => p === dashboardPath && h === '#assignments',
      },
      {
        id: 'messages',
        label: 'Messages',
        icon: MessageSquare,
        to: `${dashboardPath}#messages`,
        isActive: (p, h) => p === dashboardPath && h === '#messages',
      },
    ];
  }, [dashboardPath, isDemo]);

  const parentName = isDemo ? 'Shaik Haris' : (currentUser?.preferredName ?? currentUser?.name ?? 'Parent');
  const parentInitials = parentName
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <div className="flex min-h-screen bg-[#FDFBF5] text-slate-900 overflow-x-hidden">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        id="parent-shell-sidebar"
        className={`fixed inset-y-0 left-0 z-[120] flex flex-col transition-all transition-colors duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'} ${sidebarTheme.asideBg} shadow-2xl shadow-slate-900/20 md:sticky md:top-0 md:min-h-screen md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} ${sidebarTheme.text}`}
      >
        <div className={`h-16 flex items-center border-b ${sidebarTheme.headerBorder} px-8 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
          <Link to={isDemo ? '/parent/demo' : '/dashboard/parent'} className="flex items-center text-white/90 hover:text-white transition-colors overflow-hidden">
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
            .map((item) => (
            <React.Fragment key={item.id}>
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
              />
            </React.Fragment>
          ))}
        </nav>

        <div className={`mt-auto px-4 pt-5 pb-4 border-t ${sidebarTheme.footerBorder} space-y-1.5`}>
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center justify-center w-full p-2.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors mb-2"
              title="Expand sidebar"
            >
              <PanelLeftOpen size={20} />
            </button>
          )}

          <SidebarItem icon={Settings} label="Settings" active={false} collapsed={!isSidebarOpen} theme={sidebarTheme} />
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

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader
          role="parent"
          displayName={parentName}
          roleLabel="PARENT"
          avatarInitials={parentInitials || 'P'}
          searchPlaceholder="Search kids' progress..."
          onMobileMenuToggle={() => setIsMobileMenuOpen(true)}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

