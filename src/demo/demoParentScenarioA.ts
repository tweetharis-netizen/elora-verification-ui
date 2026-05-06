// src/demo/demoParentScenarioA.ts
// ── Scenario A: "Struggling Class" ───────────────────────────────────────
// Static demo data for the Parent dashboard demo mode.
// Represents the parent of "Jordan Lee".

import type * as dataService from '../services/dataService';

export const demoParentName = 'Shaik Haris';

export const demoChildren: dataService.ParentChild[] = [
    {
        id: 'student_1',
        name: 'Jordan Lee',
        score: 58,
        streak: 1,
        grade: 'Sec 3',
        classes: [
            { id: '1', name: 'Sec 3 Mathematics', subject: 'Mathematics' },
            { id: '3', name: 'Sec 1 Science', subject: 'Science' },
        ],
    },
    {
        id: 'student_2',
        name: 'Mia Lee',
        score: 85,
        streak: 5,
        grade: 'Sec 1',
        classes: [
            { id: '4', name: 'Sec 1 Mathematics', subject: 'Mathematics' },
            { id: '5', name: 'Sec 1 Science', subject: 'Science' },
        ],
    },
];

export const demoChildSummary: any = {
    child: demoChildren[0],
    stats: [
        { label: 'Avg. Accuracy', value: '58%', iconName: 'TrendingDown', trend: 'down' },
        { label: 'Weekly Streak', value: '1 wk', iconName: 'Zap', trend: 'stable' },
        { label: 'Assignments Done', value: '1/2', iconName: 'CheckCircle2', trend: 'stable' },
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
            title: "Jordan Lee's Performance",
            subject: 'Mathematics',
            tag: 'Practicing Algebra',
            type: 'practice',
            score: '43%',
            date: '2 days ago',
            status: 'at_risk',
        },
        {
            id: 'demo-act-2',
            title: 'Numbers Practice',
            subject: 'Mathematics',
            tag: 'Improving',
            type: 'practice',
            score: '65%',
            date: '4 days ago',
            status: 'success',
        },
    ],
    weakTopics: ['Algebra – Factorisation'],
    subjectScores: [
        { name: 'Algebra', score: 35 },
        { name: 'Geometry', score: 62 },
        { name: 'Numbers', score: 55 },
    ],
};

export const demoParentInsights: dataService.ParentInsight[] = [
    {
        id: 'p-insight-1',
        type: 'weak_topic',
        topicTag: 'Algebra – Factorisation',
        detail: 'Jordan is currently in the bottom 20% for this topic. He might need more practice before the term test.',
    },
];

export const demoParentMessages: any[] = [
    {
        id: 'msg-1',
        sender: 'Ms. Tan',
        text: "Hi! I noticed Jordan struggled with the Algebra quiz yesterday. He's trying, but factorisation is a bit tricky for him. I'll spend some time with him after school on Friday.",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    }
];

export const demoParentTips: string[] = [
    "Set a 20-minute after-dinner block for Algebra practice",
    "Ask Jordan to explain one Algebra idea to you each weekend"
];
