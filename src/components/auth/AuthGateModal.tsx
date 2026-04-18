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
  actionName = "use Copilot"
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
            className="absolute inset-0 bg-[#28193D]/40 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md overflow-hidden bg-[#FDFBF5] rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(40,25,61,0.25)] border border-[#D1CDBC]/40"
          >
            {/* Header / Banner - Glassmorphic Purple */}
            <div className="h-28 bg-[#28193D] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-grid opacity-20"></div>
              <div className="absolute top-[-20%] left-[-10%] w-48 h-48 bg-[#8D769A] rounded-full filter blur-3xl opacity-30"></div>
              
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={onClose}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <motion.div 
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                className="bg-white/10 p-4 rounded-2xl backdrop-blur-xl border border-white/20 shadow-xl"
              >
                <ShieldCheck className="text-[#FBBF24]" size={36} />
              </motion.div>
            </div>

            <div className="p-8 lg:p-10 text-center">
              <h2 className="font-serif text-3xl text-[#28193D] mb-3 tracking-tight">
                Sign in to use Copilot
              </h2>
              <p className="text-[#64748B] mb-10 leading-relaxed text-sm lg:text-base">
                Copilot is available for verified accounts only. Sign up or log in to <span className="text-[#28193D] font-bold border-b border-[#FBBF24]/60">{actionName}</span> while continuing to explore the demo dashboard.
              </p>

              <div className="grid gap-4">
                <button
                  onClick={() => handleAuth('/signup')}
                  className="group relative flex items-center justify-center gap-2 w-full py-4 bg-[#28193D] text-white rounded-2xl font-bold hover:bg-[#3D265C] transition-all shadow-lg shadow-[#28193D]/10 active:scale-[0.98]"
                >
                  <UserPlus size={18} className="group-hover:translate-x-0.5 transition-transform" />
                  Claim your free space
                  <div className="absolute -top-2 -right-2 bg-[#FBBF24] text-[#28193D] text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                    Free
                  </div>
                </button>

                <button
                  onClick={() => handleAuth('/login')}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-white text-[#28193D] border border-[#D1CDBC] rounded-2xl font-bold hover:bg-[#F8F7F2] transition-all active:scale-[0.98]"
                >
                  <LogIn size={18} />
                  Welcome back (Login)
                </button>

                <button
                  onClick={onClose}
                  className="mt-4 text-xs text-[#94A3B8] hover:text-[#28193D] font-semibold uppercase tracking-widest transition-colors"
                >
                  Continue as guest
                </button>
              </div>
            </div>

            {/* Bottom Accent */}
            <div className="h-1 bg-gradient-to-r from-[#8D769A] via-[#FBBF24] to-[#8D769A] opacity-30"></div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
