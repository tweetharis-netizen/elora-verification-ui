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

    // Role may be pre-filled from login page (passed via navigate state).
    const prefilledRole = (location.state as { role?: UserRole } | null)?.role ?? 'teacher';
    const [selectedRole, setSelectedRole] = useState<UserRole>(prefilledRole);

    const [showPersonalize, setShowPersonalize] = useState(false);
    const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
    const [preferredName, setPreferredName] = useState('');
    const [assistantName, setAssistantName] = useState('');
    const [nameError, setNameError] = useState('');

    const openPersonalize = (role: UserRole) => {
        setPendingRole(role);
        setPreferredName('');
        setAssistantName('');
        setNameError('');
        setShowPersonalize(true);
    };

    const handleVerify = () => {
        openPersonalize(selectedRole);
    };

    const finalizeAndContinue = async (rollForward: boolean) => {
        if (!pendingRole) return;

        if (rollForward) {
            const trimmedPref = preferredName.trim();
            if (!trimmedPref) {
                setNameError('Please provide a name to proceed.');
                return;
            }
            if (trimmedPref.length > 30) {
                setNameError('Name must be 30 characters or fewer.');
                return;
            }
            const trimmedAssistant = assistantName.trim();
            if (trimmedAssistant.length > 20) {
                setNameError('Assistant name must be 20 characters or fewer.');
                return;
            }

            // Create a real user in the backend
            const realId = `u_${Date.now()}`;
            try {
                const res = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: realId,
                        name: trimmedPref,
                        email: `${realId}@elora-real.com`,
                        role: pendingRole
                    })
                });
                
                if (!res.ok) {
                    throw new Error('Failed to create real user');
                }

                login(pendingRole, {
                    id: realId,
                    name: trimmedPref,
                    preferredName: trimmedPref,
                    assistantName: trimmedAssistant || undefined,
                });
            } catch (err) {
                console.error('Error during real signup, falling back to demo:', err);
                login(pendingRole, {
                    preferredName: trimmedPref,
                    assistantName: trimmedAssistant || undefined,
                });
            }
        } else {
            login(pendingRole);
        }

        setShowPersonalize(false);
        navigate(DASHBOARD_PATHS[pendingRole], { replace: true });
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

                    <h2 className="font-serif text-2xl text-elora-400 mb-2">Verify your account</h2>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        We've sent a verification link to your email.
                        Click it to continue — or use the shortcut below while we're in preview.
                    </p>
                </div>

                {/* Mock email pill */}
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6">
                    <Mail className="w-4 h-4 text-elora-200 shrink-0" />
                    <span className="text-sm text-gray-500">Check your inbox for a verification link</span>
                </div>

                {/* Role selector (confirm/change role before verifying) */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-elora-400 mb-2">
                        Joining as…
                    </label>
                    <div className="flex gap-3">
                        {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                            <label key={r} className="flex-1 cursor-pointer">
                                <input
                                    id={`role-${r}`}
                                    type="radio"
                                    name="verify-role"
                                    value={r}
                                    checked={selectedRole === r}
                                    onChange={() => setSelectedRole(r)}
                                    className="peer sr-only"
                                />
                                <div className="border border-gray-200 rounded-xl p-3 text-center text-sm font-medium text-gray-600 peer-checked:bg-elora-400 peer-checked:text-white peer-checked:border-elora-400 hover:border-elora-200 transition-all">
                                    {ROLE_LABELS[r]}
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Primary CTA */}
                <button
                    id="verify-btn"
                    onClick={handleVerify}
                    className="w-full bg-elora-400 hover:bg-elora-300 text-white font-medium rounded-xl px-4 py-3.5 transition-colors shadow-sm flex justify-center items-center gap-2"
                >
                    <ShieldCheck className="w-4 h-4" />
                    Verify &amp; go to my dashboard
                </button>

                <p className="mt-6 text-center text-xs text-gray-400">
                    Didn't get the email?{' '}
                    <button className="text-elora-200 hover:text-elora-300 font-medium transition-colors">
                        Resend link
                    </button>
                </p>

                {showPersonalize && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 relative">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Personalize your experience</h3>
                            <p className="text-sm text-slate-500 mb-4">Enter your display name and optional assistant name.</p>

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest mb-1.5">
                                    Your name
                                </label>
                                <input
                                    value={preferredName}
                                    onChange={(e) => setPreferredName(e.target.value)}
                                    maxLength={30}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-elora-200 text-slate-900 placeholder:text-slate-400"
                                    placeholder="e.g. Mr. Lim, Ms. Sarah"
                                />
                                <p className="mt-1 text-[11px] text-slate-500 font-medium">How Elora should address you.</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest mb-1.5">
                                    Assistant name (optional)
                                </label>
                                <input
                                    value={assistantName}
                                    onChange={(e) => setAssistantName(e.target.value)}
                                    maxLength={20}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-elora-200 text-slate-900 placeholder:text-slate-400"
                                    placeholder="e.g. Elora, Coach, Study Guide"
                                />
                                <p className="mt-1 text-[11px] text-slate-500 font-medium">What you’d like to call your AI assistant (for example: Elora, Coach, Study Guide).</p>
                            </div>

                            {nameError && <p className="text-sm text-red-600 mb-3">{nameError}</p>}

                            <div className="flex gap-2">
                                <button
                                    onClick={() => finalizeAndContinue(true)}
                                    className="flex-1 bg-elora-400 text-white rounded-lg px-3 py-2 hover:bg-elora-300 transition"
                                >
                                    Save and continue
                                </button>
                                <button
                                    onClick={() => finalizeAndContinue(false)}
                                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100 transition"
                                >
                                    Skip for now
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
