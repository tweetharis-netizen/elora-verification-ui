// src/components/DemoRoleSwitcher.tsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Users, User, Heart } from 'lucide-react';

export const DemoRoleSwitcher = () => {
    const { pathname } = useLocation();

    // Helper to check if a route is active
    const isActive = (path: string) => pathname.startsWith(path);

    const roles = [
        { name: 'Teacher', path: '/teacher/demo', icon: Users },
        { name: 'Student', path: '/student/demo', icon: User },
        { name: 'Parent', path: '/parent/demo', icon: Heart },
    ];

    return (
        <div className="bg-[#FAF8F4] border-b border-[#E8E4DA] py-3 px-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Switch Role:
            </div>
            <div className="flex bg-white border border-[#E8E4DA] p-1 rounded-xl shadow-sm">
                {roles.map((role) => {
                    const Icon = role.icon;
                    const active = isActive(role.path);
                    return (
                        <NavLink
                            key={role.name}
                            to={role.path}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                                active
                                    ? 'bg-[#68507B] text-white shadow-md'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                        >
                            <Icon size={14} className={active ? 'text-white' : 'text-slate-400'} />
                            <span>{role.name}</span>
                        </NavLink>
                    );
                })}
            </div>
        </div>
    );
};

export default DemoRoleSwitcher;
