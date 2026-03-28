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
            dueDate: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 days ago
            status: 'danger',
            statusLabel: 'Overdue',
            className: 'Sec 3 Mathematics',
            gamePackId: 'algebra-basics',
        },
    ],
    recentPerformance: {
        scores: [
            { score: 45, date: new Date(Date.now() - 7 * 86400000).toISOString() },
            { score: 52, date: new Date(Date.now() - 5 * 86400000).toISOString() },
            { score: 28, date: new Date(Date.now() - 2 * 86400000).toISOString() },
        ],
        weakTopics: ['Algebra – Factorisation'],
    },
};

export const demoStudentStreak: dataService.StudentStreak = {
    streakWeeks: 0,
    weeklyScores: [
        { weekLabel: 'Mar 1', avgAccuracy: 0.45 },
        { weekLabel: 'Mar 8', avgAccuracy: 0.52 },
        { weekLabel: 'Mar 15', avgAccuracy: 0.28 },
    ],
    scoreThisWeek: 28,
    scorePriorWeek: 52,
    trend: 'down',
};

export const demoGameSessions: dataService.GameSession[] = [
     {
        id: 'demo-sess-1',
        studentId: 'demo-student-jordan',
        packId: 'algebra-basics',
        score: 3,
        totalQuestions: 10,
        accuracy: 0.3,
        playedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
];

export const demoStudentNudges: dataService.ParentNudge[] = [
    {
        id: 'demo-nudge-1',
        parentId: 'demo-parent-lee',
        studentId: 'demo-student-jordan',
        message: "Hi Jordan, I noticed you haven't finished Algebra Quiz 1. Let's try to get it done today!",
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
];
