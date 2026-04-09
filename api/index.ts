// api/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Vercel Serverless Function entry point.
// This file wraps the entire Express app so that Vercel can invoke it as a
// serverless function at /api/* routes.
//
// How it works:
//   - Vercel detects files in the /api directory and turns them into functions.
//   - The catch-all filename pattern ([...path].ts or just index.ts with
//     rewrites) routes all /api/* requests here.
//   - We import the Express app (without calling app.listen) and let Vercel's
//     runtime handle the HTTP lifecycle.
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express';
import cors from 'cors';
import { db } from '../server/db.js';

import teacherRoutes from '../server/routes/teacher.routes.js';
import classesRoutes from '../server/routes/classes.routes.js';
import assignmentsRoutes from '../server/routes/assignments.routes.js';
import studentsRoutes from '../server/routes/students.routes.js';
import parentsRoutes from '../server/routes/parents.routes.js';
import aiRoutes from '../server/routes/ai.routes.js';
import notificationRoutes from '../server/routes/notifications.routes.js';
import eloraRoutes from '../server/routes/elora.routes.js';
import geminiRoutes from '../server/routes/geminiRoutes.js';
import waitlistRoutes from '../server/routes/waitlist.routes.js';
import { seedTeacherDemoNotifications, seedStudentDemoNotifications, seedParentDemoNotifications } from '../server/demo/seedNotifications.js';

const app = express();

// Allow requests from the same Vercel domain (same origin in production,
// localhost in dev). Adjust origin if you ever deploy to a custom domain.
app.use(cors());
app.use(express.json());

// Seeding for Vercel demo - explicitly seed some basic data.
// Simple check to prevent re-seeding if the function stays warm.
let seeded = false;
if (!seeded) {
    seedTeacherDemoNotifications('teacher_1');
    seedStudentDemoNotifications('student_1');
    seedParentDemoNotifications('parent_1');
    seeded = true;
}

// Mount all routes under their /api/* paths.
// Note: vercel.json rewrites strip the /api prefix before reaching this
// function, so we remount them here with their full path prefix.
app.use('/api/teacher', teacherRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/student', studentsRoutes);
app.use('/api/parent', parentsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/elora', eloraRoutes);
app.use('/api', geminiRoutes);
app.use('/api/waitlist', waitlistRoutes);

// Export the Express app as the default export.
// Vercel's Node.js runtime will call this as a standard
// (req: IncomingMessage, res: ServerResponse) handler.
export default app;
