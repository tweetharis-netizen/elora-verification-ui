// src/components/DemoRoleSwitcher.tsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Users, User, Heart, Home } from 'lucide-react';

export const DemoRoleSwitcher = () => {
    const { pathname } = useLocation();

    // Helper to check if a route is active
    const isActive = (path: string) => pathname.startsWith(path);

    const roles = [
        { id: 'teacher', name: 'Teacher view — Ms. Tan', path: '/teacher/demo', icon: Users },
        { id: 'student', name: 'Student view — Jordan', path: '/student/demo', icon: User },
        { id: 'parent', name: 'Parent view — Mr. Lee', path: '/parent/demo', icon: Heart },
    ];

    return (
        <div className="bg-[#FAF8F4] border-b border-[#E8E4DA] py-3 px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#68507B] animate-pulse" />
                <span>Demo Experience Role Switcher</span>
            </div>
            
            <div className="flex flex-wrap justify-center bg-white border border-[#E8E4DA] p-1.5 rounded-2xl shadow-sm hover:shadow-md transition-shadow max-w-full">
                {roles.map((role) => {
                    const Icon = role.icon;
                    const active = isActive(role.path);
                    return (
                        <NavLink
                            key={role.name}
                            to={role.path}
                            className={`flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[12px] md:text-[13px] font-bold transition-all duration-300 ${
                                active
                                    ? 'bg-[#68507B] text-white shadow-lg shadow-[#68507B]/20 scale-[1.02]'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <Icon size={15} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} />
                            <span className={active ? 'inline' : 'hidden sm:inline'}>
                                {role.name.split(' — ')[0]}
                            </span>
                        </NavLink>
                    );
                })}
                <div className="w-px h-8 bg-slate-200 mx-1.5 self-center hidden sm:block" />
                <NavLink
                    to="/"
                    className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[12px] md:text-[13px] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                    <Home size={15} className="text-slate-400" />
                    <span className="hidden sm:inline">Home</span>
                </NavLink>
            </div>
        </div>
    );
};

export default DemoRoleSwitcher;
