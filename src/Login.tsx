// src/Login.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth, UserRole } from './auth/AuthContext';

const DASHBOARD_PATHS: Record<UserRole, string> = {
    teacher: '/dashboard/teacher',
    student: '/dashboard/student',
    parent: '/dashboard/parent',
};

// After "login", we directly sign in as the matching demo user and navigate
// to the correct dashboard (no real verification step needed for demo accounts).
export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const location = useLocation();
    const prefilledRole = (location.state as { role?: UserRole } | null)?.role ?? 'teacher';
    const [selectedRole, setSelectedRole] = useState<UserRole>(prefilledRole);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login(selectedRole);
        navigate(DASHBOARD_PATHS[selectedRole], { replace: true });
    };

    return (
        <main className="min-h-screen w-full bg-elora-400 relative flex items-center justify-center p-4 lg:p-8 overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-40"></div>

            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-elora-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-blob"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-elora-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-blob animation-delay-2000"></div>

            <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 lg:p-10">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block mb-6">
                        <h1 className="font-serif text-3xl text-elora-400 tracking-tight">Elora.</h1>
                    </Link>
                    <h2 className="font-serif text-2xl text-elora-400 mb-2">Welcome back to your space</h2>
                    <p className="text-gray-500 text-sm">Pick up exactly where you left off.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Role selector – determines which dashboard to land on */}
                    <div>
                        <label className="block text-sm font-medium text-elora-400 mb-2">
                            I am a…
                        </label>
                        <div className="flex gap-3">
                            {(['teacher', 'student', 'parent'] as UserRole[]).map((r) => (
                                <label key={r} className="flex-1 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="login-role"
                                        value={r}
                                        checked={selectedRole === r}
                                        onChange={() => setSelectedRole(r)}
                                        className="peer sr-only"
                                    />
                                    <div className="border border-gray-200 rounded-xl p-3 text-center text-sm font-medium text-gray-600 peer-checked:bg-elora-400 peer-checked:text-white peer-checked:border-elora-400 hover:border-elora-200 transition-all">
                                        {r.charAt(0).toUpperCase() + r.slice(1)}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-elora-400 mb-1.5" htmlFor="login-email">Your email</label>
                        <input
                            type="email"
                            id="login-email"
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-elora-200 focus:border-transparent transition-all"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-sm font-medium text-elora-400" htmlFor="login-password">Password</label>
                            <a href="#" className="text-xs font-medium text-elora-200 hover:text-elora-300 transition-colors">Forgot password?</a>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="login-password"
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-elora-200 focus:border-transparent transition-all"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-elora-400 p-1.5 rounded-lg transition-colors"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-elora-400 hover:bg-elora-300 text-white font-medium rounded-xl px-4 py-3.5 mt-4 transition-colors shadow-sm flex justify-center items-center"
                    >
                        Enter your space
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-500">
                    New here?{' '}
                    <Link to="/signup" className="font-medium text-elora-200 hover:text-elora-300 transition-colors">Set up your space</Link>
                </p>
            </div>
        </main>
    );
}
