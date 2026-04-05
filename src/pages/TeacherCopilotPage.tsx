import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    Target,
    Users,
    Settings,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    Sparkles,
    Send,
    Plus,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    ArrowRight,
    AlertCircle,
    Layers,
    Check,
    GraduationCap
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { EloraLogo } from '../components/EloraLogo';
import { useDemoMode } from '../hooks/useDemoMode';
import { DemoBanner } from '../components/DemoBanner';
import { DemoRoleSwitcher } from '../components/DemoRoleSwitcher';
import { demoTeacherName, DEMO_CLASS_LEVEL, demoInsights, demoClasses } from '../demo/demoTeacherScenarioA';
import * as dataService from '../services/dataService';
import { 
    CopilotLayout, 
    CopilotMessageBubble, 
    CopilotEmptyState, 
    CopilotMobileHeader,
    CopilotAuthGate,
    Message, 
    Step, 
    ActionChip,
    shouldShowFeedback
} from '../components/Copilot/CopilotShared';
import { askElora } from '../services/askElora';


// MOCK_CLASSES removed in favor of dynamic classList state

const HorizontalChips: React.FC<{ 
    prompts: string[], 
    onSend: (p: string) => void, 
    themeColor: string 
}> = ({ prompts, onSend, themeColor }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showOverlay, setShowOverlay] = useState(false);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollWidth, clientWidth } = scrollRef.current;
            setShowOverlay(scrollWidth > clientWidth);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [prompts]);

    return (
        <div className="relative flex-1 min-w-0">
            <div 
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pr-8"
            >
                {prompts.map((prompt, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSend(prompt)}
                        className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border whitespace-nowrap transition-colors"
                        style={{
                            backgroundColor: themeColor + '0d',
                            borderColor: themeColor + '33',
                            color: themeColor
                        }}
                    >
                        {prompt}
                    </button>
                ))}
            </div>
            {showOverlay && (
                <div 
                    className="absolute right-0 top-0 h-[calc(100%-4px)] w-8 pointer-events-none rounded-r-full"
                    style={{ 
                        background: `linear-gradient(to right, transparent, white)`
                    }}
                />
            )}
        </div>
    );
};


const TeacherCopilotPage: React.FC = () => {
    const { isVerified, logout, currentUser } = useAuth();
    const navigate = useNavigate();
    const isDemo = useDemoMode();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const displayName = isDemo ? demoTeacherName : (currentUser?.name || 'Teacher');

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(isDemo ? 'demo-class-1' : null);
    const [classList, setClassList] = useState<any[]>([]);
    const [isContextPopupOpen, setIsContextPopupOpen] = useState(false);
    const dataMessageCountRef = useRef(0);
    const [insights, setInsights] = useState<any[]>(isDemo ? demoInsights : []);
    const [teacherStats, setTeacherStats] = useState<any[]>([]);

    const shouldShowFeedback = () => {
        dataMessageCountRef.current += 1;
        return dataMessageCountRef.current % 3 === 0;
    };

    useEffect(() => {
        if (isDemo) {
            setClassList(demoClasses);
        } else {
            // Load all necessary context data for the copilot
            const loadContextData = async () => {
                try {
                    const [classes, stats, rawInsights] = await Promise.all([
                        dataService.getMyClasses(),
                        dataService.getTeacherStats(),
                        dataService.getTeacherInsights()
                    ]);
                    setClassList(classes);
                    setTeacherStats(stats);
                    setInsights(rawInsights);
                } catch (err) {
                    console.error("Failed to load teacher copilot context:", err);
                }
            };
            loadContextData();
        }
    }, [isDemo]);

    const buildPrompts = (): string[] => {
        const topTopic = insights.find(i => i.type === 'weak_topic')?.topicTag ?? null;
        const overdueTitle = insights.find(i => i.type === 'overdue_assignment')?.assignmentTitle ?? null;

        if (!selectedClassId) {
            return [
                'Who needs my attention across all my classes?',
                'Give me a cross-class summary of this week.',
                topTopic
                    ? `How are my classes doing on ${topTopic}?`
                    : 'Which class is furthest behind right now?',
                overdueTitle
                    ? `Draft a parent message about ${overdueTitle} being overdue.`
                    : 'Draft a general update for parents about learning progress.',
            ];
        } else {
            const currentClassNameText = classList.find(c => c.id === selectedClassId)?.name || 'this class';
            return [
                `Which students need my attention before Friday in ${currentClassNameText}?`,
                topTopic
                    ? `How is ${currentClassNameText} doing on ${topTopic}?`
                    : `What's the main thing to work on in ${currentClassNameText}?`,
                overdueTitle
                    ? `Draft a note to parents about ${overdueTitle} being overdue.`
                    : `Draft a parent update for ${currentClassNameText}.`,
                `What should I focus on before the next ${currentClassNameText} lesson?`,
            ];
        }
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial demo state
    useEffect(() => {
        if (isDemo && messages.length === 0) {
            const contextName = classList.find(c => c.id === selectedClassId)?.name || 'All classes';
            setMessages([
                {
                    id: 'msg-1',
                    role: 'user',
                    content: 'Which students need my attention before Friday?'
                },
                {
                    id: 'msg-2',
                    role: 'assistant',
                    steps: [
                        { id: 's0', text: `Context: ${contextName} — scoping all lookups to this class` },
                        { id: 's1', text: 'Loaded Sec 3 Mathematics insights' },
                        { id: 's2', text: 'Filtered to overdue work and low scores' },
                        { id: 's3', text: 'Ranked by urgency' }
                    ],
                    content: 'In Sec 3 Mathematics, three students need your attention before Friday:\n\n**Jordan Lee** — 28% on Algebra Quiz 1 and struggling with factorisation.\n**Priya Nair** — Algebra Quiz 1 not submitted, 3 days overdue.\n**Jordan Smith** — Submitted but scored 20% on the quiz; worth a quick check-in.',
                    actions: [
                        { label: 'See who’s falling behind', actionType: 'navigate', destination: 'needs-attention' }
                    ]
                }
            ]);
        }
    }, [isDemo]);

    // Handle context change side effects
    const handleContextChange = (classId: string | null) => {
        if (classId === selectedClassId) {
            setIsContextPopupOpen(false);
            return;
        }

        setSelectedClassId(classId);
        setIsContextPopupOpen(false);
    };

    const currentPrompts = buildPrompts();
    const currentClass = classList.find(c => c.id === selectedClassId);
    const currentClassName = currentClass?.name || 'All classes';
    const contextPillLabel = currentClassName;

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    const handleSend = async (text: string) => {
        const query = text.trim();
        if (!query) return;

        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: query
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInputValue('');
        setIsThinking(true);

        try {
            const currentClassNameText = selectedClassId
                ? classList.find(c => c.id === selectedClassId)?.name || 'this class'
                : 'all classes';
            
            const contextStep: Step = {
                id: `ctx-${Date.now()}`,
                text: selectedClassId
                    ? `Scoped to ${currentClassNameText} — ${classList.find(c => c.id === selectedClassId)?.studentsCount ?? '?'} students`
                    : `Looking across all your classes (${classList.map(c => c.name).join(', ')})`,
            };

            // Enrichment: Build context from demo/real data
            const classInsights = insights.filter(i => !selectedClassId || i.className === currentClassNameText);
            const overdueCount = classInsights.filter(i => i.type === 'overdue_assignment').length;
            const weakTopics = Array.from(new Set(classInsights.filter(i => i.type === 'weak_topic').map(i => i.topicTag))).filter(Boolean);
            const avgScore = teacherStats.find(s => s.label === "Avg. Class Score")?.value || "68%";

            const contextStr = [
                `You are currently looking at ${currentClassNameText}.`,
                `Average class score: ${avgScore}.`,
                overdueCount > 0 ? `There are ${overdueCount} overdue assignments.` : 'No assignments are currently overdue.',
                weakTopics.length > 0 ? `Students are struggling with: ${weakTopics.join(', ')}.` : '',
                `Total classes: ${classList.length}.`
            ].filter(Boolean).join(' ');

            const response = await askElora({
                message: query,
                role: 'teacher',
                context: contextStr
            });

            const assistantMsg: Message = {
                id: Date.now().toString() + '-a',
                role: 'assistant',
                steps: [contextStep],
                content: response,
                showFeedback: shouldShowFeedback()
            };

            setMessages(prev => [...prev, assistantMsg]);
        } catch (error) {
            console.error('Teacher Copilot Error:', error);
            const errorMsg: Message = {
                id: Date.now().toString() + '-err',
                role: 'assistant',
                content: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again or check your connection!"
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleActionClick = (action: ActionChip) => {
        if (action.actionType === 'navigate') {
            if (action.destination === 'needs-attention') {
                navigate(isDemo ? '/teacher/demo' : '/dashboard/teacher');
                // Note: ideally we tab-switch or scroll to Needs Attention, but navigating back is fine for v1
            } else if (action.destination) {
                navigate(action.destination);
            }
        }
    };

    return (
        <CopilotLayout
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            isDemo={isDemo}
            role="Teacher"
            themeColor="#14b8a6"
            logout={logout}
            navigate={navigate}
            demoBanner={isDemo && <DemoBanner />}
            demoRoleSwitcher={isDemo && <DemoRoleSwitcher />}
            sidebar={
                <>
                    <div className="p-6 border-b border-[#EAE7DD]">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-1">Copilot</h2>
                        <p className="text-sm font-medium text-teal-600 flex items-center gap-1.5">
                            <Sparkles size={14} />
                            Connected to class data
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 no-scrollbar">
                        {/* Primary Teacher Navigation */}
                        <div className="space-y-1.5 pb-4 border-b border-slate-100">
                            <button
                                onClick={() => navigate(isDemo ? '/teacher/demo' : '/dashboard/teacher')}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            >
                                <LayoutDashboard size={18} />
                                <span>Dashboard</span>
                            </button>
                            <button
                                onClick={() => navigate(isDemo ? '/teacher/demo/classes' : '/teacher/classes')}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            >
                                <BookOpen size={18} />
                                <span>My Classes</span>
                            </button>
                            <button
                                onClick={() => navigate(isDemo ? '/teacher/demo/assignments' : '/teacher/assignments')}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            >
                                <FileText size={18} />
                                <span>Assignments</span>
                            </button>
                            <button
                                onClick={() => navigate(isDemo ? '/teacher/demo/practice' : '/teacher/practice')}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            >
                                <Target size={18} />
                                <span>Practice & quizzes</span>
                            </button>
                            {!isDemo && (
                                <button
                                    onClick={() => navigate('/teacher/copilot')}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-teal-50 text-teal-700 border border-teal-200"
                                >
                                    <Sparkles size={18} />
                                    <span>Copilot</span>
                                </button>
                            )}
                        </div>

                        {/* Context Selection Pill */}
                        <div className="relative">
                            <button
                                onClick={() => setIsContextPopupOpen(!isContextPopupOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 hover:bg-teal-100/80 border border-teal-200 rounded-full text-teal-700 transition-colors w-fit"
                            >
                                {selectedClassId && insights.some(i => i.className === currentClassName) && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                                )}
                                <span className="text-xs font-bold whitespace-nowrap">
                                    {contextPillLabel}
                                </span>
                                <ChevronDown size={14} className={`shrink-0 transition-transform ${isContextPopupOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Desktop Popover */}
                            {isContextPopupOpen && (
                                <>
                                    <div className="fixed inset-0 z-30 hidden md:block" onClick={() => setIsContextPopupOpen(false)} />
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-40 hidden md:block py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-4 py-2 mb-1">
                                            <p className="text-[11px] font-medium text-slate-400">Copilot will answer using data from this class only.</p>
                                        </div>
                                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                            <button
                                                onClick={() => handleContextChange(null)}
                                                className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors ${!selectedClassId ? 'bg-teal-50/50' : ''}`}
                                            >
                                                <div className={`mt-0.5 p-1 rounded-md ${!selectedClassId ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    <GraduationCap size={14} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-bold text-slate-900">All classes</span>
                                                        {!selectedClassId && <Check size={16} className="text-teal-600" />}
                                                    </div>
                                                </div>
                                            </button>
                                            <div className="my-1 border-t border-slate-100" />
                                            {classList.map((cls) => {
                                                const classHasInsight = insights.some(i => i.className === cls.name);
                                                return (
                                                    <button
                                                        key={cls.id}
                                                        onClick={() => handleContextChange(cls.id)}
                                                        className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors ${selectedClassId === cls.id ? 'bg-teal-50/50' : ''}`}
                                                    >
                                                        <div className={`mt-0.5 p-1 rounded-md ${selectedClassId === cls.id ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-500'}`}>
                                                            <BookOpen size={14} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                                                                    {classHasInsight && <span className="inline-block w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-0.5" />}
                                                                    {cls.name}
                                                                </span>
                                                                {selectedClassId === cls.id && <Check size={16} className="text-teal-600" />}
                                                            </div>
                                                            <p className="text-[11px] text-slate-500">{cls.studentsCount} students</p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Prompt Chips */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Suggested Questions</h3>
                            <div className="flex flex-col gap-2">
                                {currentPrompts.map((prompt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSend(prompt)}
                                        className="text-left text-sm text-teal-700 font-medium bg-teal-50 border border-teal-100 hover:bg-teal-100 hover:border-teal-200 transition-colors px-4 py-3 rounded-xl flex items-start gap-2"
                                    >
                                        <span className="flex-1 leading-snug">{prompt}</span>
                                        <ArrowRight size={16} className="shrink-0 text-teal-500 opacity-50 mt-0.5" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-[#EAE7DD]">
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            I'm best at questions about class data, assessment feedback, communication drafts, and topic explanations based on your Elora records.
                        </p>
                    </div>
                </>
            }
        >
            <CopilotMobileHeader themeColor="#14b8a6" />

            {isDemo ? (
                <CopilotAuthGate role="Teacher" themeColor="#14b8a6" />
            ) : (
                <>
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                    {messages.length === 0 ? (
                    <CopilotEmptyState
                        themeColor="#14b8a6"
                        userName={displayName}
                        description="I can uncover trends in your classes, draft feedback or messages, explain topics, and prioritize students who need your support."
                        prompts={currentPrompts}
                        handleSend={handleSend}
                    />
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#EAE7DD]">
                            <div className="flex items-center gap-3">
                                <div className="bg-teal-50 p-2 rounded-xl border border-teal-100 hidden md:block">
                                    <Sparkles className="w-6 h-6 text-teal-600" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-900 leading-tight">Copilot</h1>
                                    <p className="text-sm text-slate-500 font-medium">
                                        Your classroom AI assistant
                                    </p>
                                </div>
                            </div>

                            {/* Context Selection Pill */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsContextPopupOpen(!isContextPopupOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 hover:bg-teal-100/80 border border-teal-200 rounded-full text-teal-700 transition-colors w-fit shadow-sm"
                                >
                                     <Layers size={14} className="shrink-0" />
                                     {selectedClassId && insights.some(i => i.className === currentClassName) && (
                                         <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                                     )}
                                     <span className="text-xs font-bold whitespace-nowrap">
                                         {contextPillLabel}
                                     </span>
                                     <ChevronDown size={14} className={`shrink-0 transition-transform ${isContextPopupOpen ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {messages.map((msg) => (
                            <CopilotMessageBubble
                                key={msg.id}
                                message={msg}
                                themeColor="#14b8a6"
                                onActionClick={handleActionClick}
                                shouldAutoExpandSteps={messages.filter(m => m.role === 'assistant' && m.steps && m.steps.length > 0).findIndex(m => m.id === msg.id) < 3}
                                copilotRole="teacher"
                                showFeedback={msg.showFeedback}
                            />
                        ))}
                    </>
                )}

                {isThinking && (
                    <div className="flex w-full justify-start">
                        <div className="max-w-[85%] md:max-w-xl">
                            <div className="bg-white border border-[#EAE7DD] px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            <div className="p-4 md:p-6 bg-white border-t border-[#EAE7DD]">
                <div className="max-w-4xl mx-auto space-y-4">
                    <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-white">
                        <button
                            onClick={() => setIsContextPopupOpen(true)}
                            className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-[11px] font-bold border border-teal-200 whitespace-nowrap"
                        >
                            <Layers size={12} />
                             {selectedClassId && insights.some(i => i.className === currentClassName) && (
                                 <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                             )}
                             {contextPillLabel}
                         </button>
                        <HorizontalChips prompts={currentPrompts} onSend={handleSend} themeColor="#14b8a6" />
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMessages([])}
                            className="h-[52px] w-[52px] flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl shrink-0"
                        >
                            <Plus size={20} />
                        </button>
                        <div className="flex-1 relative">
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(inputValue);
                                    }
                                }}
                                placeholder="Ask about your class..."
                                className="w-full bg-[#F8F9FA] border border-[#EAE7DD] rounded-xl pl-4 pr-12 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none min-h-[52px] max-h-32"
                                rows={1}
                                style={{ height: '52px' }}
                            />
                            <button
                                onClick={() => handleSend(inputValue)}
                                disabled={!inputValue.trim() || isThinking}
                                className="absolute right-2.5 top-3 p-1.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-lg transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isContextPopupOpen && (
                <div className="md:hidden fixed inset-0 z-[60] flex flex-col justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setIsContextPopupOpen(false)} />
                    <div className="relative bg-white rounded-t-3xl shadow-2xl p-6 flex flex-col max-h-[70%]">
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 shrink-0" />
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Select Context</h3>
                        <p className="text-sm text-slate-500 mb-6">Copilot will answer using data from this class only.</p>
                        <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pb-6 no-scrollbar">
                            <button
                                onClick={() => handleContextChange(null)}
                                className={`w-full text-left px-4 py-4 rounded-2xl flex items-center gap-4 ${!selectedClassId ? 'bg-teal-50 border-2 border-teal-200' : 'bg-slate-50 border-2 border-transparent'}`}
                            >
                                <div className={`p-2 rounded-xl ${!selectedClassId ? 'bg-teal-100 text-teal-600' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                    <GraduationCap size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="text-[15px] font-bold text-slate-900">All classes</div>
                                </div>
                                 {!selectedClassId && <Check size={20} className="text-teal-600" />}
                             </button>
                             {classList.map((cls) => {
                                const classHasInsight = insights.some(i => i.className === cls.name);
                                return (
                                    <button
                                        key={cls.id}
                                        onClick={() => handleContextChange(cls.id)}
                                        className={`w-full text-left px-4 py-4 rounded-2xl flex items-center gap-4 ${selectedClassId === cls.id ? 'bg-teal-50 border-2 border-teal-200' : 'bg-slate-50 border-2 border-transparent'}`}
                                    >
                                        <div className={`p-2 rounded-xl ${selectedClassId === cls.id ? 'bg-teal-100 text-teal-600' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                            <BookOpen size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                {classHasInsight && <span className="inline-block w-2 h-2 rounded-full bg-orange-500 shrink-0" />}
                                                <span className="text-[15px] font-bold text-slate-900">{cls.name}</span>
                                            </div>
                                        </div>
                                        {selectedClassId === cls.id && <Check size={20} className="text-teal-600" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            </>
        )}
        </CopilotLayout>
    );
};

export default TeacherCopilotPage;

