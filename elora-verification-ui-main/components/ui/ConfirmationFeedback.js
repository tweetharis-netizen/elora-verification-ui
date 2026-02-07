// components/ui/ConfirmationFeedback.js
// Success confirmations, toasts, and undo capabilities

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

/**
 * Success toast (inline)
 */
export function SuccessToast({ message, isVisible, onClose, duration = 3000 }) {
    useEffect(() => {
        if (isVisible && duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed top-4 right-4 z-notification max-w-md"
                >
                    <div className="glass p-4 rounded-xl shadow-xl flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary-500 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-text-primary font-medium">{message}</p>
                        </div>
                        <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/**
 * Inline success confirmation
 */
export function InlineSuccess({ message, icon, className = '' }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-3 p-4 rounded-lg bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200 dark:border-secondary-800 ${className}`}
        >
            <div className="w-8 h-8 rounded-full bg-secondary-500 flex items-center justify-center flex-shrink-0">
                {icon || (
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </div>
            <p className="text-secondary-900 dark:text-secondary-100 font-medium">{message}</p>
        </motion.div>
    );
}

/**
 * Action confirmation with undo
 */
export function UndoableAction({ message, onUndo, duration = 5000 }) {
    const [isVisible, setIsVisible] = useState(true);
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
        if (timeLeft <= 0) {
            setIsVisible(false);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 100));
        }, 100);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleUndo = () => {
        setIsVisible(false);
        onUndo();
    };

    const progress = (timeLeft / duration) * 100;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-notification"
                >
                    <div className="glass-heavy px-6 py-4 rounded-2xl shadow-2xl min-w-[320px]">
                        <div className="flex items-center justify-between gap-4 mb-2">
                            <p className="text-text-primary font-medium">{message}</p>
                            <button
                                onClick={handleUndo}
                                className="btn btn-sm btn-outline whitespace-nowrap"
                            >
                                Undo
                            </button>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-primary-500"
                                initial={{ width: '100%' }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.1, ease: 'linear' }}
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/**
 * Confirmation dialog
 */
export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary', // primary, danger, warning
}) {
    const variants = {
        primary: {
            iconBg: 'bg-primary-100 dark:bg-primary-900/30',
            iconColor: 'text-primary-600 dark:text-primary-400',
            btnClass: 'btn-primary',
        },
        danger: {
            iconBg: 'bg-red-100 dark:bg-red-900/30',
            iconColor: 'text-red-600 dark:text-red-400',
            btnClass: 'bg-red-600 text-white hover:bg-red-700',
        },
        warning: {
            iconBg: 'bg-orange-100 dark:bg-orange-900/30',
            iconColor: 'text-orange-600 dark:text-orange-400',
            btnClass: 'bg-orange-600 text-white hover:bg-orange-700',
        },
    };

    const style = variants[variant];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-modal-backdrop"
                        onClick={onClose}
                    />

                    {/* Dialog */}
                    <div className="fixed inset-0 flex items-center justify-center z-modal p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4"
                        >
                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-full ${style.iconBg} flex items-center justify-center mx-auto`}>
                                <svg className={`w-6 h-6 ${style.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>

                            {/* Content */}
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-text-primary mb-2">{title}</h3>
                                <p className="text-text-secondary">{message}</p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button onClick={onClose} className="btn btn-outline flex-1">
                                    {cancelText}
                                </button>
                                <button onClick={() => { onConfirm(); onClose(); }} className={`btn ${style.btnClass} flex-1`}>
                                    {confirmText}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

/**
 * Success checkmark animation
 */
export function SuccessCheckmark({ size = 'md' }) {
    const sizes = {
        sm: 'w-12 h-12',
        md: 'w-20 h-20',
        lg: 'w-32 h-32',
    };

    return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className={`${sizes[size]} rounded-full bg-secondary-500 flex items-center justify-center`}
        >
            <motion.svg
                className="w-1/2 h-1/2 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                />
            </motion.svg>
        </motion.div>
    );
}
