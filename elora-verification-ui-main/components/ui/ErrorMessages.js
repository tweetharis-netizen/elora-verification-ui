// components/ui/ErrorMessages.js
// User-friendly error messages and recovery suggestions

import { motion, AnimatePresence } from 'framer-motion';

/**
 * Error translation - convert technical errors to user-friendly messages
 */
export function translateError(error) {
    const errorMap = {
        // Network errors
        'NetworkError': {
            title: 'Connection Issue',
            message: 'Unable to connect to the server. Please check your internet connection.',
            recovery: ['Check your internet connection', 'Try refreshing the page', 'Try again in a moment'],
        },
        'fetch failed': {
            title: 'Connection Issue',
            message: 'Unable to reach the server. Please check your internet connection.',
            recovery: ['Check your internet connection', 'Try refreshing the page'],
        },

        // Auth errors
        'auth/user-not-found': {
            title: 'Account Not Found',
            message: 'We couldn\'t find an account with that email.',
            recovery: ['Check your email address', 'Create a new account'],
        },
        'auth/wrong-password': {
            title: 'Incorrect Password',
            message: 'The password you entered is incorrect.',
            recovery: ['Try again', 'Reset your password'],
        },
        'auth/email-already-in-use': {
            title: 'Email Already Registered',
            message: 'An account with this email already exists.',
            recovery: ['Sign in instead', 'Use a different email', 'Reset password if you forgot it'],
        },

        // Firestore errors
        'permission-denied': {
            title: 'Permission Denied',
            message: 'You don\'t have permission to perform this action.',
            recovery: ['Make sure you\'re signed in', 'Contact your teacher or administrator'],
        },
        'not-found': {
            title: 'Not Found',
            message: 'The requested item could not be found.',
            recovery: ['Check if the item still exists', 'Try refreshing the page'],
        },

        // Validation errors
        'invalid-email': {
            title: 'Invalid Email',
            message: 'Please enter a valid email address.',
            recovery: ['Check your email format'],
        },
        'required-field': {
            title: 'Required Field',
            message: 'Please fill in all required fields.',
            recovery: ['Fill in the missing information'],
        },

        // Default
        default: {
            title: 'Something Went Wrong',
            message: 'An unexpected error occurred. Please try again.',
            recovery: ['Try again', 'Refresh the page', 'Contact support if the problem persists'],
        },
    };

    const errorString = typeof error === 'string' ? error : error?.message || error?.code || 'default';

    // Find matching error
    for (const [key, value] of Object.entries(errorMap)) {
        if (errorString.includes(key) || key === errorString) {
            return value;
        }
    }

    return errorMap.default;
}

/**
 * Inline error message
 */
export function InlineError({ error, className = '' }) {
    if (!error) return null;

    const friendly = translateError(error);

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 ${className}`}
        >
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">{friendly.title}</h4>
                <p className="text-sm text-red-700 dark:text-red-300">{friendly.message}</p>
            </div>
        </motion.div>
    );
}

/**
 * Error modal with recovery suggestions
 */
export function ErrorModal({ error, isOpen, onClose, onRetry }) {
    if (!error || !isOpen) return null;

    const friendly = translateError(error);

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

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-modal p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4"
                        >
                            {/* Icon */}
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>

                            {/* Content */}
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-text-primary mb-2">{friendly.title}</h3>
                                <p className="text-text-secondary mb-4">{friendly.message}</p>

                                {friendly.recovery && friendly.recovery.length > 0 && (
                                    <div className="text-left bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-4 mb-4">
                                        <h4 className="font-semibold text-sm text-text-secondary mb-2">What you can do:</h4>
                                        <ul className="space-y-1 text-sm text-text-secondary">
                                            {friendly.recovery.map((suggestion, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <span className="text-primary-600 dark:text-primary-400 mt-0.5">•</span>
                                                    <span>{suggestion}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                {onRetry && (
                                    <button onClick={onRetry} className="btn btn-primary flex-1">
                                        Try Again
                                    </button>
                                )}
                                <button onClick={onClose} className={`btn ${onRetry ? 'btn-outline flex-1' : 'btn-primary w-full'}`}>
                                    {onRetry ? 'Cancel' : 'Close'}
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
 * Error boundary fallback
 */
export function ErrorFallback({ error, resetErrorBoundary }) {
    const friendly = translateError(error);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-neutral-900 dark:to-neutral-800 p-6">
            <div className="max-w-lg w-full bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-8 space-y-6">
                <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                    <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <div className="text-center">
                    <h1 className="text-2xl font-bold text-text-primary mb-2">{friendly.title}</h1>
                    <p className="text-text-secondary mb-6">{friendly.message}</p>

                    {friendly.recovery && (
                        <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-4 mb-6 text-left">
                            <h4 className="font-semibold text-sm text-text-secondary mb-2">What you can do:</h4>
                            <ul className="space-y-1 text-sm text-text-secondary">
                                {friendly.recovery.map((suggestion, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className="text-primary-600 dark:text-primary-400 mt-0.5">•</span>
                                        <span>{suggestion}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button onClick={resetErrorBoundary} className="btn btn-primary flex-1">
                        Try Again
                    </button>
                    <button onClick={() => window.location.href = '/'} className="btn btn-outline flex-1">
                        Go Home
                    </button>
                </div>

                {process.env.NODE_ENV === 'development' && error && (
                    <details className="bg-neutral-100 dark:bg-neutral-700 rounded-lg p-4 text-xs">
                        <summary className="cursor-pointer font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                            Technical Details (Development Only)
                        </summary>
                        <pre className="overflow-auto text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                            {error.toString()}\n\n{error.stack}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
}
