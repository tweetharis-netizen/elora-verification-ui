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
    Info,
    Zap
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
    CopilotAuthGate,
    Message,
    Step,
    ActionChip,
    getParentGreeting,
    getPronoun,
    shouldShowFeedback
} from '../components/Copilot/CopilotShared';
import { EloraLogo } from '../components/EloraLogo';
import { askElora } from '../services/askElora';
import { getParentChildren, getParentChildSummary } from '../services/dataService';
import { demoChildren as scenarioChildren, demoChildSummary, demoParentName } from '../demo/demoParentScenarioA';

// Mock child data for demo
const DEMO_CHILDREN = scenarioChildren.map(c => ({
    id: c.id,
    name: c.name,
    gender: 'male' as const // Jordan is male in the scenario
}));

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

const ParentCopilotPage: React.FC<{ embeddedInShell?: boolean }> = ({ embeddedInShell = false }) => {
    const { logout, currentUser, login } = useAuth();
    const navigate = useNavigate();
    const isDemo = useDemoMode();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    
    
    // Parent Context
    const [children, setChildren] = useState<any[]>(isDemo ? DEMO_CHILDREN : []);
    const [selectedChildId, setSelectedChildId] = useState<string | null>(isDemo ? DEMO_CHILDREN[0].id : null);
    const [performanceData, setPerformanceData] = useState<any | null>(isDemo ? demoChildSummary : null);
    const [selectedSubject, setSelectedSubject] = useState<string>('All subjects');
    
    const [isChildPopupOpen, setIsChildPopupOpen] = useState(false);
    const [isSubjectPopupOpen, setIsSubjectPopupOpen] = useState(false);
    
    useEffect(() => {
        // Ensure demo user is logically "logged in" (but don't persist to localStorage)
        if (isDemo && currentUser?.id !== 'parent_1' && typeof login === 'function') {
            login('parent', undefined, false);
        }
    }, [isDemo, currentUser, login]);

    useEffect(() => {
        if (isDemo) return;
        getParentChildren().then(data => {
            setChildren(data);
            if (data.length > 0 && !selectedChildId) {
                setSelectedChildId(data[0].id);
            }
        }).catch(err => console.error('Failed to fetch children:', err));
    }, [isDemo]);
    useEffect(() => {
        if (isDemo || !selectedChildId) return;
        getParentChildSummary(selectedChildId).then(summary => {
            setPerformanceData(summary);
        }).catch(err => console.error('Failed to fetch summary:', err));
    }, [selectedChildId, isDemo]);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const currentChild = children.find(c => c.id === selectedChildId) || null;
    const childName = currentChild?.name || 'your child';
    const alertConcepts = performanceData?.alerts || [];

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

        try {
            // Context enrichment for parent
            const contextStep: Step = {
                id: `ctx-${Date.now()}`,
                text: `Checking ${childName}'s recent data…`
            };

            const data = isDemo ? demoChildSummary : performanceData;
            const weakTopic = data?.weakTopics?.[0] ?? "none";
            const upcomingCount = data?.upcoming?.length ?? 0;
            const avgScore = data?.child?.score ? `${data.child.score}%` : "not available";

            const contextStr = [
                `You are helping the parent of ${childName}.`,
                `${childName} is currently in ${currentChild?.grade || "their current class"}.`,
                `Average accuracy: ${avgScore}.`,
                weakTopic !== "none" ? `Struggling area: ${weakTopic}.` : "No major struggling areas detected.",
                upcomingCount > 0 ? `There are ${upcomingCount} upcoming assignments.` : "No major assignments coming up.",
                selectedSubject !== 'All subjects' ? `Specifically asking about ${selectedSubject}.` : ""
            ].filter(Boolean).join(' ');

            const response = await askElora({
                message: query,
                role: 'parent',
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
            console.error('Parent Copilot Error:', error);
            const errorMsg: Message = {
                id: Date.now().toString() + '-err',
                role: 'assistant',
                content: "I'm having a little trouble connecting to my brain right now. Please try again or check your connection!"
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleChildChange = (id: string | null) => {
        setSelectedChildId(id);
        setIsChildPopupOpen(false);
    };

    const handleSubjectChange = (subject: string) => {
        setSelectedSubject(subject);
        setIsSubjectPopupOpen(false);
    };

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    const currentPrompts = buildPrompts();

    const showAuthGate = !isDemo && !currentUser;

    return (
        <CopilotLayout
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            isDemo={isDemo}
            role="Parent"
            themeColor="#DB844A" // Brand Orange
            logout={logout}
            navigate={navigate}
            demoBanner={!embeddedInShell && isDemo && <DemoBanner />}
            demoRoleSwitcher={!embeddedInShell && isDemo && <DemoRoleSwitcher />}
            hidePrimarySidebar={embeddedInShell}
            sidebar={
                showAuthGate ? (
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <EloraLogo className="w-8 h-8" />
                            <span className="text-xl font-bold tracking-tight text-white">Elora</span>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-sm text-white/60 leading-relaxed italic">
                                "The best support at home starts with seeing what matters most at school."
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-6 border-b border-slate-200/60 bg-orange-50/30">
                            <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-0.5">Library</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                Suggested & History
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 no-scrollbar">
                            {/* Context Selection (Premium Card Style like Teacher) */}
                            <div className="flex flex-col gap-4">
                                {/* Active Child Card */}
                                <div className="relative">
                                    <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2 px-1">Selected Student</h3>
                                    <button
                                        onClick={() => setIsChildPopupOpen(!isChildPopupOpen)}
                                        className="flex items-center justify-between w-full px-4 py-3 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-200 rounded-2xl shadow-sm transition-all group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-2 bg-orange-50 rounded-xl text-[#DB844A] group-hover:bg-orange-100 transition-colors shrink-0">
                                                <User size={18} />
                                            </div>
                                            <div className="text-left min-w-0">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Focus</p>
                                                <p className="text-sm font-bold text-slate-900 truncate">
                                                    {currentChild?.name || 'Select Child'}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 shrink-0 ${isChildPopupOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isChildPopupOpen && (
                                        <>
                                            <div className="fixed inset-0 z-30" onClick={() => setIsChildPopupOpen(false)} />
                                            <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-slate-200 z-40 py-2 animate-in fade-in zoom-in-95 origin-top duration-200">
                                                {children.map((child) => (
                                                    <button
                                                        key={child.id}
                                                        onClick={() => handleChildChange(child.id)}
                                                        className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors ${selectedChildId === child.id ? 'bg-orange-50/50' : ''}`}
                                                    >
                                                        <span className={`text-[13px] font-bold ${selectedChildId === child.id ? 'text-[#DB844A]' : 'text-slate-700'}`}>{child.name}</span>
                                                        {selectedChildId === child.id && <Check size={16} className="text-[#DB844A]" strokeWidth={3} />}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Focus Subject Card */}
                                <div className="relative">
                                    <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2 px-1">Active Concept</h3>
                                    <button
                                        onClick={() => setIsSubjectPopupOpen(!isSubjectPopupOpen)}
                                        className="flex items-center justify-between w-full px-4 py-3 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-200 rounded-2xl shadow-sm transition-all group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-2 bg-orange-50 rounded-xl text-[#DB844A] group-hover:bg-orange-100 transition-colors shrink-0">
                                                <BookOpen size={18} />
                                            </div>
                                            <div className="text-left min-w-0">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Subject</p>
                                                <p className="text-sm font-bold text-slate-900 truncate">
                                                    {selectedSubject}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 shrink-0 ${isSubjectPopupOpen ? 'rotate-180 text-[#DB844A]' : ''}`} />
                                    </button>

                                    {alertConcepts.length > 0 && (
                                        <div className="mt-4 p-3 bg-orange-50/50 border border-orange-100 rounded-xl animate-in fade-in slide-in-from-top-2 duration-500 group cursor-help">
                                            <div className="flex items-center gap-2 text-orange-600 mb-1">
                                                <Zap size={14} className="fill-orange-600 animate-pulse" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Insight Alert</span>
                                            </div>
                                            <p className="text-[11px] text-orange-800 font-medium leading-relaxed">
                                                {childName} might need extra support with <strong>{alertConcepts[0].concept}</strong>.
                                            </p>
                                        </div>
                                    )}

                                    {isSubjectPopupOpen && (
                                        <>
                                            <div className="fixed inset-0 z-30" onClick={() => setIsSubjectPopupOpen(false)} />
                                            <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-slate-200 z-40 py-2 animate-in fade-in zoom-in-95 origin-top duration-200 max-h-60 overflow-y-auto custom-scrollbar">
                                                {SUBJECTS.map((sub) => (
                                                    <button
                                                        key={sub}
                                                        onClick={() => handleSubjectChange(sub)}
                                                        className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors ${selectedSubject === sub ? 'bg-orange-50/50 text-[#DB844A]' : 'text-slate-600'}`}
                                                    >
                                                        <span className={`text-[13px] font-bold ${selectedSubject === sub ? 'text-[#DB844A]' : 'text-slate-700'}`}>{sub}</span>
                                                        {selectedSubject === sub && <Check size={16} className="text-[#DB844A]" strokeWidth={3} />}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Prompt Chips */}
                            <div className="flex-1 mt-4">
                                <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-3 px-1">Suggested Questions</h3>
                                <div className="flex flex-col gap-2">
                                    {currentPrompts.map((prompt, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSend(prompt)}
                                            className="text-left text-sm text-[#DB844A] font-bold bg-[#DB844A]/5 border border-[#DB844A]/10 hover:bg-[#DB844A]/10 hover:border-[#DB844A]/20 transition-all px-4 py-3 rounded-xl flex items-start gap-2 group"
                                        >
                                            <span className="flex-1 leading-snug">{prompt}</span>
                                            <ArrowRight size={16} className="shrink-0 text-[#DB844A] opacity-50 group-hover:translate-x-0.5 transition-transform mt-0.5" />
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
                )
            }
        >
            <CopilotMobileHeader themeColor="#DB844A" />

            {showAuthGate ? (
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <CopilotAuthGate
                        role="Parent"
                        themeColor="#DB844A"
                    />
                </div>
            ) : (
                <>
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                        {messages.length === 0 ? (
                            <CopilotEmptyState
                                themeColor="#DB844A"
                                userName={currentUser?.name || (isDemo ? demoParentName : 'Parent')}
                                customGreeting={getParentGreeting(currentChild?.name)}
                                description={`I'm here to give you a clear, calm view of ${childName}'s progress. I'll flag what matters and help you support ${getPronoun(currentChild?.gender || 'non-binary').pObj} at home.`}
                                prompts={currentPrompts}
                                handleSend={handleSend}
                            />
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#EAE7DD]">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-orange-50 p-2 rounded-xl border border-orange-100 hidden md:block group-hover:scale-105 transition-transform shadow-sm">
                                            <Sparkles className="w-6 h-6 text-[#DB844A]" />
                                        </div>
                                        <div>
                                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Insight Navigator</h1>
                                            <p className="text-sm text-slate-500 font-semibold tracking-wide">
                                                Elora Copilot &middot; Family Support
                                            </p>
                                            <p className="text-[11px] text-[#DB844A] font-bold uppercase tracking-widest mt-1 opacity-80">
                                                This week &middot; {childName}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Subject Context Selector (Synced with Teacher style) */}
                                    <div className="relative group/pill">
                                        <button
                                            onClick={() => setIsSubjectPopupOpen(!isSubjectPopupOpen)}
                                            className="flex items-center gap-3 px-4 py-2 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-200 rounded-2xl text-slate-700 hover:text-[#DB844A] transition-all w-fit shadow-sm active:scale-95 group"
                                        >
                                            <div className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center text-[#DB844A] group-hover:bg-orange-100 transition-colors shadow-inner">
                                                <Layers size={14} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex flex-col text-left mr-1">
                                                <span className="text-[9px] font-bold uppercase tracking-[0.05em] text-slate-400 leading-none mb-0.5">Filtering by</span>
                                                <span className="text-[12px] font-bold whitespace-nowrap leading-none">
                                                    {selectedSubject}
                                                </span>
                                            </div>
                                            <ChevronDown size={14} className={`shrink-0 text-slate-300 transition-transform duration-300 group-hover:text-[#DB844A] ${isSubjectPopupOpen ? 'rotate-180 text-[#DB844A]' : ''}`} />
                                        </button>
                                    </div>
                                </div>

                                {messages.map((msg) => (
                                    <CopilotMessageBubble
                                        key={msg.id}
                                        message={msg}
                                        themeColor="#DB844A"
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
                                            <div className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '300ms' }} />
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
                                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-[11px] font-bold border border-orange-200 whitespace-nowrap"
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
                                <HorizontalChips prompts={currentPrompts} onSend={handleSend} themeColor="#DB844A" />
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
                                        className="w-full bg-[#F8F9FA] border border-[#EAE7DD] rounded-xl pl-4 pr-12 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 resize-none min-h-[52px] max-h-32"
                                        rows={1}
                                        style={{ height: '52px' }}
                                    />
                                    <button
                                        onClick={() => handleSend(inputValue)}
                                        disabled={!inputValue.trim() || isThinking}
                                        className="absolute right-2.5 top-3 p-1.5 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white rounded-lg transition-colors"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </CopilotLayout>
    );
};

export default ParentCopilotPage;
