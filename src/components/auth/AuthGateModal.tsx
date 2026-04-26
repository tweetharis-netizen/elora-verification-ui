import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { AuthGateContent } from '../Copilot/CopilotShared';

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
  const { role } = useAuth();
  const navigate = useNavigate();

  const handleAuth = (path: '/login' | '/signup') => {
    onClose();
    navigate(path, { state: { from: window.location.pathname } });
  };

  // Capitalize role for AuthGateContent
  const displayRole = (role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Teacher') as 'Teacher' | 'Student' | 'Parent';
  
  // Theme color based on role
  const themeColor = role === 'student' ? '#68507B' : (role === 'parent' ? '#4F46E5' : '#0d9488');

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
            className="relative w-full max-w-md overflow-hidden bg-white rounded-2xl shadow-[0_32px_64px_-16px_rgba(40,25,61,0.25)] border border-[#EAE7DD]"
          >
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={onClose}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <AuthGateContent 
              role={displayRole}
              themeColor={themeColor}
              title="Unlock Elora Copilot"
              description={actionName ? `Elora Copilot is required to ${actionName}. Sign up or log in to unlock the full experience.` : undefined}
              onSignupClick={() => handleAuth('/signup')}
              onLoginClick={() => handleAuth('/login')}
              onSecondaryClick={onClose}
              secondaryLabel="Continue as guest"
            />
          </motion.div>


        </div>
      )}
    </AnimatePresence>
  );
};
