import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getClasses, createClass, joinClass } from '../controllers/classes.js';

const router = Router();

// /api/classes
router.get('/', requireAuth, requireRole('teacher'), getClasses);
router.post('/', requireAuth, requireRole('teacher'), createClass);
router.post('/join', requireAuth, requireRole('student'), joinClass);

export default router;
