import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Sparkles, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import * as dataService from '../services/dataService';
import { SectionSkeleton } from '../components/ui/SectionStates';
import EloraAssistantCard from '../components/EloraAssistantCard';
import { inferClassTheme } from '../lib/classTheme';

import {
    ClassroomHeader,
    ClassroomTabs,
    PeopleTab
} from '../components/classroom/ClassroomComponents';

type ParentClassroomTab = 'overview' | 'work' | 'people';
const VALID_TABS: ParentClassroomTab[] = ['overview', 'work', 'people'];

export default function ParentClassroomPage() {
    const { childId, classId } = useParams<{ childId: string, classId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [childName, setChildName] = useState('Child');
    const [currentClass, setCurrentClass] = useState<any>(null);
    const [upcomingWork, setUpcomingWork] = useState<any[]>([]);

    const rawTab = (searchParams.get('tab') || '').toLowerCase();
    const activeTab: ParentClassroomTab = VALID_TABS.includes(rawTab as ParentClassroomTab)
        ? (rawTab as ParentClassroomTab)
        : 'overview';

    const handleTabChange = (tab: ParentClassroomTab) => {
        const next = new URLSearchParams(searchParams);
        next.set('tab', tab);
        setSearchParams(next, { replace: true });
    };

    useEffect(() => {
        const loadPageData = async () => {
            setLoading(true);
            try {
                // Here we would typically fetch the child's info and the class info
                // We mock it for the demo
                setChildName(childId === 'demo-student-jordan' ? 'Jordan Lee' : 'Your Child');
                
                let foundClass = {
                    id: classId || 'demo-class-1',
                    name: 'Sec 3 Mathematics',
                    subject: 'Mathematics',
                    teacher: 'Ms Tan',
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

                setUpcomingWork([
                    { id: '1', title: 'Algebra Quiz 1', type: 'Quiz', status: 'Overdue', dueDate: new Date(Date.now() - 3 * 86400000).toISOString() },
                    { id: '2', title: 'Geometry Intro', type: 'Assignment', status: 'Upcoming', dueDate: new Date(Date.now() + 2 * 86400000).toISOString() }
                ]);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        loadPageData();
    }, [childId, classId]);

    const currentTheme = currentClass ? inferClassTheme(currentClass) : undefined;

    const formatDateTime = (isoString?: string) => {
        if (!isoString) return 'No due date';
        const d = new Date(isoString);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="flex h-screen bg-[#FDFBF5] flex-col overflow-hidden font-sans">
            <header className="h-14 bg-white border-b border-[#EAE7DD] flex items-center justify-between px-4 lg:px-6 shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/parent/demo')} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
                        <ChevronLeft size={16} /> Back to Dashboard
                    </button>
                </div>
                <div className="font-bold text-slate-800 text-lg">Elora Family</div>
            </header>

            <main className="flex-1 overflow-y-auto w-full relative">
                <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 pb-24">
                    {loading ? (
                        <SectionSkeleton rows={3} />
                    ) : (
                        <div className="flex flex-col">
                            <div className="flex flex-col">
                                <ClassroomHeader 
                                    currentClass={currentClass} 
                                    classroomTitle={`${childName.split(' ')[0]}'s ${currentClass?.name}`}
                                    role="parent"
                                    themeColor={currentTheme?.themeColor}
                                    bannerStyle={currentTheme?.bannerStyle}
                                    playfulBackground={currentTheme?.playfulBackground}
                                    sublines={[
                                        `Child: ${childName}`,
                                        `Teacher: ${currentClass?.teacher}`
                                    ]}
                                />
                                <ClassroomTabs 
                                    activeTab={activeTab} 
                                    onTabChange={handleTabChange}
                                    themeColor={currentTheme?.themeColor}
                                    bannerStyle={currentTheme?.bannerStyle}
                                    subject={currentClass?.subject}
                                    currentClass={currentClass}
                                    tabs={[
                                        { id: 'overview', label: 'Overview' },
                                        { id: 'work', label: 'Work' },
                                        { id: 'people', label: 'People' },
                                    ]}
                                />
                            </div>

                            <section className="bg-white border border-[#EAE7DD] shadow-sm p-4 lg:p-6 rounded-2xl">
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-5 shadow-sm">
                                            <div className="flex items-center gap-3 mb-2">
                                                <AlertCircle className="w-5 h-5 text-orange-600" />
                                                <h3 className="text-orange-800 font-bold text-lg">Needs Attention</h3>
                                            </div>
                                            <p className="text-orange-700 text-sm ml-8">
                                                {childName.split(' ')[0]} has 1 overdue assignment and is struggling with Algebra – Factorisation.
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-teal-600" /> Elora Insights
                                            </h4>
                                            <EloraAssistantCard
                                                role="parent"
                                                assistantName="Elora"
                                                title={`Insights for ${childName}`}
                                                description="Get AI-powered insights about your child's progress."
                                                accentClasses={{
                                                    chipBg: 'bg-teal-50 hover:bg-teal-100',
                                                    buttonBg: 'bg-teal-600 hover:bg-teal-700',
                                                    iconBg: 'bg-teal-100',
                                                    text: 'text-teal-900',
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'work' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Work & Assignments</h3>
                                            <p className="text-sm text-slate-500 mt-1">Status of {childName.split(' ')[0]}'s recent and upcoming work.</p>
                                        </div>
                                        
                                        <div className="divide-y divide-[#EAE7DD] border border-[#EAE7DD] rounded-xl overflow-hidden">
                                            {upcomingWork.map(work => (
                                                <div key={work.id} className="p-4 flex flex-wrap gap-4 items-center justify-between hover:bg-slate-50 transition-colors">
                                                    <div>
                                                        <h4 className="font-semibold text-slate-800">{work.title}</h4>
                                                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {formatDateTime(work.dueDate)}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-600">
                                                            {work.type}
                                                        </span>
                                                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                                                            work.status === 'Overdue' ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-800'
                                                        }`}>
                                                            {work.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'people' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Teacher Connection</h3>
                                        </div>
                                        
                                        <div className="bg-white border border-[#EAE7DD] rounded-2xl overflow-hidden shadow-sm">
                                            <div className="border-b border-[#EAE7DD] bg-slate-50 px-5 py-3">
                                                <h4 className="text-sm font-semibold text-slate-700">Class Teacher</h4>
                                            </div>
                                            <div className="px-5 py-4">
                                                <div className="flex items-center gap-3 w-full">
                                                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                                                        <span className="text-teal-700 font-bold">MT</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-900">{currentClass?.teacher || 'Teacher'}</span>
                                                        <button className="text-teal-600 text-sm font-medium hover:underline text-left">Message Teacher</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
