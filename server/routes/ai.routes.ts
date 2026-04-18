import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { generateGame, askEloraHandler } from '../controllers/ai.js';

const router = Router();

// POST /api/ai/generate-game
// Restricted to teachers
router.post('/generate-game', requireAuth, requireRole('teacher'), generateGame);

// POST /api/ai/ask
router.post('/ask', requireAuth, askEloraHandler);

export default router;
