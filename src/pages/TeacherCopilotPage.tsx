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
    AlertCircle
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
    role: 'user' | 'assistant';
    content: string;
    steps?: Step[];
    actions?: ActionChip[];
};

const SUGGESTED_PROMPTS = [
    "Who needs my attention before Friday?",
    "How is Sec 3 doing on Algebra – Factorisation?",
    "Give me a summary of this week."
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
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial demo state
    useEffect(() => {
        if (isDemo && messages.length === 0) {
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
                        { id: 's1', text: 'Loaded Sec 3 Mathematics insights' },
                        { id: 's2', text: 'Filtered to overdue work and low scores' },
                        { id: 's3', text: 'Ranked by urgency' }
                    ],
                    content: 'Here are 3 students to prioritise before Friday:\n\n**Jordan Lee** — 28% on Algebra Quiz 1 and struggling with factorisation.\n**Priya Nair** — Algebra Quiz 1 not submitted, 3 days overdue.\n**Jordan Smith** — Submitted but scored 20% on the quiz; worth a quick check-in.',
                    actions: [
                        { label: 'View these students in Needs Attention', actionType: 'navigate', destination: 'needs-attention' }
                    ]
                }
            ]);
        }
    }, [isDemo]);

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
            const lowerQuery = query.toLowerCase();

            let assistantMsg: Message;

            if (lowerQuery.includes('attention before friday')) {
                assistantMsg = {
                    id: Date.now().toString() + '-a',
                    role: 'assistant',
                    steps: [
                        { id: 's1', text: 'Loaded Sec 3 Mathematics insights' },
                        { id: 's2', text: 'Filtered to overdue work and low scores' },
                        { id: 's3', text: 'Ranked by urgency' }
                    ],
                    content: 'Here are 3 students to prioritise before Friday:\n\n**Jordan Lee** — 28% on Algebra Quiz 1 and struggling with factorisation.\n**Priya Nair** — Algebra Quiz 1 not submitted, 3 days overdue.\n**Jordan Smith** — Submitted but scored 20% on the quiz; worth a quick check-in.',
                    actions: [
                        { label: 'View these students in Needs Attention', actionType: 'navigate', destination: 'needs-attention' }
                    ]
                };
            } else if (lowerQuery.includes('factorisation')) {
                assistantMsg = {
                    id: Date.now().toString() + '-a',
                    role: 'assistant',
                    content: 'Average accuracy on Algebra – Factorisation is around 61%. 14 of 28 students are below 50% on this topic. It’s worth one more short practice round on this topic before moving on.',
                };
            } else if (lowerQuery.includes('summary of this week') || lowerQuery.includes('summary')) {
                assistantMsg = {
                    id: Date.now().toString() + '-a',
                    role: 'assistant',
                    content: 'This week, Sec 3 Mathematics is averaging 61%, compared with 68% last week. 0 of 32 assignments have been submitted so far. One area to watch is Algebra - Factorisation, where several students are still below 60%.',
                };
            } else {
                assistantMsg = {
                    id: Date.now().toString() + '-a',
                    role: 'assistant',
                    content: "I'm still learning and can't answer that specific question just yet in this version. Try asking me about who needs attention, how the class is doing on a topic like factorisation, or for a summary of the week."
                };
            }

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
                            onClick={() => {}}
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
                            {/* Context Card */}
                            <div className="bg-[#F8F9FA] border border-slate-200 rounded-xl p-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Current Context</h3>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-2 text-slate-700">
                                        <BookOpen size={16} className="mt-0.5 text-slate-400" />
                                        <div className="font-medium text-sm">
                                            {isDemo ? 'Sec 3 Mathematics' : 'All Classes'}
                                            {isDemo && <span className="text-slate-500 font-normal pl-1">/ Scenario A</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 text-slate-700">
                                        <AlertCircle size={16} className="mt-0.5 text-orange-400" />
                                        <div className="font-medium text-sm">
                                            {isDemo ? '3 students need attention' : 'Ready to help'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Prompt Chips */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Suggested Questions</h3>
                                <div className="flex flex-col gap-2">
                                    {SUGGESTED_PROMPTS.map((prompt, idx) => (
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
                                Copilot can see: assignments, scores, weak topics, and student progress across your active classes.
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
                                        I can uncover trends in your classes, identify students who need support, and summarize recent engagement.
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[90%] md:max-w-2xl flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            
                                            {msg.role === 'assistant' && msg.steps && msg.steps.length > 0 && (
                                                <ThinkingStrip steps={msg.steps} />
                                            )}

                                            <div
                                                className={`px-5 py-4 rounded-2xl text-[14px] md:text-[15px] shadow-sm ${
                                                    msg.role === 'user'
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
                                    <div className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold border border-slate-200 whitespace-nowrap">
                                        <BookOpen size={12} />
                                        {isDemo ? 'Sec 3 Maths' : 'All Classes'}
                                    </div>
                                    {SUGGESTED_PROMPTS.map((prompt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSend(prompt)}
                                            className="shrink-0 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-[11px] font-medium border border-teal-100 whitespace-nowrap hover:bg-teal-100 transition-colors"
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-end gap-3">
                                    <button
                                        onClick={() => setMessages([])}
                                        title="New conversation"
                                        className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-xl transition-colors shrink-0"
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
                                            className="absolute right-2.5 top-2.5 p-1.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-lg transition-colors flex items-center justify-center"
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
