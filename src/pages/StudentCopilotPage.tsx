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
    Check
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
    Step, 
    ActionChip,
    shouldShowFeedback
} from '../components/Copilot/CopilotShared';

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
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Derived logic from Student Dashboard
    const primaryFocusTopic = recentPerformance?.weakTopics?.[0] ?? null;

    // Derived subjects list for selector
    const subjects = Array.from(new Set(assignments.map(a => a.className))).filter(Boolean);
    const selectedSubjectName = selectedSubjectId === 'all' ? 'All subjects' : selectedSubjectId;

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
                showFeedback: shouldShowFeedback()
            };
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
        <div className="flex flex-col h-full overflow-hidden bg-[#faf9f6]">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-[#EAE7DD]">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-1">Copilot</h2>
                <p className="text-sm font-medium text-[#68507B] flex items-center gap-1.5">
                    <Sparkles size={14} />
                    Connected to your progress
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 no-scrollbar select-none">
                {/* Subject Selector (Pill Style like Teacher) */}
                <div className="relative">
                    <button
                        onClick={() => setIsSubjectSelectorOpen(!isSubjectSelectorOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#68507B]/5 hover:bg-[#68507B]/10 border border-[#68507B]/20 rounded-full text-[#68507B] transition-colors w-fit shadow-sm"
                    >
                        <Layers size={14} className="shrink-0" />
                        {selectedSubjectId === 'all' && primaryFocusTopic && (
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                        )}
                        <span className="text-xs font-bold whitespace-nowrap">
                            {selectedSubjectName}
                        </span>
                        <ChevronDown size={14} className={`shrink-0 transition-transform ${isSubjectSelectorOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isSubjectSelectorOpen && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-40 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-2 mb-1">
                                <p className="text-[11px] font-medium text-slate-400">Copilot will answer using data from this subject only.</p>
                            </div>
                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                <button
                                    onClick={() => {
                                        setSelectedSubjectId('all');
                                        setIsSubjectSelectorOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 text-sm font-bold flex items-start gap-3 hover:bg-slate-50 transition-colors ${selectedSubjectId === 'all' ? 'bg-[#68507B]/5' : ''}`}
                                >
                                    <div className={`mt-0.5 p-1 rounded-md ${selectedSubjectId === 'all' ? 'bg-[#68507B]/10 text-[#68507B]' : 'bg-slate-100 text-slate-500'}`}>
                                        <Plus size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                                                {primaryFocusTopic && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                                                All subjects
                                            </span>
                                            {selectedSubjectId === 'all' && <Check size={16} className="text-[#68507B]" />}
                                        </div>
                                    </div>
                                </button>
                                <div className="my-1 border-t border-slate-100" />
                                {subjects.map(subj => (
                                    <button
                                        key={subj}
                                        onClick={() => {
                                            setSelectedSubjectId(subj);
                                            setIsSubjectSelectorOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors ${selectedSubjectId === subj ? 'bg-[#68507B]/5' : ''}`}
                                    >
                                        <div className={`mt-0.5 p-1 rounded-md ${selectedSubjectId === subj ? 'bg-[#68507B]/10 text-[#68507B]' : 'bg-slate-100 text-slate-500'}`}>
                                            <BookOpen size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-slate-900 truncate">{subj}</span>
                                                {selectedSubjectId === subj && <Check size={16} className="text-[#68507B]" />}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
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
                                className="text-left text-sm text-[#68507B] font-medium bg-[#68507B]/5 border border-[#68507B]/10 hover:bg-[#68507B]/10 hover:border-[#68507B]/20 transition-colors px-4 py-3 rounded-xl flex items-start gap-2"
                            >
                                <span className="flex-1 leading-snug">{prompt}</span>
                                <ArrowRight size={16} className="shrink-0 text-[#68507B] opacity-50 mt-0.5" />
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
                            <div className="flex items-center gap-3">
                                <div className="bg-[#68507B]/5 p-2 rounded-xl border border-[#68507B]/10 hidden md:block">
                                    <Sparkles className="w-6 h-6 text-[#68507B]" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-900 leading-tight">Copilot</h1>
                                    <p className="text-sm text-slate-500 font-medium">
                                        Your personal learning assistant
                                    </p>
                                </div>
                            </div>

                            {/* Subject Context Selector */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsSubjectSelectorOpen(!isSubjectSelectorOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-[#68507B]/5 hover:bg-[#68507B]/10 border border-[#68507B]/20 rounded-full text-[#68507B] transition-colors w-fit shadow-sm"
                                >
                                    <Layers size={14} className="shrink-0" />
                                    {selectedSubjectId === 'all' && primaryFocusTopic && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                                    )}
                                    <span className="text-xs font-bold whitespace-nowrap">
                                        {selectedSubjectName}
                                    </span>
                                    <ChevronDown size={14} className={`shrink-0 transition-transform ${isSubjectSelectorOpen ? 'rotate-180' : ''}`} />
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
                            onClick={() => setMessages([])}
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
