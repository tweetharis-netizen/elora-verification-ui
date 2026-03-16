import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getChildren, getChildSummary, sendNudge } from '../controllers/parents.js';

const router = Router();

// /api/parent
router.get('/children', requireAuth, requireRole('parent'), getChildren);
router.get('/children/:id/summary', requireAuth, requireRole('parent'), getChildSummary);
router.post('/nudges', requireAuth, requireRole('parent'), sendNudge);

export default router;
