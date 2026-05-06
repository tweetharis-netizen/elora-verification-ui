import { UserRole } from '../lib/llm/types';

export type ThemeName = 'light' | 'dark';

export type ThemeTokens = {
  appBg: string;
  appBgMuted: string;
  cardBg: string;
  cardBgMuted: string;
  cardBorder: string;
  sidebarSurface: string;
  sidebarText: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderSubtle: string;
  roleAccents: Record<UserRole, string>;
  roleSidebar: Record<UserRole, string>;
};

export const lightTheme: ThemeTokens = {
  appBg: '#fdfbf5',
  appBgMuted: '#f7f5ed',
  cardBg: '#ffffff',
  cardBgMuted: '#f8fafc',
  cardBorder: '#eae7dd',
  sidebarSurface: '#0f172a',
  sidebarText: '#f8fafc',
  textPrimary: '#111827',
  textSecondary: '#475569',
  textMuted: '#64748b',
  borderSubtle: '#e2e8f0',
  roleAccents: {
    student: '#68507b',
    teacher: '#0f766e',
    parent: '#db844a',
  },
  roleSidebar: {
    student: '#362c45',
    teacher: '#164e4a',
    parent: '#6e4225',
  },
};

export const darkTheme: ThemeTokens = {
  appBg: '#060b16',
  appBgMuted: '#0b1220',
  cardBg: '#101826',
  cardBgMuted: '#131f32',
  cardBorder: '#243244',
  sidebarSurface: '#081222',
  sidebarText: '#e2e8f0',
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  borderSubtle: '#243244',
  roleAccents: {
    student: '#a58ec9',
    teacher: '#34c6ba',
    parent: '#f2a66f',
  },
  roleSidebar: {
    student: '#362c45',
    teacher: '#164e4a',
    parent: '#6e4225',
  },
};
