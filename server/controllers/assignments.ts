import { Request, Response } from 'express';
import { db, Submission, Assignment, AssignmentAttempt } from '../db.js';
import { AuthRequest } from '../middleware/auth.js';
import { DEMO_USER_IDS, sqliteDb } from '../database.js';

export const getAssignments = (req: AuthRequest, res: Response) => {
  const teacherId = req.user!.id;

  if (DEMO_USER_IDS.has(teacherId)) {
    // existing in-memory logic unchanged
    const myAssignments = db.assignments.filter(a => a.teacherId === teacherId);
    const result = myAssignments.map(a => {
      const cls = db.classes.find(c => c.id === a.classroomId);
      return { ...a, className: cls ? cls.name : 'Unknown Class' };
    });
    return res.json(result);
  }

  // Real path
  const rows = sqliteDb.prepare(`
    SELECT a.*, c.name as class_name,
      (SELECT COUNT(*) FROM assignment_attempts aa 
       WHERE aa.assignment_id = a.id) as total_students,
      (SELECT COUNT(*) FROM assignment_attempts aa 
       WHERE aa.assignment_id = a.id AND aa.status = 'submitted') as submitted_count
    FROM assignments a
    JOIN classes c ON c.id = a.class_id
    WHERE a.teacher_id = ?
    ORDER BY a.created_at DESC
  `).all(teacherId) as any[];

  const result = rows.map(r => ({
    id: r.id,
    classroomId: r.class_id,
    teacherId: r.teacher_id,
    gamePackId: r.game_pack_id,
    title: r.title,
    description: r.description,
    dueDate: r.due_date,
    isPublished: r.status === 'published',
    createdAt: r.created_at,
    className: r.class_name,
    status: r.status === 'draft' ? 'info' : 
            new Date(r.due_date) < new Date() ? 'warning' : 'info',
    statusLabel: r.status === 'draft' ? 'DRAFT' : 
                 new Date(r.due_date) < new Date() ? 'OVERDUE' : 'DUE SOON',
    count: `${r.submitted_count} / ${r.total_students} submitted`,
  }));

  res.json(result);
};

export const submitAssignment = (req: AuthRequest, res: Response) => {
    const studentId = req.user!.id;
    const assignmentId = req.params.id;
    const { content } = req.body;

    if (!content) {
        res.status(400).json({ error: 'Content is required' });
        return;
    }

    const assignment = db.assignments.find(a => a.id === assignmentId);
    if (!assignment) {
        res.status(404).json({ error: 'Assignment not found' });
        return;
    }

    const newSubmission: Submission = {
        id: `sub_${Date.now()}`,
        assignmentId,
        studentId,
        content,
        submittedAt: new Date().toISOString(),
        status: 'pending'
    };

    db.submissions.push(newSubmission);

    res.status(201).json(newSubmission);
};

export const createAssignment = async (req: AuthRequest, res: Response) => {
  const teacherId = req.user!.id;
  const { classroomId, gamePackId, title, description, dueDate, publish } = req.body;

  if (!title || !classroomId || !dueDate) {
    return res.status(400).json({ error: 'title, classroomId, and dueDate are required' });
  }

  // Demo path: use existing in-memory logic unchanged
  if (DEMO_USER_IDS.has(teacherId)) {
    const newAssignment: Assignment = {
        id: `assign_${Date.now()}`,
        classroomId,
        teacherId,
        gamePackId,
        title,
        description,
        dueDate,
        isPublished: true,
        createdAt: new Date().toISOString(),
        status: 'warning',
        statusLabel: 'DUE SOON'
    };

    db.assignments.push(newAssignment);

    const enrolledStudents = db.enrollments.filter(e => e.classroomId === classroomId && e.status === 'active');
    const classroom = db.classes.find(c => c.id === classroomId);
    const studentIds = new Set<string>();

    enrolledStudents.forEach(e => studentIds.add(e.studentId));
    if (classroom && classroom.studentIds) {
        classroom.studentIds.forEach(id => studentIds.add(id));
    }

    studentIds.forEach(studentId => {
        if (studentId !== 'dummy_id') {
            const attempt: AssignmentAttempt = {
                id: `aa_${Date.now()}_${studentId}`,
                assignmentId: newAssignment.id,
                studentId,
                status: 'not_started',
                updatedAt: new Date().toISOString()
            };
            db.assignmentAttempts.push(attempt);
        }
    });

    newAssignment.count = `${studentIds.size} students assigned`;

    return res.status(201).json(newAssignment);
  }

  // Real path:
  const id = `assign_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
  const status = publish ? 'published' : 'draft';

  sqliteDb.prepare(`
    INSERT INTO assignments 
      (id, class_id, teacher_id, title, description, game_pack_id, due_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, classroomId, teacherId, title, description || null, 
         gamePackId || null, dueDate, status);

  // If publishing, auto-create attempts for all enrolled students
  if (status === 'published') {
    const enrolled = sqliteDb.prepare(
      `SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active'`
    ).all(classroomId) as { student_id: string }[];

    const insertAttempt = sqliteDb.prepare(`
      INSERT OR IGNORE INTO assignment_attempts 
        (id, assignment_id, student_id, status, updated_at)
      VALUES (?, ?, ?, 'not_started', datetime('now'))
    `);

    const insertMany = sqliteDb.transaction((students: { student_id: string }[]) => {
      for (const s of students) {
        insertAttempt.run(
          `att_${Date.now()}_${s.student_id.slice(0,6)}`,
          id,
          s.student_id
        );
      }
    });
    insertMany(enrolled);
  }

  const assignment = sqliteDb.prepare(
    `SELECT * FROM assignments WHERE id = ?`
  ).get(id) as any;

  // Count enrolled students for response
  const studentCount = sqliteDb.prepare(
    `SELECT COUNT(*) as count FROM enrollments WHERE class_id = ? AND status = 'active'`
  ).get(classroomId) as { count: number };

  res.status(201).json({
    id: assignment.id,
    classroomId: assignment.class_id,
    teacherId: assignment.teacher_id,
    title: assignment.title,
    description: assignment.description,
    gamePackId: assignment.game_pack_id,
    dueDate: assignment.due_date,
    isPublished: assignment.status === 'published',
    status: assignment.status === 'published' ? 'warning' : 'info',
    statusLabel: assignment.status === 'published' ? 'DUE SOON' : 'DRAFT',
    count: `${studentCount.count} students assigned`,
    createdAt: assignment.created_at,
  });
};

export const publishAssignment = async (req: AuthRequest, res: Response) => {
  const teacherId = req.user!.id;
  const { id } = req.params;

  if (DEMO_USER_IDS.has(teacherId)) {
    return res.status(403).json({ error: 'Cannot publish demo assignments' });
  }

  const assignment = sqliteDb.prepare(
    `SELECT * FROM assignments WHERE id = ? AND teacher_id = ?`
  ).get(id, teacherId) as any;

  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  if (assignment.status === 'published') {
    return res.json({ message: 'Already published' });
  }

  sqliteDb.prepare(
    `UPDATE assignments SET status = 'published' WHERE id = ?`
  ).run(id);

  // Auto-create attempts for enrolled students not yet having one
  const enrolled = sqliteDb.prepare(
    `SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active'`
  ).all(assignment.class_id) as { student_id: string }[];

  const insertAttempt = sqliteDb.prepare(`
    INSERT OR IGNORE INTO assignment_attempts
      (id, assignment_id, student_id, status, updated_at)
    VALUES (?, ?, ?, 'not_started', datetime('now'))
  `);

  const insertMany = sqliteDb.transaction((students: { student_id: string }[]) => {
    for (const s of students) {
      insertAttempt.run(
        `att_${Date.now()}_${s.student_id.slice(0,6)}_pub`,
        id,
        s.student_id
      );
    }
  });
  insertMany(enrolled);

  res.json({ id, status: 'published' });
};

export const getStudentAssignments = (req: AuthRequest, res: Response) => {
  const studentId = req.user!.id;

  if (DEMO_USER_IDS.has(studentId)) {
    const attempts = db.assignmentAttempts.filter(aa => aa.studentId === studentId);

    const uiAssignments = attempts.map(attempt => {
        const assignment = db.assignments.find(a => a.id === attempt.assignmentId);
        const classroom = db.classes.find(c => c?.id === assignment?.classroomId);

        let bestScore = null;
        let maxScore = null;
        if (attempt.bestAttemptId) {
            const gameSession = db.gameSessions.find(gs => gs.id === attempt.bestAttemptId);
            if (gameSession) {
                bestScore = Math.round(gameSession.accuracy * 100);
                maxScore = 100;
            }
        }

        return {
            id: attempt.id,
            attemptId: attempt.id,
            assignmentId: assignment?.id,
            classroomId: assignment?.classroomId,
            className: classroom?.name || 'Unknown Class',
            gamePackId: assignment?.gamePackId,
            title: assignment?.title || 'Unknown Assignment',
            dueDate: assignment?.dueDate,
            status: attempt.status,
            bestScore,
            maxScore
        };
    }).filter(a => a.assignmentId);

    // Compute recent performance and weak topics
    const studentSessions = db.gameSessions
        .filter(gs => gs.studentId === studentId && gs.status === 'completed')
        .sort((a, b) => new Date(b.endTime || 0).getTime() - new Date(a.endTime || 0).getTime());

    const recentScores = studentSessions.slice(0, 5).map(gs => ({
        score: Math.round(gs.accuracy * 100),
        date: gs.endTime || new Date().toISOString()
    }));

    const weakTopicCounts: Record<string, number> = {};
    studentSessions.slice(0, 10).forEach(gs => {
        if (gs.results) {
            gs.results.forEach(res => {
                if (!res.isCorrect && res.topicTag) {
                    weakTopicCounts[res.topicTag] = (weakTopicCounts[res.topicTag] || 0) + 1;
                }
            });
        }
    });

    const weakTopics = Object.entries(weakTopicCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);

    return res.json({
        assignments: uiAssignments,
        recentPerformance: {
            scores: recentScores,
            weakTopics
        }
    });
  }

  // Real path
  const attempts = sqliteDb.prepare(`
    SELECT 
      aa.id as attempt_id,
      aa.status as attempt_status,
      aa.score,
      aa.submitted_at,
      aa.best_session_id,
      a.id as assignment_id,
      a.class_id,
      a.title,
      a.due_date,
      a.game_pack_id,
      c.name as class_name
    FROM assignment_attempts aa
    JOIN assignments a ON a.id = aa.assignment_id
    JOIN classes c ON c.id = a.class_id
    WHERE aa.student_id = ? AND a.status = 'published'
    ORDER BY a.due_date ASC
  `).all(studentId) as any[];

  const now = new Date();

  const assignments = attempts.map(r => {
    const due = new Date(r.due_date);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / 86400000);
    let status = 'info';
    let statusLabel = 'DUE SOON';

    if (r.attempt_status === 'submitted') {
      status = 'success';
      statusLabel = 'SUBMITTED';
    } else if (due < now) {
      status = 'danger';
      statusLabel = 'OVERDUE';
    } else if (diffDays <= 3) {
      status = 'warning';
      statusLabel = 'DUE SOON';
    }

    return {
      id: r.attempt_id,
      attemptId: r.attempt_id,
      assignmentId: r.assignment_id,
      classroomId: r.class_id,
      className: r.class_name,
      gamePackId: r.game_pack_id,
      title: r.title,
      dueDate: r.due_date,
      status,
      statusLabel,
      bestScore: r.score,
      maxScore: r.score !== null ? 100 : null,
    };
  });

  // ── RECENT PERFORMANCE (Real path) ──
  const studentSessions = sqliteDb.prepare(`
    SELECT score, played_at, results
    FROM game_sessions
    WHERE student_id = ?
    ORDER BY played_at DESC
    LIMIT 10
  `).all(studentId) as any[];

  const recentScores = studentSessions.slice(0, 5).map(gs => ({
    score: gs.score,
    date: gs.played_at
  }));

  const topicStats: Record<string, { correct: number, total: number }> = {};
  studentSessions.forEach(gs => {
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
      console.error('Error parsing session results:', e);
    }
  });

  const weakTopics = Object.entries(topicStats)
    .map(([topic, stats]) => ({ topic, score: (stats.correct / stats.total) * 100 }))
    .filter(t => t.score < 70)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(t => t.topic);

  res.json({
    assignments,
    recentPerformance: {
      scores: recentScores,
      weakTopics,
    },
  });
};

export const getAssignmentResults = (req: AuthRequest, res: Response) => {
    const teacherId = req.user!.id;
    const assignmentId = req.params.id;

    const assignment = db.assignments.find(a => a.id === assignmentId && a.teacherId === teacherId);
    if (!assignment) {
        res.status(404).json({ message: 'Assignment not found' });
        return;
    }

    const classroom = db.classes.find(c => c.id === assignment.classroomId);
    const attempts = db.assignmentAttempts.filter(aa => aa.assignmentId === assignmentId);
    const weakTopicCounts: Record<string, number> = {};

    const studentResults = attempts.map(attempt => {
        const student = db.users.find(u => u.id === attempt.studentId);

        let score = null;
        if (attempt.bestAttemptId) {
            const gameSession = db.gameSessions.find(gs => gs.id === attempt.bestAttemptId);
            if (gameSession) {
                score = Math.round(gameSession.accuracy * 100);
                if (gameSession.results) {
                    gameSession.results.forEach(r => {
                        if (!r.isCorrect && r.topicTag) {
                            weakTopicCounts[r.topicTag] = (weakTopicCounts[r.topicTag] || 0) + 1;
                        }
                    });
                }
            }
        }

        return {
            studentId: attempt.studentId,
            studentName: student?.name || 'Unknown Student',
            status: attempt.status,
            updatedAt: attempt.updatedAt,
            score
        };
    });

    const weakTopics = Object.entries(weakTopicCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);

    res.json({
        assignment: {
            id: assignment.id,
            title: assignment.title,
            className: classroom?.name || 'Unknown Class',
            dueDate: assignment.dueDate
        },
        students: studentResults,
        weakTopics
    });
};

export const submitAssignmentAttempt = (req: AuthRequest, res: Response) => {
  const studentId = req.user!.id;
  const { attemptId } = req.params;
  const { gameSessionId, score } = req.body;

  if (DEMO_USER_IDS.has(studentId)) {
    const attempt = db.assignmentAttempts.find(aa => aa.id === attemptId && aa.studentId === studentId);
    if (!attempt) {
        res.status(404).json({ error: 'Assignment attempt not found' });
        return;
    }

    attempt.status = 'submitted';
    attempt.updatedAt = new Date().toISOString();
    if (gameSessionId) {
        attempt.bestAttemptId = gameSessionId;
    }

    return res.json({ success: true, attemptId, status: 'submitted', score });
  }

  // Real path
  const attempt = sqliteDb.prepare(
    `SELECT * FROM assignment_attempts WHERE id = ? AND student_id = ?`
  ).get(attemptId, studentId) as any;

  if (!attempt) {
    return res.status(404).json({ error: 'Attempt not found' });
  }

  sqliteDb.prepare(`
    UPDATE assignment_attempts
    SET status = 'submitted',
        best_session_id = ?,
        score = ?,
        submitted_at = datetime('now'),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(gameSessionId || null, score || null, attemptId);

  // Link game session to assignment and class for real users
  if (gameSessionId && !DEMO_USER_IDS.has(studentId)) {
    try {
        const attemptInfo = sqliteDb.prepare(`
            SELECT aa.assignment_id, a.class_id 
            FROM assignment_attempts aa
            JOIN assignments a ON a.id = aa.assignment_id
            WHERE aa.id = ?
        `).get(attemptId) as any;

        if (attemptInfo) {
            sqliteDb.prepare(`
                UPDATE game_sessions 
                SET assignment_id = ?, class_id = ?
                WHERE id = ?
            `).run(attemptInfo.assignment_id, attemptInfo.class_id, gameSessionId);
        }
    } catch (error) {
        console.error('Error updating game session linkage:', error);
    }
  }

  res.json({ success: true, attemptId, status: 'submitted', score });
};

export const getAttemptsByAssignment = (req: AuthRequest, res: Response) => {
  const teacherId = req.user!.id;
  const { id: assignmentId } = req.params;

  if (DEMO_USER_IDS.has(teacherId)) {
    const attempts = db.assignmentAttempts.filter(aa => aa.assignmentId === assignmentId);
    return res.json(attempts.map(aa => ({
      id: aa.id,
      studentId: aa.studentId,
      status: aa.status,
      bestScore: null,
      submittedAt: null,
    })));
  }

  const rows = sqliteDb.prepare(`
    SELECT 
      aa.id,
      aa.student_id as studentId,
      aa.status,
      aa.score as bestScore,
      aa.submitted_at as submittedAt
    FROM assignment_attempts aa
    WHERE aa.assignment_id = ?
  `).all(assignmentId) as any[];

  res.json(rows);
};

