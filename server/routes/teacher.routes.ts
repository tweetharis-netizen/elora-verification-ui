import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getTeacherStats, getInsightsNeedsAttention } from '../controllers/teacher.js';

const router = Router();

router.get('/stats', requireAuth, requireRole('teacher'), getTeacherStats);
router.get('/insights/needs-attention', requireAuth, requireRole('teacher'), getInsightsNeedsAttention);

export default router;
