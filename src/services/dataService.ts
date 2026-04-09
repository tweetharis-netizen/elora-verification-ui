// src/services/dataService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Central API client.
// • Headers are derived from the CurrentUser set by AuthContext (no hardcoding).
// • AuthContext calls setCurrentUser() on every login/logout.
// • Every fetch helper calls authHeaders() which throws if no user is logged in.
// ─────────────────────────────────────────────────────────────────────────────

import type { CurrentUser } from '../auth/AuthContext';
import * as mockData from './mockData';
import {
    demoClassroomAssignments,
    demoClassroomPractices,
    demoClassroomStreamItems,
    demoClassroomPeople,
} from '../demo/demoTeacherScenarioA';

// ── Module-level current-user slot ────────────────────────────────────────────

let _currentUser: CurrentUser | null = null;

/**
 * Called by AuthProvider whenever the user changes (login / logout / refresh).
 * Do NOT call this from elsewhere.
 */
export function setCurrentUser(user: CurrentUser | null): void {
    _currentUser = user;
}

/**
 * Returns fetch-ready headers for the current user.
 * Throws RedirectError if no user is stored (callers catch and redirect to /login).
 */
function authHeaders(): Record<string, string> {
    if (!_currentUser) {
        throw new RedirectError('/login');
    }
    return {
        'x-user-id': _currentUser.id,
        'x-user-role': _currentUser.role,
        'Content-Type': 'application/json',
    };
}

/** Sentinel error that components can catch to redirect unauthenticated users. */
export class RedirectError extends Error {
    constructor(public readonly to: string) {
        super(`Not authenticated – redirect to ${to}`);
        this.name = 'RedirectError';
    }
}

// ── Config ────────────────────────────────────────────────────────────────────

// In production (Vercel), /api/* is handled by the serverless function on the
// same domain. In local dev, Vite's proxy forwards /api/* to localhost:4000.
const API_BASE = '/api';

// ── Shared interfaces ─────────────────────────────────────────────────────────

export interface StudentAssignment {
    id: string;
    attemptId: string;
    assignmentId?: string;
    classroomId: string;
    teacherId?: string;
    title: string;
    description?: string;
    dueDate: string;
    isPublished?: boolean;
    createdAt?: string;
    status?: string;
    statusLabel?: string;
    count?: string;
    className: string;
    gamePackId?: string;
    score?: number;
    maxScore?: number;
}

export interface TeacherStat {
    label: string;
    value: string;
    trendValue?: string;
    status: string;
}

export interface TeacherClass {
    id: string;
    name: string;
    subject: string;
    studentsCount: number;
    nextTopic: string;
    time: string;
    status: string;
    statusMsg: string;
    joinCode?: string;
    activeAssignments: number;
    averageScore: number | null;
    themeColor?: string;
    bannerStyle?: string;
    playfulBackground?: boolean;
    progress?: number;
}

export interface ParentChild {
    id: string;
    name: string;
    score?: number;
    streak?: number;
    grade?: string;
}

export type ParentInsightType = 'weak_topic' | 'low_scores' | 'overdue_assignment';

export interface ParentInsight {
    id: string;
    type: ParentInsightType;
    topicTag?: string;
    detail: string;
    studentName?: string;
    assignmentTitle?: string;
    assignmentId?: string;
}

export interface ParentChildSummary {
    child: ParentChild;
    stats: { label: string; value: string; iconName: string; trend?: 'up' | 'down' | 'neutral' }[];
    upcoming: {
        id: string;
        title: string;
        subject: string;
        dueDate: string;
        status: string;
    }[];
    recentActivity: {
        id: string;
        title: string;
        subject: string;
        tag: string;
        type: string;
        score?: string;
        date: string;
        status: string;
    }[];
    weakTopics: string[];
    subjectScores: { name: string; score: number }[];
}

export interface GameQuestion {
    id: string;
    prompt: string;
    options: string[];
    correctIndex: number;
    difficulty: 'easy' | 'medium' | 'hard';
    topic: string;
    explanation?: string;
}

export interface GamePack {
    id: string;
    title: string;
    topic: string;
    level: string;
    questions: GameQuestion[];
}

export interface ParentNudge {
    id: string;
    parentId: string;
    studentId: string;
    message: string;
    read: boolean;
    createdAt: string;
    senderName?: string;
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
    startTime?: string;
    endTime?: string;
    status?: 'completed' | 'abandoned';
    results?: QuestionResult[];
}

// ── Student API ───────────────────────────────────────────────────────────────

export interface StudentClass {
    id: string;
    name: string;
    subject: string;
    teacherName: string;
    joinCode: string;
    enrolledAt: string;
    themeColor?: string;
    bannerStyle?: string;
    playfulBackground?: boolean;
}

export interface StudentDashboardData {
    assignments: StudentAssignment[];
    recentPerformance: {
        scores: { score: number; date: string }[];
        weakTopics: string[];
    };
}

export interface StudentStreak {
    streakWeeks: number;
    weeklyScores: { weekLabel: string; avgAccuracy: number }[];
    scoreThisWeek: number | null;
    scorePriorWeek: number | null;
    trend: 'up' | 'down' | 'flat';
}

export type ClassroomWorkStatus = 'upcoming' | 'due_soon' | 'overdue' | 'completed';

export interface ClassroomAssignmentMock {
    id: string;
    classId: string;
    className: string;
    title: string;
    topic: string;
    dueDate: string;
    status: ClassroomWorkStatus;
    statusLabel: string;
    submittedCount: number;
    totalCount: number;
    averageScore: number | null;
    needsAttention: boolean;
    studentStatus: ClassroomWorkStatus;
    studentScore?: number;
}

export interface ClassroomPracticeMock {
    id: string;
    classId: string;
    className: string;
    title: string;
    topic: string;
    sourceType: 'generated' | 'curated';
    questionCount: number;
    status: ClassroomWorkStatus;
    statusLabel: string;
    submittedCount: number;
    totalCount: number;
    averageScore: number | null;
    needsAttention: boolean;
    studentStatus: ClassroomWorkStatus;
    studentScore?: number;
}

export interface ClassroomStreamItemMock {
    id: string;
    classId: string;
    type: 'announcement' | 'assignment_due' | 'graded_return' | 'practice_recommendation';
    title: string;
    message: string;
    timestamp: string;
    severity: 'normal' | 'needs_attention' | 'urgent';
    linkedEntityId?: string;
}

export interface ClassroomPersonMock {
    id: string;
    classId: string;
    name: string;
    role: 'teacher' | 'student';
    participationLevel: 'low' | 'medium' | 'high';
    riskFlag: boolean;
    lastActiveAt: string;
}

export interface ClassroomMockBundle {
    streamItems: ClassroomStreamItemMock[];
    assignments: ClassroomAssignmentMock[];
    practices: ClassroomPracticeMock[];
    people: ClassroomPersonMock[];
}

export interface TeacherReviewWorkItem {
    id: string;
    type: 'assignment' | 'practice';
    title: string;
    classId: string;
    className: string;
    topic: string;
    dueDate: string;
    status: ClassroomWorkStatus;
    statusLabel: string;
    submittedCount: number;
    totalCount: number;
    averageScore: number | null;
    needsAttention: boolean;
}

export const getStudentAssignments = async (): Promise<StudentDashboardData> => {
    const response = await fetch(`${API_BASE}/assignments/student`, {
        headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch student assignments');
    return response.json();
};

export const getStudentClasses = async (): Promise<StudentClass[]> => {
    const response = await fetch(`${API_BASE}/classes/mine`, {
        headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch student classes');
    return response.json();
};

export const joinStudentClass = async (joinCode: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/classes/join`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ joinCode }),
    });
    if (!response.ok) throw new Error('Failed to join class');
    return response.json();
};

export const submitAssignmentAttempt = async (attemptId: string, payload: {
    gameSessionId?: string;
    score?: number;
}): Promise<any> => {
    const response = await fetch(`${API_BASE}/assignments/attempt/${attemptId}/submit`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to submit assignment attempt');
    return response.json();
};

export const getStudentGameSessions = async (): Promise<GameSession[]> => {
    const response = await fetch(`${API_BASE}/student/game-sessions`, {
        headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch game sessions');
    return response.json();
};

export const createStudentGameSession = async (payload: {
    packId: string;
    score: number;
    totalQuestions: number;
    accuracy: number;
    startTime?: string;
    endTime?: string;
    status?: 'completed' | 'abandoned';
    results?: QuestionResult[];
}): Promise<GameSession> => {
    const response = await fetch(`${API_BASE}/student/game-sessions`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to save game session');
    return response.json();
};

export const getStudentStreak = async (): Promise<StudentStreak> => {
    const response = await fetch(`${API_BASE}/student/me/streak`, {
        headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch student streak');
    return response.json();
};

export const getStudentNudges = async (): Promise<ParentNudge[]> => {
    const response = await fetch(`${API_BASE}/student/nudges`, {
        headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch nudges');
    return response.json();
};

export const markNudgeAsRead = async (nudgeId: string): Promise<ParentNudge> => {
    const response = await fetch(`${API_BASE}/student/nudges/${nudgeId}/read`, {
        method: 'POST',
        headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to mark nudge as read');
    return response.json();
};

// ── Teacher API ───────────────────────────────────────────────────────────────

export const getTeacherStats = async (): Promise<TeacherStat[]> => {
    const response = await fetch(`${API_BASE}/teacher/stats`, {
        headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch teacher stats');
    return response.json();
};

export const getMyClasses = async (): Promise<TeacherClass[]> => {
    const response = await fetch(`${API_BASE}/classes`, {
        headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch classes');
    return response.json();
};

export const createTeacherClass = async (
    name: string,
    subject: string,
    scheduleTime?: string
): Promise<TeacherClass> => {
    const response = await fetch(`${API_BASE}/classes`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ name, subject, scheduleTime }),
    });
    if (!response.ok) throw new Error('Failed to create class');
    return response.json();
};

export const createTeacherAssignment = async (payload: {
    classroomId: string;
    gamePackId: string;
    title: string;
    dueDate: string;
    description?: string;
}): Promise<any> => {
    const response = await fetch(`${API_BASE}/assignments`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to create assignment');
    return response.json();
};

export interface TeacherAssignmentResults {
    assignment: {
        id: string;
        title: string;
        className: string;
        dueDate: string;
    };
    students: {
        studentId: string;
        studentName: string;
        status: 'not_started' | 'in_progress' | 'submitted' | 'overdue';
        updatedAt: string;
        score: number | null;
    }[];
    weakTopics: string[];
}

export const getTeacherAssignmentResults = async (assignmentId: string): Promise<TeacherAssignmentResults> => {
    const response = await fetch(`${API_BASE}/assignments/${assignmentId}/results`, {
        headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch assignment results');
    return response.json();
};

// ── Teacher Insights ──────────────────────────────────────────────────────────

export type InsightType = 'weak_topic' | 'low_scores' | 'overdue_assignment' | 'needs_attention';

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

export const getTeacherInsights = async (): Promise<TeacherInsight[]> => {
    const response = await fetch(`${API_BASE}/teacher/insights/needs-attention`, {
        headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch teacher insights');
    const data = await response.json();
    
    // Transform new backend structure back into a single flat array for the UI
    const combined: TeacherInsight[] = [...(data.needsAttention || [])];
    
    if (data.weakTopics) {
        data.weakTopics.forEach((wt: any) => {
            combined.push({
                id: `wt-${wt.topic}`,
                type: 'weak_topic',
                topicTag: wt.topic,
                className: 'All classes',
                detail: `Average success rate of ${wt.successRate}% across ${wt.total} attempts.`
            });
        });
    }
    
    return combined;
};

// ── Notifications API ────────────────────────────────────────────────────────

export type NotificationEventType =
    | 'submission'
    | 'needs_attention'
    | 'general'
    | 'alert'
    | 'message';

export interface Notification {
    id: string;
    userId: string;
    role: 'teacher' | 'student' | 'parent';
    type: NotificationEventType;
    title: string | null;
    message: string;
    context?: {
        classId?: string;
        assignmentId?: string;
        studentId?: string;
        statusFilter?: string;
    };
    isRead: boolean;
    createdAt: string; // ISO-8601
}

export const getNotifications = async (
    userId: string,
    role: 'teacher' | 'student' | 'parent'
): Promise<Notification[]> => {
    const response = await fetch(
        `${API_BASE}/notifications?userId=${encodeURIComponent(userId)}&role=${encodeURIComponent(role)}`,
        { headers: authHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
};

export const markNotificationRead = async (notificationId: string): Promise<Notification> => {
    const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
    return response.json();
};

export const markAllNotificationsRead = async (
    userId: string,
    role: 'teacher' | 'student' | 'parent'
): Promise<{ updated: number }> => {
    const response = await fetch(`${API_BASE}/notifications/mark-all-read`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ userId, role }),
    });
    if (!response.ok) throw new Error('Failed to mark all notifications as read');
    return response.json();
};

// ── Parent API ────────────────────────────────────────────────────────────────

export const getParentChildren = async (): Promise<ParentChild[]> => {
    const response = await fetch(`${API_BASE}/parent/children`, {
        headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch children');
    return response.json();
};

export const getChildClasses = async (childId: string): Promise<StudentClass[]> => {
    const response = await fetch(`${API_BASE}/parent/children/${childId}/classes`, {
        headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch child classes');
    return response.json();
};

export const getParentChildSummary = async (
    childId: string
): Promise<ParentChildSummary> => {
    const response = await fetch(
        `${API_BASE}/parent/children/${childId}/summary`,
        { headers: authHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch child summary');
    return response.json();
};

export const sendParentNudge = async (
    studentId: string,
    message: string
): Promise<ParentNudge> => {
    const response = await fetch(`${API_BASE}/parent/nudges`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ studentId, message }),
    });
    if (!response.ok) throw new Error('Failed to send nudge');
    return response.json();
};

export const sendTeacherNudge = async (
    studentId: string,
    message: string
): Promise<any> => {
    const response = await fetch(`${API_BASE}/teacher/nudges`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ studentId, message }),
    });
    if (!response.ok) throw new Error('Failed to send nudge');
    return response.json();
};

export type CopilotConversationRole = 'user' | 'assistant' | 'system';

export interface TeacherCopilotConversation {
    id: string;
    teacherId: string;
    classId?: string | null;
    studentId?: string | null;
    title?: string | null;
    createdAt: string;
    updatedAt: string;
    lastMessageAt?: string | null;
}

export interface TeacherCopilotConversationMessage {
    id: string;
    conversationId: string;
    role: CopilotConversationRole;
    content: string;
    intent?: string | null;
    source?: string | null;
    metadata?: Record<string, unknown> | null;
    createdAt: string;
}

export const listTeacherConversations = async (params?: {
    classId?: string;
    studentId?: string;
}): Promise<TeacherCopilotConversation[]> => {
    const query = new URLSearchParams();
    if (params?.classId) query.set('classId', params.classId);
    if (params?.studentId) query.set('studentId', params.studentId);

    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`${API_BASE}/teacher/copilot/conversations${suffix}`, {
        headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to list teacher conversations');
    return response.json();
};

export const createTeacherConversation = async (body: {
    classId?: string;
    studentId?: string;
    title?: string;
}): Promise<TeacherCopilotConversation> => {
    const response = await fetch(`${API_BASE}/teacher/copilot/conversations`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('Failed to create teacher conversation');
    return response.json();
};

export const getTeacherConversationMessages = async (
    conversationId: string
): Promise<TeacherCopilotConversationMessage[]> => {
    const response = await fetch(`${API_BASE}/teacher/copilot/conversations/${conversationId}/messages`, {
        headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch teacher conversation messages');
    return response.json();
};

export const appendTeacherConversationMessage = async (
    conversationId: string,
    body: {
        role: CopilotConversationRole;
        content: string;
        intent?: string;
        source?: string;
        metadata?: Record<string, unknown>;
    }
): Promise<TeacherCopilotConversationMessage> => {
    const response = await fetch(`${API_BASE}/teacher/copilot/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('Failed to append teacher conversation message');
    return response.json();
};

// ── AI Generator API & Game Packs ───────────────────────────────────────────────

const fallbackGamePacks: Record<string, GamePack> = {
    'demo-game-1': {
        id: 'demo-game-1',
        title: 'Fractions Quest',
        topic: 'Fractions',
        level: 'Primary 5',
        questions: [
            { id: 'q1', prompt: 'What is 1/2 + 1/4?', options: ['1/8', '3/4', '1/6', '2/4'], correctIndex: 1, difficulty: 'medium', topic: 'Fractions' },
            { id: 'q2', prompt: 'Which fraction is equivalent to 2/3?', options: ['4/6', '1/3', '3/2', '4/9'], correctIndex: 0, difficulty: 'easy', topic: 'Fractions' },
            { id: 'q3', prompt: 'Subtract: 5/8 - 1/8 = ?', options: ['3/8', '2/8', '4/8', '6/8'], correctIndex: 2, difficulty: 'medium', topic: 'Fractions' }
        ]
    },
    'practice-general': {
        id: 'practice-general',
        title: 'General Math Practice',
        topic: 'General Math',
        level: 'Primary 5',
        questions: [
            { id: 'pq1', prompt: '10 x 5 = ?', options: ['15', '50', '500', '105'], correctIndex: 1, difficulty: 'easy', topic: 'Multiplication' },
            { id: 'pq2', prompt: 'What is the square root of 64?', options: ['6', '8', '12', '16'], correctIndex: 1, difficulty: 'medium', topic: 'Roots' },
            { id: 'pq3', prompt: '100 / 4 = ?', options: ['20', '25', '30', '40'], correctIndex: 1, difficulty: 'easy', topic: 'Division' }
        ]
    },
    'algebra-basics': {
        id: 'algebra-basics',
        title: 'Algebra Basics',
        topic: 'Algebra',
        level: 'Sec 3',
        questions: [
            { id: 'aq1', prompt: 'Factorise: x^2 + 5x + 6', options: ['(x+2)(x+3)', '(x-2)(x-3)', '(x+1)(x+6)', 'x(x+5)'], correctIndex: 0, difficulty: 'medium', topic: 'Algebra – Factorisation' },
            { id: 'aq2', prompt: 'Factorise completely: 4x^2 - 16', options: ['4(x-2)(x+2)', '(2x-4)(2x+4)', '4(x-4)(x+4)', '2(x^2-8)'], correctIndex: 0, difficulty: 'hard', topic: 'Algebra – Factorisation' },
            { id: 'aq3', prompt: 'Solve for x: x^2 - 4x = 0', options: ['x=0, x=4', 'x=2, x=-2', 'x=4', 'x=0'], correctIndex: 0, difficulty: 'medium', topic: 'Quadratic Equations' },
            { id: 'aq4', prompt: 'Solve for x: x^2 = 25', options: ['x=5', 'x=-5', 'x=5, x=-5', 'x=25'], correctIndex: 2, difficulty: 'easy', topic: 'Quadratic Equations' },
            { id: 'aq5', prompt: 'Solve: 2x > 6', options: ['x < 3', 'x > 3', 'x = 3', 'x > -3'], correctIndex: 1, difficulty: 'medium', topic: 'Linear Inequalities' },
        ]
    },
    'demo-game-2': {
        id: 'demo-game-2',
        title: 'Kinematics Lab',
        topic: 'Physics',
        level: 'Sec 4',
        questions: [
            { id: 'k1', prompt: 'A car accelerates from rest at 2 m/s² for 5s. What is its final velocity?', options: ['5 m/s', '10 m/s', '2.5 m/s', '20 m/s'], correctIndex: 1, difficulty: 'medium', topic: 'Kinematics' },
            { id: 'k2', prompt: 'What is the SI unit of acceleration?', options: ['m/s', 'm/s²', 'N', 'J'], correctIndex: 1, difficulty: 'easy', topic: 'Kinematics' },
            { id: 'k3', prompt: 'Distance travelled is the area under which graph?', options: ['Displacement-Time', 'Velocity-Time', 'Acceleration-Time', 'Force-Time'], correctIndex: 1, difficulty: 'medium', topic: 'Kinematics' }
        ]
    }
};

export const getGamePackById = async (id: string): Promise<GamePack> => {
    // Try to fetch from backend, fallback to in-memory map or throw
    try {
        const response = await fetch(`${API_BASE}/game-packs/${id}`, {
            headers: authHeaders(),
        });
        if (response.ok) {
            return response.json();
        }
    } catch {
        // Backend might not have this endpoint yet, swallow and fallback
    }

    const pack = fallbackGamePacks[id];
    if (pack) {
        return Promise.resolve(pack);
    }

    return Promise.reject(new Error(`Game pack with ID "${id}" not found.`));
}

export const generateGamePack = async (params: {
    topic: string;
    level: string;
    questionCount?: number;
    difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
}): Promise<GamePack> => {
    const response = await fetch(`${API_BASE}/ai/generate-game`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(params),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate game pack');
    }
    return response.json();
};

/**
 * @deprecated internal/temporary helper for legacy hardcoded flows.
 * Use getGamePackById instead where possible.
 */
export const getDemoGamePack = async (): Promise<GamePack> => {
    return Promise.resolve(fallbackGamePacks['demo-game-1']);
};

export const getAvailableGamePacks = async (): Promise<Partial<GamePack>[]> => {
    return [
        { id: 'practice-general', title: 'General Math Practice', topic: 'General Math' },
        { id: 'algebra-basics', title: 'Algebra Basics', topic: 'Algebra' },
        { id: 'demo-game-1', title: 'Fractions Quest', topic: 'Fractions' },
        { id: 'demo-game-2', title: 'Kinematics Lab', topic: 'Physics' },
    ];
};

const filterByClassId = <T extends { classId: string }>(items: T[], classId?: string): T[] => {
    if (!classId) return items;
    return items.filter((item) => item.classId === classId);
};

export const getStudentClassroomMockData = async (classId?: string): Promise<ClassroomMockBundle> => {
    return {
        streamItems: filterByClassId(demoClassroomStreamItems, classId),
        assignments: filterByClassId(demoClassroomAssignments, classId),
        practices: filterByClassId(demoClassroomPractices, classId),
        people: filterByClassId(demoClassroomPeople, classId),
    };
};

export const getTeacherClassroomMockData = async (classId?: string): Promise<ClassroomMockBundle> => {
    return {
        streamItems: filterByClassId(demoClassroomStreamItems, classId),
        assignments: filterByClassId(demoClassroomAssignments, classId),
        practices: filterByClassId(demoClassroomPractices, classId),
        people: filterByClassId(demoClassroomPeople, classId),
    };
};

export const getTeacherReviewWorkItemsMock = async (): Promise<TeacherReviewWorkItem[]> => {
    const assignmentItems: TeacherReviewWorkItem[] = demoClassroomAssignments.map((item) => ({
        id: item.id,
        type: 'assignment',
        title: item.title,
        classId: item.classId,
        className: item.className,
        topic: item.topic,
        dueDate: item.dueDate,
        status: item.status,
        statusLabel: item.statusLabel,
        submittedCount: item.submittedCount,
        totalCount: item.totalCount,
        averageScore: item.averageScore,
        needsAttention: item.needsAttention,
    }));

    const practiceItems: TeacherReviewWorkItem[] = demoClassroomPractices.map((item) => ({
        id: item.id,
        type: 'practice',
        title: item.title,
        classId: item.classId,
        className: item.className,
        topic: item.topic,
        dueDate: new Date(Date.now() + 4 * 86400000).toISOString(),
        status: item.status,
        statusLabel: item.statusLabel,
        submittedCount: item.submittedCount,
        totalCount: item.totalCount,
        averageScore: item.averageScore,
        needsAttention: item.needsAttention,
    }));

    return [...assignmentItems, ...practiceItems].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
};

// ── Legacy mock pass-throughs (keep other pages working) ─────────────────────

export const getUpcomingAssignments = async (): Promise<any[]> => {
    const response = await fetch(`${API_BASE}/assignments`, {
        headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch upcoming assignments');
    return response.json();
};

export const getRecentActivities = () =>
    Promise.resolve(mockData.activities);

export const getLeaderboardData = () =>
    Promise.resolve(mockData.leaderboard);

export const getTeacherProfile = () =>
    Promise.resolve(mockData.teacher);
