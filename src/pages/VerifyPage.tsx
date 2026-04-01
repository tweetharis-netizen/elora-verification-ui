// src/pages/VerifyPage.tsx
// ────────────────────────────────────────────────────────────────────────────
// Mock verification page.
// In a real app this would confirm an email/phone code from the backend.
// Here it simply calls mockVerify() and navigates to the correct dashboard.
//
// Role is pre-filled from signup navigation state (location.state.role).
// If the user arrives directly (e.g. from /login), they can pick their role
// from the selector shown on screen.
// ────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth, UserRole } from '../auth/AuthContext';
import { ShieldCheck, Mail } from 'lucide-react';

const ROLE_LABELS: Record<UserRole, string> = {
    teacher: 'Teacher',
    student: 'Student',
    parent: 'Parent',
};

const DASHBOARD_PATHS: Record<UserRole, string> = {
    teacher: '/dashboard/teacher',
    student: '/dashboard/student',
    parent: '/dashboard/parent',
};

export default function VerifyPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    // Extract role and name from navigation state.
    const state = location.state as { role?: UserRole; name?: string } | null;
    const selectedRole = state?.role ?? 'teacher';
    const passedName = state?.name ?? '';

    const handleVerify = async () => {
        // Direct transition using the name from signup.
        const displayName = passedName.trim();
        const preferredName = displayName || (selectedRole === 'teacher' ? 'Michael' : selectedRole === 'student' ? 'Jordan' : 'Lee');
        
        // Login and navigate directly.
        login(selectedRole, {
            name: preferredName,
            preferredName: preferredName,
        });
        
        navigate(DASHBOARD_PATHS[selectedRole], { replace: true });
    };



    return (
        <main className="min-h-screen w-full bg-elora-400 relative flex items-center justify-center p-4 lg:p-8 overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 bg-grid opacity-40" />
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-elora-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-blob" />
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-elora-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-blob animation-delay-2000" />

            <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 lg:p-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block mb-6">
                        <h1 className="font-serif text-3xl text-elora-400 tracking-tight">Elora.</h1>
                    </Link>

                    {/* Icon */}
                    <div className="w-16 h-16 rounded-2xl bg-elora-400/10 flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="w-8 h-8 text-elora-400" />
                    </div>

                    <h2 className="font-serif text-2xl text-elora-400 mb-2">
                        {passedName ? `Confirm your arrival, ${passedName.split(' ')[0]}` : 'Confirm your arrival'}
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Check your inbox for a link to your new space.
                        Click it to continue — or use the shortcut below while we're in preview.
                    </p>
                </div>

                {/* Mock email pill */}
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6">
                    <Mail className="w-4 h-4 text-elora-200 shrink-0" />
                    <span className="text-sm text-gray-500">Check your inbox for a verification link</span>
                </div>



                {/* Primary CTA */}
                <button
                    id="verify-btn"
                    onClick={handleVerify}
                    className="w-full bg-elora-400 hover:bg-elora-300 text-white font-medium rounded-xl px-4 py-3.5 transition-colors shadow-sm flex justify-center items-center gap-2"
                >
                    <ShieldCheck className="w-4 h-4" />
                    Enter my dashboard
                </button>

                <p className="mt-6 text-center text-xs text-gray-400">
                    Didn't get the email?{' '}
                    <button className="text-elora-200 hover:text-elora-300 font-medium transition-colors">
                        Resend link
                    </button>
                </p>


            </div>
        </main>
    );
}
