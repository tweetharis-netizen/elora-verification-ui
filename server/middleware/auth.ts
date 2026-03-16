import { Request, Response, NextFunction } from 'express';
import { db, UserRole, User } from '../db.js';

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

    const user = db.users.find(u => u.id === userId && u.role === userRole);
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
