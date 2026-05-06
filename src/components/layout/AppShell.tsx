import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useDemoMode } from '@/hooks/useDemoMode';
import { useSidebarState } from '@/hooks/useSidebarState';
import { DashboardHeader } from '../DashboardHeader';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { navigationConfig, type EloraRole } from '@/config/navigation';
import { useEloraTheme } from '@/theme/ThemeProvider';

interface AppShellProps {
  role: EloraRole;
  searchPlaceholder?: string;
  showCopilot?: boolean;
}

export function AppShell({ role, searchPlaceholder, showCopilot }: AppShellProps) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const isDemo = useDemoMode();
  const { pathname } = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useSidebarState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme } = useEloraTheme();

  // Derive user info
  const userName = isDemo 
    ? (role === 'teacher' ? 'Dr. Elizabeth' : role === 'student' ? 'Alex Rivers' : 'Shaik Haris')
    : (currentUser?.preferredName ?? currentUser?.name ?? 'User');

  const roleLabel = role.toUpperCase();
  const navItems = navigationConfig[role];

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen overflow-x-hidden" style={{ backgroundColor: theme.appBg, color: theme.textPrimary }}>
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:flex">
        <Sidebar
          role={role}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          isDemo={isDemo}
          logout={() => {
            logout();
            navigate('/login');
          }}
          userName={userName}
        />
      </div>

      {/* Mobile Nav - Visible only on mobile */}
      <MobileNav 
        role={role}
        navItems={navItems}
        currentPath={pathname}
        isDemo={isDemo}
      />

      <main className="flex-1 flex flex-col min-w-0 pt-16 lg:pt-0">
        {/* Desktop Header - Hidden on mobile */}
        <div className="hidden lg:block sticky top-0 z-30">
          <DashboardHeader
            role={role}
            displayName={userName}
            roleLabel={roleLabel}
            avatarInitials={userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            searchPlaceholder={searchPlaceholder || `Search ${role} dashboard...`}
          />
        </div>
        
        <div className="flex-1 min-h-0 overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
