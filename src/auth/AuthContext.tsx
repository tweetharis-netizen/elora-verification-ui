// src/auth/AuthContext.tsx
// ────────────────────────────────────────────────────────────────────────────
// MOCK ONLY – no real backend calls are made here.
// When the real backend is ready, replace mockVerify() with an API call and
// persist the token/role in localStorage or cookies.
// ────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'teacher' | 'student' | 'parent';

interface AuthState {
    /** True once the user has completed the (mock) verification step. */
    isVerified: boolean;
    /** The role the user selected during signup / verification. Null before verification. */
    role: UserRole | null;
    /**
     * MOCK: immediately marks the user as verified with the given role.
     * No actual email / phone check is performed.
     */
    mockVerify: (role: UserRole) => void;
    /** Resets auth state (simulates signing out). */
    logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isVerified, setIsVerified] = useState(false);
    const [role, setRole] = useState<UserRole | null>(null);

    const mockVerify = (selectedRole: UserRole) => {
        setIsVerified(true);
        setRole(selectedRole);
    };

    const logout = () => {
        setIsVerified(false);
        setRole(null);
    };

    return (
        <AuthContext.Provider value={{ isVerified, role, mockVerify, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

/** Convenience hook – throws if used outside <AuthProvider>. */
export function useAuth(): AuthState {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be called inside <AuthProvider>');
    return ctx;
}
