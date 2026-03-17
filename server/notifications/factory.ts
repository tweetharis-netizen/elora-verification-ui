import { Notification, NotificationRole } from '../db';

// Helper to generate a semi-random ID for seed purposes
function generateId(): string {
    return 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

export function createAssignmentOverdueNotification(params: {
    userId: string;
    studentName: string;
    assignmentTitle: string;
    subject: string;
    studentId: string;
    createdAt?: string;
}): Notification {
    return {
        id: generateId(),
        userId: params.userId,
        role: 'parent',
        type: 'alert',
        title: 'Assignment Overdue',
        message: `${params.studentName} has an overdue assignment: ${params.subject}: ${params.assignmentTitle}.`,
        context: { studentId: params.studentId },
        isRead: false,
        createdAt: params.createdAt || new Date().toISOString()
    };
}

export function createTeacherMessageNotification(params: {
    userId: string;
    teacherName: string;
    subject: string;
    studentName: string;
    studentId: string;
    createdAt?: string;
}): Notification {
    return {
        id: generateId(),
        userId: params.userId,
        role: 'parent',
        type: 'message',
        title: 'New message from teacher',
        message: `${params.teacherName} (${params.subject}) sent a progress update regarding ${params.studentName}.`,
        context: { studentId: params.studentId },
        isRead: false,
        createdAt: params.createdAt || new Date().toISOString()
    };
}

export function createWeeklyReportNotification(params: {
    userId: string;
    studentName: string;
    studentId: string;
    isRead?: boolean;
    createdAt?: string;
}): Notification {
    return {
        id: generateId(),
        userId: params.userId,
        role: 'parent',
        type: 'alert',
        title: 'Weekly Report Ready',
        message: `${params.studentName}'s progress report for this week is now available.`,
        context: { studentId: params.studentId },
        isRead: params.isRead !== undefined ? params.isRead : false,
        createdAt: params.createdAt || new Date().toISOString()
    };
}

export function createStudentSupportNotification(params: {
    userId: string;
    studentName: string;
    assignmentTitle: string;
    classId: string;
    studentId: string;
    createdAt?: string;
}): Notification {
    return {
        id: generateId(),
        userId: params.userId,
        role: 'teacher',
        type: 'needs_attention',
        title: 'Student may need support',
        message: `${params.studentName} just finished ${params.assignmentTitle}. Scores suggest she might need a bit more support.`,
        context: { classId: params.classId, studentId: params.studentId, statusFilter: 'needs_attention' },
        isRead: false,
        createdAt: params.createdAt || new Date().toISOString()
    };
}

export function createSubmissionReadyNotification(params: {
    userId: string;
    studentName: string;
    assignmentTitle: string;
    classId: string;
    createdAt?: string;
}): Notification {
    return {
        id: generateId(),
        userId: params.userId,
        role: 'teacher',
        type: 'submission',
        title: 'New submission ready',
        message: `New ${params.assignmentTitle} submission from ${params.studentName} – ready to review.`,
        context: { classId: params.classId, statusFilter: 'completed' },
        isRead: false,
        createdAt: params.createdAt || new Date().toISOString()
    };
}

export function createGeneralTeacherNotification(params: {
    userId: string;
    count: number;
    createdAt?: string;
}): Notification {
    return {
        id: generateId(),
        userId: params.userId,
        role: 'teacher',
        type: 'general',
        title: null,
        message: `You have ${params.count} new assignments ready for grading.`,
        context: {},
        isRead: false,
        createdAt: params.createdAt || new Date().toISOString()
    };
}

export function createSystemNotification(params: {
    userId: string;
    role: NotificationRole;
    type: Notification['type'];
    title: string | null;
    message: string;
    context?: any;
    isRead?: boolean;
    createdAt?: string;
}): Notification {
    return {
        id: generateId(),
        userId: params.userId,
        role: params.role,
        type: params.type,
        title: params.title,
        message: params.message,
        context: params.context || {},
        isRead: params.isRead !== undefined ? params.isRead : false,
        createdAt: params.createdAt || new Date().toISOString()
    };
}
