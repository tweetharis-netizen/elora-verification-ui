import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

interface DashboardAuthGateProps {
  role: 'Teacher' | 'Student' | 'Parent';
  rolePath: 'teacher' | 'student' | 'parent';
  themeColor?: string;
  onDismiss?: () => void;
}

/**
 * Authentication Gate for Dashboard Pages (Demo Mode)
 * Shows a clean, role-specific gate encouraging sign-in or guest exploration
 */
export const DashboardAuthGate: React.FC<DashboardAuthGateProps> = ({
  role,
  rolePath,
  themeColor = '#14b8a6',
  onDismiss,
}) => {
  const roleDescriptions: Record<string, string> = {
    Teacher:
      'Manage your classes, track student progress, and get AI-powered teaching insights.',
    Student: 'View assignments, practice with AI guidance, and track your learning progress.',
    Parent: 'Understand your child\'s learning journey and stay connected with their education.',
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100"
      style={{
        backgroundImage: `linear-gradient(135deg, ${themeColor}08 0%, rgba(255,255,255,0) 100%)`,
      }}
    >
      <div className="w-full max-w-md">
        <div
          className="bg-white rounded-2xl border-2 p-8 shadow-sm space-y-8"
          style={{ borderColor: `${themeColor}20` }}
        >
          {/* Header */}
          <div className="text-center space-y-3">
            <div
              className="w-12 h-12 mx-auto rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${themeColor}10` }}
            >
              <Sparkles size={24} style={{ color: themeColor }} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {role} Dashboard
            </h1>
            <p className="text-sm text-slate-600">
              {roleDescriptions[role]}
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-100" />

          {/* Actions */}
          <div className="space-y-3">
            <Link
              to={`/${rolePath}/login`}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all border-2"
              style={{
                color: themeColor,
                backgroundColor: `${themeColor}05`,
                borderColor: `${themeColor}20`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = themeColor;
                e.currentTarget.style.backgroundColor = `${themeColor}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${themeColor}20`;
                e.currentTarget.style.backgroundColor = `${themeColor}05`;
              }}
            >
              Sign In
              <ArrowRight size={16} />
            </Link>

            <Link
              to={`/${rolePath}/signup`}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            >
              Create Account
            </Link>

            <Link
              to={`/${rolePath}/demo`}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all text-slate-500 hover:text-slate-700 text-sm"
                          onClick={onDismiss}
            >
              Continue Exploring →
            </Link>
          </div>

          {/* Footer note */}
          <div className="text-xs text-slate-500 text-center">
            Explore as a demo {role.toLowerCase()} to see the full experience
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAuthGate;
