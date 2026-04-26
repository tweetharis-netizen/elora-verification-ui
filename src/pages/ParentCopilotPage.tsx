import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Plus,
    ChevronDown,
    Send,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useDemoMode } from '../hooks/useDemoMode';
import { shouldGateCopilotAccess } from '../hooks/useAuthGate';
import { DemoBanner } from '../components/DemoBanner';
import { DemoRoleSwitcher } from '../components/DemoRoleSwitcher';
import {
    CopilotLayout,
    CopilotLayoutShell,
    CopilotMessageBubble,
    CopilotEmptyState,
    CopilotMobileHeader,
    CopilotAuthGate,
    CopilotThinkingBubble,
    parseSuggestionsFromResponse,
    Message,
    Step,
    getParentGreeting,
    getPronoun,
    shouldShowFeedback
} from '../components/Copilot/CopilotShared';
import CopilotThreadSidebar from '../components/Copilot/CopilotThreadSidebar';
import { askElora } from '../services/askElora';
import * as dataService from '../services/dataService';
import { demoChildren as scenarioChildren, demoChildSummary, demoParentName } from '../demo/demoParentScenarioA';
import { useParentChildren } from '../hooks/useParentChildren';
import type { UseCase } from '../lib/llm/types';

// Mock child data for demo
const DEMO_CHILDREN = scenarioChildren.map(c => ({
    id: c.id,
    name: c.name,
    gender: 'male' as const // Jordan is male in the scenario
}));

const PARENT_SUPPORT_MODE_CHIP = 'Prepare for a parent-teacher meeting';
const PARENT_SUPPORT_MODE_PROMPT =
    'Help me prepare for a meeting with my child\'s teacher. Ask about my concerns and what I want to achieve.';
const PARENT_SUMMARY_CHIP = 'Summarise key actions';
const PARENT_SUMMARY_PROMPT =
    'Summarise the key points of our conversation and give me a short list of next steps I can take as a parent.';
const PARENT_SUPPORT_SIGNAL_PATTERN =
    /\b(parent-teacher|meeting|support plan|worried|confidence|encouragement|message to teacher|support at home)\b/i;

const resolveParentPromptConfig = (rawText: string): { message: string; useCase: UseCase } => {
    const trimmed = rawText.trim();

    if (trimmed === PARENT_SUPPORT_MODE_CHIP) {
        return {
            message: PARENT_SUPPORT_MODE_PROMPT,
            useCase: 'parent_support_mode',
        };
    }

    if (trimmed === PARENT_SUMMARY_CHIP) {
        return {
            message: PARENT_SUMMARY_PROMPT,
            useCase: 'parent_chat',
        };
    }

    if (PARENT_SUPPORT_SIGNAL_PATTERN.test(trimmed)) {
        return {
            message: trimmed,
            useCase: 'parent_support_mode',
        };
    }

    return {
        message: trimmed,
        useCase: 'parent_chat',
    };
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
    const { logout, currentUser, login, isGuest, isVerified } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isDemo = useDemoMode();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    type ParentCopilotNavState = {
        source?: string;
        preferredChildId?: string | null;
        childName?: string | null;
    };

    const navState = (location.state as ParentCopilotNavState | null) ?? null;

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [serviceNotice, setServiceNotice] = useState<string | null>(null);

    // Thread management (frontend-only for now - parent conversations not yet in backend)
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [activeConversationTitle, setActiveConversationTitle] = useState<string>('Active Thread');
    const [threads, setThreads] = useState<any[]>([]);
    const [isThreadsLoading] = useState(false);
    
    
    // Parent Context
    const {
        data: rosterChildren,
        error: parentChildrenError,
    } = useParentChildren();
    const [children, setChildren] = useState<any[]>(isDemo ? DEMO_CHILDREN : []);
    const [selectedChildId, setSelectedChildId] = useState<string | null>(isDemo ? DEMO_CHILDREN[0].id : null);
    const [performanceData, setPerformanceData] = useState<any | null>(isDemo ? demoChildSummary : null);
    const [selectedSubject, setSelectedSubject] = useState<string>('All subjects');
    
    useEffect(() => {
        // Ensure demo user is logically "logged in" (but don't persist to localStorage)
        if (isDemo && currentUser?.id !== 'parent_1' && typeof login === 'function') {
            login('parent', undefined, false);
        }
    }, [isDemo, currentUser, login]);

    useEffect(() => {
        if (isDemo) {
            setChildren(DEMO_CHILDREN);
            return;
        }

        // Use demo children as fallback if no real children data available
        const childrenToSet = rosterChildren.length > 0 ? rosterChildren : DEMO_CHILDREN;
        setChildren(childrenToSet as any[]);
        
        if (parentChildrenError && rosterChildren.length === 0) {
            setServiceNotice(null); // Don't show error if using fallback demo data
        } else if (parentChildrenError) {
            setServiceNotice(parentChildrenError);
        } else if (rosterChildren.length > 0) {
            setServiceNotice(null);
        }

        if (rosterChildren.length > 0 && navState?.preferredChildId) {
            const hasMatch = rosterChildren.some((child) => child.id === navState.preferredChildId);
            setSelectedChildId(hasMatch ? navState.preferredChildId : rosterChildren[0].id);
            return;
        }

        if (childrenToSet.length > 0 && !selectedChildId) {
            setSelectedChildId(childrenToSet[0].id);
        }
    }, [
        isDemo,
        rosterChildren,
        parentChildrenError,
        navState?.preferredChildId,
        selectedChildId,
    ]);

    useEffect(() => {
        if (isDemo || !selectedChildId) {
            return;
        }

        const childStillExists = children.some((child) => child.id === selectedChildId);
        if (!childStillExists) {
            setSelectedChildId(children[0]?.id ?? null);
        }
    }, [isDemo, children, selectedChildId]);

    useEffect(() => {
        if (isDemo) return;
        if (!selectedChildId) {
            setPerformanceData(null);
            return;
        }

        dataService.getParentChildSummary(selectedChildId).then(summary => {
            setServiceNotice(null);
            setPerformanceData(summary);
        }).catch((err: unknown) => {
            if (err instanceof dataService.RedirectError) {
                navigate(err.to);
                return;
            }

            const normalized = dataService.toEloraServiceError(err);
            setServiceNotice(dataService.getFriendlyServiceErrorMessage(normalized));
        });
    }, [selectedChildId, isDemo, navigate]);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesAreaRef = useRef<HTMLDivElement>(null);
    const isNearBottomRef = useRef(true);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const currentChild = children.find(c => c.id === selectedChildId) || null;
    const childName = currentChild?.name || 'your child';
    const alertConcepts = performanceData?.alerts || [];

    const buildPrompts = (): string[] => {
        return [
            PARENT_SUPPORT_MODE_CHIP,
            PARENT_SUMMARY_CHIP,
            'Summarise my child\'s recent progress.',
            'Draft a message to ask about missing work.',
            'Help me encourage my child about school.',
        ];
    };

    const handleSend = async (text: string) => {
        const { message: normalizedMessage, useCase: resolvedUseCase } = resolveParentPromptConfig(text);
        const query = normalizedMessage.trim();
        if (!query || showAuthGate) return;
        const nowIso = new Date().toISOString();
        let threadId = activeConversationId;
        if (!threadId) {
            threadId = `${Date.now()}`;
            const titleFromQuery = query.slice(0, 42);
            const seededThread = {
                id: threadId,
                title: titleFromQuery || 'New Chat',
                createdAt: nowIso,
                updatedAt: nowIso,
                isPinned: false,
                messages: [],
            };
            setThreads(prev => [seededThread, ...prev]);
            setActiveConversationId(threadId);
            setActiveConversationTitle(seededThread.title);
        }
        const isFirstMessage = messages.filter((msg) => msg.role === 'user').length === 0;
        const recentUserPrompts = messages
            .filter((msg) => msg.role === 'user')
            .map((msg) => msg.content.trim())
            .filter(Boolean)
            .slice(-3);

        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: query,
            useCase: resolvedUseCase,
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInputValue('');
        setIsThinking(true);
        setServiceNotice(null);

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
                useCase: resolvedUseCase,
                context: contextStr,
                contextMeta: !isDemo ? {
                    role: 'parent',
                    isDemo,
                    dashboardSource: navState?.source ?? null,
                    roleContextId: selectedChildId ?? undefined,
                    roleContextLabel: selectedChildId ? childName : undefined,
                    selectedClassId: currentChild?.grade ?? null,
                    selectedClassName: currentChild?.grade ?? null,
                    selectedStudentId: selectedChildId,
                    selectedStudentName: childName,
                    selectedChildId,
                    selectedChildName: childName,
                    selectedSubject,
                } : undefined,
                isFirstMessage,
                recentUserPrompts,
                lastSelectedClassId: null,
                lastSelectedStudentId: selectedChildId,
                conversationId: null,
            });

            const { cleanContent, suggestions } = parseSuggestionsFromResponse(response);

            const assistantMsg: Message = {
                id: Date.now().toString() + '-a',
                role: 'assistant',
                steps: [contextStep],
                content: cleanContent,
                suggestions,
                useCase: resolvedUseCase,
                showFeedback: shouldShowFeedback()
            };

            setMessages(prev => [...prev, assistantMsg]);

            // Keep thread history synced for parent role.
            const finalThreadId = threadId;
            const titleFromQuery = query.slice(0, 42) || 'New Chat';
            setThreads(prev => {
                const next = prev.map(t => {
                    if (t.id !== finalThreadId) return t;
                    const existingMessages = Array.isArray(t.messages) ? t.messages : [];
                    return {
                        ...t,
                        title: t.title === 'New Chat' ? titleFromQuery : t.title,
                        updatedAt: new Date().toISOString(),
                        messages: [...existingMessages, newUserMsg, assistantMsg],
                    };
                });
                return next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            });
        } catch (error: unknown) {
            if (error instanceof dataService.RedirectError) {
                navigate(error.to);
                return;
            }

            const normalized = dataService.toEloraServiceError(error);
            setServiceNotice(dataService.getFriendlyServiceErrorMessage(normalized));
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
    };

    const handleMessagesScroll = () => {
        if (!messagesAreaRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = messagesAreaRef.current;
        const distFromBottom = scrollHeight - scrollTop - clientHeight;
        isNearBottomRef.current = distFromBottom <= 100;
        setShowScrollButton(distFromBottom > 100);
    };

    useEffect(() => {
        if (!messagesAreaRef.current) return;
        if (isNearBottomRef.current) {
            messagesAreaRef.current.scrollTo({
                top: messagesAreaRef.current.scrollHeight,
                behavior: 'smooth',
            });
            setShowScrollButton(false);
        }
    }, [messages, isThinking]);

    const scrollToBottom = () => {
        if (!messagesAreaRef.current) return;
        messagesAreaRef.current.scrollTo({
            top: messagesAreaRef.current.scrollHeight,
            behavior: 'smooth',
        });
        isNearBottomRef.current = true;
        setShowScrollButton(false);
    };

    // Thread management handlers
    const handleSelectThread = useCallback((id: string) => {
        if (id === activeConversationId) return;
        const thread = threads.find((t) => t.id === id);
        if (!thread) return;

        setActiveConversationId(id);
        const title = thread.title?.trim() || 'Active Thread';
        setActiveConversationTitle(title);
        setMessages(thread.messages || []);
    }, [activeConversationId, threads]);

    const handleNewThread = useCallback(() => {
        const id = Date.now().toString();
        const newThread = {
            id,
            title: 'New Chat',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isPinned: false,
            messages: [],
        };
        setThreads(prev => [newThread, ...prev]);
        setActiveConversationId(id);
        setActiveConversationTitle('New Chat');
        setMessages([]);
    }, []);

    const handleDeleteThread = useCallback((id: string) => {
        setThreads(prev => {
            const remaining = prev.filter(t => t.id !== id);
            if (activeConversationId === id) {
                if (remaining.length > 0) {
                    const nextThread = remaining[0];
                    setActiveConversationId(nextThread.id);
                    setActiveConversationTitle(nextThread.title?.trim() || 'Active Thread');
                    setMessages(nextThread.messages || []);
                } else {
                    setActiveConversationId(null);
                    setActiveConversationTitle('Active Thread');
                    setMessages([]);
                }
            }
            return remaining;
        });
    }, [activeConversationId]);

    const handleRenameThread = useCallback((id: string, title: string) => {
        setThreads(prev => prev.map(t =>
            t.id === id ? { ...t, title } : t
        ));
        if (activeConversationId === id) {
            setActiveConversationTitle(title);
        }
    }, [activeConversationId]);

    const handlePinThread = useCallback((id: string, pinned: boolean) => {
        setThreads(prev => prev.map(t =>
            t.id === id ? { ...t, isPinned: pinned } : t
        ));
    }, []);

    const currentPrompts = buildPrompts();
    const showAuthGate = isDemo || shouldGateCopilotAccess({ isVerified, isGuest });

    const canCreateNewChat =
        !activeConversationId || messages.some((msg) => msg.role === 'user' || msg.role === 'assistant');

    const sidebarContent = showAuthGate ? <></> : (
        <div className="h-full">
            <CopilotThreadSidebar
                role="parent"
                themeColor="#DB844A"
                threads={threads}
                activeId={activeConversationId}
                onSelect={handleSelectThread}
                onNew={handleNewThread}
                onDelete={handleDeleteThread}
                onRename={handleRenameThread}
                onPin={handlePinThread}
                isLoading={isThreadsLoading}
                canCreateNewChat={canCreateNewChat}
                classes={children.map((child) => ({ id: child.id, name: child.name }))}
                selectedClassId={selectedChildId}
                onClassSelect={handleChildChange}
            />
        </div>
    );

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
            hidePrimarySidebar={embeddedInShell || showAuthGate}
            hideContextSidebar={true}
            sidebar={<></>}
            lockToViewportHeight={!embeddedInShell && !showAuthGate && !isDemo}
            contentMaxWidth="max-w-none"
            chatAreaClassName={isDemo ? undefined : "flex-1 h-full flex flex-col min-w-0 bg-slate-50 relative overflow-hidden"}
        >
            <CopilotMobileHeader themeColor="#DB844A" />

            {showAuthGate ? (
                <CopilotAuthGate role="Parent" themeColor="#DB844A" />
            ) : (
                <CopilotLayoutShell role="parent" leftRail={sidebarContent}>
                    <div className="flex-1 h-full flex flex-col min-h-0 bg-[#fffaf6] relative overflow-hidden">
                        <div
                            ref={messagesAreaRef}
                            onScroll={handleMessagesScroll}
                            className="flex-1 overflow-y-auto custom-scrollbar w-full scroll-smooth"
                        >
                            <div className="max-w-[720px] mx-auto px-6 pt-12 pb-8 flex flex-col min-h-full">
                                {serviceNotice && (
                                    <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-medium text-orange-800 mb-6">
                                        {serviceNotice}
                                    </div>
                                )}
                                {messages.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <CopilotEmptyState
                                            themeColor="#DB844A"
                                            userName={currentUser?.name || (isDemo ? demoParentName : 'Parent')}
                                            customGreeting={getParentGreeting(currentChild?.name)}
                                            description={`I'm here to give you a clear, calm view of ${childName}'s progress. I'll flag what matters and help you support ${getPronoun(currentChild?.gender || 'non-binary').pObj} at home.`}
                                            prompts={currentPrompts}
                                            handleSend={handleSend}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="mb-6 md:mb-8">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#DB844A] mb-2">
                                                {childName}
                                            </p>
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
                                                onSuggestionClick={handleSend}
                                            />
                                        ))}
                                        {isThinking && (
                                            <CopilotThinkingBubble
                                                themeColor="#DB844A"
                                                assistantName="Elora"
                                            />
                                        )}
                                        <div ref={messagesEndRef} className="h-4" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 md:p-6 bg-white border-t border-[#EAE7DD] shrink-0">
                            <div className="max-w-3xl mx-auto space-y-4">
                                <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                                    <HorizontalChips prompts={currentPrompts} onSend={handleSend} themeColor="#DB844A" />
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleNewThread}
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

                        {showScrollButton && (
                            <button
                                onClick={scrollToBottom}
                                className="fixed bottom-32 right-8 p-3 bg-white border border-slate-200 rounded-full shadow-lg text-slate-400 hover:text-[#DB844A] hover:border-orange-200 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300 z-50"
                                title="Scroll to bottom"
                            >
                                <ChevronDown size={20} />
                            </button>
                        )}
                    </div>
                </CopilotLayoutShell>
            )}
        </CopilotLayout>
    );
};

export default ParentCopilotPage;
