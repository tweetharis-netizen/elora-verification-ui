import { Response } from 'express';
import { db } from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

export const getTeacherStats = (req: AuthRequest, res: Response) => {
    // Return stats from db
    // In a real app we might calculate this based on the authenticated teacher (req.user!.id)
    res.json(db.stats);
};

// ── Shared types ──────────────────────────────────────────────────────────────

export type InsightType = 'weak_topic' | 'low_scores' | 'overdue_assignment';

export interface TeacherInsight {
    id: string;
    type: InsightType;
    studentId?: string;
    studentName?: string;
    className: string;
    assignmentId?: string;
    assignmentTitle?: string;
    topicTag?: string;
    detail: string;
}

// ── Insight thresholds ────────────────────────────────────────────────────────

/** Flag a student–topic pair if they missed it in ≥ this many recent attempts. */
const WEAK_TOPIC_MIN_FAILURES = 2;

/** Flag an assignment if its class-average score is below this percentage. */
const LOW_SCORES_THRESHOLD = 60;

/** Number of recent game sessions to scan per student for weak-topic detection. */
const RECENT_SESSIONS_WINDOW = 10;

// ── Controller ────────────────────────────────────────────────────────────────

export const getInsightsNeedsAttention = (req: AuthRequest, res: Response) => {
    const teacherId = req.user!.id;
    const now = new Date();
    const insights: TeacherInsight[] = [];

    // All classrooms belonging to this teacher
    const myClasses = db.classes.filter(c => c.teacherId === teacherId);
    const myClassIds = new Set(myClasses.map(c => c.id));

    // All published assignments in those classes
    const myAssignments = db.assignments.filter(
        a => a.teacherId === teacherId && a.isPublished
    );

    // ── 1. OVERDUE ASSIGNMENTS (no submissions at all past due date) ───────────
    myAssignments.forEach(assignment => {
        const dueDate = new Date(assignment.dueDate);
        if (dueDate > now) return; // not yet overdue

        const attempts = db.assignmentAttempts.filter(
            aa => aa.assignmentId === assignment.id
        );
        const anySubmitted = attempts.some(aa => aa.status === 'submitted');
        if (anySubmitted) return; // at least one student did it

        const cls = myClasses.find(c => c.id === assignment.classroomId);
        const className = cls?.name ?? 'Unknown Class';

        insights.push({
            id: `overdue_${assignment.id}`,
            type: 'overdue_assignment',
            className,
            assignmentId: assignment.id,
            assignmentTitle: assignment.title,
            detail: `"${assignment.title}" (${className}) was due ${dueDate.toLocaleDateString()} and has no submissions yet.`,
        });
    });

    // ── 2. LOW CLASS-AVERAGE SCORES per assignment ────────────────────────────
    myAssignments.forEach(assignment => {
        const attempts = db.assignmentAttempts.filter(
            aa => aa.assignmentId === assignment.id && aa.status === 'submitted'
        );
        if (attempts.length === 0) return;

        const scores: number[] = [];
        attempts.forEach(attempt => {
            if (attempt.bestAttemptId) {
                const session = db.gameSessions.find(gs => gs.id === attempt.bestAttemptId);
                if (session) {
                    scores.push(Math.round(session.accuracy * 100));
                }
            }
        });

        if (scores.length === 0) return;

        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        if (avg >= LOW_SCORES_THRESHOLD) return;

        const cls = myClasses.find(c => c.id === assignment.classroomId);
        const className = cls?.name ?? 'Unknown Class';

        insights.push({
            id: `low_scores_${assignment.id}`,
            type: 'low_scores',
            className,
            assignmentId: assignment.id,
            assignmentTitle: assignment.title,
            detail: `Class average for "${assignment.title}" is ${avg}% — below the ${LOW_SCORES_THRESHOLD}% threshold.`,
        });
    });

    // ── 3. WEAK TOPICS per student (across game sessions tied to teacher's classes) ─
    //
    // Collect all real studentIds enrolled in this teacher's classrooms.
    const enrolledStudentIds = new Set<string>();
    db.enrollments
        .filter(e => myClassIds.has(e.classroomId) && e.status === 'active')
        .forEach(e => enrolledStudentIds.add(e.studentId));

    // Also include students listed on classroomId.studentIds (legacy field)
    myClasses.forEach(cls => {
        cls.studentIds.forEach(sid => {
            if (sid !== 'dummy_id') enrolledStudentIds.add(sid);
        });
    });

    enrolledStudentIds.forEach(studentId => {
        const student = db.users.find(u => u.id === studentId);
        if (!student) return;

        // Determine which classroom this student is in (for className)
        const enrollment = db.enrollments.find(
            e => e.studentId === studentId && myClassIds.has(e.classroomId)
        );
        const cls = enrollment
            ? myClasses.find(c => c.id === enrollment.classroomId)
            : myClasses[0];
        const className = cls?.name ?? 'Unknown Class';

        // Gather recent completed sessions
        const sessions = db.gameSessions
            .filter(gs => gs.studentId === studentId && gs.status === 'completed')
            .sort(
                (a, b) =>
                    new Date(b.endTime || 0).getTime() -
                    new Date(a.endTime || 0).getTime()
            )
            .slice(0, RECENT_SESSIONS_WINDOW);

        // Count failures per topicTag
        const failCount: Record<string, number> = {};
        sessions.forEach(gs => {
            if (!gs.results) return;
            gs.results.forEach(r => {
                if (!r.isCorrect && r.topicTag) {
                    failCount[r.topicTag] = (failCount[r.topicTag] ?? 0) + 1;
                }
            });
        });

        // Emit an insight for each flagged topic
        Object.entries(failCount).forEach(([topic, count]) => {
            if (count < WEAK_TOPIC_MIN_FAILURES) return;

            insights.push({
                id: `weak_topic_${studentId}_${topic.replace(/\s+/g, '_')}`,
                type: 'weak_topic',
                studentId,
                studentName: student.name,
                className,
                topicTag: topic,
                detail: `${student.name} has missed "${topic}" in ${count} of the last ${sessions.length} attempt(s).`,
            });
        });
    });

    // Sort: overdue first, then low_scores, then weak_topic; cap at 10
    const order: Record<InsightType, number> = {
        overdue_assignment: 0,
        low_scores: 1,
        weak_topic: 2,
    };
    const sorted = insights
        .sort((a, b) => order[a.type] - order[b.type])
        .slice(0, 10);

    res.json(sorted);
};

export const sendTeacherNudge = (req: AuthRequest, res: Response) => {
    const teacherId = req.user!.id;
    const { studentId, message } = req.body;
    
    if (!studentId || !message) {
        return res.status(400).json({ error: 'Student ID and message are required' });
    }
    
    const nudge: any = {
        id: `t-nudge-${Date.now()}`,
        teacherId,
        studentId,
        message,
        read: false,
        createdAt: new Date().toISOString()
    };
    
    db.teacherNudges.push(nudge);
    res.status(201).json(nudge);
};
