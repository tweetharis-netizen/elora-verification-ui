import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { EloraLogo } from '../EloraLogo';
import { cn } from '@/lib/utils';
import type { EloraRole, NavItem } from '@/config/navigation';

interface MobileNavProps {
  role: EloraRole;
  navItems: NavItem[];
  currentPath: string;
  isDemo: boolean;
}

export function MobileNav({ role, navItems, currentPath, isDemo }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const roleConfigs = {
    teacher: { bg: 'bg-sidebar-teacher' },
    student: { bg: 'bg-sidebar-student' },
    parent: { bg: 'bg-accent-orange' },
  };

  const config = roleConfigs[role];

  return (
    <div className="lg:hidden">
      {/* Fixed Top Header */}
      <header className={cn(
        "fixed top-0 left-0 right-0 h-16 px-4 flex items-center justify-between z-50 transition-colors duration-300",
        config.bg,
        "shadow-lg"
      )}>
        <Link to={isDemo ? `/${role}/demo` : `/dashboard/${role}`} className="flex items-center gap-2">
          <EloraLogo className="w-9 h-9 text-white" withWordmark={true} inverted={true} />
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="text-white hover:bg-white/10"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </header>

      {/* Overlay Menu */}
      <div className={cn(
        "fixed inset-x-0 top-16 bg-surface-white border-b border-border-subtle shadow-elora-lg z-40 transition-all duration-500 ease-in-out transform origin-top",
        isOpen ? "translate-y-0 scale-y-100 opacity-100" : "-translate-y-4 scale-y-95 opacity-0 pointer-events-none"
      )}>
        <nav className="p-4 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {navItems.map((item) => {
            const href = item.href(isDemo);
            const active = item.isActive ? item.isActive(currentPath, window.location.hash, isDemo) : currentPath === href;
            
            return (
              <Button
                key={item.id}
                asChild
                variant={active ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-12 text-base font-semibold transition-all",
                  active 
                    ? "text-slate-900 border-l-4 border-accent-yellow rounded-l-none bg-slate-50" 
                    : "text-slate-600 hover:bg-slate-50"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Link to={href}>
                  <item.icon size={20} className={cn(active ? "text-accent-yellow" : "text-slate-400")} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto px-1.5 py-0.5 rounded-md text-[10px] bg-accent-yellow text-slate-900 font-bold uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </Button>
            );
          })}
        </nav>
      </div>

      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />
    </div>
  );
}
