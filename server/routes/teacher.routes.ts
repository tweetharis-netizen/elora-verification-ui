import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getTeacherStats, getInsightsNeedsAttention, sendTeacherNudge } from '../controllers/teacher.js';

const router = Router();

router.get('/stats', requireAuth, requireRole('teacher'), getTeacherStats);
router.get('/insights/needs-attention', requireAuth, requireRole('teacher'), getInsightsNeedsAttention);
router.post('/nudges', requireAuth, requireRole('teacher'), sendTeacherNudge);

export default router;
