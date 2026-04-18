import { Router } from 'express';
import { postUseCaseLLMHandler } from '../controllers/llm.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/llm/:useCase
router.post('/:useCase', requireAuth, postUseCaseLLMHandler);

export default router;
