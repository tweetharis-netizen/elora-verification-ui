// src/demo/demoParentScenarioA.ts
// ── Scenario A: "The Struggling Class" ───────────────────────────────────────
// Static demo data for the Parent dashboard demo mode.
// Represents the parent of "Jordan Lee".

import type * as dataService from '../services/dataService';

export const demoParentName = 'Mr. Lee';

export const demoChildren: dataService.ParentChild[] = [
    {
        id: 'demo-student-jordan',
        name: 'Jordan Lee',
        score: 48,
        streak: 0,
        grade: 'Sec 3 Mathematics',
    },
];

export const demoChildSummary: dataService.ParentChildSummary = {
    child: demoChildren[0],
    stats: [
        { label: 'Avg. Accuracy', value: '48%', iconName: 'TrendingDown', trend: 'down' },
        { label: 'Weekly Streak', value: '0 wks', iconName: 'Zap', trend: 'neutral' },
        { label: 'Assignments Done', value: '0/1', iconName: 'CheckCircle2', trend: 'down' },
    ],
    upcoming: [
        {
            id: 'demo-asgn-1',
            title: 'Algebra Quiz 1',
            subject: 'Mathematics',
            dueDate: '3 days overdue',
            status: 'Overdue',
        },
    ],
    recentActivity: [
        {
            id: 'demo-act-1',
            title: 'Algebra Quiz 1',
            subject: 'Mathematics',
            tag: 'Needs Help',
            type: 'quiz',
            score: '28%',
            date: '2 days ago',
            status: 'at_risk',
        },
    ],
    weakTopics: ['Algebra – Factorisation'],
    subjectScores: [
        { name: 'Algebra', score: 35 },
        { name: 'Geometry', score: 62 },
        { name: 'Numbers', score: 55 },
    ],
};
