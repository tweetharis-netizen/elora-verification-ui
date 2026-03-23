import { Response } from 'express';
import { db } from '../db.js';
import { AuthRequest } from '../middleware/auth.js';
import { DEMO_USER_IDS, sqliteDb } from '../database.js';

export const getStudentAssignments = (req: AuthRequest, res: Response) => {
    const studentId = req.user!.id;

    // Find all classes the student is part of
    const myClasses = db.classes.filter(c => c.studentIds.includes(studentId));
    const classIds = myClasses.map(c => c.id);

    // Find assignments for those classes
    const myAssignments = db.assignments.filter(a => classIds.includes(a.classroomId));

    // Map to add className and submission status
    const uiAssignments = myAssignments.map(a => {
        const cls = db.classes.find(c => c.id === a.classroomId);
        const submission = db.submissions.find(s => s.assignmentId === a.id && s.studentId === studentId);

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
    const sessions = db.gameSessions
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

    db.gameSessions.push(newSession);

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

    db.gameSessions
        .filter(gs => gs.studentId === studentId && gs.status === 'completed')
        .forEach(gs => activeDates.push(new Date(gs.playedAt)));

    db.assignmentAttempts
        .filter(aa => aa.studentId === studentId && aa.status === 'submitted')
        .forEach(aa => activeDates.push(new Date(aa.updatedAt)));

    // Build a set of week keys that have activity, plus accuracy totals per week
    type WeekStats = { accuracyTotal: number; count: number; hasActivity: boolean };
    const weekMap: Record<string, WeekStats> = {};

    // Index game session accuracies by week key
    db.gameSessions
        .filter(gs => gs.studentId === studentId && gs.status === 'completed')
        .forEach(gs => {
            const key = getMondayKey(new Date(gs.playedAt));
            if (!weekMap[key]) weekMap[key] = { accuracyTotal: 0, count: 0, hasActivity: false };
            weekMap[key].accuracyTotal += gs.accuracy * 100;
            weekMap[key].count += 1;
            weekMap[key].hasActivity = true;
        });

    // Mark weeks from submitted attempts (they count for streak but may not have a score)
    db.assignmentAttempts
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
    
    const pNudges = db.parentNudges.filter(n => n.studentId === studentId).map(n => {
        const parent = db.users.find(u => u.id === n.parentId);
        return {
            ...n,
            senderName: parent ? parent.name : 'Parent'
        };
    });
    
    const tNudges = db.teacherNudges.filter(n => n.studentId === studentId).map(n => {
        const teacher = db.users.find(u => u.id === n.teacherId);
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

    const nudge = (db.parentNudges as any[]).concat(db.teacherNudges as any[])
        .find(n => n.id === nudgeId && n.studentId === studentId);

    if (!nudge) {
        return res.status(404).json({ error: 'Nudge not found' });
    }

    nudge.read = true;
    res.json(nudge);
};
