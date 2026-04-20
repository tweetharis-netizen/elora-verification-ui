// src/demo/demoStudentScenarioA.ts
// ── Scenario A: "Struggling Class" ───────────────────────────────────────
// Static demo data for the Student dashboard demo mode.
// Represents "Jordan Lee".

import type * as dataService from '../services/dataService';
import { applySubjectThemeDefaults } from '../lib/classTheme';

export const demoStudentName = 'Jordan Lee';

export const demoStudentData: dataService.StudentDashboardData = {
    assignments: [
        {
            id: 'demo-asgn-1',
            attemptId: 'demo-att-1',
            classroomId: 'demo-class-1',
            title: 'Algebra Quiz 1',
            dueDate: new Date(Date.now() - 1 * 86400000).toISOString(),
            status: 'submitted',
            statusLabel: 'Scored 43%',
            className: 'Sec 3 Mathematics',
            gamePackId: 'algebra-basics',
            score: 43,
            maxScore: 100,
        },
    ],
    recentPerformance: {
        scores: [
            { score: 45, date: new Date(Date.now() - 7 * 86400000).toISOString() },
            { score: 52, date: new Date(Date.now() - 5 * 86400000).toISOString() },
            { score: 43, date: new Date(Date.now() - 2 * 86400000).toISOString() },
        ],
        weakTopics: ['Algebra – Factorisation'],
    },
};

export const demoStudentStreak: dataService.StudentStreak = {
    streakWeeks: 0,
    weeklyScores: [
        { weekLabel: 'Mar 1', avgAccuracy: 0.45 },
        { weekLabel: 'Mar 8', avgAccuracy: 0.52 },
        { weekLabel: 'Mar 15', avgAccuracy: 0.43 },
    ],
    scoreThisWeek: 43,
    scorePriorWeek: 52,
    trend: 'down',
};

export const demoGameSessions: dataService.GameSession[] = [
     {
        id: 'demo-sess-1',
        studentId: 'demo-student-jordan',
        packId: 'algebra-basics',
        score: 4,
        totalQuestions: 10,
        accuracy: 0.43,
        playedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
];

export const demoStudentNudges: dataService.ParentNudge[] = [
    {
        id: 'demo-nudge-1',
        parentId: 'demo-parent-lee',
        studentId: 'demo-student-jordan',
        message: "Hi Jordan, I saw your 43% on Algebra Quiz 1. Let's review factorisation together and improve it.",
        read: false,
        createdAt: new Date(Date.now() - 1 * 3600000).toISOString(), // 1 hour ago
    },
];

export const demoStudentClasses: dataService.StudentClass[] = [
    applySubjectThemeDefaults({
        id: 'demo-class-1',
        name: 'Sec 3 Mathematics',
        subject: 'Mathematics',
        teacherName: 'Mr. Michael Lee',
        joinCode: 'X7B9Q2M',
        enrolledAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        playfulBackground: true,
    }),
    applySubjectThemeDefaults({
        id: 'demo-class-2',
        name: 'Sec 1 Science',
        subject: 'Science',
        teacherName: 'Mr. Michael Lee',
        joinCode: 'SCI11A2',
        enrolledAt: new Date(Date.now() - 20 * 86400000).toISOString(),
        playfulBackground: true,
    }),
];

export const demoStudentClassroomAssignments: dataService.ClassroomAssignmentMock[] = [
    {
        id: 'cls-assignment-1',
        classId: 'demo-class-1',
        className: 'Sec 3 Mathematics',
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
        className: 'Sec 3 Mathematics',
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
];

export const demoStudentClassroomPractices: dataService.ClassroomPracticeMock[] = [
    {
        id: 'cls-practice-1',
        classId: 'demo-class-1',
        className: 'Sec 3 Mathematics',
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
        className: 'Sec 3 Mathematics',
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
