// lib/contexts/AppContext.js
// Global application state management with React Context

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { getSession, saveSession } from '../session';

const AppContext = createContext(null);

export function AppProvider({ children }) {
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);

    // Initialize session
    useEffect(() => {
        const initialSession = getSession();
        setSession(initialSession);

        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });

        // Listen for storage events (cross-tab sync)
        const handleStorageChange = () => {
            const updatedSession = getSession();
            setSession(updatedSession);
        };

        window.addEventListener('elora:session', handleStorageChange);

        return () => {
            unsubscribe();
            window.removeEventListener('elora:session', handleStorageChange);
        };
    }, []);

    // Update session
    const updateSession = useCallback((updates) => {
        const newSession = { ...session, ...updates };
        saveSession(newSession);
        setSession(newSession);
    }, [session]);

    // Add notification
    const addNotification = useCallback((notification) => {
        const id = Date.now().toString();
        setNotifications(prev => [...prev, { id, ...notification }]);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            removeNotification(id);
        }, 5000);

        return id;
    }, []);

    // Remove notification
    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const value = {
        session,
        user,
        loading,
        updateSession,
        notifications,
        addNotification,
        removeNotification,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-neutral-800">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-text-secondary text-lg">Loading Elora...</p>
                </div>
            </div>
        );
    }

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}
