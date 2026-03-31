import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, LogIn, UserPlus, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionName?: string;
}

export const AuthGateModal: React.FC<AuthGateModalProps> = ({
  isOpen,
  onClose,
  actionName = "access this feature"
}) => {
  const navigate = useNavigate();

  const handleAuth = (path: '/login' | '/signup') => {
    onClose();
    navigate(path, { state: { from: window.location.pathname } });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md overflow-hidden bg-white rounded-3xl shadow-2xl border border-slate-200"
          >
            {/* Header / Banner */}
            <div className="h-24 bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center justify-center relative">
              <div className="absolute top-4 right-4">
                <button
                  onClick={onClose}
                  className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                <ShieldCheck className="text-white" size={32} />
              </div>
            </div>

            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Unlock Full Features
              </h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                You're currently exploring in guest mode. Please create a free account to <span className="font-semibold text-indigo-600">{actionName}</span> and save your progress.
              </p>

              <div className="grid gap-3">
                <button
                  onClick={() => handleAuth('/signup')}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
                >
                  <UserPlus size={18} />
                  Create Free Account
                </button>

                <button
                  onClick={() => handleAuth('/login')}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all active:scale-[0.98]"
                >
                  <LogIn size={18} />
                  Log In
                </button>

                <button
                  onClick={onClose}
                  className="mt-2 text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>

            {/* Micro-sparkles or badges */}
            <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-indigo-400">
              <Sparkles size={12} />
              Premium Access
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
