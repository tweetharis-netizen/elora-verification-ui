import { Response } from 'express';
import { db as mockDb } from '../db.js';
import { AuthRequest } from '../middleware/auth.js';
import { DEMO_USER_IDS, sqliteDb, db } from '../database.js';

export const getStudentAssignments = (req: AuthRequest, res: Response) => {
    const studentId = req.user!.id;

    // Find all classes the student is part of
    const myClasses = mockDb.classes.filter(c => c.studentIds.includes(studentId));
    const classIds = myClasses.map(c => c.id);

    // Find assignments for those classes
    const myAssignments = mockDb.assignments.filter(a => classIds.includes(a.classroomId));

    // Map to add className and submission status
    const uiAssignments = myAssignments.map(a => {
        const cls = mockDb.classes.find(c => c.id === a.classroomId);
        const submission = mockDb.submissions.find(s => s.assignmentId === a.id && s.studentId === studentId);

        return {
            ...a,
            className: cls ? cls.name : 'Unknown Class',
            status: submission ? 'info' : a.status,
            statusLabel: submission ? 'SUBMITTED' : a.statusLabel
        };
    });

    res.json(uiAssignments);
};

export const getStudentGameSessions = (req: AuthRequest, res: Response) => {
    const studentId = req.user!.id;
    const sessions = mockDb.gameSessions
        .filter(s => s.studentId === studentId)
        .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());
    res.json(sessions);
};

export const createStudentGameSession = (req: AuthRequest, res: Response): any => {
    const studentId = req.user!.id;
    const { packId, classId, score, totalQuestions, accuracy, startTime, endTime, status, results } = req.body;

    if (!packId || typeof score !== 'number' || typeof totalQuestions !== 'number' || typeof accuracy !== 'number') {
        return res.status(400).json({ error: 'Missing or invalid fields in request body' });
    }

    const newSession = {
        id: `gs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        studentId,
        packId,
        classId,
        score,
        totalQuestions,
        accuracy,
        playedAt: new Date().toISOString(),
        startTime: startTime || new Date().toISOString(),
        endTime: endTime || new Date().toISOString(),
        status: status || 'completed',
        results: results || []
    };

    mockDb.gameSessions.push(newSession);

    // Persist to SQLite for real users
    if (!DEMO_USER_IDS.has(studentId)) {
        try {
            const topicTags = Array.from(new Set((results || []).map((r: any) => r.topicTag).filter(Boolean)));
            const scorePercentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
            
            sqliteDb.prepare(`
                INSERT INTO game_sessions (id, student_id, pack_id, class_id, score, topic_tags, results, played_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                newSession.id,
                studentId,
                packId,
                classId || null,
                scorePercentage,
                JSON.stringify(topicTags),
                JSON.stringify(results || []),
                newSession.playedAt
            );
        } catch (error) {
            console.error('Error persisting game session to SQLite:', error);
        }
    }

    return res.status(201).json(newSession);
};

// ── Streak & Weekly Trend ─────────────────────────────────────────────────────
//
// Week definition: Monday 00:00:00 local-midnight to Sunday 23:59:59 (Sun nights).
// We compute using UTC-aligned ISO week arithmetic: each "week" is identified by
// the date string of the Monday of that week (YYYY-MM-DD).
//
// A week "counts" toward the streak when the student has ≥ 1 submitted
// AssignmentAttempt OR ≥ 1 completed GameSession with a playedAt in that window.
//
// streak: consecutive weeks counted backwards from the current week.
// weeklyScores: up to 6 most recent weeks that have at least one session, newest last.

function getMondayKey(date: Date): string {
    const d = new Date(date);
    // getDay(): 0=Sun, 1=Mon ... 6=Sat
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // shift so Monday = start
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10); // YYYY-MM-DD of that Monday
}

function addWeeks(mondayKey: string, delta: number): string {
    const d = new Date(mondayKey + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + delta * 7);
    return d.toISOString().slice(0, 10);
}

function weekLabel(mondayKey: string): string {
    const d = new Date(mondayKey + 'T00:00:00Z');
    // "W/C 3 Mar"
    return `W/C ${d.getUTCDate()} ${d.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })}`;
}

export const getStudentStreak = (req: AuthRequest, res: Response) => {
    const studentId = req.user!.id;

    // Collect all active dates: playedAt from GameSessions + updatedAt from submitted attempts
    const activeDates: Date[] = [];

    mockDb.gameSessions
        .filter(gs => gs.studentId === studentId && gs.status === 'completed')
        .forEach(gs => activeDates.push(new Date(gs.playedAt)));

    mockDb.assignmentAttempts
        .filter(aa => aa.studentId === studentId && aa.status === 'submitted')
        .forEach(aa => activeDates.push(new Date(aa.updatedAt)));

    // Build a set of week keys that have activity, plus accuracy totals per week
    type WeekStats = { accuracyTotal: number; count: number; hasActivity: boolean };
    const weekMap: Record<string, WeekStats> = {};

    // Index game session accuracies by week key
    mockDb.gameSessions
        .filter(gs => gs.studentId === studentId && gs.status === 'completed')
        .forEach(gs => {
            const key = getMondayKey(new Date(gs.playedAt));
            if (!weekMap[key]) weekMap[key] = { accuracyTotal: 0, count: 0, hasActivity: false };
            weekMap[key].accuracyTotal += gs.accuracy * 100;
            weekMap[key].count += 1;
            weekMap[key].hasActivity = true;
        });

    // Mark weeks from submitted attempts (they count for streak but may not have a score)
    mockDb.assignmentAttempts
        .filter(aa => aa.studentId === studentId && aa.status === 'submitted')
        .forEach(aa => {
            const key = getMondayKey(new Date(aa.updatedAt));
            if (!weekMap[key]) weekMap[key] = { accuracyTotal: 0, count: 0, hasActivity: false };
            weekMap[key].hasActivity = true;
        });

    const currentWeekKey = getMondayKey(new Date());

    // ── Streak: count consecutive weeks backwards from current ────────────────
    let streakWeeks = 0;
    let cursor = currentWeekKey;
    for (let i = 0; i < 52; i++) {
        const stats = weekMap[cursor];
        if (stats?.hasActivity) {
            streakWeeks++;
            cursor = addWeeks(cursor, -1);
        } else {
            break;
        }
    }

    // ── Weekly scores: up to 6 most recent weeks with score data ──────────────
    const scoredWeeks = Object.entries(weekMap)
        .filter(([, s]) => s.count > 0)
        .sort(([a], [b]) => a.localeCompare(b)) // oldest first
        .slice(-6);

    const weeklyScores = scoredWeeks.map(([key, stats]) => ({
        weekLabel: weekLabel(key),
        avgAccuracy: Math.round(stats.accuracyTotal / stats.count),
    }));

    // ── This week vs prior week ────────────────────────────────────────────────
    const scoreThisWeek = weekMap[currentWeekKey]?.count
        ? Math.round(weekMap[currentWeekKey].accuracyTotal / weekMap[currentWeekKey].count)
        : null;

    const priorWeekKey = addWeeks(currentWeekKey, -1);
    const scorePriorWeek = weekMap[priorWeekKey]?.count
        ? Math.round(weekMap[priorWeekKey].accuracyTotal / weekMap[priorWeekKey].count)
        : null;

    const DEAD_ZONE = 3; // ±3% is "flat"
    let trend: 'up' | 'down' | 'flat' = 'flat';
    if (scoreThisWeek !== null && scorePriorWeek !== null) {
        const delta = scoreThisWeek - scorePriorWeek;
        if (delta > DEAD_ZONE) trend = 'up';
        else if (delta < -DEAD_ZONE) trend = 'down';
    }

    res.json({
        streakWeeks,
        weeklyScores,
        scoreThisWeek,
        scorePriorWeek,
        trend,
    });
};


export const getStudentNudges = (req: AuthRequest, res: Response) => {
    const studentId = req.user!.id;
    
    const pNudges = mockDb.parentNudges.filter(n => n.studentId === studentId).map(n => {
        const parent = mockDb.users.find(u => u.id === n.parentId);
        return {
            ...n,
            senderName: parent ? parent.name : 'Parent'
        };
    });
    
    const tNudges = mockDb.teacherNudges.filter(n => n.studentId === studentId).map(n => {
        const teacher = mockDb.users.find(u => u.id === n.teacherId);
        return {
            ...n,
            senderName: teacher ? teacher.name : 'Teacher'
        };
    });
    
    const allNudges = [...pNudges, ...tNudges]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
    res.json(allNudges);
};

export const markNudgeRead = (req: AuthRequest, res: Response): any => {
    const studentId = req.user!.id;
    const nudgeId = req.params.id;

    const nudge = (mockDb.parentNudges as any[]).concat(mockDb.teacherNudges as any[])
        .find(n => n.id === nudgeId && n.studentId === studentId);

    if (!nudge) {
        return res.status(404).json({ error: 'Nudge not found' });
    }

    nudge.read = true;
    res.json(nudge);
};

type StudentConversationRow = {
    id: string;
    student_id: string;
    class_id: string | null;
    subject: string | null;
    week_key: string | null;
    title: string | null;
    thread_type: 'weekly_subject' | 'checkpoint' | 'free_study';
    summary: string | null;
    created_at: string;
    updated_at: string;
    last_message_at: string | null;
};

type StudentConversationMessageRow = {
    id: string;
    conversation_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    intent: string | null;
    source: string | null;
    metadata_json: string | null;
    created_at: string;
};

const createId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const toConversationDto = (row: StudentConversationRow) => ({
    id: row.id,
    studentId: row.student_id,
    classId: row.class_id,
    subject: row.subject,
    weekKey: row.week_key,
    title: row.title,
    threadType: row.thread_type,
    summary: row.summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessageAt: row.last_message_at,
});

const toMessageDto = (row: StudentConversationMessageRow) => ({
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    intent: row.intent,
    source: row.source,
    metadata: row.metadata_json ? JSON.parse(row.metadata_json) : null,
    createdAt: row.created_at,
});

const getOwnedConversation = (studentId: string, conversationId: string): StudentConversationRow | undefined => {
    return db.get(
        `SELECT * FROM student_conversations WHERE id = ? AND student_id = ?`,
        conversationId,
        studentId
    ) as StudentConversationRow | undefined;
};

export const listStudentCopilotConversations = (req: AuthRequest, res: Response) => {
    const studentId = req.user!.id;
    const subject = (req.query.subject as string | undefined) ?? undefined;
    const classId = (req.query.classId as string | undefined) ?? undefined;
    const weekKey = (req.query.weekKey as string | undefined) ?? undefined;

    try {
        let sql = `SELECT * FROM student_conversations WHERE student_id = ?`;
        const params: any[] = [studentId];

        if (subject) {
            sql += ` AND subject = ?`;
            params.push(subject);
        }

        if (classId) {
            sql += ` AND class_id = ?`;
            params.push(classId);
        }

        if (weekKey) {
            sql += ` AND week_key = ?`;
            params.push(weekKey);
        }

        sql += ` ORDER BY updated_at DESC, created_at DESC`;
        const rows = db.all(sql, ...params) as StudentConversationRow[];
        res.json(rows.map(toConversationDto));
    } catch (error) {
        console.error('Error listing student copilot conversations:', error);
        res.status(500).json({ error: 'Failed to list conversations' });
    }
};

export const createStudentCopilotConversation = (req: AuthRequest, res: Response) => {
    const studentId = req.user!.id;
    const { subject, classId, weekKey, title, threadType } = req.body ?? {};
    const normalizedThreadType = String(threadType ?? 'weekly_subject');

    try {
        if (!['weekly_subject', 'checkpoint', 'free_study'].includes(normalizedThreadType)) {
            return res.status(400).json({ error: 'threadType must be weekly_subject, checkpoint, or free_study' });
        }

        if (classId) {
            if (DEMO_USER_IDS.has(studentId)) {
                const hasClass = mockDb.classes.some(
                    (row) => String(row.id) === String(classId) && row.studentIds.includes(studentId)
                );
                if (!hasClass) {
                    return res.status(400).json({ error: 'Invalid classId for this student' });
                }

                const demoClass = mockDb.classes.find((row) => String(row.id) === String(classId));
                const demoTeacherId = demoClass?.teacherId;
                if (demoClass && demoTeacherId) {
                    db.run(
                        `INSERT OR IGNORE INTO classes (id, name, subject, teacher_id, join_code, schedule_time)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        String(demoClass.id),
                        demoClass.name,
                        demoClass.subject ?? 'General',
                        demoTeacherId,
                        demoClass.joinCode,
                        demoClass.scheduleTime ?? null
                    );
                }
            } else {
                const enrolled = db.get(
                    `SELECT e.id
                     FROM enrollments e
                     JOIN classes c ON c.id = e.class_id
                     WHERE e.class_id = ? AND e.student_id = ? AND e.status = 'active'`,
                    classId,
                    studentId
                );
                if (!enrolled) {
                    return res.status(400).json({ error: 'Invalid classId for this student' });
                }
            }
        }

        const now = new Date().toISOString();
        const id = createId('scv');

        db.run(
            `INSERT INTO student_conversations (
                id, student_id, class_id, subject, week_key, title, thread_type, summary, created_at, updated_at, last_message_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, NULL)`,
            id,
            studentId,
            classId ?? null,
            subject ?? null,
            weekKey ?? null,
            title ?? null,
            normalizedThreadType,
            now,
            now
        );

        const created = db.get(`SELECT * FROM student_conversations WHERE id = ?`, id) as StudentConversationRow;
        res.status(201).json(toConversationDto(created));
    } catch (error) {
        console.error('Error creating student copilot conversation:', error);
        res.status(500).json({ error: 'Failed to create conversation' });
    }
};

export const listStudentCopilotMessages = (req: AuthRequest, res: Response) => {
    const studentId = req.user!.id;
    const conversationId = req.params.id;

    try {
        const conversation = getOwnedConversation(studentId, conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const rows = db.all(
            `SELECT * FROM student_conversation_messages WHERE conversation_id = ? ORDER BY created_at ASC`,
            conversationId
        ) as StudentConversationMessageRow[];

        res.json(rows.map(toMessageDto));
    } catch (error) {
        console.error('Error listing student copilot messages:', error);
        res.status(500).json({ error: 'Failed to list conversation messages' });
    }
};

export const appendStudentCopilotMessage = (req: AuthRequest, res: Response) => {
    const studentId = req.user!.id;
    const conversationId = req.params.id;
    const { role, content, intent, source, metadata } = req.body ?? {};

    try {
        const conversation = getOwnedConversation(studentId, conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        if (!role || !['user', 'assistant', 'system'].includes(role)) {
            return res.status(400).json({ error: 'role must be one of user, assistant, system' });
        }

        if (!content || typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({ error: 'content is required' });
        }

        const id = createId('scm');
        const now = new Date().toISOString();
        const metadataJson = metadata ? JSON.stringify(metadata) : null;

        db.run(
            `INSERT INTO student_conversation_messages (id, conversation_id, role, content, intent, source, metadata_json, created_at)
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
            `UPDATE student_conversations SET updated_at = ?, last_message_at = ? WHERE id = ?`,
            now,
            now,
            conversationId
        );

        const created = db.get(`SELECT * FROM student_conversation_messages WHERE id = ?`, id) as StudentConversationMessageRow;

        // Guardrails: detect repeated wrong attempts and self-negative language
        let wrongAttemptsCount = 0;
        let requireWarmup = false;
        let negativeSelfTalkDetected = false;

        try {
            const allRows = db.all(
                `SELECT * FROM student_conversation_messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 200`,
                conversationId
            ) as StudentConversationMessageRow[];

            // Count wrong attempts for the same concept if metadata contains attempt.conceptId
            const newMeta = metadataJson ? JSON.parse(metadataJson) : null;
            const conceptId = newMeta?.attempt?.conceptId ?? null;

            if (conceptId) {
                for (const r of allRows) {
                    if (!r.metadata_json) continue;
                    try {
                        const m = JSON.parse(r.metadata_json);
                        const attempt = m?.attempt;
                        if (attempt && attempt.conceptId === conceptId && attempt.outcome === 'wrong') {
                            wrongAttemptsCount++;
                        }
                    } catch (e) {
                        // ignore malformed
                    }
                }
            }

            if (wrongAttemptsCount >= 3) {
                requireWarmup = true;
            }

            // Basic negative self-talk detection on latest user message
            if (role === 'user') {
                const text = content.toLowerCase();
                const negativePatterns = ["i'm stupid", "i am stupid", "i can't", "i cant", "i suck", "i'm dumb", "i am dumb", "i'm not good", "i'm hopeless", "i give up"];
                for (const p of negativePatterns) {
                    if (text.includes(p)) {
                        negativeSelfTalkDetected = true;
                        break;
                    }
                }
            }

            // Regenerate a short rolling summary (synchronous simple summarizer)
            try {
                const lastMessages = allRows.slice(0, 40).reverse();
                const userLines: string[] = [];
                const assistantLines: string[] = [];
                for (const m of lastMessages) {
                    if (m.role === 'user') userLines.push(m.content.trim());
                    if (m.role === 'assistant') assistantLines.push(m.content.trim());
                }

                const summaryParts: string[] = [];
                if (userLines.length > 0) summaryParts.push(`Recent asks: ${userLines.slice(-3).join(' | ')}`);
                if (assistantLines.length > 0) summaryParts.push(`Recent guidance: ${assistantLines.slice(-3).join(' | ')}`);
                const summaryText = summaryParts.join('\n');

                db.run(`UPDATE student_conversations SET summary = ? WHERE id = ?`, summaryText, conversationId);
            } catch (e) {
                // non-fatal
                console.error('Error generating inline summary:', e);
            }
        } catch (e) {
            console.error('Error computing guardrails for message append:', e);
        }

        const responsePayload: any = toMessageDto(created);
        responsePayload.guardrails = {
            wrongAttemptsCount,
            requireWarmup,
            negativeSelfTalkDetected
        };

        res.status(201).json(responsePayload);
    } catch (error) {
        console.error('Error appending student copilot message:', error);
        res.status(500).json({ error: 'Failed to append conversation message' });
    }
};

export const summarizeStudentCopilotConversation = (req: AuthRequest, res: Response) => {
    const studentId = req.user!.id;
    const conversationId = req.params.id;

    try {
        const conversation = getOwnedConversation(studentId, conversationId);
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        const rows = db.all(
            `SELECT * FROM student_conversation_messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 200`,
            conversationId
        ) as StudentConversationMessageRow[];

        // Simple summarizer: collect recent user asks and assistant guidance
        const userLines: string[] = [];
        const assistantLines: string[] = [];
        for (const m of rows) {
            if (m.role === 'user') userLines.push(m.content.trim());
            if (m.role === 'assistant') assistantLines.push(m.content.trim());
        }

        const parts: string[] = [];
        if (userLines.length > 0) parts.push(`Recent asks: ${userLines.slice(-5).join(' | ')}`);
        if (assistantLines.length > 0) parts.push(`Recent guidance: ${assistantLines.slice(-5).join(' | ')}`);

        const summaryText = parts.join('\n');

        db.run(`UPDATE student_conversations SET summary = ?, updated_at = ? WHERE id = ?`, summaryText, new Date().toISOString(), conversationId);

        res.json({ ok: true, summary: summaryText });
    } catch (error) {
        console.error('Error summarizing conversation:', error);
        res.status(500).json({ error: 'Failed to summarize conversation' });
    }
};

export const getWarmupExample = (req: AuthRequest, res: Response) => {
    const studentId = req.user!.id;
    const conversationId = req.params.id;
    const conceptId = req.query.conceptId as string | undefined;

    try {
        const conversation = getOwnedConversation(studentId, conversationId);
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        // Simple warmup examples keyed by concept
        const warmupExamples: Record<string, { title: string; question: string; hint: string }> = {
            'algebra-factorisation': {
                title: 'Warm-up: Simple Factorisation',
                question: 'Factor this simple expression: x² + 4x + 3. (Hint: find two numbers that multiply to 3 and add to 4)',
                hint: 'Think: what two numbers multiply to give 3 and add to give 4? Answer: 1 and 3. So the factors are (x+1) and (x+3).'
            },
            'quadratic-equations': {
                title: 'Warm-up: Easy Quadratic',
                question: 'Solve: x² = 9. What are the two solutions?',
                hint: 'Think about what number times itself gives 9. Remember there are two answers: positive and negative.'
            },
            'fractions': {
                title: 'Warm-up: Simple Fraction Addition',
                question: 'Add these fractions: 1/4 + 2/4. Simplify your answer.',
                hint: 'When the denominators are the same, just add the numerators: 1 + 2 = 3. So the answer is 3/4.'
            },
            'default': {
                title: 'Warm-up: Take a Breath',
                question: 'Before we try again, let\'s review the basics of this concept. What is one thing you remember about this topic?',
                hint: 'There\'s no wrong answer here. Just think about what you already know. Once you share, I\'ll give you an easy example to build from.'
            }
        };

        const example = conceptId && warmupExamples[conceptId]
            ? warmupExamples[conceptId]
            : warmupExamples['default'];

        res.json({
            ok: true,
            warmup: {
                conceptId: conceptId ?? 'default',
                ...example
            }
        });
    } catch (error) {
        console.error('Error fetching warmup example:', error);
        res.status(500).json({ error: 'Failed to fetch warmup example' });
    }
};
