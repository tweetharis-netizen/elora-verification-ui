import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    Gamepad2,
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
import { demoTeacherName, DEMO_CLASS_LEVEL, demoInsights } from '../demo/demoTeacherScenarioA';

type Step = {
    id: string;
    text: string;
};

type ActionChip = {
    label: string;
    actionType: 'navigate';
    destination?: string; // e.g. 'needs-attention', '/teacher/assignment/123'
};

type Message = {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    steps?: Step[];
    actions?: ActionChip[];
};

const SUGGESTED_PROMPTS_ALL = [
    "Who needs attention across all my classes?",
    "Give me a cross-class summary of this week.",
    "Explain Algebra – Factorisation in simple terms.",
    "Draft a message to parents about Algebra Quiz 1 being overdue."
];

const SUGGESTED_PROMPTS_SPECIFIC = [
    "Which students need my attention before Friday?",
    "How is this class doing on factorisation?",
    "Draft a note to parents about Algebra Quiz 1 being overdue.",
    "What's one thing I should focus on before our next lesson?"
];

// Mock classes for the context selector
const MOCK_CLASSES = [
    { id: 'demo-class-1', name: 'Sec 3 Mathematics', studentsCount: 32, lastActive: '2 hours ago' },
    { id: 'demo-class-2', name: 'Sec 4 Physics', studentsCount: 24, lastActive: '1 day ago' },
];

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
    const [isContextPopupOpen, setIsContextPopupOpen] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial demo state
    useEffect(() => {
        if (isDemo && messages.length === 0) {
            const contextName = MOCK_CLASSES.find(c => c.id === selectedClassId)?.name || 'All classes';
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
                        { label: 'View these students in Needs Attention', actionType: 'navigate', destination: 'needs-attention' }
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

        const newClass = MOCK_CLASSES.find(c => c.id === classId);
        const label = newClass ? newClass.name : 'All classes';

        setSelectedClassId(classId);
        setIsContextPopupOpen(false);

        // Add system message
        const systemMsg: Message = {
            id: `system-${Date.now()}`,
            role: 'system',
            content: `── Context changed to ${label} ──`
        };
        setMessages(prev => [...prev, systemMsg]);
    };

    const currentPrompts = selectedClassId ? SUGGESTED_PROMPTS_SPECIFIC : SUGGESTED_PROMPTS_ALL;
    const currentClassName = MOCK_CLASSES.find(c => c.id === selectedClassId)?.name || 'All classes';

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    useEffect(() => {
        console.log(`
[Elora Copilot Update Summary]

1. Small-talk / Greetings Detection:
Detected via case-insensitive keywords ('hi', 'hey', etc.) OR if the message is short (<= 6 words) and matches no other intent keywords.
Pattern fired: No thinking strip rendered. A short, friendly fallback message provides guided examples to help the user.

2. Thinking Steps Construction:
Steps are dynamically created array objects matching the natural logic of the check.
Example (Planning intent):
- Step 1: "Context: Sec 3 Mathematics — scoping all lookups to this class." (or All classes aggregate text)
- Step 2: "Checked overdue/upcoming assignments for Sec 3 Mathematics."
- Step 3: "Checked weak topic flags — none found this week."

3. Updated Copilot Description & Examples:
The "what is elora" / "what is copilot" intent clearly explains that Copilot works strictly on actual tracked class data and won't guess beyond it.
Example prompts:
- 'Which students need my attention before Friday?'
- 'Explain Algebra – Factorisation simply for this class.'
- 'Draft a short note to parents about Algebra Quiz 1 being overdue.'

4. Example Responses:
a) "Hi"
   - Steps: None
   - Text: "Hey! I work best when you ask me about your Elora classes — data, topics, students, or upcoming deadlines. Try something like:
   • 'Who needs my attention before Friday?'
   • 'Explain Algebra – Factorisation simply for this class.'
   • 'Draft a short note to parents about Algebra Quiz 1 being overdue.'"

b) "Which students need my attention before Friday?" (Sec 3 Mathematics)
   - Steps:
     1. "Context: Sec 3 Mathematics — scoping all lookups to this class."
     2. "Loaded assignments for Sec 3 Mathematics — found 1 overdue (Algebra Quiz 1)."
     3. "Checked recent sessions — filtered to the last 7 days."
     4. "Ranked by urgency: overdue first, then low scores, then weak topics."
   - Text: "In **Sec 3 Mathematics**, three students need your attention before Friday:
   **Jordan Lee** — 28% on Algebra Quiz 1 and struggling with factorisation.
   **Priya Nair** — Algebra Quiz 1 hasn't started yet, 3 days overdue.
   **Jordan Smith** — Submitted but scored 20% on the quiz; worth a quick check-in."

c) "What is Elora?"
   - Steps: None
   - Text: "Elora is a teaching platform that tracks your classes, assignments, topics, and how students are progressing. I'm the Copilot built into Elora — I read your class data and turn it into suggestions, summaries, and drafts. I only work with what's actually in your data; I don't guess beyond that.
   You can ask me things like:
   • 'Which students need my attention before Friday?'
   • 'Explain Algebra – Factorisation simply for this class.'
   • 'Draft a short message to parents about an overdue assignment.'"
        `);
    }, []);

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

            const currentClassNameText = selectedClassId
                ? MOCK_CLASSES.find(c => c.id === selectedClassId)?.name || 'this class'
                : 'all classes';
            const allClassesList = MOCK_CLASSES.map(c => c.name).join(', ');

            const contextStep = {
                id: `ctx-${Date.now()}`,
                text: selectedClassId
                    ? `Context: ${currentClassNameText} — scoping all lookups to this class.`
                    : `Context: All classes — aggregating across ${allClassesList}.`
            };

            // Intent Detection Helpers
            const isSmallTalkKw = (q: string) => /hi|hello|hey|thanks|thank you|how are you/i.test(q);
            const isAboutKw = (q: string) => /what is (elora|this|copilot)|what can you do|how should i use this|how do i use this/i.test(q);
            const isCommunicationKw = (q: string) => /message|email|note|parent|families|tell|say/i.test(q);
            const isExplanationKw = (q: string) => /explain|help me understand|what is (?!elora|this|copilot)/i.test(q);
            const isFeedbackKw = (q: string) => /feedback|comment|what should i say/i.test(q);
            const isPlanningKw = (q: string) => /before friday|this week|today|next lesson|next class/i.test(q);
            const isAttentionKw = (q: string) => /attention|struggling|help/i.test(q);
            const isTopicKw = (q: string) => /factorisation|algebra|topic|performance/i.test(q);
            const isSummaryKw = (q: string) => /summary|how are we doing|report|weekly/i.test(q);

            const hasSupportedIntent = isAboutKw(lowerQuery) || isCommunicationKw(lowerQuery) || isExplanationKw(lowerQuery) || isFeedbackKw(lowerQuery) || isPlanningKw(lowerQuery) || isAttentionKw(lowerQuery) || isTopicKw(lowerQuery) || isSummaryKw(lowerQuery);

            const wordCount = query.trim().split(/\s+/).length;
            const isSmallTalk = isSmallTalkKw(lowerQuery) || (wordCount <= 6 && !hasSupportedIntent);

            let content = "";
            let steps: Step[] = [];
            let actions: ActionChip[] = [];

            const getScopePrefix = () => {
                if (selectedClassId) return "";
                const variations = [
                    "Across all your classes, here's what I found...",
                    "Checking across all your current classes...",
                    "Looking at everything across all classes...",
                    "Based on data from all your classes..."
                ];
                return variations[Math.floor(Math.random() * variations.length)] + "\n\n";
            };

            if (isSmallTalk) {
                steps = [];
                content = "Hey! I work best when you ask me about your Elora classes — data, topics, students, or upcoming deadlines. Try something like:\n• 'Who needs my attention before Friday?'\n• 'Explain Algebra – Factorisation simply for this class.'\n• 'Draft a short note to parents about Algebra Quiz 1 being overdue.'";
            } else if (isAboutKw(lowerQuery)) {
                steps = [];
                content = "Elora is a teaching platform that tracks your classes, assignments, topics, and how students are progressing. I'm the Copilot built into Elora — I read your class data and turn it into suggestions, summaries, and drafts. I only work with what's actually in your data; I don't guess beyond that.\n\nYou can ask me things like:\n• 'Which students need my attention before Friday?'\n• 'Explain Algebra – Factorisation simply for this class.'\n• 'Draft a short message to parents about an overdue assignment.'";
            } else if (isCommunicationKw(lowerQuery)) {
                steps = [
                    contextStep,
                    { id: 'scan-asgn', text: `Loaded assignments for ${currentClassNameText} — found 1 overdue (Algebra Quiz 1).` },
                    { id: 'drafting', text: 'Drafting a calm message based on assignment status.' }
                ];
                content = getScopePrefix() + `Here’s a draft message you can send to parents about **Algebra Quiz 1**:\n\n"Hi everyone, I noticed that Algebra Quiz 1 was due a few days ago but hasn't been submitted yet. If your child is struggling with the factorisation topics, please let me know — I'm happy to help them get back on track!"`;
                actions = [{ label: 'View Assignment', actionType: 'navigate', destination: '/teacher/assignment/demo-asgn-1' }];
            } else if (isExplanationKw(lowerQuery)) {
                steps = [];
                content = "Factorisation is the process of breaking down an expression into a product of simpler factors. For Sec 3, I'd suggest explaining it as the 'reverse of expansion'.\n\n**Quick suggestion:** You could assign a short 5-minute practice pack to help the 14 students who are currently below the class average.";
                actions = [{ label: 'Open Practice Pack', actionType: 'navigate', destination: '/teacher/practice' }];
            } else if (isFeedbackKw(lowerQuery)) {
                steps = [
                    contextStep,
                    { id: 'check-student', text: 'Checked performance data for Jordan Lee.' },
                    { id: 'load-insight', text: 'Loaded insight: 28% on Algebra Quiz 1, struggling with factorisation.' }
                ];
                content = getScopePrefix() + `For **Jordan Lee**, I suggest this feedback: "Jordan, I see you've made a start on the factorisation exercises. It's a tricky topic! Let's spend a few minutes next lesson looking at the bracket expansion rules together to help boost your confidence."`;
            } else if (isPlanningKw(lowerQuery)) {
                steps = [
                    contextStep,
                    { id: 'load-stats', text: `Checked overdue/upcoming assignments for ${currentClassNameText}.` },
                    { id: 'check-upcoming', text: 'Checked weak topic flags — none found this week.' }
                ];
                content = getScopePrefix() + `Before your next lesson, I’d recommend focusing on **Algebra – Factorisation**. \n\n**Algebra Quiz 1** is 3 days overdue with no submissions yet, and about half the class is currently scoring below the class average on these topics. A quick recap of factorising quadratic expressions might be a great way to start the next class.`;
            } else if (isAttentionKw(lowerQuery)) {
                steps = [
                    contextStep,
                    { id: 's1', text: `Loaded assignments for ${currentClassNameText} — found 1 overdue (Algebra Quiz 1).` },
                    { id: 's2', text: 'Checked recent sessions — filtered to the last 7 days.' },
                    { id: 's3', text: 'Ranked by urgency: overdue first, then low scores, then weak topics.' }
                ];
                content = selectedClassId
                    ? `In **${currentClassNameText}**, three students need your attention before Friday:\n\n**Jordan Lee** — 28% on Algebra Quiz 1 and struggling with factorisation.\n**Priya Nair** — Algebra Quiz 1 hasn't started yet, 3 days overdue.\n**Jordan Smith** — Submitted but scored 20% on the quiz; worth a quick check-in.`
                    : getScopePrefix() + `**Sec 3 Mathematics**: Jordan Lee (28%), Priya Nair (Overdue).\n**Sec 4 Physics**: Alex Wong (Low participation).`;
                actions = [{ label: 'View in Needs Attention', actionType: 'navigate', destination: 'needs-attention' }];
            } else if (isTopicKw(lowerQuery)) {
                steps = [
                    contextStep,
                    { id: 'fetch', text: `Loaded assignments for ${currentClassNameText} — found Algebra Quiz 1.` },
                    { id: 'analyze', text: 'Checked recent sessions — filtered to the last 7 days.' }
                ];
                content = selectedClassId
                    ? `In **${currentClassNameText}**, average accuracy on Algebra – Factorisation is around 61%. 14 of 28 students are currently below the class average. It might be worth assigning one more short practice round.`
                    : getScopePrefix() + `**Algebra - Factorisation** is a key area for support in Sec 3 Mathematics (61% avg). Your other classes are performing within expected ranges.`;
            } else if (isSummaryKw(lowerQuery)) {
                steps = [
                    contextStep,
                    { id: 'agg', text: `Checked recent sessions — filtered to the last 7 days.` },
                    { id: 'comp', text: 'Checked weak topic flags — none found this week.' }
                ];
                content = selectedClassId
                    ? `In **${currentClassNameText}**, the class is averaging 61% accuracy this week, which is slightly down from last week's 68%. Notably, no students have submitted the Algebra Quiz 1 yet.`
                    : getScopePrefix() + `Engagement is slightly lower this week. Sec 3 Mathematics is at 61% while Sec 4 Physics is holding steady at 74%.`;
            } else {
                steps = [];
                content = `I'm not sure I can help with that one yet. Here are things I can do:\n• 'Who needs my attention before Friday?'\n• 'Explain Algebra – Factorisation simply for ${currentClassNameText}.'\n• 'Draft a short note to parents about Algebra Quiz 1 being overdue.'\n• 'What should I focus on before our next lesson?'`;
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
        if (action.actionType === 'navigate') {
            if (action.destination === 'needs-attention') {
                navigate(isDemo ? '/teacher/demo' : '/dashboard/teacher');
                // Note: ideally we tab-switch or scroll to Needs Attention, but navigating back is fine for v1
            } else if (action.destination) {
                navigate(action.destination);
            }
        }
    };

    const NavItem = ({
        icon,
        label,
        active = false,
        onClick,
        collapsed = false,
    }: {
        icon: React.ReactNode;
        label: string;
        active?: boolean;
        onClick?: () => void;
        collapsed?: boolean;
    }) => (
        <a
            href="#"
            onClick={(e) => { e.preventDefault(); onClick?.(); }}
            className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${active
                ? 'bg-teal-800 text-white'
                : 'text-teal-100 hover:bg-teal-800/50 hover:text-white'
                } ${collapsed ? 'justify-center focus:outline-none' : ''}`}
            title={collapsed ? label : undefined}
        >
            <div className="shrink-0">{icon}</div>
            {!collapsed && <span className="whitespace-nowrap">{label}</span>}
            {active && !collapsed && (
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
                    className={`bg-teal-900 text-teal-50 flex flex-col h-screen sticky top-0 shrink-0 shadow-xl z-20 transition-[width] duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}
                >
                    <div className={`h-20 flex items-center border-b border-teal-800/50 px-6 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
                        <Link to="/" className="flex items-center text-teal-50 hover:text-white transition-colors overflow-hidden">
                            <EloraLogo className="w-8 h-8 text-current" withWordmark={isSidebarOpen} />
                        </Link>
                        {isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="text-teal-100/50 hover:text-white transition-colors"
                            >
                                <PanelLeftClose size={18} />
                            </button>
                        )}
                    </div>

                    <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                        <NavItem
                            icon={<LayoutDashboard size={20} />}
                            label="Dashboard"
                            onClick={() => navigate(isDemo ? '/teacher/demo' : '/dashboard/teacher')}
                            collapsed={!isSidebarOpen}
                        />
                        <NavItem
                            icon={<BookOpen size={20} />}
                            label="Classes"
                            onClick={() => navigate(isDemo ? '/teacher/demo' : '/dashboard/teacher')}
                            collapsed={!isSidebarOpen}
                        />
                        <NavItem
                            icon={<Sparkles size={20} />}
                            label="Copilot"
                            active={true}
                            onClick={() => { }}
                            collapsed={!isSidebarOpen}
                        />
                        <NavItem
                            icon={<Gamepad2 size={20} />}
                            label="Practice & quizzes"
                            onClick={() => navigate(isDemo ? '/teacher/demo' : '/dashboard/teacher')}
                            collapsed={!isSidebarOpen}
                        />
                        <NavItem icon={<Users size={20} />} label="Students" collapsed={!isSidebarOpen} />
                    </nav>

                    <div className="p-4 border-t border-teal-800/50 space-y-1.5">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="flex items-center justify-center w-full p-2.5 text-teal-100/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors mb-2"
                            >
                                <PanelLeftOpen size={20} />
                            </button>
                        )}
                        <NavItem icon={<Settings size={20} />} label="Settings" collapsed={!isSidebarOpen} />
                        <button
                            onClick={logout}
                            className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-teal-100 hover:bg-teal-800/50 hover:text-white transition-colors ${!isSidebarOpen ? 'justify-center' : ''}`}
                            title={!isSidebarOpen ? "Sign out" : undefined}
                        >
                            <LogOut size={20} className="shrink-0" />
                            {isSidebarOpen && <span className="whitespace-nowrap">Sign out</span>}
                        </button>
                    </div>
                </aside>

                {/* ── Main Copilot Area ── */}
                <main className="flex-1 flex flex-col md:flex-row h-screen overflow-hidden">

                    {/* Left Column (Context Sidebar) - Hidden on mobile */}
                    <div className="hidden md:flex w-72 bg-white border-r border-[#EAE7DD] flex-col shrink-0">
                        <div className="p-6 border-b border-[#EAE7DD]">
                            <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-1">Elora Copilot</h2>
                            <p className="text-sm font-medium text-teal-600 flex items-center gap-1.5">
                                <Sparkles size={14} />
                                Connected to class data
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                            {/* Context Selection Pill */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsContextPopupOpen(!isContextPopupOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 hover:bg-teal-100/80 border border-teal-200 rounded-full text-teal-700 transition-colors w-fit"
                                >
                                    <Layers size={14} className="shrink-0" />
                                    <span className="text-xs font-bold whitespace-nowrap">
                                        {currentClassName}
                                    </span>
                                    <ChevronDown size={14} className={`shrink-0 transition-transform ${isContextPopupOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Desktop Popover */}
                                {isContextPopupOpen && (
                                    <>
                                        {/* Backdrop for desktop click-away */}
                                        <div
                                            className="fixed inset-0 z-30 hidden md:block"
                                            onClick={() => setIsContextPopupOpen(false)}
                                        />
                                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-40 hidden md:block py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="px-4 py-2 mb-1">
                                                <p className="text-[11px] font-medium text-slate-400">
                                                    Copilot will answer using data from this class only.
                                                </p>
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
                                                        <p className="text-[11px] text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">
                                                            Answers will name the relevant class each time
                                                        </p>
                                                    </div>
                                                </button>

                                                <div className="my-1 border-t border-slate-100" />

                                                {MOCK_CLASSES.map((cls) => (
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
                                                                <span className="text-sm font-bold text-slate-900 truncate">{cls.name}</span>
                                                                {selectedClassId === cls.id && <Check size={16} className="text-teal-600" />}
                                                            </div>
                                                            <p className="text-[11px] text-slate-500">
                                                                {cls.studentsCount} students · Last active {cls.lastActive}
                                                            </p>
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
                    </div>

                    {/* Right Column (Chat Area) */}
                    <div className="flex-1 flex flex-col bg-[#FDFBF5] relative min-w-0">
                        {/* Mobile Header (Only on small screens) */}
                        <div className="md:hidden p-4 bg-white border-b border-[#EAE7DD] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-teal-100 text-teal-600 rounded-lg">
                                    <Sparkles size={18} />
                                </div>
                                <h2 className="font-bold text-slate-900">Elora Copilot</h2>
                            </div>
                            <div className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full border border-teal-100">
                                LIVE DATA
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto p-4">
                                    <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mb-6">
                                        <Sparkles size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">How can I help you today?</h2>
                                    <p className="text-slate-500 text-sm">
                                        I can uncover trends in your classes, draft feedback or messages, explain topics, and prioritize students who need your support.
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg) => (
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

                                                    {msg.role === 'assistant' && msg.steps && msg.steps.length > 0 && (
                                                        <ThinkingStrip steps={msg.steps} />
                                                    )}

                                                    <div
                                                        className={`px-5 py-4 rounded-2xl text-[14px] md:text-[15px] shadow-sm ${msg.role === 'user'
                                                                ? 'bg-teal-600 text-white rounded-br-sm'
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
                                                                    className="text-[12px] md:text-[13px] font-medium text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 shadow-sm"
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
                                ))
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

                        {/* Input Bar */}
                        <div className="p-4 md:p-6 bg-white border-t border-[#EAE7DD]">
                            <div className="max-w-4xl mx-auto space-y-4">
                                {/* Mobile Context/Prompt Chips - Scrollable horizontally */}
                                <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                                    <button
                                        onClick={() => setIsContextPopupOpen(true)}
                                        className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-[11px] font-bold border border-teal-200 whitespace-nowrap transition-colors hover:bg-teal-100"
                                    >
                                        <Layers size={12} />
                                        {currentClassName}
                                    </button>
                                    {currentPrompts.map((prompt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSend(prompt)}
                                            className="shrink-0 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-[11px] font-medium border border-teal-100 whitespace-nowrap hover:bg-teal-100 transition-colors"
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>

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
                                            placeholder="Ask about your class..."
                                            className="w-full bg-[#F8F9FA] border border-[#EAE7DD] rounded-xl pl-4 pr-12 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none flex-1 min-h-[52px] max-h-32"
                                            rows={1}
                                            style={{ height: '52px' }}
                                        />
                                        <button
                                            onClick={() => handleSend(inputValue)}
                                            disabled={!inputValue.trim() || isThinking}
                                            className="absolute right-2.5 top-3 p-1.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-lg transition-colors flex items-center justify-center"
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

                    {/* Mobile Context Bottom Sheet */}
                    {isContextPopupOpen && (
                        <div className="md:hidden fixed inset-0 z-[60] flex flex-col justify-end">
                            <div
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300"
                                onClick={() => setIsContextPopupOpen(false)}
                            />
                            <div className="relative bg-white rounded-t-3xl shadow-2xl p-6 flex flex-col max-h-[70%] animate-in slide-in-from-bottom duration-300">
                                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 shrink-0" />

                                <h3 className="text-lg font-bold text-slate-900 mb-1">Select Context</h3>
                                <p className="text-sm text-slate-500 mb-6">
                                    Copilot will answer using data from this class only.
                                </p>

                                <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pb-6 custom-scrollbar">
                                    <button
                                        onClick={() => handleContextChange(null)}
                                        className={`w-full text-left px-4 py-4 rounded-2xl flex items-center gap-4 transition-colors ${!selectedClassId ? 'bg-teal-50 border-2 border-teal-200' : 'bg-slate-50 border-2 border-transparent'}`}
                                    >
                                        <div className={`p-2 rounded-xl ${!selectedClassId ? 'bg-teal-100 text-teal-600' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                            <GraduationCap size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[15px] font-bold text-slate-900">All classes</div>
                                            <div className="text-[12px] text-slate-500">Compare data across everything</div>
                                        </div>
                                        {!selectedClassId && <Check size={20} className="text-teal-600" />}
                                    </button>

                                    {MOCK_CLASSES.map((cls) => (
                                        <button
                                            key={cls.id}
                                            onClick={() => handleContextChange(cls.id)}
                                            className={`w-full text-left px-4 py-4 rounded-2xl flex items-center gap-4 transition-colors ${selectedClassId === cls.id ? 'bg-teal-50 border-2 border-teal-200' : 'bg-slate-50 border-2 border-transparent'}`}
                                        >
                                            <div className={`p-2 rounded-xl ${selectedClassId === cls.id ? 'bg-teal-100 text-teal-600' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                                <BookOpen size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-[15px] font-bold text-slate-900">{cls.name}</div>
                                                <div className="text-[12px] text-slate-500">{cls.studentsCount} students · Last active {cls.lastActive}</div>
                                            </div>
                                            {selectedClassId === cls.id && <Check size={20} className="text-teal-600" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default TeacherCopilotPage;

// --- Subcomponents ---

const ThinkingStrip = ({ steps }: { steps: Step[] }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="mb-2 w-full">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors bg-white/50 px-2.5 py-1 rounded-md mb-1 border border-slate-200"
            >
                <Sparkles size={12} className="text-teal-500" />
                <span>What I checked &middot; {steps.length} steps</span>
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {expanded && (
                <div className="pl-2 border-l-2 border-teal-200 space-y-2 mb-2 ml-1">
                    {steps.map((step) => (
                        <div key={step.id} className="flex items-start gap-2 text-[13px] text-slate-600">
                            <CheckCircle2 size={14} className="text-teal-500 mt-0.5 shrink-0" />
                            <span>{step.text}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
