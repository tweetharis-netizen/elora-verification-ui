import React from 'react';
import { AuthGate } from '../components/auth/AuthGate';
import { useAuthGate } from '../hooks/useAuthGate';
import { useAuth } from '../auth/AuthContext';
import { Sparkles, MessageCircle, FileText, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EloraLogo } from '../components/EloraLogo';

export default function AuthGateDemoPage() {
  const { isGuest, currentUser, logout } = useAuth();
  const { withGate } = useAuthGate();

  const handleSecretAction = () => {
    alert("Action executed! You are authenticated.");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors">
            <ChevronLeft size={20} />
            Back to Home
          </Link>
          <EloraLogo className="w-10 h-10" />
        </header>

        <section className="bg-white rounded-3xl p-10 border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-100">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">AuthGate Component Demo</h1>
              <p className="text-slate-500 mt-2">Test how the application handles gated actions for guest users.</p>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${isGuest ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
              {isGuest ? 'Guest User' : (currentUser ? 'Verified User' : 'Not Logged In')}
            </div>
          </div>

          <div className="grid gap-12">
            {/* Example 1: Declarative Button */}
            <div>
              <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Sparkles className="text-indigo-500" size={20} />
                Example 1: Gated Primary Action
              </h3>
              <p className="text-sm text-slate-500 mb-6 font-medium">Use the <code>&lt;AuthGate&gt;</code> wrapper around a button or link.</p>

              <AuthGate actionName="generate AI learning content">
                <button
                  onClick={handleSecretAction}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] w-fit"
                >
                  Generate Content
                </button>
              </AuthGate>
            </div>

            {/* Example 2: Gated Link */}
            <div>
              <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                <FileText className="text-emerald-500" size={20} />
                Example 2: Gated Navigation
              </h3>
              <p className="text-sm text-slate-500 mb-6 font-medium">Wrap a <code>Link</code> to prevent sub-page navigation.</p>

              <AuthGate actionName="view detailed learning analytics">
                <Link
                  to="/teacher/reports/active"
                  className="inline-flex items-center gap-2 font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-6 py-3 rounded-2xl hover:bg-emerald-100 transition-all"
                >
                  Open Reports
                </Link>
              </AuthGate>
            </div>

            {/* Example 3: Programmatic Hook */}
            <div>
              <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                <MessageCircle className="text-violet-500" size={20} />
                Example 3: Programmatic Guard (Hook)
              </h3>
              <p className="text-sm text-slate-500 mb-6 font-medium">Use <code>withGate()</code> from the <code>useAuthGate</code> hook.</p>

              <div className="relative max-w-lg">
                <textarea
                  onFocus={withGate(() => { }, "use the Copilot")}
                  placeholder="Try focusing this input to chat..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 font-medium h-24 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-400 font-medium">
              Testing as: <span className="text-slate-600">{currentUser?.name || "None"}</span>
            </p>
            <button
              onClick={logout}
              className="text-sm font-bold text-red-500 hover:text-red-700"
            >
              Logout (Clear state)
            </button>
          </div>
        </section>

        <footer className="mt-12 text-center text-slate-400 text-sm font-medium">
          Elora Gated Demo Protocol v1.0
        </footer>
      </div>
    </div>
  );
}
