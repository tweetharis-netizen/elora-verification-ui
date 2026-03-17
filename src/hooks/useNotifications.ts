import { useState, useEffect, useCallback } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead, Notification } from '../services/dataService';

export function useNotifications({ userId, role }: { userId: string, role: 'teacher' | 'student' | 'parent' }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchNotifications = useCallback(async () => {
        if (!userId || !role) return;
        try {
            setLoading(true);
            const data = await getNotifications(userId, role);
            // Ensure notifications are sorted by date descending
            const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setNotifications(sorted);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
        } finally {
            setLoading(false);
        }
    }, [userId, role]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markOneRead = async (id: string) => {
        // Optimistic update
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );

        try {
            await markNotificationRead(id);
        } catch (err) {
            console.error('Failed to mark notification read:', err);
            // Revert optimistic update
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
            );
        }
    };

    const markAllRead = async () => {
        // Optimistic update
        const previous = [...notifications];
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

        try {
            await markAllNotificationsRead(userId, role);
        } catch (err) {
            console.error('Failed to mark all notifications read:', err);
            // Revert
            setNotifications(previous);
        }
    };

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return {
        notifications,
        unreadCount,
        loading,
        error,
        markOneRead,
        markAllRead,
        refresh: fetchNotifications
    };
}
