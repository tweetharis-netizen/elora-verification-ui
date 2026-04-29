export const DEMO_USER_IDS = new Set(['teacher_1', 'student_1', 'parent_1']);

export const isDemoRoutePath = (pathname: string): boolean => pathname.includes('/demo');

export const isDemoUserId = (userId?: string | null): boolean => {
    if (!userId) {
        return false;
    }

    return DEMO_USER_IDS.has(userId);
};

export const isDemoContext = (pathname: string, userId?: string | null): boolean => {
    return isDemoRoutePath(pathname) || isDemoUserId(userId);
};