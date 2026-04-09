import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
	getTeacherStats,
	getInsightsNeedsAttention,
	sendTeacherNudge,
	listTeacherCopilotConversations,
	createTeacherCopilotConversation,
	listTeacherCopilotMessages,
	appendTeacherCopilotMessage,
} from '../controllers/teacher.js';

const router = Router();

router.get('/stats', requireAuth, requireRole('teacher'), getTeacherStats);
router.get('/insights/needs-attention', requireAuth, requireRole('teacher'), getInsightsNeedsAttention);
router.post('/nudges', requireAuth, requireRole('teacher'), sendTeacherNudge);
router.get('/copilot/conversations', requireAuth, requireRole('teacher'), listTeacherCopilotConversations);
router.post('/copilot/conversations', requireAuth, requireRole('teacher'), createTeacherCopilotConversation);
router.get('/copilot/conversations/:id/messages', requireAuth, requireRole('teacher'), listTeacherCopilotMessages);
router.post('/copilot/conversations/:id/messages', requireAuth, requireRole('teacher'), appendTeacherCopilotMessage);

export default router;
