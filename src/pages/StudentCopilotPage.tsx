import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    Gamepad2,
    FileText,
    BarChart2,
    Settings,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    Sparkles,
    Send,
    Plus,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    ArrowRight
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { EloraLogo } from '../components/EloraLogo';
import { useDemoMode } from '../hooks/useDemoMode';
import { DemoBanner } from '../components/DemoBanner';
import { DemoRoleSwitcher } from '../components/DemoRoleSwitcher';
import {
    demoStudentData,
    demoStudentStreak,
    demoGameSessions
} from '../demo/demoStudentScenarioA';
import * as dataService from '../services/dataService';

type Step = {
    id: string;
    text: string;
};

type ActionChip = {
    label: string;
    actionType: 'navigate';
    destination?: string;
};

type Message = {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    steps?: Step[];
    actions?: ActionChip[];
};

const StudentCopilotPage: React.FC = () => {
    const { isVerified, logout, currentUser, login } = useAuth();
    const navigate = useNavigate();
    const isDemo = useDemoMode();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Initialise student data state
    const [assignments, setAssignments] = useState<any[]>([]);
    const [recentPerformance, setRecentPerformance] = useState<any>(null);
    const [streakData, setStreakData] = useState<any>(null);
    const [gameSessions, setGameSessions] = useState<any[]>([]);

    useEffect(() => {
        // Ensure demo user is logically "logged in"
        if (isDemo && currentUser?.id !== 'student_1' && typeof login === 'function') {
            login('student');
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

    const displayName = isDemo ? 'Jordan' : (currentUser?.preferredName ?? currentUser?.name ?? 'Student');

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const dataMessageCountRef = useRef(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Derived logic from Student Dashboard
    const pendingAssignments = assignments.filter(a => a.status === 'not_started' || a.status === 'danger' || a.status === 'warning' || a.status === 'info');
    const completedAssignments = assignments.filter(a => a.status === 'completed' || a.status === 'success' || a.status === 'submitted');
    
    const primaryWeakTopic = recentPerformance?.weakTopics?.[0] ?? null;

    const buildPrompts = (): string[] => {
        return [
            "Do I have any overdue or unfinished assignments?",
            "What's the best use of my next 20 minutes?",
            "Can you give me a summary of how I'm doing this week?",
            "What can you do?"
        ];
    };

    const currentPrompts = buildPrompts();

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    const handleSend = (text: string) => {
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

        // Simulate thinking & response
        setTimeout(() => {
            setIsThinking(false);
            const lowerQuery = query.toLowerCase().trim();

            const isSmallTalkKw = (q: string) => /hi|hello|hey|thanks|thank you|how are you/i.test(q);
            const isAboutKw = (q: string) => /what is (elora|this|copilot)|what can you do|how should i use this/i.test(q);
            const isOverdueKw = (q: string) => /overdue|unfinished|not finished|missing|todo/i.test(q);
            const isNextActionKw = (q: string) => /next|20 minutes|work on|should i work on/i.test(q);
            const isSummaryKw = (q: string) => /week|how am i doing|summary|overview/i.test(q);

            const hasSupportedIntent = isAboutKw(lowerQuery) || isOverdueKw(lowerQuery) || isNextActionKw(lowerQuery) || isSummaryKw(lowerQuery);
            const isSmallTalk = isSmallTalkKw(lowerQuery);
            const isUnknown = !isSmallTalk && !hasSupportedIntent;

            let content = "";
            let steps: Step[] = [];
            let actions: ActionChip[] = [];

            if (isSmallTalk) {
                steps = [];
                content = "Hey! I'm your Elora Assistant. I can check your assignments, topics, and overall progress. Try something like:\n• 'Do I have any overdue assignments?'\n• 'What's the best use of my next 20 minutes?'\n• 'How am I doing this week?'";
            } else if (isAboutKw(lowerQuery)) {
                steps = [];
                content = "I'm Elora Copilot, your personal learning assistant. I can look at your class data, assignments, and practice scores to give you targeted advice. You can ask me things like:\n• 'Do I have any unfinished assignments?'\n• 'What should I work on next?'\n• 'Can you summarize how I am doing this week?'";
            } else if (isOverdueKw(lowerQuery)) {
                steps = [
                    { id: 'load-data', text: 'Checked your assignment queue' },
                    { id: 'filter-items', text: 'Filtered to overdue and upcoming items' },
                    { id: 'sort', text: 'Sorted by urgency' }
                ];
                
                const sorted = [...pendingAssignments].sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                });

                if (sorted.length === 0) {
                    content = "I don't see any unfinished assignments — your schedule looks clear right now.";
                } else {
                    let str = `You have ${sorted.length} thing${sorted.length > 1 ? 's' : ''} still to do:\n`;
                    const top3 = sorted.slice(0, 3);
                    top3.forEach((asgn, i) => {
                        const isOverdue = asgn.status === 'danger' || (asgn.dueDate && new Date(asgn.dueDate).getTime() < Date.now());
                        let dueText = '';
                        if (asgn.dueDate) {
                            const diffDays = Math.floor((Date.now() - new Date(asgn.dueDate).getTime()) / 86400000);
                            if (isOverdue) {
                                dueText = diffDays > 0 ? `was due ${diffDays} day${diffDays > 1 ? 's' : ''} ago` : 'was due today';
                            } else {
                                const inDays = Math.ceil((new Date(asgn.dueDate).getTime() - Date.now()) / 86400000);
                                dueText = inDays > 0 ? `is due in ${inDays} day${inDays > 1 ? 's' : ''}` : 'is due today';
                            }
                        } else {
                            dueText = 'has no due date';
                        }
                        const startHint = i === 0 ? " Start this first." : "";
                        str += `\n**${asgn.title}** — ${dueText}.${startHint}`;
                    });
                    content = str;
                    if (sorted[0]) {
                         actions = [{ label: 'Go to Assignments', actionType: 'navigate', destination: '/dashboard/student' }];
                    }
                }
            } else if (isNextActionKw(lowerQuery)) {
                steps = [
                    { id: 'load-data', text: 'Checked your pending assignments and their due dates' },
                    { id: 'load-topics', text: 'Analyzed your recent practice performance looking for weak topics' }
                ];

                const sorted = [...pendingAssignments].sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                });
                
                const urgent = sorted[0];
                
                if (urgent) {
                    let str = `The best use of your next 20 minutes is to finish **${urgent.title}** since it is the most urgent.`;
                    if (primaryWeakTopic) {
                        str += `\n\nIf you have time after that, try one short round on **${primaryWeakTopic}** to improve your score.`;
                    }
                    content = str;
                    actions = [{ label: 'Start Assignment', actionType: 'navigate', destination: '/dashboard/student' }];
                } else if (primaryWeakTopic) {
                    content = `You don't have any urgent assignments. The best use of your next 20 minutes is to try one short practice round on **${primaryWeakTopic}**.`;
                    actions = [{ label: 'Start Practice', actionType: 'navigate', destination: '/play/practice-general' }];
                } else {
                    content = "You have no urgent assignments and your topics look solid. Enjoy your free time or explore new topics!";
                }
            } else if (isSummaryKw(lowerQuery)) {
                steps = [
                    { id: 'check-streak', text: 'Checked your streak and score history' },
                    { id: 'check-completion', text: 'Counted submitted assignments versus total' }
                ];

                if (!streakData || streakData.weeklyScores.length === 0) {
                    content = "I don't see enough activity this week to give a summary yet. Keep practicing!";
                } else {
                    const thisWeekScore = streakData.scoreThisWeek ?? 0;
                    const priorWeekScore = streakData.scorePriorWeek ?? 0;
                    
                    const submittedCount = completedAssignments.length;
                    const totalCount = assignments.length;
            
                    const topicString = primaryWeakTopic ? ` The main topic to keep an eye on is **${primaryWeakTopic}**.` : "";
            
                    content = `This week, your average score is **${thisWeekScore}%** (last week it was ${priorWeekScore}%). You've submitted ${submittedCount} of ${totalCount > 0 ? totalCount : 'your'} assignments.${topicString}`;
                }
            } else if (isUnknown) {
                steps = [];
                content = `I didn't quite catch that. Try asking me:\n• 'Do I have any unfinished assignments?'\n• 'What should I work on next?'\n• 'How am I doing this week?'`;
            }

            const assistantMsg: Message = {
                id: Date.now().toString() + '-a',
                role: 'assistant',
                steps: steps,
                content: content,
                actions: actions.length > 0 ? actions : undefined
            };

            setMessages(prev => [...prev, assistantMsg]);
        }, 1500);
    };

    const handleActionClick = (action: ActionChip) => {
        if (action.actionType === 'navigate' && action.destination) {
            navigate(action.destination);
        }
    };

    // Sidebar navigation item component
    const NavItem = ({
        icon,
        label,
        active = false,
        onClick,
        collapsed = false,
        className = ''
    }: {
        icon: React.ReactNode;
        label: string;
        active?: boolean;
        onClick?: () => void;
        collapsed?: boolean;
        className?: string;
    }) => (
        <a
            href="#"
            onClick={(e) => { e.preventDefault(); onClick?.(); }}
            className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-colors ${
                active && !className.includes('bg-[#68507B]/10')
                    ? 'bg-white/10 text-white'
                    : className || 'text-white/70 hover:bg-white/5 hover:text-white'
                } ${collapsed ? 'justify-center focus:outline-none px-0' : ''}`}
            title={collapsed ? label : undefined}
        >
            <div className="shrink-0">{icon}</div>
            {!collapsed && <span className="whitespace-nowrap">{label}</span>}
            {active && !collapsed && className === '' && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white" />
            )}
        </a>
    );

    return (
        <div className="flex flex-col min-h-screen bg-[#FDFBF5] font-sans text-slate-900">
            {isDemo && (
                <>
                    <DemoBanner />
                    <DemoRoleSwitcher />
                </>
            )}

            <div className="flex flex-1 overflow-hidden">
                {/* ── Sidebar ── */}
                <aside
                    className={`bg-[#68507B] text-white flex flex-col h-[100dvh] sticky top-0 shrink-0 shadow-xl z-20 transition-[width] duration-300 ease-in-out hidden sm:flex ${isSidebarOpen ? 'w-64' : 'w-20'}`}
                >
                    <div className={`p-6 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
                        <Link to="/" className="flex items-center text-white/90 hover:text-white transition-colors overflow-hidden shrink-0">
                            <EloraLogo className="w-8 h-8 text-current" withWordmark={isSidebarOpen} />
                        </Link>
                        {isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="text-white/50 hover:text-white transition-colors shrink-0"
                                title="Close sidebar"
                            >
                                <PanelLeftClose className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <nav className="flex-1 px-4 py-4 space-y-1 min-h-0 overflow-y-auto no-scrollbar">
                        <NavItem
                            icon={<LayoutDashboard size={20} />}
                            label="Overview"
                            collapsed={!isSidebarOpen}
                            onClick={() => navigate(isDemo ? '/student/demo' : '/dashboard/student')}
                        />
                        <NavItem icon={<BookOpen size={20} />} label="My Classes" collapsed={!isSidebarOpen} />
                        <NavItem icon={<Gamepad2 size={20} />} label="Practice & quizzes" collapsed={!isSidebarOpen} />
                        <NavItem icon={<FileText size={20} />} label="Assignments & Quizzes" collapsed={!isSidebarOpen} />
                        <NavItem icon={<BarChart2 size={20} />} label="Reports" collapsed={!isSidebarOpen} />

                        <div className="my-2 border-t border-white/10" />
                        <NavItem
                            icon={<Sparkles size={20} />}
                            label="Elora Copilot"
                            active={true}
                            collapsed={!isSidebarOpen}
                            className={!isSidebarOpen ? 'bg-[#9878b3] text-white' : 'text-[#68507B] bg-[#FDFBF5] hover:bg-white'}
                        />
                    </nav>

                    <div className="p-4 flex flex-col gap-1 shrink-0">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="flex items-center justify-center w-full p-2.5 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors mb-2"
                                title="Open sidebar"
                            >
                                <PanelLeftOpen className="w-5 h-5" />
                            </button>
                        )}
                        <div className="h-px bg-white/10 my-2 mx-3" />
                        <NavItem icon={<Settings size={20} />} label="Settings" collapsed={!isSidebarOpen} />
                        <button
                            onClick={logout}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-white/70 hover:bg-red-500/20 hover:text-white ${!isSidebarOpen ? 'justify-center border border-transparent hover:border-red-500/30' : ''}`}
                            title={!isSidebarOpen ? "Sign out" : undefined}
                        >
                            <LogOut className="w-5 h-5 shrink-0" />
                            {isSidebarOpen && <span className="whitespace-nowrap">Sign out</span>}
                        </button>
                    </div>
                </aside>

                <main className="flex-1 flex flex-col min-w-0 relative">
                    {/* Right Column (Chat Area) */}
                    <div className="flex-1 flex flex-col bg-[#FDFBF5] relative min-w-0">
                        {/* Mobile Header (Only on small screens) */}
                        <div className="md:hidden p-4 bg-white border-b border-[#EAE7DD] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-[#68507B]/10 text-[#68507B] rounded-lg">
                                    <Sparkles size={18} />
                                </div>
                                <h2 className="font-bold text-slate-900">Elora Copilot</h2>
                            </div>
                            <div className="text-[10px] font-bold text-[#68507B] bg-[#68507B]/5 px-2 py-1 rounded-full border border-[#68507B]/20">
                                LIVE DATA
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto p-4">
                                    <div className="w-16 h-16 bg-[#68507B]/10 text-[#68507B] rounded-2xl flex items-center justify-center mb-6">
                                        <Sparkles size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">How can I help you today?</h2>
                                    <p className="text-slate-500 text-sm">
                                        I can check your pending assignments, tell you what to focus on, and summarize your weekly progress.
                                    </p>
                                    <div className="flex flex-col gap-2 mt-6 w-full max-w-xs">
                                        {currentPrompts.map((prompt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSend(prompt)}
                                                className="w-full text-left px-4 py-3 rounded-xl bg-[#68507B]/5 hover:bg-[#68507B]/10 border border-[#68507B]/20 text-sm font-medium text-[#68507B] transition-colors flex items-center justify-between gap-2"
                                            >
                                                <span>{prompt}</span>
                                                <ArrowRight size={14} className="shrink-0 text-[#68507B]/50" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#EAE7DD]">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-[#68507B]/10 p-2 rounded-xl border border-[#68507B]/20 hidden md:block">
                                                <Sparkles className="w-6 h-6 text-[#68507B]" />
                                            </div>
                                            <div>
                                                <h1 className="text-xl font-bold text-slate-900 leading-tight">Copilot</h1>
                                                <p className="text-sm text-slate-500 font-medium">Your personal learning assistant</p>
                                            </div>
                                        </div>
                                    </div>
                                    {messages.map((msg) => (
                                        <div key={msg.id} className="w-full">
                                            {msg.role === 'system' ? (
                                                <div className="flex justify-center my-4">
                                                    <div className="text-[12px] font-bold text-slate-400 flex items-center gap-2">
                                                        <span className="h-[1px] w-8 bg-slate-200" />
                                                        {msg.content}
                                                        <span className="h-[1px] w-8 bg-slate-200" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[90%] md:max-w-2xl flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

                                                        {msg.role === 'assistant' && msg.steps && msg.steps.length > 0 && (() => {
                                                            const dataMessages = messages.filter(
                                                                m => m.role === 'assistant' && m.steps && m.steps.length > 0
                                                            );
                                                            const indexInDataMessages = dataMessages.findIndex(m => m.id === msg.id);
                                                            const shouldAutoExpand = indexInDataMessages < 3;
                                                            return <ThinkingStrip steps={msg.steps} defaultExpanded={shouldAutoExpand} themeColor="#68507B" />;
                                                        })()}

                                                        <div
                                                            className={`px-5 py-4 rounded-2xl text-[14px] md:text-[15px] shadow-sm ${msg.role === 'user'
                                                                ? 'bg-[#68507B] text-white rounded-br-sm'
                                                                : 'bg-white border border-[#EAE7DD] text-slate-800 rounded-tl-sm'
                                                                }`}
                                                        >
                                                            <div className="whitespace-pre-wrap leading-relaxed">
                                                                {msg.content.split('**').map((part, i) => (
                                                                    i % 2 === 1 ? <strong key={part + i}>{part}</strong> : part
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {msg.actions && msg.actions.length > 0 && (
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                {msg.actions.map((action, i) => (
                                                                    <button
                                                                        key={i}
                                                                        onClick={() => handleActionClick(action)}
                                                                        className="text-[12px] md:text-[13px] font-medium text-[#68507B] hover:text-[#523d60] bg-[#68507B]/5 hover:bg-[#68507B]/10 border border-[#68507B]/20 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 shadow-sm"
                                                                    >
                                                                        {action.label}
                                                                        <ArrowRight size={14} />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
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
                                {/* Mobile Prompt Chips - Scrollable horizontally */}
                                {messages.length > 0 && (
                                    <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                                        {currentPrompts.map((prompt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSend(prompt)}
                                                className="shrink-0 px-3 py-1.5 bg-[#68507B]/5 text-[#68507B] rounded-full text-[11px] font-medium border border-[#68507B]/20 whitespace-nowrap hover:bg-[#68507B]/10 transition-colors"
                                            >
                                                {prompt}
                                            </button>
                                        ))}
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
                                            <Send size={16} className="ml-0.5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-center mt-3">
                                    <p className="text-[11px] text-slate-400">
                                        Elora Copilot is an AI assistant and may occasionally make mistakes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StudentCopilotPage;

// --- Subcomponents ---

const ThinkingStrip = ({ steps, defaultExpanded, themeColor }: { steps: Step[], defaultExpanded?: boolean, themeColor?: string }) => {
    const [expanded, setExpanded] = useState(defaultExpanded ?? false);
    const color = themeColor || '#14b8a6'; // fallback to teal

    return (
        <div className="mb-2 w-full">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors bg-white/50 px-2.5 py-1 rounded-md mb-1 border border-slate-200"
            >
                <Sparkles size={12} style={{ color }} />
                <span>What I checked &middot; {steps.length} steps</span>
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {expanded && (
                <div className="pl-2 border-l-2 space-y-2 mb-2 ml-1" style={{ borderLeftColor: `${color}40` }}>
                    {steps.map((step) => (
                        <div key={step.id} className="flex items-start gap-2 text-[13px] text-slate-600">
                            <CheckCircle2 size={14} style={{ color }} className="mt-0.5 shrink-0" />
                            <span>{step.text}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
