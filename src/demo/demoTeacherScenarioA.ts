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
            'Jordan attempted Algebra Quiz 1 but scored 28% – consistently struggling with factorisation.',
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
