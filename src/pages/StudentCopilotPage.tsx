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
        const isSmallTalkKw = (q: string) => /^(hi|hello|hey|thanks|thank you|how are you)$/i.test(q.replace(/[?!.]/g, ''));
        const isAboutKw = (q: string) => /what is (elora|this|copilot)|what can you do|how should i use this/i.test(q);
        const isOverdueKw = (q: string) => /overdue|unfinished|not finished|not done|what's overdue|todo|haven't finished/i.test(q);
        const isNextActionKw = (q: string) => /next|20 minutes|work on|should i work on|do now|best use of my time/i.test(q);
        // Summary: also catch "how am i doing", "am i doing ok", "am i behind", "am i okay in school"
        const isSummaryKw = (q: string) => /week|summary|overview|progress|(how am i doing)|(am i (doing|behind|okay|ok|keeping up))|(how am i going)/i.test(q);
        const isFocusTopicKw = (q: string) => /topic to focus on|area to focus on|growth area|what to work on|focus area|weakest topic/i.test(q);
        const isWhyPatternKw = (q: string) => /why do i keep getting|why do i keep missing|why do i keep getting this wrong/i.test(q);
        const isPrepareQuizKw = (q: string) => /prepare for the next quiz|prepare for the quiz|prepare for test|get ready for/i.test(q);
        const isExplainKw = (q: string) => /explain|what is|help me understand/i.test(q);
        // Sensitive: wellbeing
        const isSensitiveKw = (q: string) => /sad|depressed|hurt|mean|bully|stress|lonely|anxious|unhappy/i.test(q);
        // Fear / low confidence: "i feel dumb", "scared to fail", "i'm stupid"
        const isFearKw = (q: string) => /(feel (dumb|stupid|useless|like i can'?t))|(scared (i'?m going to|to) fail)|(going to fail)|(i'?m (so |really |)(bad|terrible|rubbish) at)/i.test(q);

        const getScopePrefix = () => {
            if (selectedSubjectId !== 'all') return "";
            const variations = [
                "Across all your subjects, here's what I found...",
                "Checking across all your current work...",
                "Looking at everything across all subjects...",
                "Based on your data from all subjects..."
            ];
            return variations[Math.floor(Math.random() * variations.length)] + "\n\n";
        };

        setTimeout(() => {
            setIsThinking(false);

            let content = "";
            let steps: Step[] = [];
            let actions: ActionChip[] = [];

            // Context-aware Step generator helper
            const getCtxStep = () => {
                return selectedSubjectId === 'all' 
                    ? { id: 'ctx', text: 'Context: All subjects — scoping all lookups across your full schedule' } 
                    : { id: 'ctx', text: `Context: ${selectedSubjectId} — scoping all lookups to this subject only` };
            };

            if (isSensitiveKw(lowerQuery)) {
                content = "I hear that you're feeling this way, and that sounds genuinely tough. While I don't give personal advice, I'd really encourage you to talk to a teacher, counselor, or parent. They can provide the support you need right now.\n\nI'm still here if you want to take a look at your workload or take a pause from studying.";
            } else if (isFearKw(lowerQuery)) {
                content = "That's a really normal feeling, and it doesn't mean you're not capable. Lots of students feel this way — especially before a big quiz or when a topic feels hard.\n\nLet me check where you actually stand, because the data often tells a different story than how we feel.";
                steps = [
                    getCtxStep(),
                    { id: 'check-scores', text: 'Checked your recent scores and submission rate' }
                ];
                if (streakData) {
                    const thisWeekScore = streakData.scoreThisWeek ?? 0;
                    content += `\n\nRight now, you're averaging **${thisWeekScore}%** this week${primaryFocusTopic ? ` and your main area to focus on is **${primaryFocusTopic}**` : ' and your scores are fairly balanced'}. You're not failing — there's one thing worth working on, and I can help you focus on it.`;
                    if (primaryFocusTopic) actions.push({ label: `Practice ${primaryFocusTopic}`, actionType: 'navigate', destination: '/play/practice-general' });
                }
                actions.unshift({ label: 'Show me where I stand', actionType: 'navigate', destination: '/dashboard/student' });
            } else if (isSummaryKw(lowerQuery)) {
                steps = [
                    getCtxStep(),
                    { id: 'check-scores', text: 'Checked your average score this week and last week' },
                    { id: 'check-asgn', text: 'Checked how many assignments you’ve submitted out of those due' },
                    { id: 'check-streak', text: 'Checked your practice streak for this week' }
                ];
                if (!streakData || streakData.weeklyScores.length === 0) {
                    content = "I don't have enough data to give you a full summary yet — keep at it and I'll have more to show you soon!";
                } else {
                    const ctxStr = selectedSubjectId === 'all' ? 'Across all your subjects' : `For your ${selectedSubjectId} work`;
                    const thisWeekScore = streakData.scoreThisWeek ?? 0;
                    const priorWeekScore = streakData.scorePriorWeek ?? 0;
                    const subCount = filteredAssignments.filter(a => ['completed', 'success', 'submitted'].includes(a.status || '')).length;
                    const totalCount = filteredAssignments.length;

                    content = getScopePrefix() + `You're doing okay overall — there are a couple of things worth focusing on, but nothing is out of control. ${ctxStr}, your average score is **${thisWeekScore}%** this week, compared with ${priorWeekScore}% last week.\n\nYou've submitted ${subCount} of ${totalCount > 0 ? totalCount : 'your'} assignments. ${primaryFocusTopic ? `The best next step is to work on **${primaryFocusTopic}** — I can open a practice round for you.` : 'Your scores are looking balanced across all topics — nice work.'}`;
                    actions = [{ label: "See my remaining work", actionType: 'navigate', destination: '/dashboard/student' }];
                    if (primaryFocusTopic) actions.push({ label: `Practice ${primaryFocusTopic} now`, actionType: 'navigate', destination: '/play/practice-general' });
                }

            } else if (isSmallTalkKw(lowerQuery) || lowerQuery === "hi" || lowerQuery === "hello") {
                content = "Hey! I'm your Elora assistant. I'm here to help you stay on top of your work and improve your scores. \n\nWhat can I help you with right now? Try asking about your unfinished assignments or what to focus on next.";
            } else if (isAboutKw(lowerQuery)) {
                content = "Elora is a platform for tracking your progress and assignments. I'm your Student Copilot, designed to help you figure out what to work on, understand tricky topics, and get ready for quizzes. \n\nTry asking: \n• 'What should I do right now?' \n• 'What assignments haven’t I finished?' \n• 'Explain Factorisation simply.'";
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
                    content = getScopePrefix() + `You have ${sorted.length} assignment${sorted.length > 1 ? 's' : ''} still to do:\n`;
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
                    { id: 'load-performance', text: 'Analyzed your recent practice performance looking for topics to focus on' }
                ];

                const urgent = [...filteredPending].sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                })[0];

                if (urgent) {
                    content = getScopePrefix() + `The most important thing to start now is **${urgent.title}** because it is the most urgent on your list.`;
                    if (primaryFocusTopic) {
                        content += `\n\nIf you have extra time, follow that up with a short practice round on **${primaryFocusTopic}** to boost your scores.`;
                        actions.push({ label: `Practice ${primaryFocusTopic}`, actionType: 'navigate', destination: '/play/practice-general' });
                    }
                    actions.unshift({ label: `Start ${urgent.title}`, actionType: 'navigate', destination: '/dashboard/student' });
                } else if (primaryFocusTopic) {
                    content = getScopePrefix() + `Across your subjects, the best use of your time right now is to practice **${primaryFocusTopic}**. This is the topic you've been finding most tricky recently.`;
                    actions = [{ label: `Practice ${primaryFocusTopic}`, actionType: 'navigate', destination: '/play/practice-general' }];
                } else {
                    content = "Your schedule looks great! You've cleared your priority assignments and your recent scores are balanced. You could explore a new topic or take a well-earned break.";
                }
            } else if (isFocusTopicKw(lowerQuery)) {
                steps = [
                    getCtxStep(),
                    { id: 'check-topics', text: 'Analyzed your recent practice results by topic' },
                    { id: 'find-focus-area', text: 'Found the topic where you have the most room to grow' }
                ];

                if (primaryFocusTopic) {
                    content = getScopePrefix() + `Right now, your main focus area is **${primaryFocusTopic}**. Working on this first will have the biggest impact on your overall progress.`;
                    actions = [
                        { label: `Practice ${primaryFocusTopic}`, actionType: 'navigate', destination: '/play/practice-general' },
                        { label: `Explain ${primaryFocusTopic} simply`, actionType: 'navigate', destination: '#' }
                    ];
                } else {
                    content = "I don't see a single topic to focus on right now — your recent results are fairly balanced.";
                }
            } else if (isWhyPatternKw(lowerQuery)) {
                const topicInQuery = Object.keys(topicExplanations).find(t => lowerQuery.includes(t.toLowerCase()));
                const actualTopic = topicInQuery || primaryFocusTopic;

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
                    { id: 'compare-performance', text: 'Compared that with your current focus areas' }
                ];

                const nextQuiz = filteredPending.find(a => /quiz|test/i.test(a.title));
                
                if (nextQuiz) {
                    content = getScopePrefix() + `Your next quiz is **${nextQuiz.title}**. The most important thing for you to focus on is any growth areas in that area. Spending just 15–20 minutes on specific practice rounds before the quiz will help you feel more confident!`;
                    actions = [{ label: "Show me what's on the quiz", actionType: 'navigate', destination: '/dashboard/student' }];
                } else {
                    content = getScopePrefix() + "I don't see any upcoming quizzes on your schedule right now, so you can use this time for general practice or clearing any overdue work.";
                    actions = [{ label: "Start a practice round now", actionType: 'navigate', destination: '/play/practice-general' }];
                }
            } else if (isExplainKw(lowerQuery)) {
                const matchedTopic = Object.keys(topicExplanations).find(t => lowerQuery.includes(t.toLowerCase().split(' – ')[0]));
                if (matchedTopic) {
                    content = topicExplanations[matchedTopic];
                    actions = [
                        { label: `Practice ${matchedTopic}`, actionType: 'navigate', destination: '/play/practice-general' },
                        { label: "Ask another question", actionType: 'navigate', destination: '#' }
                    ];
                } else if (primaryFocusTopic) {
                    content = `I'm not exactly sure which topic you mean, but since you've been working on **${primaryFocusTopic}** lately, here's a simple explanation: \n\n${topicExplanations[primaryFocusTopic] || "It's an important concept that builds on what you've learned. Try some practice questions to see how it works!"}`;
                    actions = [{ label: `Practice ${primaryFocusTopic}`, actionType: 'navigate', destination: '/play/practice-general' }];
                } else {
                    content = "Which topic would you like me to explain? I can help with things like Factorisation, Quadratic Equations, or Kinematics.";
                }
            } else {
                content = "I'm not sure I can help with that one, but I'm great at questions about your work — like what to do next, what's overdue, or why a topic is tricky. \n\nTry asking: \n• 'What should I do right now?' \n• 'How am I doing this week?' \n• 'Explain Factorisation simply.'";
            }

            const resolvedIntent = isSensitiveKw(lowerQuery) ? 'sensitive' :
                isFearKw(lowerQuery) ? 'fearconfidence' :
                isSummaryKw(lowerQuery) ? 'summary' :
                (isSmallTalkKw(lowerQuery) || lowerQuery === "hi" || lowerQuery === "hello") ? 'smalltalk' :
                isAboutKw(lowerQuery) ? 'about' :
                isOverdueKw(lowerQuery) ? 'overdue' :
                isNextActionKw(lowerQuery) ? 'nextaction' :
                isFocusTopicKw(lowerQuery) ? 'focustopic' :
                isWhyPatternKw(lowerQuery) ? 'whypattern' :
                isPrepareQuizKw(lowerQuery) ? 'preparequiz' :
                isExplainKw(lowerQuery) ? 'explain' : 'unknown';

            const assistantMsg: Message = {
                id: Date.now().toString() + '-a',
                role: 'assistant',
                steps: steps,
                content: content,
                actions: actions.length > 0 ? actions : undefined,
                intent: resolvedIntent,
                showFeedback: shouldShowFeedback()
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
        <div className="flex flex-col h-full overflow-hidden bg-[#faf9f6]">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-[#EAE7DD]">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-1">Elora Copilot</h2>
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
                                        setMessages(prev => [...prev, { id: `sys-${Date.now()}`, role: 'system', content: `Switched to All subjects · answers now reflect this subject` }]);
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
                                            setMessages(prev => [...prev, { id: `sys-${Date.now()}`, role: 'system', content: `Switched to ${subj} · answers now reflect this subject` }]);
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
            sidebarColor="#68507B"
            logout={logout}
            navigate={navigate}
            sidebar={sidebarContent}
            demoBanner={isDemo && <DemoBanner />}
            demoRoleSwitcher={isDemo && <DemoRoleSwitcher />}
        >
            <CopilotMobileHeader themeColor="#68507B" />

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
                            Elora Copilot is an AI assistant and may occasionally make mistakes.
                        </p>
                    </div>
                </div>
            </div>
        </CopilotLayout>
    );
};

export default StudentCopilotPage;
