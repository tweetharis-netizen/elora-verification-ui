import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env and .env.local
dotenv.config();
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: true });

import { db } from './db.js';

import teacherRoutes from './routes/teacher.routes.js';
import classesRoutes from './routes/classes.routes.js';
import assignmentsRoutes from './routes/assignments.routes.js';
import studentsRoutes from './routes/students.routes.js';
import parentsRoutes from './routes/parents.routes.js';
import aiRoutes from './routes/ai.routes.js';

import eloraRoutes from './routes/elora.routes.js';
import geminiRoutes from './routes/geminiRoutes.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/teacher', teacherRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/student', studentsRoutes);
app.use('/api/parent', parentsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/elora', eloraRoutes);
app.use('/api', geminiRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
