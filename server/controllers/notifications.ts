import { Response } from 'express';
import { db, NotificationRole } from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

// ── GET /api/notifications ─────────────────────────────────────────────────────
// Query params: userId (string), role ('teacher' | 'student' | 'parent')
// Returns notifications for that user, unread first, then by createdAt desc.
export const getNotifications = (req: AuthRequest, res: Response): any => {
    const { userId, role } = req.query as { userId?: string; role?: string };

    if (!userId || !role) {
        return res.status(400).json({ error: 'Query params userId and role are required.' });
    }

    const validRoles: NotificationRole[] = ['teacher', 'student', 'parent'];
    if (!validRoles.includes(role as NotificationRole)) {
        return res.status(400).json({ error: `role must be one of: ${validRoles.join(', ')}` });
    }

    const results = db.notifications
        .filter(n => n.userId === userId && n.role === role)
        .sort((a, b) => {
            // Unread first; within same read-status sort by createdAt desc
            if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

    res.json(results);
};

// ── PATCH /api/notifications/:id/read ─────────────────────────────────────────
// Marks a single notification as isRead: true.
// The authenticated user must own the notification.
export const markNotificationRead = (req: AuthRequest, res: Response): any => {
    const { id } = req.params;
    const requestingUserId = req.user!.id;

    const notification = db.notifications.find(n => n.id === id);

    if (!notification) {
        return res.status(404).json({ error: 'Notification not found.' });
    }

    // Security: users can only mark their own notifications as read
    if (notification.userId !== requestingUserId) {
        return res.status(403).json({ error: 'Not authorised to update this notification.' });
    }

    notification.isRead = true;
    res.json(notification);
};

// ── POST /api/notifications/mark-all-read ─────────────────────────────────────
// Body: { userId: string, role: string }
// Marks every notification for that user+role as read.
// Returns { updated: number }
export const markAllNotificationsRead = (req: AuthRequest, res: Response): any => {
    const { userId, role } = req.body as { userId?: string; role?: string };

    if (!userId || !role) {
        return res.status(400).json({ error: 'Body must contain userId and role.' });
    }

    // Security: the authenticated user can only act on their own notifications
    if (req.user!.id !== userId) {
        return res.status(403).json({ error: 'Not authorised to update notifications for another user.' });
    }

    let updated = 0;
    db.notifications.forEach(n => {
        if (n.userId === userId && n.role === role && !n.isRead) {
            n.isRead = true;
            updated++;
        }
    });

    res.json({ updated });
};
