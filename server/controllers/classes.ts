import { Response } from 'express';
import { db, Classroom, Enrollment } from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

export const getClasses = (req: AuthRequest, res: Response) => {
    const teacherId = req.user!.id;
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

    res.json(uiClasses);
};

export const createClass = (req: AuthRequest, res: Response) => {
    const teacherId = req.user!.id;
    const { name } = req.body;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let joinCode = '';
    for (let i = 0; i < 6; i++) {
        joinCode += chars.charAt(Math.floor(Math.random() * chars.length));
        if (i === 2) joinCode += '-'; // e.g., ABC-123
    }

    const newClass: Classroom = {
        id: `class_${Date.now()}`,
        name,
        teacherId,
        joinCode,
        studentIds: [],
        nextTopic: 'TBD',
        scheduleTime: 'TBD',
        status: 'info',
        statusMsg: 'Newly created'
    };

    db.classes.push(newClass);
    res.status(201).json(newClass);
};

export const joinClass = (req: AuthRequest, res: Response) => {
    const studentId = req.user!.id;
    const { joinCode } = req.body;

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

    res.json({ classroom: targetClass });
};
