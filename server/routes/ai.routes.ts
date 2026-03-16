import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { generateGame } from '../controllers/ai.js';

const router = Router();

// POST /api/ai/generate-game
// Restricted to teachers
router.post('/generate-game', requireAuth, requireRole('teacher'), generateGame);

export default router;
