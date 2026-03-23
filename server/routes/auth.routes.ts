import { Router, Request, Response } from 'express';
import { sqliteDb } from '../database.js';

const router = Router();

// POST /api/auth/signup
router.post('/signup', (req: Request, res: Response) => {
    const { id, name, email, role } = req.body;
    
    if (!id || !name || !email || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        sqliteDb.prepare(`
            INSERT INTO users (id, name, email, role)
            VALUES (?, ?, ?, ?)
        `).run(id, name, email, role);
        
        res.status(201).json({ id, name, email, role });
    } catch (err: any) {
        if (err.message.includes('UNIQUE constraint failed')) {
            // If user already exists, just return it (simplified login/signup)
            const user = sqliteDb.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
            return res.json(user);
        }
        res.status(500).json({ error: err.message });
    }
});

// GET /api/auth/me/:id
router.get('/me/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const user = sqliteDb.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
});

export default router;
