import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { EloraLogo } from '../components/EloraLogo';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const location = useLocation();
  const stateEmail = (location.state as { email?: string } | null)?.email ?? '';
  const [email, setEmail] = useState(stateEmail);
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (status !== 'submitting') return;

    const timer = window.setTimeout(() => {
      setStatus('success');
    }, 850);

    return () => window.clearTimeout(timer);
  }, [status]);

  const normalizedEmail = useMemo(() => email.trim(), [email]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address to continue.');
      return;
    }

    setErrorMessage('');
    setStatus('submitting');
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (status === 'error') {
      setStatus('idle');
      setErrorMessage('');
    }
  };

  return (
    <main className="min-h-screen w-full bg-elora-400 relative flex items-center justify-center p-4 lg:p-8 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40"></div>

      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-elora-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-elora-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-blob animation-delay-2000"></div>

      <section className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 lg:p-10">
        <Link to="/" className="inline-flex items-center gap-2 text-elora-400 mb-6 hover:opacity-90 transition-opacity">
          <EloraLogo className="w-6 h-6" />
          <span className="font-serif text-2xl tracking-tight">Elora</span>
        </Link>

        {status === 'success' ? (
          <div>
            <div className="w-12 h-12 rounded-full bg-elora-100/20 text-elora-300 flex items-center justify-center mb-5">
              <MailCheck className="w-6 h-6" aria-hidden="true" />
            </div>
            <h1 className="font-serif text-3xl text-elora-400 mb-3">Check your email</h1>
            <p className="text-gray-600 leading-relaxed">
              If an account exists for <span className="font-medium text-gray-800">{normalizedEmail}</span>, we&apos;ve sent a link to reset your password.
            </p>
            <p className="text-sm text-gray-500 mt-3">For security, reset links expire after a short time.</p>

            <Link
              to="/login"
              className="mt-8 w-full bg-elora-400 hover:bg-elora-300 text-white font-medium rounded-xl px-4 py-3.5 transition-colors shadow-sm flex justify-center items-center"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-serif text-3xl text-elora-400 mb-2">Reset your password</h1>
            <p className="text-gray-500 mb-8 text-sm">
              We&apos;ll send a link to the email address associated with your account.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-medium text-elora-400 mb-1.5" htmlFor="forgot-email">
                  Email address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(event) => handleEmailChange(event.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-elora-200 focus:border-transparent transition-all"
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={status === 'error'}
                  aria-describedby={status === 'error' ? 'forgot-email-error' : undefined}
                />
                {status === 'error' && (
                  <p id="forgot-email-error" className="text-sm text-red-600 mt-2">
                    {errorMessage}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full bg-elora-400 hover:bg-elora-300 disabled:bg-elora-300/70 disabled:cursor-not-allowed text-white font-medium rounded-xl px-4 py-3.5 transition-colors shadow-sm flex justify-center items-center"
              >
                {status === 'submitting' ? 'Sending...' : 'Send reset link'}
              </button>
            </form>

            <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-elora-200 hover:text-elora-300 transition-colors">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Back to sign in
            </Link>
          </>
        )}
      </section>
    </main>
  );
}