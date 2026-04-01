// src/Signup.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { UserRole } from './auth/AuthContext';

// Signup no longer receives setIsAuthenticated – auth state is managed by AuthContext.
// The selected role is passed to /verify via navigation state so VerifyPage can pre-fill it.
export default function Signup() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole>('teacher');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to /verify and pass the chosen role and name in router state.
    navigate('/verify', { state: { role: selectedRole, name: fullName } });
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
          <h3 className="font-serif text-3xl text-elora-400 mb-2">Set up your Elora space</h3>
          <p className="text-gray-500 mb-8">A calm, shared home for teachers, students, and parents.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-elora-400 mb-2">I am joining as a...</label>
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
              <label className="block text-sm font-medium text-elora-400 mb-1.5" htmlFor="fullName">What should we call you?</label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-elora-200 focus:border-transparent transition-all"
                placeholder="e.g. Alex Rivera"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-elora-400 mb-1.5" htmlFor="email">School or personal email</label>
              <input
                type="email"
                id="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-elora-200 focus:border-transparent transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-elora-400 mb-1.5" htmlFor="password">Create a secure password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-elora-200 focus:border-transparent transition-all"
                  placeholder="8+ characters to keep your space safe"
                  required
                  minLength={8}
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
              className="w-full bg-elora-400 hover:bg-elora-300 text-white font-medium rounded-xl px-4 py-3.5 mt-2 transition-colors shadow-sm flex justify-center items-center"
            >
              Begin my journey
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-elora-200 hover:text-elora-300 transition-colors">Sign in here</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
