import { Response } from 'express';
import { db } from '../db.js';
import { sqliteDb, DEMO_USER_IDS } from '../database.js';
import { AuthRequest } from '../middleware/auth.js';

export const getChildren = (req: AuthRequest, res: Response) => {
    const parent = req.user!;

    if (!parent.childrenIds || parent.childrenIds.length === 0) {
        res.json([]);
        return;
    }

    const children = db.users.filter(u => parent.childrenIds!.includes(u.id));
    res.json(children);
};

export const getChildSummary = (req: AuthRequest, res: Response) => {
    const parent = req.user!;
    const childId = req.params.id;

    if (!parent.childrenIds || !parent.childrenIds.includes(childId)) {
        res.status(403).json({ error: 'Not authorized to view this child' });
        return;
    }

    const child = db.users.find(u => u.id === childId);
    if (!child) {
        res.status(404).json({ error: 'Child not found' });
        return;
    }

    const attempts = db.assignmentAttempts.filter(a => a.studentId === childId);

    // 1. Upcoming assignments
    const upcoming = attempts
        .filter(a => a.status !== 'submitted')
        .map(atm => {
            const assignment = db.assignments.find(a => a.id === atm.assignmentId);
            const classroom = db.classes.find(c => c.id === assignment?.classroomId);

            let displayStatus = 'On track';
            if (atm.status === 'in_progress') displayStatus = 'In Progress';
            if (atm.status === 'overdue') displayStatus = 'Overdue';

            return {
                id: atm.id,
                title: assignment?.title || 'Unknown Assignment',
                subject: classroom?.name || 'Unknown Subject',
                dueDate: assignment?.dueDate ? `Due ${assignment.dueDate}` : 'No Date',
                status: displayStatus
            };
        });

    // 2. Recent activities (submitted attempts)
    const recentActivity = attempts
        .filter(a => a.status === 'submitted')
        .map(atm => {
            const assignment = db.assignments.find(a => a.id === atm.assignmentId);
            const classroom = db.classes.find(c => c.id === assignment?.classroomId);

            let scoreStr = undefined;
            let playDate = new Date(atm.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

            if (atm.bestAttemptId) {
                const gs = db.gameSessions.find(g => g.id === atm.bestAttemptId);
                if (gs) {
                    scoreStr = Math.round(gs.accuracy * 100) + '%';
                    playDate = new Date(gs.playedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                }
            }

            return {
                id: atm.id,
                title: assignment?.title || 'Unknown Assignment',
                subject: classroom?.name || 'Unknown Class',
                tag: 'Quiz',
                type: assignment?.gamePackId ? 'GamePack' : 'Assignment',
                score: scoreStr,
                date: playDate,
                status: 'Completed'
            };
        });

    // 3. Weak Topics
    const childSessions = db.gameSessions.filter(gs => gs.studentId === childId);
    const weakTopicCounts: Record<string, number> = {};
    let totalQuestionsAnswered = 0;
    let correctQuestions = 0;

    childSessions.forEach(gs => {
        if (gs.results) {
            gs.results.forEach(res => {
                totalQuestionsAnswered++;
                if (res.isCorrect) {
                    correctQuestions++;
                } else if (res.topicTag) {
                    weakTopicCounts[res.topicTag] = (weakTopicCounts[res.topicTag] || 0) + 1;
                }
            });
        }
    });

    const weakTopics = Object.entries(weakTopicCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);

    // 4. Summary stats
    const avgScore = totalQuestionsAnswered > 0
        ? Math.round((correctQuestions / totalQuestionsAnswered) * 100) + '%'
        : 'N/A';

    const stats = [
        { label: 'Assignments due soon', value: upcoming.length.toString(), iconName: 'FileText', trend: 'neutral' },
        { label: 'Recently completed', value: recentActivity.length.toString(), iconName: 'Gamepad2', trend: 'up' },
        { label: 'Average recent score', value: avgScore, iconName: 'TrendingUp', trend: 'neutral' },
    ];

    // 5. Subject scores — derive from the child's GameSessions that are linked to
    //    assignments, grouped by the classroom (subject) name.
    //    For each classroom, compute the average accuracy across all best attempts.
    const subjectAccuracyMap: Record<string, { total: number; count: number }> = {};

    attempts.forEach(atm => {
        if (!atm.bestAttemptId) return;
        const assignment = db.assignments.find(a => a.id === atm.assignmentId);
        const classroom = db.classes.find(c => c.id === assignment?.classroomId);
        if (!classroom) return;
        const gs = db.gameSessions.find(g => g.id === atm.bestAttemptId);
        if (!gs) return;

        const subjectName = classroom.name;
        if (!subjectAccuracyMap[subjectName]) {
            subjectAccuracyMap[subjectName] = { total: 0, count: 0 };
        }
        subjectAccuracyMap[subjectName].total += gs.accuracy * 100;
        subjectAccuracyMap[subjectName].count += 1;
    });

    const subjectScores = Object.entries(subjectAccuracyMap).map(([name, { total, count }]) => ({
        name,
        score: Math.round(total / count),
    }));

    // Add child classes to response
    let childClasses = [];
    if (DEMO_USER_IDS.has(parent.id)) {
        childClasses = db.classes
            .filter(c => c.studentIds.includes(childId))
            .map(c => ({ id: c.id, name: c.name, subject: (c as any).subject ?? 'General' }));
    } else {
        const rows = sqliteDb.prepare(`
            SELECT c.id, c.name, c.subject
            FROM classes c
            JOIN enrollments e ON c.id = e.class_id
            WHERE e.student_id = ? AND e.status = 'active'
        `).all(childId) as any[];
        childClasses = rows.map(c => ({ id: c.id, name: c.name, subject: c.subject }));
    }

    res.json({
        child: {
            id: child.id,
            name: child.name,
            score: child.score,
            streak: child.streak
        },
        stats,
        upcoming,
        recentActivity,
        weakTopics,
        subjectScores,
        classes: childClasses,
    });
};

export const getChildClasses = (req: AuthRequest, res: Response) => {
    const parent = req.user!;
    const childId = req.params.id;

    if (!parent.childrenIds || !parent.childrenIds.includes(childId)) {
        res.status(403).json({ error: 'Not authorized to view this child' });
        return;
    }

    if (DEMO_USER_IDS.has(parent.id)) {
        const myClasses = db.classes.filter(c => c.studentIds.includes(childId));
        return res.json(myClasses.map(c => {
            const teacher = db.users.find(u => u.id === c.teacherId);
            return {
                id: c.id,
                name: c.name,
                subject: (c as any).subject ?? 'General',
                teacherName: teacher?.name || 'Unknown',
                joinCode: c.joinCode,
                enrolledAt: new Date().toISOString()
            };
        }));
    }

    const rows = sqliteDb.prepare(`
        SELECT c.*, u.name as teacher_name, e.joined_at
        FROM classes c
        JOIN enrollments e ON c.id = e.class_id
        JOIN users u ON c.teacher_id = u.id
        WHERE e.student_id = ? AND e.status = 'active'
    `).all(childId) as any[];

    res.json(rows.map(r => ({
        id: r.id,
        name: r.name,
        subject: r.subject,
        teacherName: r.teacher_name,
        joinCode: r.join_code,
        enrolledAt: r.joined_at
    })));
};

export const sendNudge = (req: AuthRequest, res: Response): any => {
    const parent = req.user!;
    const { studentId, message } = req.body;

    if (!studentId || !message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Missing studentId or message' });
    }

    if (!parent.childrenIds?.includes(studentId)) {
        return res.status(403).json({ error: 'Not authorized for this student' });
    }

    const newNudge = {
        id: `nudge_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        parentId: parent.id,
        studentId,
        message,
        read: false,
        createdAt: new Date().toISOString()
    };

    db.parentNudges.push(newNudge);
    res.json(newNudge);
};
