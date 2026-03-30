import { useState, useEffect } from 'react';

const SIDEBAR_STATE_KEY = 'elora_sidebar_open';

export function useSidebarState(initialState = true) {
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
        try {
            const stored = localStorage.getItem(SIDEBAR_STATE_KEY);
            if (stored !== null) {
                return stored === 'true';
            }
        } catch (e) {
            console.warn('localStorage access failed:', e);
        }
        return initialState;
    });

    useEffect(() => {
        try {
            localStorage.setItem(SIDEBAR_STATE_KEY, isSidebarOpen.toString());
        } catch (e) {
            console.warn('localStorage access failed:', e);
        }
    }, [isSidebarOpen]);

    return [isSidebarOpen, setIsSidebarOpen] as const;
}
