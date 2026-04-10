import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    CheckCircle2,
    ChevronDown,
    Sparkles,
    ArrowRight,
    Layers,
    GraduationCap,
    BookOpen,
    Check,
    Zap
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useDemoMode } from '../hooks/useDemoMode';
import { useSidebarState } from '../hooks/useSidebarState';
import { DemoBanner } from '../components/DemoBanner';
import { DemoRoleSwitcher } from '../components/DemoRoleSwitcher';
import { askElora } from '../services/askElora';
import {
    demoStudentData,
    demoStudentStreak,
    demoGameSessions
} from '../demo/demoStudentScenarioA';
import * as dataService from '../services/dataService';
import { 
    CopilotLayout, 
    CopilotMessageBubble, 
    CopilotEmptyState, 
    CopilotMobileHeader,
    CopilotAuthGate,
    Message, 
    ActionChip,
    shouldShowFeedback
} from '../components/Copilot/CopilotShared';

const getIsoWeekKey = (value: Date) => {
    const date = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-${String(weekNo).padStart(2, '0')}`;
};

const buildWeeklyTitle = (subjectLabel: string) => `This week - ${subjectLabel}`;

const topicExplanations: Record<string, string> = {
    'Algebra – Factorisation': "Factorisation is like 'un-multiplying'. You're taking an expression and finding simpler terms that multiply together to make it. For example, x² + 5x + 6 becomes (x+2)(x+3). It's a key skill for solving complex equations later on.",
    'Quadratic Equations': "A quadratic equation is any equation that can be written in the form ax² + bx + c = 0. The graph of these equations always forms a curve called a parabola. They are used everywhere from physics to business to model curved paths or changing rates.",
    'Linear Inequalities': "Inequalities are like equations but use signs like > or < instead of =. They describe a range of possible answers rather than just one. For example, 2x > 6 means x must be any number greater than 3.",
    'Fractions': "Fractions represent parts of a whole. The top number (numerator) tells you how many parts you have, and the bottom number (denominator) tells you how many parts make up the full whole. Adding them is easiest when the denominators are the same!",
    'Kinematics': "Kinematics is the study of motion. We use terms like displacement, velocity, and acceleration to describe how objects move without worrying about the forces that cause the movement. It's the foundation of almost everything in classical physics."
};

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
        <div className="relative md:hidden">
            <div 
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pr-10"
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
                    className="absolute right-0 top-0 h-[calc(100%-4px)] w-10 pointer-events-none rounded-r-full"
                    style={{ 
                        background: `linear-gradient(to right, transparent, white)`
                    }}
                />
            )}
        </div>
    );
};

const StudentCopilotPage: React.FC<{ embeddedInShell?: boolean }> = ({ embeddedInShell = false }) => {
    const { logout, currentUser, login } = useAuth();
    const navigate = useNavigate();
    const isDemo = useDemoMode();
    const isUnauthenticated = isDemo || !currentUser;
    const [isSidebarOpen, setIsSidebarOpen] = useSidebarState(true);
    
    // Context Selector State
    const [selectedSubjectId, setSelectedSubjectId] = useState('all');
    const [isSubjectSelectorOpen, setIsSubjectSelectorOpen] = useState(false);

    // Initialise student data state
    const [assignments, setAssignments] = useState<any[]>([]);
    const [recentPerformance, setRecentPerformance] = useState<any>(null);
    const [streakData, setStreakData] = useState<any>(null);
    const [gameSessions, setGameSessions] = useState<any[]>([]);

    useEffect(() => {
        // Ensure demo user is logically "logged in" (but don't persist to localStorage)
        // Wait: If they are unauthenticated and we show the gate, we might still want the side nav to work
        if (isDemo && currentUser?.id !== 'student_1' && typeof login === 'function') {
            login('student', undefined, false);
        }
    }, [isDemo, currentUser, login]);

    useEffect(() => {
        const fetchData = async () => {
            if (isDemo) {
                setAssignments(demoStudentData.assignments);
                setRecentPerformance(demoStudentData.recentPerformance);
                setStreakData(demoStudentStreak);
                setGameSessions(demoGameSessions);
            } else {
                try {
                    const [studentData, sessions, streak] = await Promise.all([
                        dataService.getStudentAssignments(),
                        dataService.getStudentGameSessions(),
                        dataService.getStudentStreak()
                    ]);
                    setAssignments(studentData.assignments);
                    setRecentPerformance(studentData.recentPerformance);
                    setGameSessions(sessions);
                    setStreakData(streak);
                } catch (err) {
                    console.error("Failed to load live student data", err);
                }
            }
        };
        fetchData();
    }, [isDemo]);

    const [messages, setMessages] = useState<Message[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [activeConversationTitle, setActiveConversationTitle] = useState<string>(buildWeeklyTitle('All subjects'));
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Derived logic from Student Dashboard
    const primaryFocusTopic = recentPerformance?.weakTopics?.[0] ?? null;

    // Derived subjects list for selector
    const subjects = Array.from(new Set(assignments.map(a => a.className))).filter(Boolean);
    const selectedSubjectName = selectedSubjectId === 'all' ? 'All subjects' : selectedSubjectId;
    const weekKey = getIsoWeekKey(new Date());
    const weeklyTitle = buildWeeklyTitle(selectedSubjectName);

    // Filtered data based on context
    const filteredAssignments = selectedSubjectId === 'all' 
        ? assignments 
        : assignments.filter(a => a.className === selectedSubjectId);
    
    const filteredPending = filteredAssignments.filter(a => ['not_started', 'danger', 'warning', 'info'].includes(a.status || ''));

    const currentPrompts = [
        "Do I have any overdue or unfinished assignments?",
        "What's the best use of my next 20 minutes?",
        "Can you give me a summary of how I'm doing this week?",
        "What can you do?"
    ];

    const toUiMessage = (
        persisted: dataService.StudentCopilotConversationMessage,
        conversationId: string,
        conversationTitle: string
    ): Message => {
        return {
            id: persisted.id,
            role: persisted.role,
            content: persisted.content,
            intent: persisted.intent ?? undefined,
            source: persisted.source ?? undefined,
            conversationId,
            threadContext: {
                label: conversationTitle,
            },
            persistedAt: persisted.createdAt,
            showFeedback: persisted.role === 'assistant' ? shouldShowFeedback() : false,
        };
    };

    useEffect(() => {
        if (isDemo || !currentUser || currentUser.role !== 'student') {
            return;
        }

        let cancelled = false;

        const loadConversation = async () => {
            try {
                const conversations = await dataService.listStudentConversations({
                    weekKey,
                });
                if (cancelled) return;

                if (conversations.length === 0) {
                    setActiveConversationId(null);
                    setActiveConversationTitle(weeklyTitle);
                    setMessages([]);
                    return;
                }

                const currentConversation = conversations[0];
                const resolvedTitle = currentConversation.title?.trim() || weeklyTitle;
                setActiveConversationId(currentConversation.id);
                setActiveConversationTitle(resolvedTitle);

                const persistedMessages = await dataService.getStudentConversationMessages(currentConversation.id);
                if (cancelled) return;

                setMessages(
                    persistedMessages.map((persisted) =>
                        toUiMessage(persisted, currentConversation.id, resolvedTitle)
                    )
                );
            } catch (error) {
                console.error('Failed to load student copilot conversation:', error);
            }
        };

        loadConversation();

        return () => {
            cancelled = true;
        };
    }, [isDemo, currentUser?.id, currentUser?.role, weekKey, weeklyTitle]);

    const ensureActiveConversation = async () => {
        if (activeConversationId) {
            return {
                id: activeConversationId,
                title: activeConversationTitle,
            };
        }

        const existing = await dataService.listStudentConversations({ weekKey });
        if (existing.length > 0) {
            const latest = existing[0];
            const resolvedTitle = latest.title?.trim() || weeklyTitle;
            setActiveConversationId(latest.id);
            setActiveConversationTitle(resolvedTitle);
            return {
                id: latest.id,
                title: resolvedTitle,
            };
        }

        const created = await dataService.createStudentConversation({
            weekKey,
            title: weeklyTitle,
            threadType: 'weekly_subject',
        });

        const createdTitle = created.title?.trim() || weeklyTitle;
        setActiveConversationId(created.id);
        setActiveConversationTitle(createdTitle);

        return {
            id: created.id,
            title: createdTitle,
        };
    };

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    const handleSend = async (text: string) => {
        const query = text.trim();
        if (!query) return;

        let conversationIdForMessage: string | null = null;
        let conversationTitleForMessage = activeConversationTitle || weeklyTitle;

        if (!isDemo && currentUser?.role === 'student') {
            try {
                const ensured = await ensureActiveConversation();
                conversationIdForMessage = ensured.id;
                conversationTitleForMessage = ensured.title;
            } catch (error) {
                console.error('Failed to ensure student conversation:', error);
            }
        }

        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: query,
            conversationId: conversationIdForMessage ?? undefined,
            threadContext: {
                label: conversationTitleForMessage,
            },
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInputValue('');
        setIsThinking(true);

        try {
            if (conversationIdForMessage && !isDemo) {
                await dataService.appendStudentConversationMessage(conversationIdForMessage, {
                    role: 'user',
                    content: query,
                    source: 'copilot_page',
                });
            }

            // Build Context for Elora
            const contextStr = [
                `Subject Selector: ${selectedSubjectName}.`,
                primaryFocusTopic ? `Your current focus area is ${primaryFocusTopic}.` : '',
                filteredPending[0] ? `Upcoming/Overdue task: "${filteredPending[0].title}" (Status: ${filteredPending[0].statusLabel || filteredPending[0].status}).` : 'No urgent assignments.',
                streakData ? `Average this week: ${streakData.scoreThisWeek}%. Trend: ${streakData.trend}.` : ''
            ].filter(Boolean).join(' ');

            const response = await askElora({
                message: query,
                role: 'student',
                context: contextStr
            });

            const eloraMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                showFeedback: shouldShowFeedback(),
                conversationId: conversationIdForMessage ?? undefined,
                source: 'copilot_page',
                threadContext: {
                    label: conversationTitleForMessage,
                },
            };

            if (conversationIdForMessage && !isDemo) {
                await dataService.appendStudentConversationMessage(conversationIdForMessage, {
                    role: 'assistant',
                    content: response,
                    source: 'copilot_page',
                });
            }

            setMessages(prev => [...prev, eloraMsg]);
        } catch (error) {
            console.error('Copilot Error:', error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm sorry, I'm having trouble connecting right now. Can we try again in a moment?"
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleActionClick = (action: ActionChip) => {
        if (action.actionType === 'navigate' && action.destination) {
            navigate(action.destination);
        }
    };

    const sidebarContent = (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Sidebar Header - Library Style */}
            <div className="p-6 border-b border-slate-200/60 bg-white/40">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-0.5">Library</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    Suggested & History
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 no-scrollbar select-none">
                {/* Subject Selector (Premium Card Style like Teacher) */}
                <div className="relative">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2 px-1">Active Context</h3>
                    <button
                        onClick={() => setIsSubjectSelectorOpen(!isSubjectSelectorOpen)}
                        className="flex items-center justify-between w-full px-4 py-3 bg-white hover:bg-[#68507B]/5 border border-slate-200 hover:border-[#68507B]/30 rounded-2xl shadow-sm transition-all group"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2 rounded-xl shrink-0 transition-colors ${selectedSubjectId !== 'all' ? 'bg-[#68507B]/10 text-[#68507B] group-hover:bg-[#68507B]/15' : 'bg-slate-100 text-slate-500'}`}>
                                {selectedSubjectId === 'all' ? <Layers size={18} /> : <BookOpen size={18} />}
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Focus</p>
                                <p className="text-sm font-bold text-slate-900 truncate">
                                    {selectedSubjectName}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedSubjectId === 'all' && primaryFocusTopic && (
                                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
                            )}
                            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isSubjectSelectorOpen ? 'rotate-180 text-[#68507B]' : ''}`} />
                        </div>
                    </button>

                    {selectedSubjectId === 'all' && primaryFocusTopic && (
                        <div className="mt-4 p-3 bg-orange-50/50 border border-orange-100 rounded-xl animate-in fade-in slide-in-from-top-2 duration-500 group cursor-help">
                            <div className="flex items-center gap-2 text-orange-600 mb-1">
                                <Zap size={14} className="fill-orange-600 animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Top Priority</span>
                            </div>
                            <p className="text-[11px] text-orange-800 font-medium leading-relaxed">
                                You're currently focusing on <strong>{primaryFocusTopic}</strong>.
                            </p>
                        </div>
                    )}

                    {isSubjectSelectorOpen && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setIsSubjectSelectorOpen(false)} />
                            <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-slate-200 z-40 py-2 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-200 origin-top">
                                <div className="px-4 py-2 mb-1 border-b border-slate-50">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Switch Focus</p>
                                </div>
                                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                    <button
                                        onClick={() => {
                                            setSelectedSubjectId('all');
                                            setIsSubjectSelectorOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors ${selectedSubjectId === 'all' ? 'bg-[#68507B]/5' : ''}`}
                                    >
                                        <div className={`mt-0.5 p-1.5 rounded-lg ${selectedSubjectId === 'all' ? 'bg-[#68507B]/10 text-[#68507B]' : 'bg-slate-100 text-slate-400'}`}>
                                            <Layers size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[13px] font-bold ${selectedSubjectId === 'all' ? 'text-[#68507B]' : 'text-slate-700'}`}>All subjects</span>
                                                {selectedSubjectId === 'all' && <Check size={16} className="text-[#68507B]" strokeWidth={3} />}
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-medium">Cross-subject synthesis</p>
                                        </div>
                                    </button>
                                    <div className="my-1 border-t border-slate-100 mx-2" />
                                    {subjects.map(subj => (
                                        <button
                                            key={subj}
                                            onClick={() => {
                                                setSelectedSubjectId(subj);
                                                setIsSubjectSelectorOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors ${selectedSubjectId === subj ? 'bg-[#68507B]/5' : ''}`}
                                        >
                                            <div className={`mt-0.5 p-1.5 rounded-lg ${selectedSubjectId === subj ? 'bg-[#68507B]/10 text-[#68507B]' : 'bg-slate-100 text-slate-400'}`}>
                                                <BookOpen size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-[13px] font-bold truncate ${selectedSubjectId === subj ? 'text-[#68507B]' : 'text-slate-700'}`}>{subj}</span>
                                                    {selectedSubjectId === subj && <Check size={16} className="text-[#68507B]" strokeWidth={3} />}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Prompt Chips */}
                <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-3 px-1">Suggested Questions</h3>
                    <div className="flex flex-col gap-2">
                        {currentPrompts.map((prompt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(prompt)}
                                className="text-left text-sm text-[#68507B] font-bold bg-[#68507B]/5 border border-[#68507B]/10 hover:bg-[#68507B]/10 hover:border-[#68507B]/20 transition-colors px-4 py-3 rounded-xl flex items-start gap-2 group"
                            >
                                <span className="flex-1 leading-snug">{prompt}</span>
                                <ArrowRight size={16} className="shrink-0 text-[#68507B] opacity-50 group-hover:translate-x-0.5 transition-transform mt-0.5" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-6 border-t border-[#EAE7DD] bg-[#faf9f6]">
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                    I'm best at checking pending work, suggesting what to do next, and explaining tricky topics based on your actual progress data.
                </p>
            </div>
        </div>
    );

    return (
        <CopilotLayout
            role="Student"
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            isDemo={isDemo}
            themeColor="#68507B"
            logout={logout}
            navigate={navigate}
            sidebar={sidebarContent}
            demoBanner={!embeddedInShell && isDemo && <DemoBanner />}
            demoRoleSwitcher={!embeddedInShell && isDemo && <DemoRoleSwitcher />}
            hidePrimarySidebar={embeddedInShell}
        >
            <CopilotMobileHeader themeColor="#68507B" />

            {isUnauthenticated ? (
                <CopilotAuthGate role="Student" themeColor="#68507B" />
            ) : (
                <>
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                        {messages.length === 0 ? (
                    <CopilotEmptyState
                        themeColor="#68507B"
                        userName={currentUser?.name}
                        description="I can check your pending assignments, tell you what to focus on, and summarize your weekly progress."
                        prompts={currentPrompts}
                        handleSend={handleSend}
                    />
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#EAE7DD]">
                            <div className="flex items-center gap-4">
                                <div className="bg-[#68507B]/5 p-2 rounded-xl border border-[#68507B]/10 hidden md:block group-hover:scale-105 transition-transform shadow-sm">
                                    <Sparkles className="w-6 h-6 text-[#68507B]" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Personal AI Guide</h1>
                                    <p className="text-sm text-slate-500 font-semibold tracking-wide">
                                        Elora Copilot &middot; Learning Unblocked
                                    </p>
                                    <p className="text-[11px] text-[#68507B] font-bold uppercase tracking-widest mt-1 opacity-80">
                                        {activeConversationTitle}
                                    </p>
                                </div>
                            </div>

                            {/* Subject Context Selector (Synced with Teacher style) */}
                            <div className="relative group/pill">
                                <button
                                    onClick={() => setIsSubjectSelectorOpen(!isSubjectSelectorOpen)}
                                    className="flex items-center gap-3 px-4 py-2 bg-white hover:bg-[#68507B]/5 border border-slate-200 hover:border-[#68507B]/30 rounded-2xl text-slate-700 hover:text-[#68507B] transition-all w-fit shadow-sm active:scale-95 group"
                                >
                                    <div className="w-6 h-6 rounded-lg bg-[#68507B]/5 flex items-center justify-center text-[#68507B] group-hover:bg-[#68507B]/10 transition-colors shadow-inner">
                                        <Layers size={14} strokeWidth={2.5} />
                                    </div>
                                    {selectedSubjectId === 'all' && primaryFocusTopic && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                    )}
                                    <div className="flex flex-col text-left mr-1">
                                        <span className="text-[9px] font-bold uppercase tracking-[0.05em] text-slate-400 leading-none mb-0.5">Filtering by</span>
                                        <span className="text-[12px] font-bold whitespace-nowrap leading-none">
                                            {selectedSubjectName}
                                        </span>
                                    </div>
                                    <ChevronDown size={14} className={`shrink-0 text-slate-300 transition-transform duration-300 group-hover:text-[#68507B] ${isSubjectSelectorOpen ? 'rotate-180 text-[#68507B]' : ''}`} />
                                </button>
                            </div>
                        </div>
                        {messages.map((msg) => (
                            <CopilotMessageBubble
                                key={msg.id}
                                message={msg}
                                themeColor="#68507B"
                                onActionClick={handleActionClick}
                                shouldAutoExpandSteps={messages.filter(m => m.role === 'assistant' && m.steps && m.steps.length > 0).findIndex(m => m.id === msg.id) < 3}
                                copilotRole="student"
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
                                    <div className="w-2 h-2 rounded-full bg-[#68507B]/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-[#68507B]/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-[#68507B]/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input Bar */}
            <div className="p-4 md:p-6 bg-white border-t border-[#EAE7DD]">
                <div className="max-w-4xl mx-auto space-y-4">
                    {messages.length > 0 && (
                        <div className="relative">
                            <HorizontalChips prompts={currentPrompts} onSend={handleSend} themeColor="#68507B" />
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                setMessages([]);
                                setActiveConversationId(null);
                                setActiveConversationTitle(weeklyTitle);
                            }}
                            title="New conversation"
                            className="h-[52px] w-[52px] flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-xl transition-colors shrink-0"
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
                                placeholder="Ask Copilot a question..."
                                className="w-full bg-[#F8F9FA] border border-[#EAE7DD] rounded-xl pl-4 pr-12 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#68507B]/30 focus:border-[#68507B] resize-none flex-1 min-h-[52px] max-h-32"
                                rows={1}
                                style={{ height: '52px' }}
                            />
                            <button
                                onClick={() => handleSend(inputValue)}
                                disabled={!inputValue.trim() || isThinking}
                                className="absolute right-2.5 top-3 p-1.5 bg-[#68507B] hover:bg-[#523d60] disabled:bg-slate-300 text-white rounded-lg transition-colors flex items-center justify-center"
                            >
                                <Sparkles size={16} className="ml-0.5" />
                            </button>
                        </div>
                    </div>
                        <div className="text-center mt-3">
                            <p className="text-[11px] text-slate-400">
                                Copilot is an AI assistant and may occasionally make mistakes.
                            </p>
                        </div>
                    </div>
                </div>
                </>
            )}
        </CopilotLayout>
    );
};

export default StudentCopilotPage;
