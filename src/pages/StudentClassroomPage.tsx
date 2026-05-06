import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
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
    AssignmentsPracticeTab,
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
    const [streamItems, setStreamItems] = useState<dataService.ClassroomStreamItemMock[]>([]);
    const [assignments, setAssignments] = useState<dataService.ClassroomAssignmentMock[]>([]);
    const [practices, setPractices] = useState<dataService.ClassroomPracticeMock[]>([]);
    const [people, setPeople] = useState<dataService.ClassroomPersonMock[]>([]);

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

                const classroomMockData = await dataService.getStudentClassroomMockData(foundClass.id);
                setStreamItems(classroomMockData.streamItems);
                setAssignments(classroomMockData.assignments);
                setPractices(classroomMockData.practices);
                setPeople(classroomMockData.people);

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
    const classroomUpcoming = [...assignments, ...practices]
        .filter(item => ['overdue', 'due_soon', 'upcoming'].includes(item.studentStatus || item.status))
        .slice(0, 4);

    const classroomPeople = people.filter((person) => person.role === 'student');
    const currentClassWithPeople = { ...currentClass, students: classroomPeople };

    return (
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6 pb-24 w-full">
            {loading ? (
                <SectionSkeleton rows={3} />
            ) : (
                <div className="flex flex-col">
                    <ClassroomBreadcrumb
                        items={[
                            { label: 'Classes', href: isDemo ? '/student/demo/classes' : '/student/classes' },
                            { label: currentClass?.name || 'Classroom' },
                        ]}
                    />

                    <div className="flex flex-col">
                        <ClassroomHeader
                            currentClass={currentClass}
                            classroomTitle={currentClass?.name || 'Classroom'}
                            role="student"
                            leftUtilityBadge={currentClass?.subject || 'Mathematics'}
                            rightUtilityBadge="Progress"
                            themeColor="teal"
                            bannerStyle={currentTheme?.bannerStyle}
                            playfulBackground={currentTheme?.playfulBackground}
                        />

                        <ClassroomTabs
                            activeTab={activeTab}
                            onTabChange={handleTabChange}
                            themeColor="teal"
                            bannerStyle={currentTheme?.bannerStyle}
                            subject={currentClass?.subject}
                            currentClass={currentClass}
                            role="student"
                        />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] gap-6 items-start mt-6">
                        <aside className="space-y-6 xl:sticky xl:top-6">
                            <section className="bg-white border border-[#EAEAEA] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                                <div className="px-4 py-3 border-b border-[#EAEAEA] bg-slate-50/40">
                                    <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Due Soon</p>
                                    <h3 className="mt-1 text-base font-semibold tracking-tight text-slate-900">Upcoming</h3>
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {classroomUpcoming.length > 0 ? classroomUpcoming.map((item) => {
                                        const dueText = 'dueDate' in item && item.dueDate ? new Date(item.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Soon';
                                        const isUrgent = String(item.studentStatus || item.status || '').toLowerCase().includes('overdue');
                                        const itemLabel = 'questionCount' in item ? 'Practice' : 'Assignment';

                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => handleTabChange('classwork')}
                                                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
                                            >
                                                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">{itemLabel}</p>
                                                <p className="text-sm font-semibold text-slate-900 mt-1 truncate">{item.title}</p>
                                                <p className={`text-sm mt-1 ${isUrgent ? 'font-semibold text-[#9F1239]' : 'text-slate-500'}`}>
                                                    Due {dueText}
                                                </p>
                                            </button>
                                        );
                                    }) : (
                                        <div className="px-4 py-6 text-center">
                                            <p className="text-sm font-medium text-slate-700">No upcoming tasks</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </aside>

                        <section className="w-full max-w-[800px] xl:justify-self-end bg-white border border-[#EAEAEA] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 lg:p-6">
                            {activeTab === 'stream' ? (
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
                                    displayName={currentUser?.name || 'Student'}
                                    classroomStreamItems={streamItems}
                                    onNavigateToWork={() => handleTabChange('classwork')}
                                    themeColor="teal"
                                    bannerStyle={currentTheme?.bannerStyle}
                                    playfulBackground={currentTheme?.playfulBackground}
                                    subject={currentClass?.subject}
                                    currentClass={currentClass}
                                />
                            ) : (
                                <>
                                    {activeTab === 'classwork' && (
                                        <AssignmentsPracticeTab role="student" assignments={assignments} practices={practices} />
                                    )}

                                    {activeTab === 'people' && (
                                        <PeopleTab role="student" currentClass={currentClassWithPeople} />
                                    )}

                                    {activeTab === 'grades' && (
                                        <GradesTab
                                            role="student"
                                            currentClass={currentClass}
                                            themeColor="teal"
                                            bannerStyle={currentTheme?.bannerStyle}
                                            subject={currentClass?.subject}
                                        />
                                    )}
                                </>
                            )}
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
}
