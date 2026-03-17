export type UserRole = 'teacher' | 'student' | 'parent';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: string;
    lastActive: string;
    greetingSuffix?: string;
    score?: number;
    streak?: number;
    rank?: number;
    trend?: string;
    trendVal?: string;
    childrenIds?: string[];
}

export interface Classroom {
    id: string;
    name: string;
    teacherId: string;
    joinCode: string;
    studentIds: string[];
    nextTopic: string;
    scheduleTime: string;
    status: 'success' | 'warning' | 'info';
    statusMsg: string;
}

export interface Assignment {
    id: string;
    classroomId: string;
    teacherId: string;
    gamePackId: string;
    title: string;
    description?: string;
    dueDate: string;
    isPublished: boolean;
    createdAt: string;
    status?: string;
    statusLabel?: string;
    count?: string;
}

export interface Enrollment {
    id: string;
    classroomId: string;
    studentId: string;
    status: 'active' | 'archived';
    joinedAt: string;
}

export interface AssignmentAttempt {
    id: string;
    assignmentId: string;
    studentId: string;
    status: 'not_started' | 'in_progress' | 'submitted' | 'overdue';
    bestAttemptId?: string;
    updatedAt: string;
}

export interface Submission {
    id: string;
    assignmentId: string;
    studentId: string;
    submittedAt: string;
    content: string;
    grade?: number;
    status: 'pending' | 'graded' | 'late';
}

export interface Activity {
    id: string;
    userId: string;
    title: string;
    timeLabel: string;
    createdAt: string;
}

export interface QuestionResult {
    questionId: number;
    isCorrect: boolean;
    timeSpentSeconds: number;
    studentAnswer: string;
    topicTag: string;
    explanation: string;
}

export interface GameSession {
    id: string;
    studentId: string;
    packId: string;
    score: number;
    totalQuestions: number;
    accuracy: number;
    playedAt: string;
    startTime: string;
    endTime: string;
    status: 'completed' | 'abandoned';
    results: QuestionResult[];
}

export interface ParentNudge {
    id: string;
    parentId: string;
    studentId: string;
    message: string;
    read: boolean;
    createdAt: string;
}

import {
    createStudentSupportNotification,
    createSubmissionReadyNotification,
    createGeneralTeacherNotification,
    createAssignmentOverdueNotification,
    createTeacherMessageNotification,
    createWeeklyReportNotification
} from './notifications/factory';

// ── Unified Notification model ────────────────────────────────────────────────
// This is the canonical shape for the new notifications system.
// ParentNudge is kept as-is for backward compat with /api/student/nudges;
// it can be migrated into this model in a later sprint.

export type NotificationRole = 'teacher' | 'student' | 'parent';
export type NotificationEventType =
    | 'submission'
    | 'needs_attention'
    | 'general'
    | 'alert'
    | 'message';

export interface NotificationContext {
    classId?: string;
    assignmentId?: string;
    studentId?: string;
    /**
     * When set, the frontend can use this to pre-filter the assignments section
     * (e.g. 'completed', 'needs_attention').  Mirrors the statusFilter field
     * that lives on the legacy TeacherDashboardPage NotificationItem shape.
     */
    statusFilter?: string;
}

export interface Notification {
    id: string;
    userId: string;         // the recipient
    role: NotificationRole; // role of the recipient
    type: NotificationEventType;
    title: string | null;
    message: string;
    context?: NotificationContext;
    isRead: boolean;        // false by default
    createdAt: string;      // ISO-8601
}

export const users: User[] = [
    { id: "teacher_1", name: "Mr. Davis", email: "teacher@elora.com", role: "teacher", createdAt: new Date().toISOString(), lastActive: "October 12th", greetingSuffix: "Good afternoon" },
    { id: "student_1", name: "Alex Chen", email: "alex@elora.com", role: "student", createdAt: new Date().toISOString(), lastActive: "Today", score: 2450, rank: 1, streak: 5, trend: "up", trendVal: "2" },
    { id: "student_2", name: "Jordan Smith", email: "jordan@elora.com", role: "student", createdAt: new Date().toISOString(), lastActive: "Yesterday", score: 2310, rank: 2, trend: "neutral" },
    { id: "student_3", name: "Priya Patel", email: "priya@elora.com", role: "student", createdAt: new Date().toISOString(), lastActive: "Today", score: 2180, rank: 3, trend: "down", trendVal: "1" },
    { id: "parent_1", name: "Mrs. Chen", email: "parent@elora.com", role: "parent", createdAt: new Date().toISOString(), lastActive: "Today", childrenIds: ["student_1"] }
];

export const classes: Classroom[] = [
    {
        id: "1",
        name: "Sec 3 Mathematics",
        teacherId: "teacher_1",
        joinCode: "X7B9-Q",
        studentIds: ["student_1", "student_2", "student_3", ...Array(29).fill("dummy_id")],
        nextTopic: "Algebra II Review",
        scheduleTime: "10:00 AM",
        status: "success",
        statusMsg: "Class is on track"
    },
    {
        id: "2",
        name: "Sec 4 Physics",
        teacherId: "teacher_1",
        joinCode: "PHYS-4",
        studentIds: ["student_1", "student_2", ...Array(26).fill("dummy_id")],
        nextTopic: "Kinematics Lab",
        scheduleTime: "1:00 PM",
        status: "warning",
        statusMsg: "Attendance dropping"
    },
    {
        id: "3",
        name: "Sec 1 Science",
        teacherId: "teacher_1",
        joinCode: "SCI-11",
        studentIds: Array(40).fill("dummy_id"),
        nextTopic: "Cells & Organisms",
        scheduleTime: "Tomorrow",
        status: "success",
        statusMsg: "Class is on track"
    },
    {
        id: "4",
        name: "Sec 2 Mathematics",
        teacherId: "teacher_1",
        joinCode: "MATH-2",
        studentIds: Array(42).fill("dummy_id"),
        nextTopic: "Geometry Basics",
        scheduleTime: "Wed",
        status: "success",
        statusMsg: "Scores trending up"
    },
];

export const assignments: Assignment[] = [
    {
        id: "101",
        classroomId: "1",
        teacherId: "teacher_1",
        gamePackId: "algebra-basics",
        title: "Algebra Quiz 1",
        dueDate: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 days overdue
        isPublished: true,
        createdAt: new Date().toISOString(),
        statusLabel: "OVERDUE",
        status: "warning",
        count: "23 students assigned"
    },
    {
        id: "102",
        classroomId: "2",
        teacherId: "teacher_1",
        gamePackId: "demo-game-2",
        title: "Kinematics Worksheet",
        dueDate: new Date().toISOString(),
        isPublished: false,
        createdAt: new Date().toISOString(),
        statusLabel: "DRAFT",
        status: "info",
        count: "Draft - Not published yet"
    }
];

export const submissions: Submission[] = [];

export const activities: Activity[] = [
    { id: "1", userId: "teacher_1", title: "5 students submitted Algebra Quiz 1", timeLabel: "10m ago", createdAt: new Date().toISOString() },
    { id: "2", userId: "teacher_1", title: "Sarah Lee joined Sec 3 Mathematics", timeLabel: "1h ago", createdAt: new Date().toISOString() },
];

export const stats = [
    { label: "Total Classes", value: "5", trend: "Same as last semester", status: "info" },
    { label: "Active Students", value: "142", trend: "+12 this week", status: "success" },
    { label: "Assignments Due", value: "3", trend: "2 need review", status: "warning" },
    { label: "Avg. Class Score", value: "84%", trend: "Highest this semester! 🌟", status: "success" },
];

export const gameSessions: GameSession[] = [
    {
        // Alex Chen – older session, mostly correct
        id: "gs_1",
        studentId: "student_1",
        packId: "algebra-basics",
        score: 4,
        totalQuestions: 5,
        accuracy: 0.8,
        playedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        startTime: new Date(Date.now() - 86400000 * 4 - 300000).toISOString(),
        endTime: new Date(Date.now() - 86400000 * 4).toISOString(),
        status: 'completed',
        results: [
            { questionId: 0, isCorrect: true, timeSpentSeconds: 45, studentAnswer: "correct", topicTag: "Algebra – Factorisation", explanation: "" },
            { questionId: 1, isCorrect: false, timeSpentSeconds: 60, studentAnswer: "wrong", topicTag: "Algebra – Factorisation", explanation: "" },
            { questionId: 2, isCorrect: true, timeSpentSeconds: 30, studentAnswer: "correct", topicTag: "Quadratic Equations", explanation: "" },
            { questionId: 3, isCorrect: true, timeSpentSeconds: 35, studentAnswer: "correct", topicTag: "Linear Inequalities", explanation: "" },
            { questionId: 4, isCorrect: true, timeSpentSeconds: 40, studentAnswer: "correct", topicTag: "Quadratic Equations", explanation: "" }
        ]
    },
    {
        // Alex Chen – recent session, struggling with Algebra – Factorisation (low score 40%)
        id: "gs_1b",
        studentId: "student_1",
        packId: "algebra-basics",
        score: 2,
        totalQuestions: 5,
        accuracy: 0.4,
        playedAt: new Date(Date.now() - 86400000).toISOString(),
        startTime: new Date(Date.now() - 86400000 - 300000).toISOString(),
        endTime: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed',
        results: [
            { questionId: 0, isCorrect: false, timeSpentSeconds: 70, studentAnswer: "wrong", topicTag: "Algebra – Factorisation", explanation: "" },
            { questionId: 1, isCorrect: false, timeSpentSeconds: 65, studentAnswer: "wrong", topicTag: "Algebra – Factorisation", explanation: "" },
            { questionId: 2, isCorrect: true, timeSpentSeconds: 40, studentAnswer: "correct", topicTag: "Quadratic Equations", explanation: "" },
            { questionId: 3, isCorrect: false, timeSpentSeconds: 80, studentAnswer: "wrong", topicTag: "Algebra – Factorisation", explanation: "" },
            { questionId: 4, isCorrect: true, timeSpentSeconds: 35, studentAnswer: "correct", topicTag: "Linear Inequalities", explanation: "" }
        ]
    },
    {
        id: "gs_2",
        studentId: "student_2",
        packId: "algebra-basics",
        score: 1,
        totalQuestions: 5,
        accuracy: 0.2,
        playedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        startTime: new Date(Date.now() - 2 * 86400000 - 300000).toISOString(),
        endTime: new Date(Date.now() - 2 * 86400000).toISOString(),
        status: 'completed',
        results: [
            { questionId: 0, isCorrect: false, timeSpentSeconds: 60, studentAnswer: "wrong", topicTag: "Algebra – Factorisation", explanation: "" },
            { questionId: 1, isCorrect: false, timeSpentSeconds: 55, studentAnswer: "wrong", topicTag: "Algebra – Factorisation", explanation: "" },
            { questionId: 2, isCorrect: false, timeSpentSeconds: 70, studentAnswer: "wrong", topicTag: "Quadratic Equations", explanation: "" },
            { questionId: 3, isCorrect: false, timeSpentSeconds: 80, studentAnswer: "wrong", topicTag: "Quadratic Equations", explanation: "" },
            { questionId: 4, isCorrect: true, timeSpentSeconds: 30, studentAnswer: "right", topicTag: "Linear Inequalities", explanation: "" }
        ]
    },
    {
        id: "gs_3",
        studentId: "student_3",
        packId: "algebra-basics",
        score: 1,
        totalQuestions: 5,
        accuracy: 0.2,
        playedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        startTime: new Date(Date.now() - 3 * 86400000 - 300000).toISOString(),
        endTime: new Date(Date.now() - 3 * 86400000).toISOString(),
        status: 'completed',
        results: [
            { questionId: 0, isCorrect: false, timeSpentSeconds: 50, studentAnswer: "wrong", topicTag: "Algebra – Factorisation", explanation: "" },
            { questionId: 1, isCorrect: false, timeSpentSeconds: 65, studentAnswer: "wrong", topicTag: "Algebra – Factorisation", explanation: "" },
            { questionId: 2, isCorrect: false, timeSpentSeconds: 90, studentAnswer: "wrong", topicTag: "Quadratic Equations", explanation: "" },
            { questionId: 3, isCorrect: true, timeSpentSeconds: 40, studentAnswer: "right", topicTag: "Linear Inequalities", explanation: "" },
            { questionId: 4, isCorrect: false, timeSpentSeconds: 75, studentAnswer: "wrong", topicTag: "Quadratic Equations", explanation: "" }
        ]
    }
];

export const enrollments: Enrollment[] = [
    { id: "e1", classroomId: "1", studentId: "student_1", status: 'active', joinedAt: new Date().toISOString() },
    { id: "e2", classroomId: "1", studentId: "student_2", status: 'active', joinedAt: new Date().toISOString() },
    { id: "e3", classroomId: "1", studentId: "student_3", status: 'active', joinedAt: new Date().toISOString() },
    { id: "e4", classroomId: "2", studentId: "student_1", status: 'active', joinedAt: new Date().toISOString() },
    { id: "e5", classroomId: "2", studentId: "student_2", status: 'active', joinedAt: new Date().toISOString() },
];

export const assignmentAttempts: AssignmentAttempt[] = [
    {
        // Alex Chen – older submitted attempt (parent sees 'recently completed' with low score)
        id: "aa_1", assignmentId: "101", studentId: "student_1", status: 'submitted', bestAttemptId: "gs_1b", updatedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
        // Alex Chen – upcoming (not yet started) assignment for assignment 102
        id: "aa_1c", assignmentId: "102", studentId: "student_1", status: 'not_started', bestAttemptId: undefined, updatedAt: new Date().toISOString()
    },
    {
        id: "aa_2", assignmentId: "101", studentId: "student_2", status: 'submitted', bestAttemptId: "gs_2", updatedAt: new Date().toISOString()
    },
    {
        id: "aa_3", assignmentId: "101", studentId: "student_3", status: 'submitted', bestAttemptId: "gs_3", updatedAt: new Date().toISOString()
    }
];

export const parentNudges: ParentNudge[] = [];

// ── In-memory notifications store ────────────────────────────────────────────
// Seeded once when the module loads. In a real app this would be a DB table.
export const notifications: Notification[] = [];

/**
 * Seeds a small set of initial teacher notifications that mirror the legacy
 * hardcoded mockNotifications in TeacherDashboardPage.tsx.  Called once on
 * startup (dev mode only) when the collection is empty.
 */
export function seedTeacherNotifications(teacherId: string): void {
    if (notifications.some(n => n.userId === teacherId && n.role === 'teacher')) {
        return; // already seeded
    }

    const now = Date.now();
    const seed: Notification[] = [
        createStudentSupportNotification({
            userId: teacherId,
            studentName: 'Aisyah',
            assignmentTitle: 'Algebra Quiz 1',
            classId: '1',
            studentId: 'student_1',
            createdAt: new Date(now - 5 * 60_000).toISOString()
        }),
        createSubmissionReadyNotification({
            userId: teacherId,
            studentName: 'Bobby',
            assignmentTitle: 'Physics Lab Report',
            classId: '2',
            createdAt: new Date(now - 60 * 60_000).toISOString()
        }),
        createGeneralTeacherNotification({
            userId: teacherId,
            count: 3,
            createdAt: new Date(now - 2 * 60 * 60_000).toISOString()
        })
    ];

    notifications.push(...seed);
}

/**
 * Seeds a small set of initial parent notifications that mirror the legacy
 * hardcoded parentNotifications in ParentDashboardPage.tsx.
 */
export function seedParentNotifications(parentId: string): void {
    if (notifications.some(n => n.userId === parentId && n.role === 'parent')) {
        return; // already seeded
    }

    const now = Date.now();
    const seed: Notification[] = [
        createAssignmentOverdueNotification({
            userId: parentId,
            studentName: 'Aqil',
            assignmentTitle: 'Surds & Indices Practice',
            subject: 'A-Maths',
            studentId: 'student_1',
            createdAt: new Date(now - 24 * 60 * 60_000).toISOString()
        }),
        createTeacherMessageNotification({
            userId: parentId,
            teacherName: 'Mr Tan Wei',
            subject: 'E-Maths',
            studentName: 'Aqil',
            studentId: 'student_1',
            createdAt: new Date(now - 2 * 60 * 60_000).toISOString()
        }),
        createWeeklyReportNotification({
            userId: parentId,
            studentName: 'Nadia',
            studentId: 'student_2',
            isRead: true,
            createdAt: new Date(now - 2 * 24 * 60 * 60_000).toISOString()
        })
    ];

    notifications.push(...seed);
}

export const db = {
    users,
    classes,
    assignments,
    submissions,
    activities,
    stats,
    gameSessions,
    enrollments,
    assignmentAttempts,
    parentNudges,
    notifications,
};
