import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    CheckCircle2,
    ChevronDown,
    Sparkles
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useDemoMode } from '../hooks/useDemoMode';
import { DemoBanner } from '../components/DemoBanner';
import { DemoRoleSwitcher } from '../components/DemoRoleSwitcher';
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
    Message, 
    Step, 
    ActionChip 
} from '../components/Copilot/CopilotShared';

const topicExplanations: Record<string, string> = {
    'Algebra – Factorisation': "Factorisation is like 'un-multiplying'. You're taking an expression and finding simpler terms that multiply together to make it. For example, x² + 5x + 6 becomes (x+2)(x+3). It's a key skill for solving complex equations later on.",
    'Quadratic Equations': "A quadratic equation is any equation that can be written in the form ax² + bx + c = 0. The graph of these equations always forms a curve called a parabola. They are used everywhere from physics to business to model curved paths or changing rates.",
    'Linear Inequalities': "Inequalities are like equations but use signs like > or < instead of =. They describe a range of possible answers rather than just one. For example, 2x > 6 means x must be any number greater than 3.",
    'Fractions': "Fractions represent parts of a whole. The top number (numerator) tells you how many parts you have, and the bottom number (denominator) tells you how many parts make up the full whole. Adding them is easiest when the denominators are the same!",
    'Kinematics': "Kinematics is the study of motion. We use terms like displacement, velocity, and acceleration to describe how objects move without worrying about the forces that cause the movement. It's the foundation of almost everything in classical physics."
};

const StudentCopilotPage: React.FC = () => {
    const { logout, currentUser, login } = useAuth();
    const navigate = useNavigate();
    const isDemo = useDemoMode();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Context Selector State
    const [selectedSubjectId, setSelectedSubjectId] = useState('all');
    const [isSubjectSelectorOpen, setIsSubjectSelectorOpen] = useState(false);

    // Initialise student data state
    const [assignments, setAssignments] = useState<any[]>([]);
    const [recentPerformance, setRecentPerformance] = useState<any>(null);
    const [streakData, setStreakData] = useState<any>(null);
    const [, setGameSessions] = useState<any[]>([]);

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

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Derived logic from Student Dashboard
    const primaryWeakTopic = recentPerformance?.weakTopics?.[0] ?? null;

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

        const lowerQuery = query.toLowerCase().trim();

        // ── Intent Classifiers ──
        const isSmallTalkKw = (q: string) => /hi|hello|hey|thanks|thank you|how are you/i.test(q);
        const isAboutKw = (q: string) => /what is (elora|this|copilot)|what can you do|how should i use this/i.test(q);
        const isOverdueKw = (q: string) => /overdue|unfinished|not finished|not done|what's overdue|todo|haven't finished/i.test(q);
        const isNextActionKw = (q: string) => /next|20 minutes|work on|should i work on|do now|best use of my time/i.test(q);
        const isSummaryKw = (q: string) => /week|how am i doing|summary|overview|progress/i.test(q);
        const isWeakestTopicKw = (q: string) => /weakest topic|what am i worst at|what do i struggle with|struggling most with/i.test(q);
        const isWhyPatternKw = (q: string) => /why do i keep getting|why do i keep missing|why do i keep getting this wrong/i.test(q);
        const isPrepareQuizKw = (q: string) => /prepare for the next quiz|prepare for the quiz|prepare for test|get ready for/i.test(q);
        const isExplainKw = (q: string) => /explain|what is|help me understand/i.test(q);
        const isSensitiveKw = (q: string) => /sad|depressed|hurt|mean|bully|stress|lonely/i.test(q);

        setTimeout(() => {
            setIsThinking(false);

            let content = "";
            let steps: Step[] = [];
            let actions: ActionChip[] = [];

            // Context-aware Step generator helper
            const getCtxStep = () => {
                return selectedSubjectId === 'all' 
                    ? { id: 'ctx', text: 'Context: All subjects — looking across all your work' } 
                    : { id: 'ctx', text: `Context: ${selectedSubjectId} — only using data from this class` };
            };

            if (isSmallTalkKw(lowerQuery)) {
                content = "Hey! I'm your Elora assistant. I'm here to help you stay on top of your work and improve your scores. \n\nWhat can I help you with right now? Try asking about your unfinished assignments or what to focus on next.";
            } else if (isAboutKw(lowerQuery)) {
                content = "Elora is a platform for tracking your progress and assignments. I'm your Student Copilot, designed to help you figure out what to work on, understand tricky topics, and get ready for quizzes. \n\nTry asking: \n• 'What should I do right now?' \n• 'What assignments haven’t I finished?' \n• 'Explain Factorisation simply.'";
            } else if (isSensitiveKw(lowerQuery)) {
                content = "I'm sorry to hear that you're feeling this way. It might be helpful to talk things through with a trusted adult, like a teacher, parent, or counselor. \n\nI'm still here if you'd like to talk about your schoolwork or anything you're working on in Elora.";
            } else if (isOverdueKw(lowerQuery)) {
                steps = [
                    getCtxStep(),
                    { id: 'load-data', text: 'Loaded your assignment attempts and filtered to not finished' },
                    { id: 'sort', text: 'Sorted them by urgency' }
                ];

                const sorted = [...filteredPending].sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                });

                if (sorted.length === 0) {
                    content = `I don't see any unfinished assignments ${selectedSubjectId === 'all' ? '' : `for ${selectedSubjectId} `}— your schedule looks clear right now.`;
                } else {
                    content = `You have ${sorted.length} assignment${sorted.length > 1 ? 's' : ''} still to do:\n`;
                    sorted.slice(0, 5).forEach(asgn => {
                        const isOverdue = asgn.dueDate && new Date(asgn.dueDate).getTime() < Date.now();
                        let dueText = '';
                        if (asgn.dueDate) {
                            const diffDays = Math.floor((Date.now() - new Date(asgn.dueDate).getTime()) / 86400000);
                            dueText = isOverdue ? (diffDays > 0 ? `was due ${diffDays} day${diffDays > 1 ? 's' : ''} ago` : 'was due today') : `is due in ${Math.ceil(-diffDays)} day${Math.ceil(-diffDays) !== 1 ? 's' : ''}`;
                        }
                        content += `\n• **${asgn.title}** — ${dueText || 'has no due date'}.`;
                    });
                    actions = [{ label: `Start ${sorted[0].title}`, actionType: 'navigate', destination: '/dashboard/student' }];
                }
            } else if (isNextActionKw(lowerQuery)) {
                steps = [
                    getCtxStep(),
                    { id: 'load-data', text: 'Checked your pending assignments and their due dates' },
                    { id: 'load-performance', text: 'Analyzed your recent practice performance looking for weak topics' }
                ];

                const urgent = [...filteredPending].sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                })[0];

                if (urgent) {
                    content = `The most important thing to start now is **${urgent.title}** because it is the most urgent on your list.`;
                    if (primaryWeakTopic) {
                        content += `\n\nIf you have extra time, follow that up with a short practice round on **${primaryWeakTopic}** to boost your scores.`;
                        actions.push({ label: `Practice ${primaryWeakTopic}`, actionType: 'navigate', destination: '/play/practice-general' });
                    }
                    actions.unshift({ label: `Start ${urgent.title}`, actionType: 'navigate', destination: '/dashboard/student' });
                } else if (primaryWeakTopic) {
                    content = `Across your subjects, the best use of your time right now is to practice **${primaryWeakTopic}**. This is the topic you've been finding most tricky recently.`;
                    actions = [{ label: `Practice ${primaryWeakTopic}`, actionType: 'navigate', destination: '/play/practice-general' }];
                } else {
                    content = "Your schedule looks great! You've cleared your priority assignments and your recent scores are balanced. You could explore a new topic or take a well-earned break.";
                }
            } else if (isSummaryKw(lowerQuery)) {
                steps = [
                    getCtxStep(),
                    { id: 'check-scores', text: 'Checked your average score this week and last week' },
                    { id: 'check-asgn', text: 'Checked how many assignments you’ve submitted out of those due' },
                    { id: 'check-streak', text: 'Checked your practice streak for this week' }
                ];

                if (!streakData || streakData.weeklyScores.length === 0) {
                    content = "I don't have enough data to give you a summary yet for this week. Keep at it!";
                } else {
                    const ctxStr = selectedSubjectId === 'all' ? 'Across all your subjects' : `For your ${selectedSubjectId} work`;
                    const thisWeekScore = streakData.scoreThisWeek ?? 0;
                    const priorWeekScore = streakData.scorePriorWeek ?? 0;
                    const subCount = filteredAssignments.filter(a => ['completed', 'success', 'submitted'].includes(a.status || '')).length;
                    const totalCount = filteredAssignments.length;

                    content = `${ctxStr}, your average score is **${thisWeekScore}%** this week, compared with ${priorWeekScore}% last week. \n\nYou’ve submitted ${subCount} of ${totalCount > 0 ? totalCount : 'your'} assignments. ${primaryWeakTopic ? `The main topic to watch is **${primaryWeakTopic}** if we see one.` : 'Your scores are looking very balanced across all topics.'}`;
                    actions = [{ label: "See what's left to do", actionType: 'navigate', destination: '/dashboard/student' }];
                    if (primaryWeakTopic) actions.push({ label: `Practice ${primaryWeakTopic}`, actionType: 'navigate', destination: '/play/practice-general' });
                }
            } else if (isWeakestTopicKw(lowerQuery)) {
                steps = [
                    getCtxStep(),
                    { id: 'check-topics', text: 'Analyzed your recent practice results by topic' },
                    { id: 'find-weakest', text: 'Found the topic where you’ve missed the most questions' }
                ];

                if (primaryWeakTopic) {
                    content = `Right now, the topic you're finding hardest is **${primaryWeakTopic}**. Working on this first will have the biggest impact on your overall progress.`;
                    actions = [
                        { label: `Practice ${primaryWeakTopic}`, actionType: 'navigate', destination: '/play/practice-general' },
                        { label: `Explain ${primaryWeakTopic} simply`, actionType: 'navigate', destination: '#' }
                    ];
                } else {
                    content = "I don't see a clearly weakest topic right now — your recent results are fairly balanced.";
                }
            } else if (isWhyPatternKw(lowerQuery)) {
                const topicInQuery = Object.keys(topicExplanations).find(t => lowerQuery.includes(t.toLowerCase()));
                const actualTopic = topicInQuery || primaryWeakTopic;

                steps = [
                    { id: 'load-pattern', text: `Loaded your recent practice sessions for ${actualTopic || 'your work'}` },
                    { id: 'find-pattern', text: 'Looked for patterns in where you’re getting questions wrong' }
                ];

                if (actualTopic) {
                    content = `I can see you're finding **${actualTopic}** tricky, but your wrong answers are spread out across different question types. It may help to slow down and focus on the worked examples in that topic.`;
                    actions = [{ label: `Practice ${actualTopic}`, actionType: 'navigate', destination: '/play/practice-general' }];
                } else {
                    content = "I haven't detected a clear pattern yet, but I'll keep analyzing your practice rounds as you complete them!";
                }
            } else if (isPrepareQuizKw(lowerQuery)) {
                steps = [
                    getCtxStep(),
                    { id: 'find-quiz', text: 'Found your next upcoming quiz or test' },
                    { id: 'check-quiz-topics', text: 'Checked which topics it covers' },
                    { id: 'compare-performance', text: 'Compared that with the topics you’re finding hardest right now' }
                ];

                const nextQuiz = filteredPending.find(a => /quiz|test/i.test(a.title));
                
                if (nextQuiz) {
                    content = `Your next quiz is **${nextQuiz.title}**. The most important thing for you to focus on is any weak points in that area. Spending just 15–20 minutes on specific practice rounds before the quiz will help you feel more confident!`;
                    actions = [{ label: "Show me what's on the quiz", actionType: 'navigate', destination: '/dashboard/student' }];
                } else {
                    content = "I don't see any upcoming quizzes on your schedule right now, so you can use this time for general practice or clearing any overdue work.";
                    actions = [{ label: "Start a practice round", actionType: 'navigate', destination: '/play/practice-general' }];
                }
            } else if (isExplainKw(lowerQuery)) {
                const matchedTopic = Object.keys(topicExplanations).find(t => lowerQuery.includes(t.toLowerCase()));
                if (matchedTopic) {
                    content = topicExplanations[matchedTopic];
                    actions = [
                        { label: `Practice ${matchedTopic}`, actionType: 'navigate', destination: '/play/practice-general' },
                        { label: "Ask another question", actionType: 'navigate', destination: '#' }
                    ];
                } else if (primaryWeakTopic) {
                    content = `I'm not sure which topic you mean, but since you've been working on **${primaryWeakTopic}** lately, here's a simple explanation: \n\n${topicExplanations[primaryWeakTopic] || "It's an important concept that builds on what you've learned. Try some practice questions to see how it works!"}`;
                    actions = [{ label: `Practice ${primaryWeakTopic}`, actionType: 'navigate', destination: '/play/practice-general' }];
                } else {
                    content = "Which topic would you like me to explain? I can help with things like Factorisation, Quadratic Equations, or Kinematics.";
                }
            } else {
                content = "I'm not sure I can help with that one, but I'm great at questions about your work — like what to do next, what's overdue, or why a topic is tricky. \n\nTry asking: \n• 'What should I do right now?' \n• 'How am I doing this week?' \n• 'Explain Factorisation simply.'";
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

    const sidebarContent = (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b border-[#EAE7DD]">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles size={18} className="text-[#68507B]" />
                    Context
                </h2>
                <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed">
                    Picking a class helps me give more accurate answers about your specific work.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Current Class</p>
                    <button
                        onClick={() => setIsSubjectSelectorOpen(!isSubjectSelectorOpen)}
                        className="w-full flex items-center justify-between p-3 bg-[#68507B]/5 border border-[#68507B]/20 rounded-xl text-[#68507B] hover:bg-[#68507B]/10 transition-colors shadow-sm"
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-2 h-2 rounded-full bg-[#68507B]/40 shrink-0" />
                            <span className="text-sm font-bold truncate">{selectedSubjectName}</span>
                        </div>
                        <ChevronDown size={16} className={`shrink-0 transition-transform ${isSubjectSelectorOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isSubjectSelectorOpen && (
                        <div className="mt-2 bg-white rounded-xl border border-[#EAE7DD] shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                            <button
                                onClick={() => {
                                    setSelectedSubjectId('all');
                                    setIsSubjectSelectorOpen(false);
                                    setMessages(prev => [...prev, { id: `sys-${Date.now()}`, role: 'system', content: '── Context changed to All subjects ──' }]);
                                }}
                                className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center justify-between hover:bg-slate-50 transition-colors ${selectedSubjectId === 'all' ? 'bg-[#68507B]/5 text-[#68507B]' : 'text-slate-700'}`}
                            >
                                <span>All subjects</span>
                                {selectedSubjectId === 'all' && <CheckCircle2 size={16} />}
                            </button>
                            {subjects.map(subj => (
                                <button
                                    key={subj}
                                    onClick={() => {
                                        setSelectedSubjectId(subj);
                                        setIsSubjectSelectorOpen(false);
                                        setMessages(prev => [...prev, { id: `sys-${Date.now()}`, role: 'system', content: `── Context changed to ${subj} ──` }]);
                                    }}
                                    className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center justify-between hover:bg-slate-50 border-t border-slate-50 transition-colors ${selectedSubjectId === subj ? 'bg-[#68507B]/5 text-[#68507B]' : 'text-slate-700'}`}
                                >
                                    <span className="truncate">{subj}</span>
                                    {selectedSubjectId === subj && <CheckCircle2 size={16} />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 italic">I'm best at:</p>
                    <ul className="space-y-2.5 px-2">
                        <li className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#68507B]/30 mt-1.5 shrink-0" />
                            Finding unfinished work
                        </li>
                        <li className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#68507B]/30 mt-1.5 shrink-0" />
                            Suggesting what to do next
                        </li>
                        <li className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#68507B]/30 mt-1.5 shrink-0" />
                            Weekly progress summaries
                        </li>
                        <li className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#68507B]/30 mt-1.5 shrink-0" />
                            Explaining tricky topics
                        </li>
                    </ul>
                </div>
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
            sidebarColor="#4a3958"
            logout={logout}
            navigate={navigate}
            sidebar={sidebarContent}
            demoBanner={<DemoBanner />}
            demoRoleSwitcher={<DemoRoleSwitcher />}
        >
            <CopilotMobileHeader themeColor="#68507B" />

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                {messages.length === 0 ? (
                    <CopilotEmptyState
                        themeColor="#68507B"
                        description="I can check your pending assignments, tell you what to focus on, and summarize your weekly progress."
                        prompts={currentPrompts}
                        handleSend={handleSend}
                    />
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

                            {/* Subject Context Selector */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsSubjectSelectorOpen(!isSubjectSelectorOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-[#68507B]/5 hover:bg-[#68507B]/10 border border-[#68507B]/20 rounded-full text-[#68507B] transition-colors w-fit shadow-sm"
                                >
                                    <div className="w-2 h-2 rounded-full bg-[#68507B]/40" />
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
                                <Sparkles size={16} className="ml-0.5" />
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
        </CopilotLayout>
    );
};

export default StudentCopilotPage;
