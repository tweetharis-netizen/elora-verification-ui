import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    CheckCircle2,
    ChevronDown,
    Sparkles,
    ArrowRight,
    Layers,
    BookOpen,
    Check,
    Send,
    Heart,
    Calendar,
    AlertCircle,
    User,
    TrendingUp,
    MessageSquare,
    Mail,
    Info
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useDemoMode } from '../hooks/useDemoMode';
import { DemoBanner } from '../components/DemoBanner';
import { DemoRoleSwitcher } from '../components/DemoRoleSwitcher';
import {
    CopilotLayout,
    CopilotMessageBubble,
    CopilotEmptyState,
    CopilotMobileHeader,
    Message,
    ActionChip,
    getParentGreeting,
    getPronoun,
    shouldShowFeedback
} from '../components/Copilot/CopilotShared';
import { ParentChildData, processParentPrompt } from '../lib/parentIntentHandler';

// Mock child data for demo
const DEMO_CHILDREN: ParentChildData[] = [
    {
        id: 'liam-1',
        name: 'Liam',
        gender: 'male'
    }
];

const SUBJECTS = ['All subjects', 'Math', 'Science', 'English', 'History', 'Geography'];

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

const ParentCopilotPage: React.FC = () => {
    const { logout, currentUser } = useAuth();
    const navigate = useNavigate();
    const isDemo = useDemoMode();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    
    // Parent Context
    const [selectedChildId, setSelectedChildId] = useState<string | null>(isDemo ? 'liam-1' : null);
    const [selectedSubject, setSelectedSubject] = useState<string>('All subjects');
    
    const [isChildPopupOpen, setIsChildPopupOpen] = useState(false);
    const [isSubjectPopupOpen, setIsSubjectPopupOpen] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const currentChild = DEMO_CHILDREN.find(c => c.id === selectedChildId) || null;
    const childName = currentChild?.name || 'your child';

    const buildPrompts = (): string[] => {
        const firstLabel = currentChild 
            ? `How’s ${currentChild.name} doing this week?` 
            : `How is my child doing this week?`;

        return [
            firstLabel,
            "Anything coming up?",
            "How can I help at home?",
            "Should I be worried about anything?"
        ];
    };

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

        // Process with intent handler
        setTimeout(() => {
            const result = processParentPrompt(query, {
                selectedChildId: selectedChildId,
                selectedSubject: selectedSubject === 'All subjects' ? null : selectedSubject,
                children: DEMO_CHILDREN
            });

            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: result.content,
                steps: result.steps,
                actions: result.actions,
                intent: result.intent,
                showFeedback: shouldShowFeedback()
            };

            setMessages(prev => [...prev, assistantMessage]);
            setIsThinking(false);
        }, 1500);
    };

    const handleChildChange = (id: string | null) => {
        const newChild = DEMO_CHILDREN.find(c => c.id === id);
        setSelectedChildId(id);
        setIsChildPopupOpen(false);
        
        const systemMsg: Message = {
            id: `system-${Date.now()}`,
            role: 'system',
            content: `Switched to ${newChild?.name || 'All children'} · answers now reflect this child`
        };
        setMessages(prev => [...prev, systemMsg]);
    };

    const handleSubjectChange = (subject: string) => {
        setSelectedSubject(subject);
        setIsSubjectPopupOpen(false);
        
        const systemMsg: Message = {
            id: `system-${Date.now()}`,
            role: 'system',
            content: `Filtering by ${subject} · answers now focus on this area`
        };
        setMessages(prev => [...prev, systemMsg]);
    };

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    const currentPrompts = buildPrompts();

    return (
        <CopilotLayout
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            isDemo={isDemo}
            role="Parent"
            themeColor="#f59e0b" // amber-500
            sidebarColor="#78350f" // amber-900
            logout={logout}
            navigate={navigate}
            demoBanner={isDemo && <DemoBanner />}
            demoRoleSwitcher={isDemo && <DemoRoleSwitcher />}
            sidebar={
                <>
                    <div className="p-6 border-b border-[#EAE7DD]">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-1">Elora Copilot</h2>
                        <p className="text-sm font-medium text-amber-600 flex items-center gap-1.5">
                            <Sparkles size={14} />
                            Connected to {childName}'s data
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 no-scrollbar">
                        {/* Context Selection Row */}
                        <div className="flex flex-col gap-3">
                            {/* Child Selector */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsChildPopupOpen(!isChildPopupOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-full text-amber-700 transition-colors w-full"
                                >
                                    <User size={14} className="shrink-0" />
                                    <span className="text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                                        {currentChild?.name || 'Select child'}
                                    </span>
                                    <ChevronDown size={14} className={`shrink-0 ml-auto transition-transform ${isChildPopupOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isChildPopupOpen && (
                                    <>
                                        <div className="fixed inset-0 z-30" onClick={() => setIsChildPopupOpen(false)} />
                                        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-200 z-40 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            {DEMO_CHILDREN.map((child) => (
                                                <button
                                                    key={child.id}
                                                    onClick={() => handleChildChange(child.id)}
                                                    className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors ${selectedChildId === child.id ? 'bg-amber-50/50' : ''}`}
                                                >
                                                    <span className="text-sm font-bold text-slate-900">{child.name}</span>
                                                    {selectedChildId === child.id && <Check size={16} className="text-amber-600" />}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Subject Selector */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsSubjectPopupOpen(!isSubjectPopupOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-slate-700 transition-colors w-full"
                                >
                                    <BookOpen size={14} className="shrink-0" />
                                    <span className="text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                                        {selectedSubject}
                                    </span>
                                    <ChevronDown size={14} className={`shrink-0 ml-auto transition-transform ${isSubjectPopupOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isSubjectPopupOpen && (
                                    <>
                                        <div className="fixed inset-0 z-30" onClick={() => setIsSubjectPopupOpen(false)} />
                                        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-200 z-40 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto">
                                            {SUBJECTS.map((sub) => (
                                                <button
                                                    key={sub}
                                                    onClick={() => handleSubjectChange(sub)}
                                                    className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors ${selectedSubject === sub ? 'bg-amber-50/50 text-amber-900' : 'text-slate-600'}`}
                                                >
                                                    <span className="text-sm font-medium">{sub}</span>
                                                    {selectedSubject === sub && <Check size={16} className="text-amber-600" />}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Prompt Chips */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Suggested Questions</h3>
                            <div className="flex flex-col gap-2">
                                {currentPrompts.map((prompt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSend(prompt)}
                                        className="text-left text-sm text-amber-700 font-medium bg-amber-50 border border-amber-100 hover:bg-amber-100 hover:border-amber-200 transition-colors px-4 py-3 rounded-xl flex items-start gap-2"
                                    >
                                        <span className="flex-1 leading-snug">{prompt}</span>
                                        <ArrowRight size={16} className="shrink-0 text-amber-500 opacity-50 mt-0.5" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-[#EAE7DD]">
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            Ask me anything about {childName}'s learning — I'll keep it simple.
                        </p>
                    </div>
                </>
            }
        >
            <CopilotMobileHeader themeColor="#f59e0b" />

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                {messages.length === 0 ? (
                    <CopilotEmptyState
                        themeColor="#f59e0b"
                        userName={currentUser?.name || 'Parent'}
                        customGreeting={getParentGreeting(currentChild?.name)}
                        description={`I'm here to give you a clear, calm view of ${childName}'s progress. I'll flag what matters and help you support ${getPronoun(currentChild?.gender || 'non-binary').pObj} at home.`}
                        prompts={currentPrompts}
                        handleSend={handleSend}
                    />
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#EAE7DD]">
                            <div className="flex items-center gap-3">
                                <div className="bg-amber-50 p-2 rounded-xl border border-amber-100 hidden md:block">
                                    <Sparkles className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-900 leading-tight">Elora Copilot</h1>
                                    <p className="text-sm text-slate-500 font-medium">
                                        Calm snapshots of {childName}'s learning
                                    </p>
                                </div>
                            </div>
                        </div>

                        {messages.map((msg) => (
                            <CopilotMessageBubble
                                key={msg.id}
                                message={msg}
                                themeColor="#f59e0b"
                                thinkingStripHeader="How I found this"
                                shouldAutoExpandSteps={messages.filter(m => m.role === 'assistant' && m.steps && m.steps.length > 0).findIndex(m => m.id === msg.id) < 3}
                                copilotRole="parent"
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
                                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            <div className="p-4 md:p-6 bg-white border-t border-[#EAE7DD]">
                <div className="max-w-4xl mx-auto space-y-4">
                    <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                         <button
                            onClick={() => setIsChildPopupOpen(true)}
                            className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-[11px] font-bold border border-amber-200 whitespace-nowrap"
                        >
                            <User size={12} />
                            {currentChild?.name || 'Child'}
                        </button>
                        <button
                            onClick={() => setIsSubjectPopupOpen(true)}
                            className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-white text-slate-700 rounded-full text-[11px] font-bold border border-slate-200 whitespace-nowrap"
                        >
                            <BookOpen size={12} />
                            {selectedSubject}
                        </button>
                        <HorizontalChips prompts={currentPrompts} onSend={handleSend} themeColor="#f59e0b" />
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
                                placeholder={`Ask about ${childName}'s learning...`}
                                className="w-full bg-[#F8F9FA] border border-[#EAE7DD] rounded-xl pl-4 pr-12 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none min-h-[52px] max-h-32"
                                rows={1}
                                style={{ height: '52px' }}
                            />
                            <button
                                onClick={() => handleSend(inputValue)}
                                disabled={!inputValue.trim() || isThinking}
                                className="absolute right-2.5 top-3 p-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white rounded-lg transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </CopilotLayout>
    );
};

export default ParentCopilotPage;
