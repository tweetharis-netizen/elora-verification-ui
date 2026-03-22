import { Response } from 'express';
import { db, Classroom, Enrollment, users } from '../db.js';
import { sqliteDb, DEMO_USER_IDS } from '../database.js';
import { AuthRequest } from '../middleware/auth.js';

export const getClasses = (req: AuthRequest, res: Response) => {
    const teacherId = req.user!.id;

    if (DEMO_USER_IDS.has(teacherId)) {
        // Demo path: use existing in-memory logic (unchanged)
        const myClasses = db.classes.filter(c => c.teacherId === teacherId);
        const now = new Date().toISOString();

        // Transform to match frontend expectations (studentsCount instead of studentIds)
        const uiClasses = myClasses.map(c => {
            // Compute activeAssignments
            const classAssignments = db.assignments.filter(a => a.classroomId === c.id);
            const todayStr = now.split('T')[0];
            const activeAssignments = classAssignments.filter(a => a.dueDate >= todayStr).length;

            // Compute averageScore
            let totalAccuracy = 0;
            let attemptCount = 0;

            for (const assignment of classAssignments) {
                const attempts = db.assignmentAttempts.filter(
                    a => a.assignmentId === assignment.id && a.bestAttemptId
                );

                for (const attempt of attempts) {
                    const gameSession = db.gameSessions.find(gs => gs.id === attempt.bestAttemptId);
                    if (gameSession && typeof gameSession.accuracy === 'number') {
                        totalAccuracy += gameSession.accuracy;
                        attemptCount++;
                    }
                }
            }

            const averageScore = attemptCount > 0 ? Math.round(totalAccuracy / attemptCount) : null;

            return {
                id: c.id,
                name: c.name,
                subject: (c as any).subject ?? 'General',
                joinCode: c.joinCode,
                studentsCount: c.studentIds.length,
                nextTopic: c.nextTopic,
                time: c.scheduleTime,
                status: c.status,
                statusMsg: c.statusMsg,
                activeAssignments,
                averageScore
            };
        });

        return res.json(uiClasses);
    }

    // Real path: query SQLite
    const rows = sqliteDb.prepare(
        `SELECT c.*, 
        (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status = 'active') as student_count
        FROM classes c WHERE c.teacher_id = ?`
    ).all(teacherId) as any[];

    const uiClasses = rows.map(r => ({
        id: r.id,
        name: r.name,
        subject: r.subject,
        studentsCount: r.student_count,
        nextTopic: 'TBD',
        time: r.schedule_time || 'TBD',
        status: 'info' as const,
        statusMsg: 'Newly created',
        joinCode: r.join_code,
        activeAssignments: 0,
        averageScore: null,
    }));

    res.json(uiClasses);
};

export const createClass = (req: AuthRequest, res: Response) => {
    const teacherId = req.user!.id;
    const { name, subject, scheduleTime } = req.body;

    if (DEMO_USER_IDS.has(teacherId)) {
        return res.status(403).json({ error: "Demo classes are read-only" });
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let joinCode = '';
    for (let i = 0; i < 6; i++) {
        joinCode += chars.charAt(Math.floor(Math.random() * chars.length));
        if (i === 2) joinCode += '-'; // e.g., ABC-123
    }

    const id = `class_${Date.now()}`;

    sqliteDb.prepare(`
        INSERT INTO classes (id, name, subject, teacher_id, join_code, schedule_time)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, subject || 'General', teacherId, joinCode, scheduleTime || null);

    const newClass = {
        id,
        name,
        subject: subject || 'General',
        teacherId,
        joinCode,
        studentIds: [],
        studentsCount: 0,
        nextTopic: 'TBD',
        scheduleTime: scheduleTime || 'TBD',
        status: 'info',
        statusMsg: 'Newly created',
        activeAssignments: 0,
        averageScore: null
    };

    res.status(201).json(newClass);
};

export const joinClass = (req: AuthRequest, res: Response) => {
    const studentId = req.user!.id;
    const { joinCode } = req.body;

    if (DEMO_USER_IDS.has(studentId)) {
        const targetClass = db.classes.find(c => c.joinCode.toUpperCase() === joinCode.toUpperCase());
        if (!targetClass) {
            return res.status(404).json({ message: 'Invalid join code. Please check and try again.' });
        }

        const alreadyEnrolled = db.enrollments.find(e => e.classroomId === targetClass.id && e.studentId === studentId);
        if (!alreadyEnrolled) {
            const enrollment: Enrollment = {
                id: `enroll_${Date.now()}`,
                classroomId: targetClass.id,
                studentId,
                status: 'active',
                joinedAt: new Date().toISOString()
            };
            db.enrollments.push(enrollment);

            if (!targetClass.studentIds.includes(studentId)) {
                targetClass.studentIds.push(studentId);
            }
        }

        return res.json({ classroom: targetClass });
    }

    const targetClass = sqliteDb.prepare(`SELECT * FROM classes WHERE UPPER(join_code) = UPPER(?)`).get(joinCode) as any;
    if (!targetClass) {
        return res.status(404).json({ message: 'Invalid join code. Please check and try again.' });
    }

    const alreadyEnrolled = sqliteDb.prepare(`SELECT * FROM enrollments WHERE class_id = ? AND student_id = ?`).get(targetClass.id, studentId);
    
    if (!alreadyEnrolled) {
        sqliteDb.prepare(`
            INSERT INTO enrollments (id, class_id, student_id, status, joined_at)
            VALUES (?, ?, ?, 'active', datetime('now'))
        `).run(`enroll_${Date.now()}`, targetClass.id, studentId);
    }

    res.json({ classroom: {
        id: targetClass.id,
        name: targetClass.name,
        subject: targetClass.subject,
        teacherId: targetClass.teacher_id,
        joinCode: targetClass.join_code,
        scheduleTime: targetClass.schedule_time
    } });
};

export const getStudentClasses = (req: AuthRequest, res: Response) => {
    const studentId = req.user!.id;

    if (DEMO_USER_IDS.has(studentId)) {
        const myClasses = db.classes.filter(c => c.studentIds.includes(studentId));
        return res.json(myClasses.map(c => {
            const teacher = db.users.find(u => u.id === c.teacherId);
            return {
                id: c.id,
                name: c.name,
                subject: (c as any).subject ?? 'General',
                teacherName: teacher?.name || 'Unknown',
                joinCode: c.joinCode,
                enrolledAt: new Date().toISOString() // approximated for demo
            };
        }));
    }

    const rows = sqliteDb.prepare(`
        SELECT c.*, u.name as teacher_name, e.joined_at
        FROM classes c
        JOIN enrollments e ON c.id = e.class_id
        JOIN users u ON c.teacher_id = u.id
        WHERE e.student_id = ? AND e.status = 'active'
    `).all(studentId) as any[];

    res.json(rows.map(r => ({
        id: r.id,
        name: r.name,
        subject: r.subject,
        teacherName: r.teacher_name,
        joinCode: r.join_code,
        enrolledAt: r.joined_at
    })));
};
