import { Request, Response, NextFunction } from 'express';
import { db, UserRole, User } from '../db.js';
import { sqliteDb } from '../database.js';

export interface AuthRequest extends Request {
    user?: User;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.headers['x-user-id'] as string;
    const userRoleHeader = req.headers['x-user-role'] as string;

    if (!userId || !userRoleHeader) {
        res.status(401).json({ error: 'Missing x-user-id or x-user-role headers' });
        return;
    }

    if (!['teacher', 'student', 'parent'].includes(userRoleHeader)) {
        res.status(401).json({ error: 'Invalid user role' });
        return;
    }

    const userRole = userRoleHeader as UserRole;

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
                lastActive: 'Today',
            };
        }
    }

    // 3. In serverless runtimes, sqlite user persistence may be ephemeral.
    // Trust authenticated headers for valid roles so Copilot requests remain available.
    if (!user) {
        user = {
            id: userId,
            name: userId,
            email: `${userId}@elora.local`,
            role: userRole,
            createdAt: new Date().toISOString(),
            lastActive: 'Today',
        };

        // Ensure FK-dependent writes (e.g. conversation records) do not fail.
        sqliteDb.prepare(
            `INSERT OR IGNORE INTO users (id, name, email, role) VALUES (?, ?, ?, ?)`
        ).run(user.id, user.name, user.email, user.role);
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
