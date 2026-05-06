import { Router } from 'express';
import multer from 'multer';
import { uploadFileHandler } from '../controllers/files.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Configure multer (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
    },
});

router.post('/upload', requireAuth, upload.single('file'), uploadFileHandler);

export default router;
