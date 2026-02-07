// lib/contexts/NotificationContext.js
// Toast notifications using react-hot-toast

import { createContext, useContext } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const notify = {
        success: (message, options = {}) => {
            return toast.success(message, {
                duration: 4000,
                style: {
                    background: 'var(--color-secondary-600)',
                    color: '#ffffff',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-2) var(--spacing-3)',
                    fontSize: 'var(--text-base)',
                },
                iconTheme: {
                    primary: '#ffffff',
                    secondary: 'var(--color-secondary-600)',
                },
                ...options,
            });
        },

        error: (message, options = {}) => {
            return toast.error(message, {
                duration: 5000,
                style: {
                    background: 'var(--color-error)',
                    color: '#ffffff',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-2) var(--spacing-3)',
                    fontSize: 'var(--text-base)',
                },
                ...options,
            });
        },

        info: (message, options = {}) => {
            return toast(message, {
                duration: 4000,
                icon: 'ℹ️',
                style: {
                    background: 'var(--color-info)',
                    color: '#ffffff',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-2) var(--spacing-3)',
                    fontSize: 'var(--text-base)',
                },
                ...options,
            });
        },

        warning: (message, options = {}) => {
            return toast(message, {
                duration: 4500,
                icon: '⚠️',
                style: {
                    background: 'var(--color-warning)',
                    color: '#ffffff',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-2) var(--spacing-3)',
                    fontSize: 'var(--text-base)',
                },
                ...options,
            });
        },

        loading: (message) => {
            return toast.loading(message, {
                style: {
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--spacing-2) var(--spacing-3)',
                    fontSize: 'var(--text-base)',
                    border: '1px solid var(--border-primary)',
                },
            });
        },

        promise: (promise, messages) => {
            return toast.promise(
                promise,
                {
                    loading: messages.loading || 'Loading...',
                    success: messages.success || 'Success!',
                    error: messages.error || 'Error occurred',
                },
                {
                    style: {
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--spacing-2) var(--spacing-3)',
                        fontSize: 'var(--text-base)',
                    },
                }
            );
        },

        dismiss: (toastId) => {
            toast.dismiss(toastId);
        },

        custom: (component, options = {}) => {
            return toast.custom(component, options);
        },
    };

    return (
        <NotificationContext.Provider value={notify}>
            <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                toastOptions={{
                    className: 'animate-slide-down',
                    style: {
                        maxWidth: '500px',
                    },
                }}
            />
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
}
