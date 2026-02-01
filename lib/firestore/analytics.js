// lib/firestore/analytics.js
// Analytics and performance tracking

import {
    collection,
    doc,
    setDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { format, subDays, parseISO } from 'date-fns';

/**
 * Record student activity
 */
export async function recordActivity({
    studentId,
    classId = null,
    assignmentId = null,
    activityType,
    metadata = {}
}) {
    if (!db) return;

    const activityData = {
        studentId,
        classId,
        assignmentId,
        activityType,
        metadata,
        timestamp: serverTimestamp(),
    };

    const activityRef = doc(collection(db, 'activities'));
    await setDoc(activityRef, activityData);
}

/**
 * Get student analytics
 */
export async function getStudentAnalytics(studentId, daysBack = 30) {
    if (!db) return null;

    const startDate = subDays(new Date(), daysBack);

    const q = query(
        collection(db, 'activities'),
        where('studentId', '==', studentId),
        where('timestamp', '>=', startDate),
        orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculate metrics
    const totalActivities = activities.length;
    const assignmentsCompleted = activities.filter(a => a.activityType === 'assignment_submitted').length;
    const averageGrade = calculateAverageGrade(activities);
    const streakDays = calculateStreak(activities);
    const topSubjects = getTopSubjects(activities);
    const performanceTrend = calculatePerformanceTrend(activities);

    return {
        totalActivities,
        assignmentsCompleted,
        averageGrade,
        streakDays,
        topSubjects,
        performanceTrend,
        recentActivities: activities.slice(0, 10),
    };
}

/**
 * Get class performance heatmap
 */
export async function getClassPerformanceHeatmap(classId) {
    if (!db) return [];

    // Get all assignments for the class
    const assignmentsQuery = query(
        collection(db, 'assignments'),
        where('classId', '==', classId)
    );
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    const assignments = assignmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get all submissions for these assignments
    const heatmapData = [];

    for (const assignment of assignments) {
        const submissionsQuery = query(
            collection(db, 'submissions'),
            where('assignmentId', '==', assignment.id)
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        const submissions = submissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        submissions.forEach(submission => {
            if (submission.grade !== null) {
                heatmapData.push({
                    studentId: submission.studentId,
                    assignment: assignment.title,
                    topic: assignment.topic || 'General',
                    grade: submission.grade,
                    maxGrade: assignment.points,
                    percentage: (submission.grade / assignment.points) * 100,
                });
            }
        });
    }

    return heatmapData;
}

/**
 * Detect students needing intervention
 */
export async function detectInterventions(classId) {
    if (!db) return [];

    const heatmapData = await getClassPerformanceHeatmap(classId);
    const interventions = [];

    // Group by student
    const studentPerformance = {};
    heatmapData.forEach(item => {
        if (!studentPerformance[item.studentId]) {
            studentPerformance[item.studentId] = [];
        }
        studentPerformance[item.studentId].push(item.percentage);
    });

    // Check for concerning patterns
    Object.entries(studentPerformance).forEach(([studentId, grades]) => {
        const avgGrade = grades.reduce((a, b) => a + b, 0) / grades.length;
        const recentGrades = grades.slice(-3);
        const recentAvg = recentGrades.reduce((a, b) => a + b, 0) / recentGrades.length;
        const declining = grades.length >= 3 && recentGrades.every((g, i) => i === 0 || g < recentGrades[i - 1]);

        if (avgGrade < 60) {
            interventions.push({
                studentId,
                type: 'low_performance',
                severity: 'high',
                message: 'Student is consistently performing below 60%',
                avgGrade,
            });
        } else if (recentAvg < avgGrade - 15) {
            interventions.push({
                studentId,
                type: 'declining_performance',
                severity: 'medium',
                message: 'Recent performance has declined significantly',
                avgGrade,
                recentAvg,
            });
        } else if (declining) {
            interventions.push({
                studentId,
                type: 'negative_trend',
                severity: 'medium',
                message: 'Grades show a consistent declining trend',
                avgGrade,
            });
        }
    });

    return interventions;
}

/**
 * Get learning gap analysis
 */
export async function getLearningGaps(studentId) {
    if (!db) return [];

    const analytics = await getStudentAnalytics(studentId);
    if (!analytics) return [];

    const gaps = [];

    // Analyze performance by topic
    const topicPerformance = {};
    analytics.recentActivities.forEach(activity => {
        if (activity.metadata?.topic && activity.metadata?.grade) {
            if (!topicPerformance[activity.metadata.topic]) {
                topicPerformance[activity.metadata.topic] = [];
            }
            topicPerformance[activity.metadata.topic].push(activity.metadata.grade);
        }
    });

    Object.entries(topicPerformance).forEach(([topic, grades]) => {
        const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
        if (avg < 70) {
            gaps.push({
                topic,
                averageScore: avg,
                attempts: grades.length,
                recommendations: generateRecommendations(topic, avg),
            });
        }
    });

    return gaps.sort((a, b) => a.averageScore - b.averageScore);
}

/**
 * Generate weekly digest for parents
 */
export async function generateWeeklyDigest(studentId) {
    if (!db) return null;

    const analytics = await getStudentAnalytics(studentId, 7);
    if (!analytics) return null;

    const digest = {
        period: {
            start: format(subDays(new Date(), 7), 'MMM dd, yyyy'),
            end: format(new Date(), 'MMM dd, yyyy'),
        },
        summary: {
            activeDays: calculateActiveDays(analytics.recentActivities),
            assignmentsCompleted: analytics.assignmentsCompleted,
            averageGrade: analytics.averageGrade,
            streak: analytics.streakDays,
        },
        topTopics: analytics.topSubjects,
        achievements: detectAchievements(analytics),
        concerns: analytics.averageGrade < 70 ? ['Student may need additional support'] : [],
        nextSteps: generateNextSteps(analytics),
    };

    return digest;
}

// Helper functions
function calculateAverageGrade(activities) {
    const graded = activities.filter(a => a.metadata?.grade);
    if (graded.length === 0) return null;
    const sum = graded.reduce((acc, a) => acc + a.metadata.grade, 0);
    return Math.round(sum / graded.length);
}

function calculateStreak(activities) {
    const dates = activities.map(a => format(a.timestamp?.toDate?.() || new Date(), 'yyyy-MM-dd'));
    const uniqueDates = [...new Set(dates)].sort().reverse();

    let streak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');

    for (let i = 0; i < uniqueDates.length; i++) {
        const expectedDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
        if (uniqueDates[i] === expectedDate) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

function getTopSubjects(activities) {
    const subjects = {};
    activities.forEach(a => {
        if (a.metadata?.subject) {
            subjects[a.metadata.subject] = (subjects[a.metadata.subject] || 0) + 1;
        }
    });

    return Object.entries(subjects)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([subject, count]) => ({ subject, activities: count }));
}

function calculatePerformanceTrend(activities) {
    const graded = activities.filter(a => a.metadata?.grade).reverse();
    if (graded.length < 2) return 'neutral';

    const recentAvg = graded.slice(-3).reduce((acc, a) => acc + a.metadata.grade, 0) / Math.min(3, graded.length);
    const overallAvg = graded.reduce((acc, a) => acc + a.metadata.grade, 0) / graded.length;

    if (recentAvg > overallAvg + 5) return 'improving';
    if (recentAvg < overallAvg - 5) return 'declining';
    return 'stable';
}

function calculateActiveDays(activities) {
    const dates = activities.map(a => format(a.timestamp?.toDate?.() || new Date(), 'yyyy-MM-dd'));
    return new Set(dates).size;
}

function detectAchievements(analytics) {
    const achievements = [];

    if (analytics.streakDays >= 7) achievements.push('7-day learning streak! 🔥');
    if (analytics.averageGrade >= 90) achievements.push('Excellent performance! ⭐');
    if (analytics.assignmentsCompleted >= 5) achievements.push('Productive week! 📚');

    return achievements;
}

function generateNextSteps(analytics) {
    const steps = [];

    if (analytics.averageGrade < 70) {
        steps.push('Review recent concepts with targeted practice');
    }
    if (analytics.performanceTrend === 'declining') {
        steps.push('Schedule one-on-one time to identify challenges');
    }
    steps.push('Continue current learning pace');

    return steps;
}

function generateRecommendations(topic, avgScore) {
    return [
        `Review ${topic} fundamentals`,
        'Practice with additional exercises',
        'Watch educational videos on this topic',
        'Ask teacher for extra help',
    ];
}
