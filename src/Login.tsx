// src/Login.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserRole } from './auth/AuthContext';

// After "login", the user goes to /verify with their chosen role pre-filled.
// VerifyPage reads location.state.role and routes to the correct dashboard on verify.
export default function Login() {
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState<UserRole>('teacher');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Pass the chosen role via router state so VerifyPage pre-fills it.
        navigate('/verify', { state: { role: selectedRole } });
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
                    <h2 className="font-serif text-2xl text-elora-400 mb-2">Welcome back</h2>
                    <p className="text-gray-500 text-sm">Sign in to continue your learning journey.</p>
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
                        <label className="block text-sm font-medium text-elora-400 mb-1.5" htmlFor="login-email">Email address</label>
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
                        <input
                            type="password"
                            id="login-password"
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-elora-200 focus:border-transparent transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-elora-400 hover:bg-elora-300 text-white font-medium rounded-xl px-4 py-3.5 mt-4 transition-colors shadow-sm flex justify-center items-center"
                    >
                        Sign in to Elora
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-500">
                    New here?{' '}
                    <Link to="/signup" className="font-medium text-elora-200 hover:text-elora-300 transition-colors">Create an account</Link>
                </p>
            </div>
        </main>
    );
}
