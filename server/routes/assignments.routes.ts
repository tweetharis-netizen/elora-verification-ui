import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getAssignments, submitAssignment, createAssignment, getStudentAssignments, getAssignmentResults, submitAssignmentAttempt, getAttemptsByAssignment, publishAssignment } from '../controllers/assignments.js';

const router = Router();

// /api/assignments
router.get('/', requireAuth, requireRole('teacher'), getAssignments);
router.post('/', requireAuth, requireRole('teacher'), createAssignment);
router.post('/:id/publish', requireAuth, requireRole('teacher'), publishAssignment);
router.get('/student', requireAuth, requireRole('student'), getStudentAssignments);
router.get('/:id/results', requireAuth, requireRole('teacher'), getAssignmentResults);
router.get('/:id/attempts', requireAuth, requireRole('teacher'), getAttemptsByAssignment);

// student submits an assignment (old content-based route)
router.post('/:id/submit', requireAuth, requireRole('student'), submitAssignment);

// student submits a quiz-based assignment attempt
router.post('/attempt/:attemptId/submit', requireAuth, requireRole('student'), submitAssignmentAttempt);

export default router;

