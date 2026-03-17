import { notifications, Notification } from '../db.js';
import {
    createStudentSupportNotification,
    createSubmissionReadyNotification,
    createGeneralTeacherNotification,
    createAssignmentOverdueNotification,
    createTeacherMessageNotification,
    createWeeklyReportNotification,
    createSystemNotification
} from '../notifications/factory.js';

export function seedTeacherDemoNotifications(teacherId: string): void {
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
        }),
        createSystemNotification({
            userId: teacherId,
            role: 'teacher',
            type: 'message',
            title: 'New faculty memo',
            message: 'Please review the updated guidelines for next semester.',
            isRead: true,
            createdAt: new Date(now - 3 * 24 * 60 * 60_000).toISOString()
        })
    ];

    notifications.push(...seed);
}

export function seedParentDemoNotifications(parentId: string): void {
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

export function seedStudentDemoNotifications(studentId: string): void {
    if (notifications.some(n => n.userId === studentId && n.role === 'student')) {
        return; // already seeded
    }

    const now = Date.now();
    const seed: Notification[] = [
        createSystemNotification({
            userId: studentId,
            role: 'student',
            type: 'alert',
            title: 'Assignment due soon',
            message: 'Your A-Maths "Surds & Indices" assignment is due tomorrow.',
            createdAt: new Date(now - 30 * 60_000).toISOString(),
            context: { assignmentId: '101' }
        }),
        createSystemNotification({
            userId: studentId,
            role: 'student',
            type: 'alert',
            title: 'Overdue Assignment Reminder',
            message: 'Physics Lab Report is past due. Please submit ASAP.',
            createdAt: new Date(now - 8 * 60 * 60_000).toISOString()
        }),
        createSystemNotification({
            userId: studentId,
            role: 'student',
            type: 'message',
            title: 'Feedback Posted',
            message: 'Mr. Davis left feedback on your Algebra Quiz.',
            createdAt: new Date(now - 24 * 60 * 60_000).toISOString()
        }),
        createSystemNotification({
            userId: studentId,
            role: 'student',
            type: 'general',
            title: 'Study Tip',
            message: 'Elora suggests reviewing Quadratic Equations before the upcoming test.',
            isRead: true,
            createdAt: new Date(now - 2 * 24 * 60 * 60_000).toISOString()
        })
    ];

    notifications.push(...seed);
}
