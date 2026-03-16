import { Router } from 'express';
import { getClassSupportSuggestion, getStudentSupportSuggestion } from '../controllers/elora.js';

const router = Router();

// POST /api/elora/suggestions/class
router.post('/suggestions/class', getClassSupportSuggestion);

// POST /api/elora/suggestions/student
router.post('/suggestions/student', getStudentSupportSuggestion);

export default router;
