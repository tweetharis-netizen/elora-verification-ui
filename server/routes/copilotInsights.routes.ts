import { NextFunction, Response, Router } from 'express';
import { getCopilotInsights } from '../controllers/copilotInsights.js';
import { requireAuth } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

const requireInsightsAccess = (req: AuthRequest, res: Response, next: NextFunction): void => {
	const user = req.user;

	if (!user) {
		res.status(401).json({ ok: false, error: 'Unauthorized' });
		return;
	}

	if (user.role !== 'teacher') {
		res.status(403).json({ ok: false, error: 'Forbidden' });
		return;
	}

	next();
};

router.get('/insights', requireAuth, requireInsightsAccess, getCopilotInsights);

export default router;
