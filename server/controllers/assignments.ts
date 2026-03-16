import { Request, Response } from 'express';
import { db, Submission, Assignment, AssignmentAttempt } from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

export const getAssignments = (req: AuthRequest, res: Response) => {
    const teacherId = req.user!.id;
    const myAssignments = db.assignments.filter(a => a.teacherId === teacherId);

    // Send back with className derived from the classroomId
    const result = myAssignments.map(a => {
        const cls = db.classes.find(c => c.id === a.classroomId);
        return {
            ...a,
            className: cls ? cls.name : 'Unknown Class'
        };
    });

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

export const createAssignment = (req: AuthRequest, res: Response) => {
    const teacherId = req.user!.id;
    const { classroomId, gamePackId, title, dueDate, description } = req.body;

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

    res.status(201).json(newAssignment);
};

export const getStudentAssignments = (req: AuthRequest, res: Response) => {
    const studentId = req.user!.id;

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

    res.json({
        assignments: uiAssignments,
        recentPerformance: {
            scores: recentScores,
            weakTopics
        }
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
    const attemptId = req.params.attemptId;
    const { gameSessionId, score } = req.body;

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

    res.json({ success: true, attemptId, status: 'submitted', score });
};

