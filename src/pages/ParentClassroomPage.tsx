import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Sparkles, Clock, AlertCircle } from 'lucide-react';
import { SectionSkeleton } from '../components/ui/SectionStates';
import EloraAssistantCard from '../components/EloraAssistantCard';
import { inferClassTheme } from '../lib/classTheme';
import { useDemoMode } from '../hooks/useDemoMode';

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
    const isDemo = useDemoMode();
    
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
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6 pb-24 w-full">
            {loading ? (
                <SectionSkeleton rows={3} />
            ) : (
                <div className="flex flex-col">
                    <div className="flex flex-col">
                        <ClassroomHeader
                            currentClass={currentClass}
                            classroomTitle={`${childName.split(' ')[0]}'s ${currentClass?.name}`}
                            role="parent"
                            leftUtilityBadge={currentClass?.subject || 'Class Info'}
                            rightUtilityBadge="Grade"
                            themeColor="orange"
                            bannerStyle={currentTheme?.bannerStyle}
                            playfulBackground={currentTheme?.playfulBackground}
                            sublines={[`Child: ${childName}`, `Teacher: ${currentClass?.teacher}`]}
                        />
                        <ClassroomTabs
                            activeTab={activeTab}
                            onTabChange={handleTabChange}
                            role="parent"
                            themeColor="orange"
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

                    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] gap-6 items-start mt-6">
                        <aside className="space-y-6 xl:sticky xl:top-6">
                            <section className="bg-white border border-[#EAEAEA] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                                <div className="px-4 py-3 border-b border-[#EAEAEA] bg-slate-50/40">
                                    <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">Child Snapshot</p>
                                    <h3 className="mt-1 text-base font-semibold tracking-tight text-slate-900">Overview</h3>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {upcomingWork.slice(0, 3).map((work) => (
                                        <div key={work.id} className="px-4 py-3">
                                            <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">{work.type}</p>
                                            <p className="text-sm font-semibold text-slate-900 mt-1 truncate">{work.title}</p>
                                            <p className={`text-sm mt-1 ${work.status === 'Overdue' ? 'font-semibold text-[#9F1239]' : 'text-slate-500'}`}>
                                                {work.status === 'Overdue' ? 'Overdue' : formatDateTime(work.dueDate)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </aside>

                        <section className="w-full max-w-[800px] xl:justify-self-end bg-white border border-[#EAEAEA] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 lg:p-6">
                            {activeTab === 'people' ? (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Teacher Connection</h3>
                                    </div>

                                    <div className="bg-white border border-[#EAE7DD] rounded-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                        <div className="border-b border-[#EAE7DD] bg-slate-50 px-5 py-3">
                                            <h4 className="text-sm font-semibold text-slate-700">Class Teacher</h4>
                                        </div>
                                        <div className="px-5 py-4">
                                            <div className="flex items-center gap-3 w-full">
                                                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                                                    <span className="font-semibold">MT</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900">{currentClass?.teacher || 'Teacher'}</span>
                                                    <button className="text-teal-600 text-sm font-medium hover:underline text-left">Message Teacher</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {activeTab === 'overview' && (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
                                                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Current Grade</p>
                                                    <p className="text-3xl font-black text-[#DB844A]">B+</p>
                                                </div>
                                                <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
                                                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Completion</p>
                                                    <p className="text-3xl font-black text-emerald-600">92%</p>
                                                </div>
                                                <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
                                                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Class Rank</p>
                                                    <p className="text-3xl font-black text-blue-600">Top 25%</p>
                                                </div>
                                            </div>

                                            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 shadow-sm">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <AlertCircle className="w-5 h-5 text-[#9F1239]" />
                                                    <h3 className="text-[#9F1239] font-semibold text-lg tracking-tight">Needs Attention</h3>
                                                </div>
                                                <p className="text-slate-700 text-sm ml-8">
                                                    {childName.split(' ')[0]} has 1 overdue assignment and is struggling with Algebra - Factorisation.
                                                </p>
                                            </div>

                                            <div>
                                                <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2 tracking-tight">
                                                    <Sparkles className="w-4 h-4 text-[#DB844A]" /> Elora Insights
                                                </h4>
                                                <EloraAssistantCard
                                                    role="parent"
                                                    assistantName="Elora"
                                                    title={`Insights for ${childName}`}
                                                    description="Get AI-powered insights about your child's progress."
                                                    accentClasses={{
                                                        chipBg: 'bg-[#DB844A]/10 hover:bg-[#DB844A]/20',
                                                        buttonBg: 'bg-[#DB844A] hover:bg-[#DB844A]/90',
                                                        iconBg: 'bg-[#DB844A]/20',
                                                        text: 'text-orange-900',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'work' && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Detailed Reports</h3>
                                                <p className="text-sm text-slate-500 mt-1">Status of {childName.split(' ')[0]}'s recent and upcoming work.</p>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3">
                                                {upcomingWork.map((work) => (
                                                    <div key={work.id} className="bg-white border border-[#EAEAEA] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 flex flex-wrap gap-4 items-center justify-between hover:bg-slate-50 transition-colors">
                                                        <div className="min-w-0 flex items-start gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                                                                <Clock className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">{work.type}</p>
                                                                <h4 className="font-semibold text-slate-800">{work.title}</h4>
                                                                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                                                                    {formatDateTime(work.dueDate)}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-600 uppercase tracking-widest">
                                                                {work.type}
                                                            </span>
                                                            <span className={`text-xs font-semibold px-2 py-1 rounded ${work.status === 'Overdue' ? 'bg-rose-50 text-[#9F1239]' : 'bg-teal-100 text-teal-800'}`}>
                                                                {work.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
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
