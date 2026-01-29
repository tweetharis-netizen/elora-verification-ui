// Toast Notification System
import { useState, useEffect } from 'react';

let addNotification = null;

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        addNotification = (message, type = 'info') => {
            const id = Date.now();
            setNotifications(prev => [...prev, { id, message, type }]);
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }, 4000);
        };
    }, []);

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    const colors = {
        success: 'from-emerald-500 to-teal-600',
        error: 'from-rose-500 to-red-600',
        warning: 'from-amber-500 to-orange-600',
        info: 'from-indigo-500 to-violet-600'
    };

    return (
        <>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] space-y-3 pointer-events-none">
                {notifications.map(notif => (
                    <div
                        key={notif.id}
                        className={`pointer-events-auto transform transition-all duration-500 ease-in-out bg-gradient-to-r ${colors[notif.type]} text-white px-6 py-4 rounded-2xl shadow-2xl min-w-[300px] max-w-md flex items-center gap-3 animate-in slide-in-from-right-10 fade-in`}
                    >
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-black text-lg">
                            {icons[notif.type]}
                        </div>
                        <p className="flex-1 font-bold text-sm">{notif.message}</p>
                    </div>
                ))}
            </div>
        </>
    );
}

export function notify(message, type = 'info') {
    if (addNotification) {
        addNotification(message, type);
    }
}
