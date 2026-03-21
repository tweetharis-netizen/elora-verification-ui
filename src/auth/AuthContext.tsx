// src/auth/AuthContext.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Auth layer that maps role selector → demo backend user.
// CurrentUser is persisted in localStorage so a page refresh keeps you logged in.
// All API calls read headers from here via dataService.setCurrentUser().
// ─────────────────────────────────────────────────────────────────────────────

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react';
import { setCurrentUser as dsSetCurrentUser } from '../services/dataService';

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole = 'teacher' | 'student' | 'parent';

export interface CurrentUser {
    id: string;
    name: string;
    role: UserRole;
    preferredName?: string;
    assistantName?: string;
}

// ── Demo user map ─────────────────────────────────────────────────────────────
// These IDs match the in-memory DB seeded in server/db.ts.

export const DEMO_USERS: Record<UserRole, CurrentUser> = {
    teacher: {
        id: 'teacher_1',
        name: 'Mr. Michael Lee',
        role: 'teacher',
        preferredName: 'Michael',
        assistantName: 'Elora',
    },
    student: {
        id: 'student_1',
        name: 'Jordan Lee',
        role: 'student',
        preferredName: 'Jordan',
        assistantName: 'Elora',
    },
    parent: {
        id: 'parent_1',
        name: 'Mr. Lee',
        role: 'parent',
        preferredName: 'Lee',
        assistantName: 'Elora',
    },
};

const LS_KEY = 'elora_current_user';

function loadFromStorage(): CurrentUser | null {
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? (JSON.parse(raw) as CurrentUser) : null;
    } catch {
        return null;
    }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface AuthState {
    /** The currently signed-in user, or null if not logged in. */
    currentUser: CurrentUser | null;
    /** True when a user is logged in. Convenience alias for !!currentUser. */
    isVerified: boolean;
    /** The current user's role (null when not logged in). */
    role: UserRole | null;
    /**
     * Signs in as one of the three demo users matching the given role.
     * Persists to localStorage and syncs headers to dataService.
     */
    login: (role: UserRole, data?: Partial<CurrentUser>) => void;
    /** Updates the current user profile (e.g. preferredName, assistantName). */
    updateProfile: (data: Partial<CurrentUser>) => void;
    /** Signs out, clears storage and resets dataService headers. */
    logout: () => void;
    /**
     * @deprecated Use login() instead. Kept for backward compatibility
     * with any call-sites that still use mockVerify().
     */
    mockVerify: (role: UserRole) => void;
}

const AuthContext = createContext<AuthState | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(
        loadFromStorage
    );

    // On mount (and whenever currentUser changes), push the user into dataService
    // so all fetch helpers pick up the right headers automatically.
    useEffect(() => {
        dsSetCurrentUser(currentUser);
    }, [currentUser]);

    const login = (role: UserRole, data?: Partial<CurrentUser>) => {
        const baseUser = DEMO_USERS[role];
        const user: CurrentUser = {
            ...baseUser,
            ...data,
            role: baseUser.role,
            id: baseUser.id,
            name: baseUser.name,
        };
        setCurrentUser(user);
        localStorage.setItem(LS_KEY, JSON.stringify(user));
        dsSetCurrentUser(user);
    };

    const updateProfile = (data: Partial<CurrentUser>) => {
        setCurrentUser((prev) => {
            if (!prev) return prev;
            const next = { ...prev, ...data };
            localStorage.setItem(LS_KEY, JSON.stringify(next));
            return next;
        });
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem(LS_KEY);
        dsSetCurrentUser(null);
    };

    const value: AuthState = {
        currentUser,
        isVerified: currentUser !== null,
        role: currentUser?.role ?? null,
        login,
        updateProfile,
        logout,
        // backward compat alias
        mockVerify: login,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/** Convenience hook – throws if used outside <AuthProvider>. */
export function useAuth(): AuthState {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be called inside <AuthProvider>');
    return ctx;
}
