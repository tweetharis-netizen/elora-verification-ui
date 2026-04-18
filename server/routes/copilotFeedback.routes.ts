import { Router } from 'express';
import { submitCopilotFeedbackHandler } from '../controllers/copilotFeedback.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/feedback', requireAuth, submitCopilotFeedbackHandler);

export default router;
