import { Response } from 'express';
import { randomUUID } from 'crypto';
import type { AuthRequest } from '../middleware/auth.js';

export const uploadFileHandler = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const authUser = req.user;
        if (!authUser) {
            res.status(401).json({ error: 'AUTH_REQUIRED', message: 'Authentication required' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ error: 'NO_FILE_UPLOADED', message: 'No file was provided in the request.' });
            return;
        }

        const file = req.file;

        // Double check size (though multer middleware handles this, explicit check for standard error)
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_SIZE) {
            res.status(400).json({ error: 'FILE_TOO_LARGE', message: 'Files must be 10MB or smaller.' });
            return;
        }

        // Deduce and validate type from mimetype
        let fileType: 'pdf' | 'image' | 'doc' | 'text' | 'other' | null = null;
        if (file.mimetype.includes('pdf')) {
            fileType = 'pdf';
        } else if (file.mimetype.includes('image')) {
            fileType = 'image';
        } else if (file.mimetype.includes('text') || file.mimetype.includes('csv') || file.mimetype === 'application/json') {
            fileType = 'text';
        } else if (
            file.mimetype.includes('word') || 
            file.mimetype.includes('document') ||
            file.originalname.endsWith('.docx') ||
            file.originalname.endsWith('.doc')
        ) {
            fileType = 'doc';
        }

        if (!fileType) {
            res.status(400).json({ 
                error: 'UNSUPPORTED_FILE_TYPE', 
                message: 'File type not supported. Try PDF, DOCX, common images, or text files.' 
            });
            return;
        }
        
        // Mock opaque file_id string
        const fileId = `file_${randomUUID()}`;

        res.json({
            id: fileId,
            name: file.originalname,
            type: fileType,
            sizeBytes: file.size,
        });
    } catch (error) {
        console.error('Error handling file upload:', error);
        res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred while processing your file.' });
    }
};
