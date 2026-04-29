import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
    getStudentAssignments,
    getStudentGameSessions,
    createStudentGameSession,
    getStudentStreak,
    getStudentNudges,
    markNudgeRead,
    listStudentCopilotConversations,
    createStudentCopilotConversation,
    listStudentCopilotMessages,
    appendStudentCopilotMessage,
    summarizeStudentCopilotConversation,
    getWarmupExample,
} from '../controllers/students.js';
import { getStudentClasses } from '../controllers/classes.js';

const router = Router();

// /api/student
router.get('/assignments', requireAuth, requireRole('student'), getStudentAssignments);
router.get('/classes', requireAuth, requireRole('student'), getStudentClasses);
router.get('/game-sessions', requireAuth, requireRole('student'), getStudentGameSessions);
router.post('/game-sessions', requireAuth, requireRole('student'), createStudentGameSession);
router.get('/me/streak', requireAuth, requireRole('student'), getStudentStreak);
router.get('/nudges', requireAuth, requireRole('student'), getStudentNudges);
router.post('/nudges/:id/read', requireAuth, requireRole('student'), markNudgeRead);
router.get('/copilot/conversations', requireAuth, requireRole('student'), listStudentCopilotConversations);
router.post('/copilot/conversations', requireAuth, requireRole('student'), createStudentCopilotConversation);
router.get('/copilot/conversations/:id/messages', requireAuth, requireRole('student'), listStudentCopilotMessages);
router.post('/copilot/conversations/:id/messages', requireAuth, requireRole('student'), appendStudentCopilotMessage);
router.post('/copilot/conversations/:id/summarize', requireAuth, requireRole('student'), summarizeStudentCopilotConversation);
router.get('/copilot/conversations/:id/warmup', requireAuth, requireRole('student'), getWarmupExample);

export default router;
