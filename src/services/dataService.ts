// src/services/dataService.ts
import * as mockData from './mockData';

export const getTeacherStats = () => {
    return Promise.resolve(mockData.stats);
};

export const getMyClasses = () => {
    return Promise.resolve(mockData.classes);
};

export const getUpcomingAssignments = () => {
    return Promise.resolve(mockData.upcomingAssignments);
};

export const getRecentActivities = () => {
    return Promise.resolve(mockData.activities);
};

export const getLeaderboardData = () => {
    return Promise.resolve(mockData.leaderboard);
};

export const getTeacherProfile = () => {
    return Promise.resolve(mockData.teacher);
};
