import { Router } from 'express';
import {
	getAssignmentObjectiveSuggestions,
	getAssignmentTaskSuggestions,
	getAssignmentReviewFeedback,
	getClassSupportSuggestion,
	getStudentSupportSuggestion,
} from '../controllers/elora.js';

const router = Router();

// POST /api/elora/suggestions/class
router.post('/suggestions/class', getClassSupportSuggestion);

// POST /api/elora/suggestions/student
router.post('/suggestions/student', getStudentSupportSuggestion);

// POST /api/elora/assignments/suggest-objectives
router.post('/assignments/suggest-objectives', getAssignmentObjectiveSuggestions);

// POST /api/elora/assignments/suggest-tasks
router.post('/assignments/suggest-tasks', getAssignmentTaskSuggestions);

// POST /api/elora/assignments/review-feedback
router.post('/assignments/review-feedback', getAssignmentReviewFeedback);

export default router;

