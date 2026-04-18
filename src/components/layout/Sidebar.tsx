import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, PanelLeftClose, PanelLeftOpen, Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EloraLogo } from '../EloraLogo';
import { navigationConfig, type EloraRole } from '@/config/navigation';
import { getRoleSidebarTheme } from '@/lib/roleTheme';

interface SidebarProps {
  role: EloraRole;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isDemo: boolean;
  logout: () => void;
  userName: string;
}

export function Sidebar({
  role,
  isSidebarOpen,
  setIsSidebarOpen,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isDemo,
  logout,
  userName,
}: SidebarProps) {
  const { pathname, hash } = useLocation();
  const theme = getRoleSidebarTheme(role);
  const navItems = navigationConfig[role];

  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[120] flex flex-col transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-64" : "w-20",
          theme.asideBg,
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "md:sticky md:top-0 md:h-screen text-white overflow-hidden shadow-2xl"
        )}
      >
        {/* Sidebar Header */}
        <div className={cn(
          "h-16 flex items-center border-b border-white/10 px-6",
          isSidebarOpen ? "justify-between" : "justify-center"
        )}>
          <Link 
            to={isDemo ? `/${role}/demo` : `/dashboard/${role}`} 
            className="flex items-center gap-2 overflow-hidden"
          >
            <EloraLogo className="w-9 h-9 shrink-0" withWordmark={false} />
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <X size={20} />
          </button>

          {isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="hidden md:flex items-center justify-center p-2.5 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <PanelLeftClose size={20} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const active = item.isActive ? item.isActive(pathname, hash, isDemo) : pathname === item.href(isDemo);
            
            return (
              <Link
                key={item.id}
                to={item.href(isDemo)}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  active 
                    ? "bg-white/20 text-white" 
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                  !isSidebarOpen && "justify-center"
                )}
                title={!isSidebarOpen ? item.label : undefined}
              >
                {/* Active Indicator Bar */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/85 rounded-r-full shadow-[0_0_8px_rgba(255,255,255,0.35)]" />
                )}

                <item.icon size={20} className={cn(
                  "shrink-0 transition-transform duration-300",
                  active ? "scale-105" : "group-hover:scale-110"
                )} />
                
                {isSidebarOpen && (
                  <span className="truncate tracking-tight">{item.label}</span>
                )}

                {item.badge && isSidebarOpen && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-md text-[10px] bg-accent-yellow text-slate-900 font-bold uppercase tracking-wider">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="mt-auto p-3 space-y-1 border-t border-white/10">
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center justify-center w-full p-2.5 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all mb-2"
              title="Expand sidebar"
            >
              <PanelLeftOpen size={20} />
            </button>
          )}

          <Link
            to={isDemo ? `/${role}/demo/settings` : `/${role}/settings`}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all",
              !isSidebarOpen && "justify-center"
            )}
            title={!isSidebarOpen ? "Settings" : undefined}
          >
            <Settings size={20} className="shrink-0" />
            {isSidebarOpen && <span>Settings</span>}
          </Link>

          <button
            onClick={logout}
            className={cn(
              "flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all",
              !isSidebarOpen && "justify-center"
            )}
            title={!isSidebarOpen ? "Sign out" : undefined}
          >
            <LogOut size={20} className="shrink-0" />
            {isSidebarOpen && <span>Sign out</span>}
          </button>

          {/* User Profile Card */}
          <div className={cn(
            "mt-4 p-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all",
            !isSidebarOpen && "px-1"
          )}>
            <div className={cn("flex items-center gap-3", !isSidebarOpen && "justify-center")}>
              <div className="h-8 w-8 rounded-full bg-accent-yellow flex items-center justify-center text-slate-900 text-xs font-bold shrink-0 shadow-lg">
                {userInitials}
              </div>
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate uppercase tracking-wider">{userName}</p>
                  <p className="text-[10px] text-white/50 truncate font-medium uppercase">{role}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
