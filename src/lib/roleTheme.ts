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
        asideBg: 'bg-[#164e4a]',
        text: 'text-teal-50',
        headerBorder: 'border-teal-800/50',
        footerBorder: 'border-teal-800/50',
        navActiveBg: '',
        navActiveText: 'text-white font-bold',
        navInactiveText: 'text-teal-100',
        navHoverBg: '',
        navHoverText: 'hover:text-white',
    },
    student: {
        asideBg: 'bg-[#362c45]',
        text: 'text-white',
        headerBorder: 'border-white/10',
        footerBorder: 'border-white/10',
        navActiveBg: '',
        navActiveText: 'text-white font-bold',
        navInactiveText: 'text-white/70',
        navHoverBg: '',
        navHoverText: 'hover:text-white',
    },
    parent: {
        asideBg: 'bg-[#6e4225]',
        text: 'text-white',
        headerBorder: 'border-white/10',
        footerBorder: 'border-white/10',
        navActiveBg: '',
        navActiveText: 'text-white font-bold',
        navInactiveText: 'text-white/70',
        navHoverBg: '',
        navHoverText: 'hover:text-white',
    },
};

export function getRoleSidebarTheme(role: EloraRole): RoleSidebarTheme {
    return ROLE_SIDEBAR_THEMES[role];
}
