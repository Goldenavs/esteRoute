import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, LogOut, X } from 'lucide-react';

interface ConfirmExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isGuest?: boolean;
  intent?: 'login' | 'register' | 'logout';
}

export default function ConfirmExitModal({
  isOpen,
  onClose,
  onConfirm,
  isGuest = false,
  intent = 'logout'
}: ConfirmExitModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isAuthAction = intent === 'login' || intent === 'register';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Dialog Card (Clean Unskewed Geometry) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-md bg-surface border-2 border-border-subtle rounded-sm shadow-2xl p-6 sm:p-7 overflow-hidden font-sans"
          >
            {/* Top Accent Strip */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${isGuest ? 'bg-amber-500' : 'bg-semantic-urgent'}`} />

            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-sm border shrink-0 ${
                  isGuest 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                    : 'bg-semantic-urgent/10 border-semantic-urgent/30 text-semantic-urgent'
                }`}>
                  {isGuest ? <AlertTriangle className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-heading font-bold text-text-primary uppercase tracking-wider">
                    {isGuest 
                      ? (isAuthAction ? 'Leave Guest Session to Continue?' : 'End Guest Session?') 
                      : 'Sign Out of esteRoute?'}
                  </h3>
                  <span className="text-[11px] font-mono text-text-muted block mt-0.5">
                    {isGuest ? 'Guest Session Warning' : 'Session Termination'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-subtle rounded-xs transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Warning Body */}
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-6 font-sans">
              {isGuest ? (
                isAuthAction ? (
                  <>
                    You are currently in an <strong>anonymous guest session</strong>. Proceeding to sign in or register an account will end your guest session and return you to the landing page.
                  </>
                ) : (
                  <>
                    Are you sure you want to end your guest session? You will be signed out and redirected back to the landing page.
                  </>
                )
              ) : (
                <>
                  Are you sure you want to sign out of your account? You will be returned to the landing page.
                </>
              )}
            </p>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-sm bg-surface hover:bg-surface-subtle border border-border-strong text-text-primary text-xs font-heading font-semibold uppercase tracking-wider transition-colors cursor-pointer active:scale-95"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onConfirm}
                className={`px-4 py-2 rounded-sm text-white text-xs font-heading font-semibold uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95 ${
                  isGuest
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-semantic-urgent hover:bg-red-500'
                }`}
              >
                {isGuest ? (isAuthAction ? 'Continue to Landing Page' : 'End Session') : 'Sign Out'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

