import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
} from '../controllers/notifications.js';

const router = Router();

// GET  /api/notifications?userId=<id>&role=<role>
router.get('/', requireAuth, getNotifications);

// PATCH /api/notifications/:id/read
router.patch('/:id/read', requireAuth, markNotificationRead);

// POST  /api/notifications/mark-all-read
// Note: must be declared BEFORE /:id/read so Express doesn't treat
// "mark-all-read" as an :id param value.
router.post('/mark-all-read', requireAuth, markAllNotificationsRead);

export default router;
