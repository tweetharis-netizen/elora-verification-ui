import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import TeacherDashboardPage from './TeacherDashboardPage';

type ClassroomTab = 'stream' | 'classwork' | 'people' | 'grades';
const VALID_TABS: ClassroomTab[] = ['stream', 'classwork', 'people', 'grades'];

export default function TeacherClassroomPage() {
    const { classId } = useParams<{ classId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();

    const rawTab = (searchParams.get('tab') || '').toLowerCase();
    const activeTab: ClassroomTab = VALID_TABS.includes(rawTab as ClassroomTab)
        ? (rawTab as ClassroomTab)
        : 'stream';

    const handleTabChange = (tab: ClassroomTab) => {
        const next = new URLSearchParams(searchParams);
        next.set('tab', tab);
        setSearchParams(next, { replace: true });
    };

    return (
        <TeacherDashboardPage
            initialClassId={classId}
            initialClassroomTab={activeTab}
            forcedClassroomMode
        />
    );
}
