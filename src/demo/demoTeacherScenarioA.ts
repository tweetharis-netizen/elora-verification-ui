// src/demo/demoTeacherScenarioA.ts
// ── Scenario A: "Struggling Class" ───────────────────────────────────────
// Static demo data for the Teacher dashboard demo mode.
// Nothing here calls any API – it is purely declarative.

import type * as dataService from '../services/dataService';
import { applySubjectThemeDefaults } from '../lib/classTheme';

// ── Class overview ────────────────────────────────────────────────────────────

export const DEMO_CLASS_NAME = 'Sec 3 Mathematics';
export const DEMO_CLASS_LEVEL = 'Sec 3';

export const demoStats: dataService.TeacherStat[] = [
    { label: 'Classes Today', value: '1', trendValue: 'stable', status: 'success' },
    { label: 'Active Students', value: '28', trendValue: 'down', status: 'warning' },
    { label: 'Pending Grading', value: '4', trendValue: 'stable', status: 'warning' },
    { label: 'Average Score', value: '61%', trendValue: 'down', status: 'warning' },
];

export const demoClasses: dataService.TeacherClass[] = [
    applySubjectThemeDefaults({
        id: 'demo-class-1',
        name: DEMO_CLASS_NAME,
        subject: 'Mathematics',
        studentsCount: 32,
        nextTopic: 'Algebra – Factorisation',
        time: 'Mon · Wed · Fri, 09:00 AM',
        status: 'warning',
        statusMsg: 'Needs Attention',
        activeAssignments: 1,
        averageScore: 61,
        playfulBackground: true,
        progress: 75,
    }),
];

// ── Assignments ───────────────────────────────────────────────────────────────

export interface DemoAssignment {
    id: string;
    title: string;
    className: string;
    dueDate?: string;
    statusLabel: string;
    status: string;
}

export const demoAssignments: DemoAssignment[] = [
    {
        id: 'demo-asgn-1',
        title: 'Algebra Quiz 1',
        className: DEMO_CLASS_NAME,
        statusLabel: '3 days overdue · 0 submissions',
        status: 'Needs Attention',
    },
];

// ── Insights (Needs Attention / Weak Topics) ───────────────────────────────────

export const demoInsights: dataService.TeacherInsight[] = [
    {
        id: 'demo-insight-1',
        type: 'weak_topic',
        className: DEMO_CLASS_NAME,
        topicTag: 'Algebra – Factorisation',
        detail:
            '14 of 28 active students scored below 50% on Factorisation questions this week.',
        studentName: undefined,
        assignmentTitle: undefined,
        assignmentId: undefined,
    },
    {
        id: 'demo-insight-2',
        type: 'low_scores',
        className: DEMO_CLASS_NAME,
        topicTag: 'Algebra – Factorisation',
        studentName: 'Jordan Lee',
        studentId: 'demo-student-jordan',
        detail:
            'Jordan attempted Algebra Quiz 1 and scored 43% - he needs focused support on factorisation.',
        assignmentTitle: 'Algebra Quiz 1',
        assignmentId: 'demo-asgn-1',
    },
    {
        id: 'demo-insight-3',
        type: 'low_scores',
        className: DEMO_CLASS_NAME,
        topicTag: 'Algebra – Factorisation',
        studentName: 'Priya Nair',
        studentId: 'demo-student-priya',
        detail: 'Priya has not submitted Algebra Quiz 1 and missed two sessions this week.',
        assignmentTitle: 'Algebra Quiz 1',
        assignmentId: 'demo-asgn-1',
    },
    {
        id: 'demo-insight-4',
        type: 'overdue_assignment',
        className: DEMO_CLASS_NAME,
        assignmentTitle: 'Algebra Quiz 1',
        assignmentId: 'demo-asgn-1',
        detail: '0 of 32 students have submitted. Due date was 3 days ago.',
        studentName: undefined,
        topicTag: undefined,
    },
];

// ── Teacher profile ───────────────────────────────────────────────────────────

export const demoTeacherName = 'Mr. Michael Lee';

// ── Classroom mock model (shared across Student/Teacher classroom views) ─────

export const demoClassroomAssignments: dataService.ClassroomAssignmentMock[] = [
    {
        id: 'cls-assignment-1',
        classId: 'demo-class-1',
        className: DEMO_CLASS_NAME,
        title: 'Algebra Quiz 1',
        topic: 'Algebra - Factorisation',
        dueDate: new Date(Date.now() - 2 * 86400000).toISOString(),
        status: 'overdue',
        statusLabel: '2 days overdue',
        submittedCount: 12,
        totalCount: 32,
        averageScore: 43,
        needsAttention: true,
        studentStatus: 'overdue',
        studentScore: 43,
    },
    {
        id: 'cls-assignment-2',
        classId: 'demo-class-1',
        className: DEMO_CLASS_NAME,
        title: 'Linear Equations Worksheet',
        topic: 'Algebra - Linear Equations',
        dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
        status: 'due_soon',
        statusLabel: 'Due in 2 days',
        submittedCount: 20,
        totalCount: 32,
        averageScore: 68,
        needsAttention: false,
        studentStatus: 'due_soon',
    },
    {
        id: 'cls-assignment-3',
        classId: 'demo-class-1',
        className: DEMO_CLASS_NAME,
        title: 'Geometry Intro Reflection',
        topic: 'Geometry',
        dueDate: new Date(Date.now() - 6 * 86400000).toISOString(),
        status: 'completed',
        statusLabel: 'Closed',
        submittedCount: 32,
        totalCount: 32,
        averageScore: 82,
        needsAttention: false,
        studentStatus: 'completed',
        studentScore: 74,
    },
];

export const demoClassroomPractices: dataService.ClassroomPracticeMock[] = [
    {
        id: 'cls-practice-1',
        classId: 'demo-class-1',
        className: DEMO_CLASS_NAME,
        title: 'Factorisation Booster Set',
        topic: 'Algebra - Factorisation',
        sourceType: 'generated',
        questionCount: 10,
        status: 'upcoming',
        statusLabel: 'Recommended this week',
        submittedCount: 8,
        totalCount: 32,
        averageScore: 52,
        needsAttention: true,
        studentStatus: 'upcoming',
    },
    {
        id: 'cls-practice-2',
        classId: 'demo-class-1',
        className: DEMO_CLASS_NAME,
        title: 'Quick Equations Drill',
        topic: 'Algebra - Linear Equations',
        sourceType: 'curated',
        questionCount: 8,
        status: 'completed',
        statusLabel: 'Completed by most students',
        submittedCount: 27,
        totalCount: 32,
        averageScore: 79,
        needsAttention: false,
        studentStatus: 'completed',
        studentScore: 75,
    },
];

export const demoClassroomStreamItems: dataService.ClassroomStreamItemMock[] = [
    {
        id: 'stream-1',
        classId: 'demo-class-1',
        type: 'announcement',
        title: 'Revision Focus',
        message: 'We will focus on factorisation strategies this week. Bring your worksheet tomorrow.',
        timestamp: '1 hour ago',
        severity: 'normal',
    },
    {
        id: 'stream-2',
        classId: 'demo-class-1',
        type: 'assignment_due',
        title: 'Algebra Quiz 1 overdue',
        message: '12 of 32 submissions received. Please remind students who have not submitted.',
        timestamp: 'Today',
        severity: 'urgent',
        linkedEntityId: 'cls-assignment-1',
    },
    {
        id: 'stream-3',
        classId: 'demo-class-1',
        type: 'practice_recommendation',
        title: 'Practice recommendation',
        message: 'Elora recommends Factorisation Booster Set for students below 50%.',
        timestamp: 'Today',
        severity: 'needs_attention',
        linkedEntityId: 'cls-practice-1',
    },
    {
        id: 'stream-4',
        classId: 'demo-class-1',
        type: 'graded_return',
        title: 'Geometry reflection graded',
        message: 'Average score: 82%. Great improvement from last week.',
        timestamp: 'Yesterday',
        severity: 'normal',
        linkedEntityId: 'cls-assignment-3',
    },
];

export const demoClassroomPeople: dataService.ClassroomPersonMock[] = [
    {
        id: 'teacher-1',
        classId: 'demo-class-1',
        name: demoTeacherName,
        role: 'teacher',
        participationLevel: 'high',
        riskFlag: false,
        lastActiveAt: new Date(Date.now() - 45 * 60000).toISOString(),
    },
    {
        id: 'demo-student-jordan',
        classId: 'demo-class-1',
        name: 'Jordan Lee',
        role: 'student',
        participationLevel: 'low',
        riskFlag: true,
        lastActiveAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
        id: 'demo-student-priya',
        classId: 'demo-class-1',
        name: 'Priya Nair',
        role: 'student',
        participationLevel: 'medium',
        riskFlag: true,
        lastActiveAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
    {
        id: 'demo-student-alex',
        classId: 'demo-class-1',
        name: 'Alex Chen',
        role: 'student',
        participationLevel: 'high',
        riskFlag: false,
        lastActiveAt: new Date(Date.now() - 30 * 60000).toISOString(),
    },
];
