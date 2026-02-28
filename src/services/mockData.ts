// src/services/mockData.ts

export const teacher = {
    name: "Mr. Davis",
    lastActive: "October 12th",
    greetingSuffix: "Good afternoon",
};

export const stats = [
    { label: "Total Classes", value: "5", trend: "Same as last semester", status: "info" },
    { label: "Active Students", value: "142", trend: "+12 this week", status: "success" },
    { label: "Assignments Due", value: "3", trend: "2 need review", status: "warning" },
    { label: "Avg. Class Score", value: "84%", trend: "Highest this semester! \uD83C\uDF1F", status: "success" },
];

export const classes = [
    {
        id: 1,
        name: "Sec 3 Mathematics",
        studentsCount: 32,
        nextTopic: "Algebra II Review",
        time: "10:00 AM",
        status: "success",
        statusMsg: "Class is on track"
    },
    {
        id: 2,
        name: "Sec 4 Physics",
        studentsCount: 28,
        nextTopic: "Kinematics Lab",
        time: "1:00 PM",
        status: "warning",
        statusMsg: "Attendance dropping"
    },
    {
        id: 3,
        name: "Sec 1 Science",
        studentsCount: 40,
        nextTopic: "Cells & Organisms",
        time: "Tomorrow",
        status: "success",
        statusMsg: "Class is on track"
    },
    {
        id: 4,
        name: "Sec 2 Mathematics",
        studentsCount: 42,
        nextTopic: "Geometry Basics",
        time: "Wed",
        status: "success",
        statusMsg: "Scores trending up"
    },
];

export const upcomingAssignments = [
    {
        id: 101,
        title: "Algebra Quiz 1",
        count: "23 students assigned",
        className: "Sec 3 Mathematics",
        status: "warning",
        statusLabel: "DUE TODAY"
    },
    {
        id: 102,
        title: "Kinematics Worksheet",
        count: "Draft - Not published yet",
        className: "Sec 4 Physics",
        status: "info",
        statusLabel: "DRAFT"
    },
];

export const activities = [
    { id: 1, title: "5 students submitted Algebra Quiz 1", time: "10m ago" },
    { id: 2, title: "Sarah Lee joined Sec 3 Mathematics", time: "1h ago" },
];

export const leaderboard = [
    { id: 1, name: "Alex Chen", score: "2,450 pts", rank: 1, streak: "5 week streak!", trend: "up", trendVal: "2" },
    { id: 2, name: "Jordan Smith", score: "2,310 pts", rank: 2, trend: "neutral" },
    { id: 3, name: "Priya Patel", score: "2,180 pts", rank: 3, trend: "down", trendVal: "1" },
];
