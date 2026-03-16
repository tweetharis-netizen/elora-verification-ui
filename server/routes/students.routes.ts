import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
    getStudentAssignments,
    getStudentGameSessions,
    createStudentGameSession,
    getStudentStreak,
    getStudentNudges,
    markNudgeRead
} from '../controllers/students.js';

const router = Router();

// /api/student
router.get('/assignments', requireAuth, requireRole('student'), getStudentAssignments);
router.get('/game-sessions', requireAuth, requireRole('student'), getStudentGameSessions);
router.post('/game-sessions', requireAuth, requireRole('student'), createStudentGameSession);
router.get('/me/streak', requireAuth, requireRole('student'), getStudentStreak);
router.get('/nudges', requireAuth, requireRole('student'), getStudentNudges);
router.post('/nudges/:id/read', requireAuth, requireRole('student'), markNudgeRead);

export default router;
