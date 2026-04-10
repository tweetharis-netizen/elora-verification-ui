import { Response } from 'express';
import { db as mockDb } from '../db.js';
import { db, DEMO_USER_IDS } from '../database.js';
import { AuthRequest } from '../middleware/auth.js';

export const getTeacherStats = (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const isDemo = DEMO_USER_IDS.has(userId);

    if (isDemo) {
        return res.json(mockDb.stats);
    }

    try {
        const totalClassesRow = db.get(`SELECT COUNT(*) as count FROM classes WHERE teacher_id = ?`, userId) as any;
        const totalClasses = totalClassesRow?.count ?? 0;
        
        const activeStudentsRow = db.get(`
            SELECT COUNT(DISTINCT e.student_id) as count 
            FROM enrollments e
            JOIN classes c ON e.class_id = c.id
            WHERE c.teacher_id = ? AND e.status = 'active'
        `, userId) as any;
        const activeStudents = activeStudentsRow?.count ?? 0;

        const assignmentsDueRow = db.get(`
            SELECT COUNT(*) as count 
            FROM assignments 
            WHERE teacher_id = ? AND due_date > datetime('now') AND status = 'published'
        `, userId) as any;
        const assignmentsDue = assignmentsDueRow?.count ?? 0;

        const avgScoreRow = db.get(`
            SELECT AVG(aa.score) as avg 
            FROM assignment_attempts aa
            JOIN assignments a ON aa.assignment_id = a.id
            WHERE a.teacher_id = ? AND aa.status = 'submitted'
        `, userId) as any;
        const avgScore = avgScoreRow?.avg ? Math.round(avgScoreRow.avg) : 0;

        res.json([
            { label: "Total Classes", value: String(totalClasses), trendValue: "+", status: "info" },
            { label: "Active Students", value: String(activeStudents), trendValue: "+", status: "success" },
            { label: "Assignments Due", value: String(assignmentsDue), trendValue: "!", status: "warning" },
            { label: "Avg. Class Score", value: avgScore > 0 ? `${avgScore}%` : "No data", trendValue: "~", status: "info" },
        ]);
    } catch (error) {
        console.error("Error fetching teacher stats:", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
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
    const isDemo = DEMO_USER_IDS.has(teacherId);
    
    if (isDemo) {
        // ... (demo logic preserved below in the modified version)
        const myClasses = mockDb.classes.filter(c => c.teacherId === teacherId);
        const myClassIds = new Set(myClasses.map(c => c.id));
        const myAssignments = mockDb.assignments.filter(
            a => a.teacherId === teacherId && a.isPublished
        );
        const insights: TeacherInsight[] = [];
        const now = new Date();

        // Overdue
        myAssignments.forEach(assignment => {
            const dueDate = new Date(assignment.dueDate);
            if (dueDate > now) return;
            const attempts = mockDb.assignmentAttempts.filter(aa => aa.assignmentId === assignment.id);
            const anySubmitted = attempts.some(aa => aa.status === 'submitted');
            if (anySubmitted) return;
            const cls = myClasses.find(c => c.id === assignment.classroomId);
            insights.push({
                id: `overdue_${assignment.id}`,
                type: 'overdue_assignment',
                className: cls?.name ?? 'Unknown Class',
                assignmentId: assignment.id,
                assignmentTitle: assignment.title,
                detail: `"${assignment.title}" (${cls?.name ?? 'Unknown Class'}) was due ${dueDate.toLocaleDateString()} and has no submissions yet.`,
            });
        });

        // Low Scores
        myAssignments.forEach(assignment => {
            const attempts = mockDb.assignmentAttempts.filter(aa => aa.assignmentId === assignment.id && aa.status === 'submitted');
            if (attempts.length === 0) return;
            const scores: number[] = [];
            attempts.forEach(attempt => {
                if (attempt.bestAttemptId) {
                    const session = mockDb.gameSessions.find(gs => gs.id === attempt.bestAttemptId);
                    if (session) scores.push(Math.round(session.accuracy * 100));
                }
            });
            if (scores.length === 0) return;
            const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
            if (avg >= LOW_SCORES_THRESHOLD) return;
            const cls = myClasses.find(c => c.id === assignment.classroomId);
            insights.push({
                id: `low_scores_${assignment.id}`,
                type: 'low_scores',
                className: cls?.name ?? 'Unknown Class',
                assignmentId: assignment.id,
                assignmentTitle: assignment.title,
                detail: `Class average for "${assignment.title}" is ${avg}% — below the ${LOW_SCORES_THRESHOLD}% threshold.`,
            });
        });

        // Weak Topics (truncated for demo)
        const enrolledStudentIds = new Set<string>();
        mockDb.enrollments.filter(e => myClassIds.has(e.classroomId) && e.status === 'active').forEach(e => enrolledStudentIds.add(e.studentId));
        enrolledStudentIds.forEach(studentId => {
            const student = mockDb.users.find(u => u.id === studentId);
            if (!student) return;
            const enrollment = mockDb.enrollments.find(e => e.studentId === studentId && myClassIds.has(e.classroomId));
            const cls = enrollment ? myClasses.find(c => c.id === enrollment.classroomId) : myClasses[0];
            const className = cls?.name ?? 'Unknown Class';
            const sessions = mockDb.gameSessions.filter(gs => gs.studentId === studentId && gs.status === 'completed').slice(0, 10);
            const failCount: Record<string, number> = {};
            sessions.forEach(gs => gs.results?.forEach(r => { if (!r.isCorrect && r.topicTag) failCount[r.topicTag] = (failCount[r.topicTag] ?? 0) + 1; }));
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

        const order: Record<InsightType, number> = { overdue_assignment: 0, low_scores: 1, weak_topic: 2 };
        return res.json({ 
            needsAttention: insights.sort((a, b) => order[a.type] - order[b.type]).slice(0, 10),
            weakTopics: [] 
        });
    }

    // REAL USER LOGIC (SQLite)
    try {
        const insights: TeacherInsight[] = [];

        // 1. OVERDUE ASSIGNMENTS
        // Assignments with due_date in the past and status 'published'
        // Join with assignment_attempts to see if ANY student has submitted
        const overdue = db.all(`
            SELECT a.id, a.title, a.due_date, c.name as className
            FROM assignments a
            JOIN classes c ON a.class_id = c.id
            WHERE a.teacher_id = ? 
              AND a.due_date < datetime('now')
              AND a.status = 'published'
        `, teacherId);

        overdue.forEach(asgn => {
            const attemptSummary = db.get(`
                SELECT COUNT(*) as total, 
                       SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted
                FROM assignment_attempts
                WHERE assignment_id = ?
            `, asgn.id);

            if (attemptSummary.total > 0 && attemptSummary.submitted === 0) {
                insights.push({
                    id: `overdue_${asgn.id}`,
                    type: 'overdue_assignment',
                    className: asgn.className,
                    assignmentId: asgn.id,
                    assignmentTitle: asgn.title,
                    detail: `"${asgn.title}" (${asgn.className}) was due ${new Date(asgn.due_date).toLocaleDateString()} and has no submissions yet.`,
                });
            }
        });

        // 2. LOW SCORES
        const lowScoreAssignments = db.all(`
            SELECT a.id, a.title, c.name as className, AVG(aa.score) as avgScore
            FROM assignments a
            JOIN classes c ON a.class_id = c.id
            JOIN assignment_attempts aa ON a.id = aa.assignment_id
            WHERE a.teacher_id = ? 
              AND aa.status = 'submitted'
            GROUP BY a.id
            HAVING avgScore < ?
        `, teacherId, LOW_SCORES_THRESHOLD);

        lowScoreAssignments.forEach(asgn => {
            insights.push({
                id: `low_scores_${asgn.id}`,
                type: 'low_scores',
                className: asgn.className,
                assignmentId: asgn.id,
                assignmentTitle: asgn.title,
                detail: `Class average for "${asgn.title}" is ${Math.round(asgn.avgScore)}% — below the ${LOW_SCORES_THRESHOLD}% threshold.`,
            });
        });

        // 3. WEAK TOPICS
        const activeStudents = db.all(`
            SELECT DISTINCT e.student_id, u.name as studentName, c.name as className
            FROM enrollments e
            JOIN classes c ON e.class_id = c.id
            JOIN users u ON e.student_id = u.id
            WHERE c.teacher_id = ? AND e.status = 'active'
        `, teacherId) as any[];

        activeStudents.forEach(row => {
            // Get last N sessions for this student
            const sessions = db.all(`
                SELECT results FROM game_sessions 
                WHERE student_id = ? 
                ORDER BY played_at DESC 
                LIMIT ?
            `, row.student_id, RECENT_SESSIONS_WINDOW) as any[];

            if (sessions.length === 0) return;

            const failCount: Record<string, number> = {};
            sessions.forEach(s => {
                try {
                    const results = JSON.parse(s.results || '[]');
                    results.forEach((r: any) => {
                        if (!r.isCorrect && r.topicTag) {
                            failCount[r.topicTag] = (failCount[r.topicTag] || 0) + 1;
                        }
                    });
                } catch (e) {
                    console.error('Error parsing session results:', e);
                }
            });

            Object.entries(failCount).forEach(([topic, count]) => {
                if (count >= WEAK_TOPIC_MIN_FAILURES) {
                    insights.push({
                        id: `weak_topic_${row.student_id}_${topic.replace(/\s+/g, '_')}`,
                        type: 'weak_topic',
                        studentId: row.student_id,
                        studentName: row.studentName,
                        className: row.className,
                        topicTag: topic,
                        detail: `${row.studentName} has missed "${topic}" in ${count} of the last ${sessions.length} session(s).`,
                    });
                }
            });
        });

        const order: Record<InsightType, number> = { overdue_assignment: 0, low_scores: 1, weak_topic: 2 };
        res.json({
            needsAttention: insights.sort((a, b) => order[a.type] - order[b.type]).slice(0, 10),
            weakTopics: []
        });

    } catch (error) {
        console.error("Error fetching insights:", error);
        res.status(500).json({ error: "Failed to fetch insights" });
    }
};

export const sendTeacherNudge = (req: AuthRequest, res: Response) => {
    const teacherId = req.user!.id;
    const isDemo = DEMO_USER_IDS.has(teacherId);
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
    
    if (isDemo) {
        mockDb.teacherNudges.push(nudge);
    } else {
        // SQLite: no teacher_nudges table yet, but we define the flow if needed.
        // For now, we only push to memory for demo. 
        // Real persistence for nudges can be Phase 4.
    }
    res.status(201).json(nudge);
};

type CopilotRole = 'user' | 'assistant' | 'system';

interface TeacherConversationRow {
    id: string;
    teacher_id: string;
    class_id: string | null;
    student_id: string | null;
    title: string | null;
    created_at: string;
    updated_at: string;
    last_message_at: string | null;
}

interface TeacherConversationMessageRow {
    id: string;
    conversation_id: string;
    role: CopilotRole;
    content: string;
    intent: string | null;
    source: string | null;
    metadata_json: string | null;
    created_at: string;
}

const createId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const toConversationDto = (row: TeacherConversationRow) => ({
    id: row.id,
    teacherId: row.teacher_id,
    classId: row.class_id,
    studentId: row.student_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessageAt: row.last_message_at,
});

const toMessageDto = (row: TeacherConversationMessageRow) => ({
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    intent: row.intent,
    source: row.source,
    metadata: row.metadata_json ? JSON.parse(row.metadata_json) : null,
    createdAt: row.created_at,
});

const getOwnedConversation = (teacherId: string, conversationId: string): TeacherConversationRow | undefined => {
    return db.get(
        `SELECT * FROM teacher_conversations WHERE id = ? AND teacher_id = ?`,
        conversationId,
        teacherId
    ) as TeacherConversationRow | undefined;
};

export const listTeacherCopilotConversations = (req: AuthRequest, res: Response) => {
    const teacherId = req.user!.id;
    const classId = (req.query.classId as string | undefined) ?? undefined;
    const studentId = (req.query.studentId as string | undefined) ?? undefined;

    try {
        let sql = `SELECT * FROM teacher_conversations WHERE teacher_id = ?`;
        const params: any[] = [teacherId];

        if (classId) {
            sql += ` AND class_id = ?`;
            params.push(classId);
        }

        if (studentId) {
            sql += ` AND student_id = ?`;
            params.push(studentId);
        }

        sql += ` ORDER BY updated_at DESC, created_at DESC`;

        const rows = db.all(sql, ...params) as TeacherConversationRow[];
        res.json(rows.map(toConversationDto));
    } catch (error) {
        console.error('Error listing teacher copilot conversations:', error);
        res.status(500).json({ error: 'Failed to list conversations' });
    }
};

export const createTeacherCopilotConversation = (req: AuthRequest, res: Response) => {
    const teacherId = req.user!.id;
    const { classId, studentId, title } = req.body ?? {};
    const isDemoTeacher = DEMO_USER_IDS.has(teacherId);

    const normalizeId = (value: unknown) => {
        if (value === null || value === undefined) return null;
        return String(value).trim();
    };

    const normalizedClassId = normalizeId(classId);
    const normalizedStudentId = normalizeId(studentId);
    let validatedDemoClass: any | null = null;
    let validatedDemoStudent: any | null = null;

    try {
        if (normalizedClassId) {
            if (isDemoTeacher) {
                const demoClass = mockDb.classes.find(
                    (row) => String(row.id) === normalizedClassId && row.teacherId === teacherId
                );
                if (!demoClass) {
                    return res.status(400).json({ error: 'Invalid classId for this teacher' });
                }
                validatedDemoClass = demoClass;
            } else {
                const classRow = db.get(
                    `SELECT id FROM classes WHERE id = ? AND teacher_id = ?`,
                    normalizedClassId,
                    teacherId
                );
                if (!classRow) {
                    return res.status(400).json({ error: 'Invalid classId for this teacher' });
                }
            }
        }

        if (normalizedStudentId) {
            if (isDemoTeacher) {
                const student = mockDb.users.find(
                    (row) => String(row.id) === normalizedStudentId && row.role === 'student'
                );
                if (!student) {
                    return res.status(400).json({ error: 'Invalid studentId' });
                }
                validatedDemoStudent = student;

                if (normalizedClassId) {
                    const demoClass = validatedDemoClass ?? mockDb.classes.find(
                        (row) => String(row.id) === normalizedClassId && row.teacherId === teacherId
                    );

                    if (!demoClass) {
                        return res.status(400).json({ error: 'Invalid classId for this teacher' });
                    }

                    const activeEnrollment = mockDb.enrollments.find(
                        (row) =>
                            String(row.classroomId) === normalizedClassId &&
                            String(row.studentId) === normalizedStudentId &&
                            row.status === 'active'
                    );

                    // Demo data has partial enrollment records for large classes.
                    // Fall back to the class roster so class-level conversations stay usable in seeded dev mode.
                    const isInRoster = demoClass.studentIds.some((id) => String(id) === normalizedStudentId);

                    if (!activeEnrollment && !isInRoster) {
                        return res.status(400).json({ error: 'studentId is not active in classId' });
                    }
                }
            } else {
                const student = db.get(`SELECT id FROM users WHERE id = ? AND role = 'student'`, normalizedStudentId);
                if (!student) {
                    return res.status(400).json({ error: 'Invalid studentId' });
                }

                if (normalizedClassId) {
                    const enrolled = db.get(
                        `SELECT id FROM enrollments WHERE class_id = ? AND student_id = ? AND status = 'active'`,
                        normalizedClassId,
                        normalizedStudentId
                    );
                    if (!enrolled) {
                        return res.status(400).json({ error: 'studentId is not active in classId' });
                    }
                }
            }
        }

        if (isDemoTeacher) {
            if (validatedDemoClass) {
                // Demo classes live in memory. Mirror validated rows into SQLite to satisfy FK constraints.
                db.run(
                    `INSERT OR IGNORE INTO classes (id, name, subject, teacher_id, join_code, schedule_time)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    String(validatedDemoClass.id),
                    validatedDemoClass.name,
                    validatedDemoClass.subject ?? 'General',
                    teacherId,
                    validatedDemoClass.joinCode,
                    validatedDemoClass.scheduleTime ?? null
                );
            }

            if (validatedDemoStudent) {
                db.run(
                    `INSERT OR IGNORE INTO users (id, name, email, role)
                     VALUES (?, ?, ?, 'student')`,
                    String(validatedDemoStudent.id),
                    validatedDemoStudent.name,
                    validatedDemoStudent.email
                );
            }
        }

        const now = new Date().toISOString();
        const id = createId('tcv');

        db.run(
            `INSERT INTO teacher_conversations (id, teacher_id, class_id, student_id, title, created_at, updated_at, last_message_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
            id,
            teacherId,
            normalizedClassId ?? null,
            normalizedStudentId ?? null,
            title ?? null,
            now,
            now
        );

        const created = db.get(`SELECT * FROM teacher_conversations WHERE id = ?`, id) as TeacherConversationRow;
        res.status(201).json(toConversationDto(created));
    } catch (error) {
        console.error('Error creating teacher copilot conversation:', error);
        res.status(500).json({ error: 'Failed to create conversation' });
    }
};

export const listTeacherCopilotMessages = (req: AuthRequest, res: Response) => {
    const teacherId = req.user!.id;
    const conversationId = req.params.id;

    try {
        const conversation = getOwnedConversation(teacherId, conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const rows = db.all(
            `SELECT * FROM teacher_conversation_messages WHERE conversation_id = ? ORDER BY created_at ASC`,
            conversationId
        ) as TeacherConversationMessageRow[];

        res.json(rows.map(toMessageDto));
    } catch (error) {
        console.error('Error listing teacher copilot messages:', error);
        res.status(500).json({ error: 'Failed to list conversation messages' });
    }
};

export const appendTeacherCopilotMessage = (req: AuthRequest, res: Response) => {
    const teacherId = req.user!.id;
    const conversationId = req.params.id;
    const { role, content, intent, source, metadata } = req.body ?? {};

    try {
        const conversation = getOwnedConversation(teacherId, conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        if (!role || !['user', 'assistant', 'system'].includes(role)) {
            return res.status(400).json({ error: 'role must be one of user, assistant, system' });
        }

        if (!content || typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({ error: 'content is required' });
        }

        const id = createId('tcm');
        const now = new Date().toISOString();
        const metadataJson = metadata ? JSON.stringify(metadata) : null;

        db.run(
            `INSERT INTO teacher_conversation_messages (id, conversation_id, role, content, intent, source, metadata_json, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            id,
            conversationId,
            role,
            content,
            intent ?? null,
            source ?? null,
            metadataJson,
            now
        );

        db.run(
            `UPDATE teacher_conversations SET updated_at = ?, last_message_at = ? WHERE id = ?`,
            now,
            now,
            conversationId
        );

        const created = db.get(`SELECT * FROM teacher_conversation_messages WHERE id = ?`, id) as TeacherConversationMessageRow;
        res.status(201).json(toMessageDto(created));
    } catch (error) {
        console.error('Error appending teacher copilot message:', error);
        res.status(500).json({ error: 'Failed to append conversation message' });
    }
};
