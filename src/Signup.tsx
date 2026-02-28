// src/Signup.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserRole } from './auth/AuthContext';

// Signup no longer receives setIsAuthenticated – auth state is managed by AuthContext.
// The selected role is passed to /verify via navigation state so VerifyPage can pre-fill it.
export default function Signup() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole>('teacher');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to /verify and pass the chosen role in router state.
    navigate('/verify', { state: { role: selectedRole } });
  };

  return (
    <main className="min-h-screen flex flex-col lg:flex-row w-full bg-white">
      {/* Left Column: Pitch & Visuals */}
      <div className="relative flex-1 bg-elora-400 flex flex-col justify-center p-8 lg:p-16 overflow-hidden min-h-[40vh] lg:min-h-screen">
        <div className="absolute inset-0 bg-grid opacity-50"></div>

        <div className="relative z-10 max-w-lg mx-auto lg:mx-0 lg:max-w-md">
          <Link to="/" className="inline-block mb-10 lg:mb-16">
            <h1 className="font-serif text-4xl lg:text-5xl text-white tracking-tight">Elora.</h1>
          </Link>

          <h2 className="font-serif text-3xl lg:text-4xl text-white leading-tight mb-12">
            Your entire classroom, <br /><span className="text-elora-100 italic">supercharged by AI.</span>
          </h2>

          <div className="hidden lg:block relative h-64 w-full perspective-1000">
            <div className="absolute top-0 left-0 w-48 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 transform -rotate-6 shadow-xl animate-float">
              <div className="w-8 h-8 rounded-full bg-accent-orange mb-3"></div>
              <div className="h-2 w-24 bg-white/50 rounded mb-2"></div>
              <div className="h-2 w-16 bg-white/30 rounded"></div>
            </div>
            <div className="absolute top-12 right-4 w-56 bg-elora-300/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 transform rotate-3 shadow-2xl animate-float-delayed">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent-green flex-shrink-0"></div>
                <div className="w-full">
                  <div className="h-2.5 w-20 bg-white/70 rounded mb-1.5"></div>
                  <div className="h-2 w-12 bg-white/40 rounded"></div>
                </div>
              </div>
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden mt-4">
                <div className="h-full w-2/3 bg-accent-yellow rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="flex-1 flex flex-col justify-center p-8 lg:p-16 bg-white">
        <div className="w-full max-w-md mx-auto">
          <h3 className="font-serif text-3xl text-elora-400 mb-2">Create an account</h3>
          <p className="text-gray-500 mb-8">Join Elora to start your learning journey.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-elora-400 mb-2">I am a...</label>
              <div className="flex gap-3">
                {(['teacher', 'student', 'parent'] as UserRole[]).map((r) => (
                  <label key={r} className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
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
              <label className="block text-sm font-medium text-elora-400 mb-1.5" htmlFor="fullName">Full name</label>
              <input
                type="text"
                id="fullName"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-elora-200 focus:border-transparent transition-all"
                placeholder="Jane Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-elora-400 mb-1.5" htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-elora-200 focus:border-transparent transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-elora-400 mb-1.5" htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-elora-200 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-elora-400 hover:bg-elora-300 text-white font-medium rounded-xl px-4 py-3.5 mt-2 transition-colors shadow-sm flex justify-center items-center"
            >
              Create my Elora account
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-elora-200 hover:text-elora-300 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
