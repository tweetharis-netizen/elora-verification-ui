import { Request, Response, NextFunction } from 'express';
import { db, UserRole, User } from '../db.js';
import { sqliteDb } from '../database.js';

export interface AuthRequest extends Request {
    user?: User;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as UserRole;

    if (!userId || !userRole) {
        res.status(401).json({ error: 'Missing x-user-id or x-user-role headers' });
        return;
    }

    // 1. Try demo (in-memory) users first
    let user = db.users.find(u => u.id === userId && u.role === userRole);

    // 2. Fall back to SQLite for real users
    if (!user) {
        const sqliteUser = sqliteDb.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(userId, userRole) as any;
        if (sqliteUser) {
            user = {
                id: sqliteUser.id,
                name: sqliteUser.name,
                email: sqliteUser.email,
                role: sqliteUser.role as UserRole,
                createdAt: sqliteUser.created_at,
                lastActive: 'Today', // Placeholder
            };
        }
    }

    if (!user) {
        res.status(401).json({ error: 'Invalid user or role' });
        return;
    }

    req.user = user;
    next();
};

export const requireRole = (role: UserRole) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (req.user?.role !== role) {
            res.status(403).json({ error: `Requires ${role} role` });
            return;
        }
        next();
    };
};
