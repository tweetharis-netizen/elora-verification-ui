import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import * as dataService from '../services/dataService';
import { SectionSkeleton } from '../components/ui/SectionStates';
import { inferClassTheme } from '../lib/classTheme';
import { useDemoMode } from '../hooks/useDemoMode';
import { demoStudentClasses, demoStudentName } from '../demo/demoStudentScenarioA';

import {
    ClassroomHeader,
    ClassroomTabs,
    StreamLayout,
    ClassworkTab,
    PeopleTab,
    GradesTab
} from '../components/classroom/ClassroomComponents';
import { ClassroomBreadcrumb } from '../components/layout/ClassroomBreadcrumb';

type ClassroomTab = 'stream' | 'classwork' | 'people' | 'grades';
const VALID_TABS: ClassroomTab[] = ['stream', 'classwork', 'people', 'grades'];

export default function StudentClassroomPage() {
    const { classId } = useParams<{ classId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { currentUser, login } = useAuth();
    const isDemo = useDemoMode();

    const [loading, setLoading] = useState(true);
    const [currentClass, setCurrentClass] = useState<any>(null);
    const [streamItems, setStreamItems] = useState<any[]>([]);
    const [topicGroups, setTopicGroups] = useState<any[]>([]);

    // Using simple mock state for UI responsiveness
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [isComposerAIMode, setIsComposerAIMode] = useState(false);
    const [composerText, setComposerText] = useState("");
    const [teacherAnnouncements, setTeacherAnnouncements] = useState<any[]>([]);

    // Ensure demo user is "logged in" for backend headers (but don't persist to localStorage)
    useEffect(() => {
        if (isDemo && currentUser?.id !== 'student_1' && typeof login === 'function') {
            login('student', undefined, false);
        }
    }, [isDemo, currentUser, login]);

    const rawTab = (searchParams.get('tab') || '').toLowerCase();
    const activeTab: ClassroomTab = VALID_TABS.includes(rawTab as ClassroomTab)
        ? (rawTab as ClassroomTab)
        : 'stream';

    const handleTabChange = (tab: ClassroomTab) => {
        const next = new URLSearchParams(searchParams);
        next.set('tab', tab);
        setSearchParams(next, { replace: true });
    };

    useEffect(() => {
        const loadClassData = async () => {
            setLoading(true);
            try {
                let classes: any[] = [];

                // In demo mode, use demo data; otherwise, fetch from API
                if (isDemo) {
                    classes = demoStudentClasses;
                } else {
                    try {
                        classes = await dataService.getStudentClasses();
                    } catch (err) {
                        // If RedirectError or 403, redirect to login
                        if (err instanceof dataService.RedirectError) {
                            navigate(err.to);
                            return;
                        }
                        throw err;
                    }
                }

                let foundClass = classes.find(c => c.id === classId || c.id === 'demo-class-1') || {
                    id: classId,
                    name: 'Sec 3 Mathematics',
                    subject: 'Mathematics',
                    teacherName: 'Mr. Michael Lee',
                    joinCode: 'X7B9Q2M',
                    enrolledAt: new Date().toISOString(),
                };

                try {
                    const saved = localStorage.getItem('elora.classSettings');
                    if (saved) {
                        const overrides = JSON.parse(saved);
                        if (overrides[foundClass.id]) {
                            foundClass = { ...foundClass, ...overrides[foundClass.id] };
                        }
                    }
                } catch (e) {
                    console.error('Failed to parse class settings', e);
                }

                setCurrentClass(foundClass);

                // Mocking stream data for the student
                setStreamItems([
                    { id: '1', type: 'assignment', badgeLabel: 'Needs attention', message: 'Posted a new assignment: Algebra Quiz 1', meta: 'Due Tomorrow' },
                    { id: '2', type: 'announcement', badgeLabel: 'New', message: 'Reminder: Bring calculators tomorrow', meta: 'Yesterday' }
                ]);

                // Mocking classwork topic groups
                setTopicGroups([
                    {
                        topicId: 't1', topicName: 'Algebra', items: [
                            { id: 'a1', title: 'Algebra Quiz 1', type: 'Quiz', status: 'Needs attention', dueLabel: 'Tomorrow' }
                        ]
                    },
                    {
                        topicId: 't2', topicName: 'Geometry', items: [
                            { id: 'a2', title: 'Intro to Shapes', type: 'Assignment', status: 'Submitted', dueLabel: 'Next Week' }
                        ]
                    }
                ]);

            } catch (err) {
                console.error('Failed to load classroom data:', err);
                // If there was an unhandled error and we're not in demo mode, redirect to login as a fallback
                if (!isDemo) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        loadClassData();
    }, [classId, isDemo, navigate]);

    const currentTheme = currentClass ? inferClassTheme(currentClass) : undefined;

    return (
        <div className="flex h-screen bg-[#FDFBF5] flex-col overflow-hidden font-sans">
            <header className="h-14 bg-white border-b border-[#EAE7DD] flex items-center justify-between px-4 lg:px-6 shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard/student')} className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors">
                        <ChevronLeft size={16} /> Back to Dashboard
                    </button>
                </div>
                <div className="font-bold text-slate-800 text-lg">Elora Student</div>
            </header>

            <main className="flex-1 overflow-y-auto w-full relative">
                <div className="max-w-[1000px] mx-auto px-4 lg:px-8 py-6 pb-24">
                    {loading ? (
                        <SectionSkeleton rows={3} />
                    ) : (
                        <div className="flex flex-col">
                            <ClassroomBreadcrumb
                                items={[
                                    { label: 'Classes', href: isDemo ? '/student/demo/classes' : '/student/classes' },
                                    { label: currentClass?.name || 'Classroom' }
                                ]}
                            />
                            <div className="flex flex-col">
                                <ClassroomHeader
                                    currentClass={currentClass}
                                    classroomTitle={currentClass?.name || 'Classroom'}
                                    role="student"
                                    themeColor={currentTheme?.themeColor}
                                    bannerStyle={currentTheme?.bannerStyle}
                                    playfulBackground={currentTheme?.playfulBackground}
                                />

                                <ClassroomTabs
                                    activeTab={activeTab}
                                    onTabChange={handleTabChange}
                                    themeColor={currentTheme?.themeColor}
                                    bannerStyle={currentTheme?.bannerStyle}
                                    subject={currentClass?.subject}
                                    currentClass={currentClass}
                                    role="student"
                                />
                            </div>

                            <section className="bg-white border border-[#EAE7DD] shadow-sm p-4 lg:p-6 rounded-2xl">
                                {activeTab === 'stream' && (
                                    <StreamLayout 
                                        role="student"
                                        isComposerOpen={isComposerOpen}
                                        setIsComposerOpen={setIsComposerOpen}
                                        isComposerAIMode={isComposerAIMode}
                                        setIsComposerAIMode={setIsComposerAIMode}
                                        composerText={composerText}
                                        setComposerText={setComposerText}
                                        teacherAnnouncements={teacherAnnouncements}
                                        setTeacherAnnouncements={setTeacherAnnouncements}
                                        displayName={currentUser?.name || "Student"}
                                        classroomStreamItems={streamItems}
                                        onNavigateToWork={() => handleTabChange('classwork')}
                                        themeColor={currentTheme?.themeColor}
                                        bannerStyle={currentTheme?.bannerStyle}
                                        playfulBackground={currentTheme?.playfulBackground}
                                        subject={currentClass?.subject}
                                        currentClass={currentClass}
                                    />
                                )}

                                {activeTab === 'classwork' && (
                                    <ClassworkTab 
                                        role="student"
                                        classroomTopicGroups={topicGroups}
                                        onNavigateToWork={() => handleTabChange('classwork')}
                                        themeColor={currentTheme?.themeColor}
                                        bannerStyle={currentTheme?.bannerStyle}
                                        subject={currentClass?.subject}
                                        currentClass={currentClass}
                                    />
                                )}

                                {activeTab === 'people' && (
                                    <PeopleTab 
                                        role="student"
                                        currentClass={currentClass} 
                                    />
                                )}

                                {activeTab === 'grades' && (
                                    <GradesTab 
                                        role="student"
                                        currentClass={currentClass}
                                        themeColor={currentTheme?.themeColor}
                                        bannerStyle={currentTheme?.bannerStyle}
                                        subject={currentClass?.subject}
                                    />
                                )}
                            </section>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
