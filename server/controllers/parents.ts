import { Response } from 'express';
import { db } from '../db.js';
import { sqliteDb, DEMO_USER_IDS } from '../database.js';
import { AuthRequest } from '../middleware/auth.js';

export const getChildren = (req: AuthRequest, res: Response) => {
    const parent = req.user!;

    if (DEMO_USER_IDS.has(parent.id)) {
        const childIds = parent.childrenIds && parent.childrenIds.length > 0
            ? parent.childrenIds
            : ['student_1'];

        const children = childIds
            .map((childId) => db.users.find((user) => user.id === childId))
            .filter(Boolean)
            .map((child) => {
                const childClasses = db.classes
                    .filter((classroom) => classroom.studentIds.includes(child!.id))
                    .map((classroom) => ({
                        id: classroom.id,
                        name: classroom.name,
                        subject: classroom.subject,
                    }));

                return {
                    id: child!.id,
                    name: child!.name,
                    grade: (child as any).level ?? null,
                    classes: childClasses,
                };
            });

        res.json(children);
        return;
    }

    // Real path
    const childrenRows = sqliteDb.prepare(`
        SELECT u.id, u.name, u.email
        FROM parent_children pc
        JOIN users u ON u.id = pc.child_id
        WHERE pc.parent_id = ?
    `).all(parent.id) as Array<{ id: string; name: string; email: string }>;

    const response = childrenRows.map((child) => {
        const classes = sqliteDb.prepare(`
            SELECT c.id, c.name, c.subject
            FROM enrollments e
            JOIN classes c ON c.id = e.class_id
            WHERE e.student_id = ? AND e.status = 'active'
        `).all(child.id) as Array<{ id: string; name: string; subject: string }>;

        return {
            id: child.id,
            name: child.name,
            email: child.email,
            classes,
        };
    });

    res.json(response);
};

export const getChildSummary = async (req: AuthRequest, res: Response) => {
  const parent = req.user!;
  const childId = req.params.id;

  // Demo path: existing logic unchanged
  if (DEMO_USER_IDS.has(parent.id)) {
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

    // 5. Subject scores
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

    return res.json({
        child: { id: child.id, name: child.name, score: (child as any).score || 0, streak: (child as any).streak || 0 },
        stats,
        upcoming,
        recentActivity,
        weakTopics,
        subjectScores,
    });
  }

  // Real path
  // Verify parent-child link
  const link = sqliteDb.prepare(
    `SELECT 1 FROM parent_children WHERE parent_id = ? AND child_id = ?`
  ).get(parent.id, childId);

  if (!link) {
    return res.status(403).json({ error: 'Not authorized to view this child' });
  }

  const child = sqliteDb.prepare(
    `SELECT id, name FROM users WHERE id = ?`
  ).get(childId) as any;

  if (!child) {
    return res.status(404).json({ error: 'Child not found' });
  }

  const now = new Date();

  // Upcoming: published assignments with not_started or in_progress attempt
  const upcomingRaw = sqliteDb.prepare(`
    SELECT 
      aa.id, a.title, c.name as subject,
      a.due_date, aa.status
    FROM assignment_attempts aa
    JOIN assignments a ON a.id = aa.assignment_id
    JOIN classes c ON c.id = a.class_id
    WHERE aa.student_id = ? 
      AND aa.status != 'submitted'
      AND a.status = 'published'
    ORDER BY a.due_date ASC
    LIMIT 10
  `).all(childId) as any[];

  // Recent activity: submitted attempts
  const recentActivityRaw = sqliteDb.prepare(`
    SELECT 
      aa.id, a.title, c.name as subject,
      aa.score, aa.submitted_at, aa.status
    FROM assignment_attempts aa
    JOIN assignments a ON a.id = aa.assignment_id
    JOIN classes c ON c.id = a.class_id
    WHERE aa.student_id = ? AND aa.status = 'submitted'
    ORDER BY aa.submitted_at DESC
    LIMIT 10
  `).all(childId) as any[];

  // Weak Topics
  const childSessions = sqliteDb.prepare(`
      SELECT results FROM game_sessions WHERE student_id = ? ORDER BY played_at DESC LIMIT 20
  `).all(childId) as any[];

  const topicStats: Record<string, { correct: number, total: number }> = {};
  childSessions.forEach(gs => {
      try {
          const results = JSON.parse(gs.results || '[]');
          results.forEach((r: any) => {
              if (r.topicTag) {
                  if (!topicStats[r.topicTag]) topicStats[r.topicTag] = { correct: 0, total: 0 };
                  topicStats[r.topicTag].total++;
                  if (r.isCorrect) topicStats[r.topicTag].correct++;
              }
          });
      } catch (e) {
          console.error('Error parsing child session results:', e);
      }
  });

  const weakTopics = Object.entries(topicStats)
      .map(([topic, stats]) => ({ topic, score: (stats.correct / stats.total) * 100 }))
      .filter(t => t.score < 70)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map(entry => entry.topic);

  // Subject Scores
  const subjectScoresRaw = sqliteDb.prepare(`
      SELECT c.name, AVG(gs.score) as score
      FROM game_sessions gs
      JOIN classes c ON c.id = gs.class_id
      WHERE gs.student_id = ?
      GROUP BY c.name
  `).all(childId) as any[];

  const summaryStats = [
    { 
      label: 'Assignments due soon', 
      value: upcomingRaw.length.toString(), 
      iconName: 'FileText', 
      trend: 'neutral' 
    },
    { 
      label: 'Recently completed', 
      value: recentActivityRaw.length.toString(), 
      iconName: 'Gamepad2', 
      trend: 'up' 
    },
    { 
      label: 'Average recent score', 
      value: recentActivityRaw.length > 0
        ? Math.round(
            recentActivityRaw.reduce((s: number, r: any) => s + (r.score || 0), 0) 
            / recentActivityRaw.filter((r: any) => r.score !== null).length
          ) + '%'
        : 'N/A',
      iconName: 'TrendingUp', 
      trend: 'neutral' 
    },
  ];

  res.json({
    child: { id: child.id, name: child.name, score: 0, streak: 0 },
    stats: summaryStats,
    upcoming: upcomingRaw.map(r => ({
      id: r.id,
      title: r.title,
      subject: r.subject,
      dueDate: new Date(r.due_date) < now ? 'Overdue' : `Due ${r.due_date}`,
      status: new Date(r.due_date) < now ? 'Overdue' : 'On track',
    })),
    recentActivity: recentActivityRaw.map(r => ({
      id: r.id,
      title: r.title,
      subject: r.subject,
      tag: 'Assignment',
      type: 'Assignment',
      score: r.score !== null ? r.score + '%' : undefined,
      date: r.submitted_at 
        ? new Date(r.submitted_at).toLocaleDateString('en-GB', 
            { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Unknown',
      status: 'Completed',
    })),
    weakTopics,
    subjectScores: subjectScoresRaw.map(s => ({
      name: s.name,
      score: Math.round(s.score)
    })),
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
