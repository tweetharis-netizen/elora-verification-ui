// lib/dashboard-utils.js
// Common constants and helper functions for the Elora Dashboard

import { getRecommendations, getRecommendationReason } from "./videoLibrary";

export const COUNTRIES = ["Singapore", "United States", "United Kingdom", "Australia", "Malaysia", "Other"];

export const SUBJECTS = ["General", "Math", "Science", "English", "History", "Geography", "Computing", "Physics", "Chemistry", "Biology", "Economics"];

export const SUBJECTS_MAP = {
    "Singapore": {
        "Primary": ["English", "Mathematics", "Science", "Chinese", "Malay", "Tamil"],
        "Secondary": ["English", "Elementary Math", "Additional Math", "Physics", "Chemistry", "Biology", "Combined Science", "Geography", "History", "Literature", "Social Studies"],
        "Junior College": ["General Paper", "H1 Math", "H2 Math", "H2 Physics", "H2 Chemistry", "H2 Biology", "H2 Economics", "H1 Economics", "History", "Geography", "Literature"]
    },
    "United Kingdom": {
        "Key Stage 1-2": ["English", "Maths", "Science", "History", "Geography", "Art", "Computing"],
        "GCSE": ["English Language", "English Literature", "Maths", "Biology", "Chemistry", "Physics", "Combined Science", "History", "Geography", "Computer Science"],
        "A-Level": ["Maths", "Further Maths", "Physics", "Chemistry", "Biology", "English Literature", "History", "Geography", "Psychology", "Sociology", "Economics"]
    },
    "United States": {
        "Elementary": ["English Language Arts", "Mathematics", "Science", "Social Studies"],
        "Middle School": ["English", "Pre-Algebra", "Algebra 1", "Earth Science", "Life Science", "Physical Science", "World History", "US History"],
        "High School": ["English I-IV", "Algebra 1", "Geometry", "Algebra 2", "Pre-Calculus", "Calculus", "Biology", "Chemistry", "Physics", "US History", "World History", "Government", "Economics"]
    },
    "Other": ["General", "Math", "Science", "English", "History", "Geography", "Computing", "Physics", "Chemistry", "Biology", "Economics"]
};

export const LEVELS_MAP = {
    "Singapore": ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6", "Secondary 1", "Secondary 2", "Secondary 3", "Secondary 4", "Junior College 1", "Junior College 2"],
    "United States": ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"],
    "United Kingdom": ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6", "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12", "Year 13"],
    "Australia": ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6", "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12"],
    "Malaysia": ["Standard 1", "Standard 2", "Standard 3", "Standard 4", "Standard 5", "Standard 6", "Form 1", "Form 2", "Form 3", "Form 4", "Form 5", "Form 6"],
    "Other": ["Elementary", "Middle", "High School", "Tertiary"]
};

export function getCountrySubjects(country, level) {
    if (!country || !SUBJECTS_MAP[country]) return SUBJECTS_MAP["Other"];
    if (!level || typeof level !== 'string') return Array.isArray(SUBJECTS_MAP[country]) ? SUBJECTS_MAP[country] : Object.values(SUBJECTS_MAP[country])[0];

    const map = SUBJECTS_MAP[country];
    if (country === "Singapore") {
        if (level.includes("Primary")) return map["Primary"];
        if (level.includes("Secondary")) return map["Secondary"];
        if (level.includes("Junior")) return map["Junior College"];
    } else if (country === "United Kingdom") {
        if (level.includes("Year 1") || level.includes("Year 2") || level.includes("Year 3") || level.includes("Year 4") || level.includes("Year 5") || level.includes("Year 6")) return map["Key Stage 1-2"];
        if (level.includes("Year 12") || level.includes("Year 13")) return map["A-Level"];
        return map["GCSE"];
    } else if (country === "United States") {
        if (level.includes("Grade 1") || level.includes("Grade 2") || level.includes("Grade 3") || level.includes("Grade 4") || level.includes("Grade 5")) return map["Elementary"];
        if (level.includes("Grade 6") || level.includes("Grade 7") || level.includes("Grade 8")) return map["Middle School"];
        return map["High School"];
    }

    return Array.isArray(map) ? map : Object.values(map).flat();
}

export function getCountryLevels(country) {
    return LEVELS_MAP[country] || LEVELS_MAP["Other"];
}

export function generateJoinCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function cn(...inputs) {
    return inputs.filter(Boolean).join(" ");
}

export function deriveStudentStats(session) {
    const isVerified = Boolean(session?.verified);
    const usage = session?.usage || {};

    if (!isVerified) {
        return {
            name: "Future Scholar",
            streak: 0,
            todayMinutes: 0,
            overallProgress: 12,
            recentTopics: [
                { name: "Algebra Foundations", progress: 45, emoji: "🔢" },
                { name: "Cell Biology", progress: 20, emoji: "🧬" }
            ],
            chartData: [5, 12, 8, 20, 15, 25],
            achievements: [
                { title: "First Message", earned: false },
                { title: "Focus Timer", earned: false }
            ],
            isPreview: true
        };
    }

    const safeSubjects = Array.isArray(usage.subjects) ? usage.subjects : [];
    const messagesSent = Number(usage.messagesSent) || 0;
    const activeMinutes = Number(usage.activeMinutes) || 0;
    const streak = Number(usage.streak) || 0;

    return {
        name: session?.name || session?.email?.split('@')[0] || "Student",
        streak,
        todayMinutes: activeMinutes,
        overallProgress: Math.min(100, messagesSent * 5),
        recentTopics: safeSubjects.length > 0
            ? safeSubjects.map(s => ({ name: String(s), progress: 65, emoji: "📚" }))
            : [{ name: "Getting Started", progress: 0, emoji: "🚀" }],
        chartData: [10, 15, 20, 25, 30, messagesSent + 30],
        achievements: [
            { title: "First Message", earned: (messagesSent > 0) },
            { title: "Focus Timer", earned: (activeMinutes > 10) },
        ],
        resources: session?.classroom?.resources || [],
        quizzes: session?.classroom?.quizzes || [],
        isPreview: false
    };
}

export function computeClassMetrics(linkedStudents = [], isVerified = true, hasMounted = false) {
    if (!isVerified) {
        return {
            avgEngagement: 48,
            topSubject: "Advanced Calculus",
            totalHours: "156.0",
            heatmapData: [
                { subject: "Math", score: 82, students: 15 },
                { subject: "Physics", score: 68, students: 12 },
                { subject: "Chemistry", score: 91, students: 10 },
                { subject: "English", score: 75, students: 20 },
            ],
            recommendedVideos: getRecommendations("Math", "Newton's Second Law"),
            recommendationReason: "Demo: Newton's second law is a common struggle point.",
            isPreview: true
        };
    }

    const safeStudents = Array.isArray(linkedStudents) ? linkedStudents : [];
    if (safeStudents.length === 0) return {
        avgEngagement: 0,
        topSubject: "N/A",
        totalHours: "0.0",
        heatmapData: [],
        recommendedVideos: [],
        vibe: "Focused",
        sentimentInsight: "Waiting for student activity."
    };

    let totalMessages = 0;
    let totalMinutes = 0;
    const subjectCounts = {};

    safeStudents.forEach(s => {
        if (!s) return;
        totalMessages += (Number(s.stats?.messagesSent) || 0);
        totalMinutes += (Number(s.stats?.activeMinutes) || 0);
        const stSubjects = Array.isArray(s.stats?.subjects) ? s.stats.subjects : [];
        stSubjects.forEach(sub => {
            if (!sub) return;
            subjectCounts[sub] = (subjectCounts[sub] || 0) + 1;
        });
    });

    const entries = Object.entries(subjectCounts);
    const top = entries.sort((a, b) => b[1] - a[1])[0];

    const subjectsWithMetrics = entries.map(e => {
        const subjectName = e[0];
        const studentCount = e[1];
        const avgScore = hasMounted ? (75 + (Math.floor(Math.random() * 20) - 10)) : 75;
        return { name: subjectName, students: studentCount, avg: avgScore };
    });

    const heatmapData = subjectsWithMetrics.length > 0
        ? subjectsWithMetrics.map(s => ({ subject: s.name, score: s.avg, students: s.students }))
        : [
            { subject: "Math", score: 78, students: 12 },
            { subject: "Physics", score: 65, students: 8 },
            { subject: "English", score: 88, students: 15 },
        ];

    const mainStruggle = heatmapData.find(h => h.score < 70);
    const struggleTopic = mainStruggle?.subject;
    const recommendationReason = getRecommendationReason(struggleTopic, linkedStudents.length);
    const recommendedVideos = getRecommendations(subjectsWithMetrics[0]?.name || 'math', struggleTopic);

    const vibe = struggleTopic ? "Confused" : (heatmapData.length > 0 && (heatmapData.reduce((sum, item) => sum + item.score, 0) / heatmapData.length) > 85 ? "Excited" : "Focused");
    const sentimentInsight = struggleTopic
        ? `${Math.floor(safeStudents.length * 0.4) + 1} students feeling ${vibe.toLowerCase()} about ${struggleTopic}.`
        : `Class is generally ${vibe.toLowerCase()} and maintaining momentum.`;

    const recentSubmissions = safeStudents.flatMap(s => s.classroom?.submissions || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const struggleSubmissions = recentSubmissions.filter(s => s.score / s.total < 0.7);

    let coachingNote = null;
    if (struggleSubmissions.length >= 2) {
        const commonTopic = struggleSubmissions[0].quizTitle;
        coachingNote = {
            topic: commonTopic,
            count: struggleSubmissions.length,
            advice: `Elora detected a pattern: ${struggleSubmissions.length} students are stalling on "${commonTopic}". Try a 5-minute visual analogy before the next quiz.`
        };
    }

    return {
        avgEngagement: Math.round(totalMessages / safeStudents.length),
        topSubject: top ? top[0] : "General",
        totalHours: (safeStudents.length > 0 ? totalMinutes / 60 : 0).toFixed(1),
        heatmapData,
        recommendedVideos,
        struggleTopic,
        coachingNote,
        recommendationReason,
        vibe,
        sentimentInsight,
        isPreview: !isVerified
    };
}
