// src/components/ProtectedRoute.tsx
// ────────────────────────────────────────────────────────────────────────────
// Simple client-side route guard. No backend validation.
// If the user is not verified, they are redirected to /verify.
// ────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isVerified } = useAuth();

    if (!isVerified) {
        // Not logged in → send to /login
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
