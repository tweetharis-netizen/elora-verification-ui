export type EloraRole = 'teacher' | 'student' | 'parent';

export type RoleSidebarTheme = {
    asideBg: string;
    text: string;
    headerBorder: string;
    footerBorder: string;
    navActiveBg: string;
    navActiveText: string;
    navInactiveText: string;
    navHoverBg: string;
    navHoverText: string;
};

export const ROLE_SIDEBAR_THEMES: Record<EloraRole, RoleSidebarTheme> = {
    teacher: {
        asideBg: 'bg-teal-900',
        text: 'text-teal-50',
        headerBorder: 'border-teal-800/50',
        footerBorder: 'border-teal-800/50',
        navActiveBg: 'bg-accent-yellow/[0.08]',
        navActiveText: 'text-accent-yellow',
        navInactiveText: 'text-teal-100',
        navHoverBg: 'hover:bg-white/10',
        navHoverText: 'hover:text-white',
    },
    student: {
        asideBg: 'bg-[#68507B]',
        text: 'text-white',
        headerBorder: 'border-white/10',
        footerBorder: 'border-white/10',
        navActiveBg: 'bg-accent-yellow/[0.08]',
        navActiveText: 'text-accent-yellow',
        navInactiveText: 'text-white/70',
        navHoverBg: 'hover:bg-white/10',
        navHoverText: 'hover:text-white',
    },
    parent: {
        asideBg: 'bg-[#DB844A]',
        text: 'text-white',
        headerBorder: 'border-white/10',
        footerBorder: 'border-white/10',
        navActiveBg: 'bg-accent-yellow/[0.08]',
        navActiveText: 'text-accent-yellow',
        navInactiveText: 'text-white/70',
        navHoverBg: 'hover:bg-white/10',
        navHoverText: 'hover:text-white',
    },
};

export function getRoleSidebarTheme(role: EloraRole): RoleSidebarTheme {
    return ROLE_SIDEBAR_THEMES[role];
}
