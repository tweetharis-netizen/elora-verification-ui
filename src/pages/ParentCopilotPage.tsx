import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    ChevronDown,
    Send,
} from 'lucide-react';
import { ArtifactStudio, CopilotContextBar } from '../components/Copilot/CopilotShared';
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
    shouldShowFeedback,
} from '../components/Copilot/CopilotShared';
import { CopilotInputBar } from '../components/Copilot/CopilotInputBar';
import CopilotThreadSidebar from '../components/Copilot/CopilotThreadSidebar';
import { askElora } from '../services/askElora';
import * as dataService from '../services/dataService';
import { demoChildren as scenarioChildren, demoChildSummary, demoParentName } from '../demo/demoParentScenarioA';
import { useParentChildren } from '../hooks/useParentChildren';
import { loadSettings } from '../services/settingsService';
import type { UseCase, CopilotFileAttachment } from '../lib/llm/types';
import { uploadCopilotFile } from '../services/fileUploadService';

// Mock child data for demo
const DEMO_CHILDREN = scenarioChildren.map(c => ({
    id: c.id,
    name: c.name,
    gender: 'male' as const // Jordan is male in the scenario
}));

const PARENT_PROGRESS_CHIP = 'Summarise my child\'s progress this week';
const PARENT_PROGRESS_PROMPT =
    'Summarise my child\'s progress this week in plain language, then suggest the top next action at home.';
const PARENT_HOME_SUPPORT_CHIP = 'Suggest how I can help at home with this topic';
const PARENT_HOME_SUPPORT_PROMPT =
    'Suggest how I can help with this topic at home in a calm, practical way.';
const PARENT_SUPPORT_SIGNAL_PATTERN =
    /\b(parent-teacher|meeting|support plan|worried|confidence|encouragement|message to teacher|support at home)\b/i;

const resolveParentPromptConfig = (rawText: string): { message: string; useCase: UseCase } => {
    const trimmed = rawText.trim();

    if (trimmed === PARENT_PROGRESS_CHIP) {
        return {
            message: PARENT_PROGRESS_PROMPT,
            useCase: 'parent_chat',
        };
    }

    if (trimmed === PARENT_HOME_SUPPORT_CHIP) {
        return {
            message: PARENT_HOME_SUPPORT_PROMPT,
            useCase: 'parent_support_mode',
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


const ParentCopilotPage: React.FC<{ embeddedInShell?: boolean }> = ({ embeddedInShell = false }) => {
    const { logout, currentUser, login, isGuest, isVerified } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isDemo = useDemoMode();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const currentRole: 'parent' = 'parent';
    const fallbackName = currentUser?.preferredName ?? currentUser?.name ?? 'Parent';
    const [parentDisplayName, setParentDisplayName] = useState<string>(() => {
        if (isDemo) return demoParentName;
        const settings = loadSettings(currentRole);
        return settings.displayName || fallbackName;
    });

    useEffect(() => {
        if (isDemo) {
            setParentDisplayName(demoParentName);
            return;
        }
        const settings = loadSettings(currentRole);
        setParentDisplayName(settings.displayName || fallbackName);
    }, [currentRole, fallbackName, isDemo]);

    useEffect(() => {
        const onSettings = (event: Event) => {
            const detail = (event as CustomEvent).detail as { role?: string; displayName?: string } | undefined;
            if (!detail || detail.role !== currentRole) return;
            setParentDisplayName(detail.displayName || fallbackName);
        };
        window.addEventListener('elora-settings-updated', onSettings as EventListener);
        return () => window.removeEventListener('elora-settings-updated', onSettings as EventListener);
    }, [currentRole, fallbackName]);

    type ParentCopilotNavState = {
        source?: string;
        preferredChildId?: string | null;
        childName?: string | null;
    };

    const navState = (location.state as ParentCopilotNavState | null) ?? null;

    const [messages, setMessages] = useState<Message[]>([]);
    const [hasShownGreeting, setHasShownGreeting] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [serviceNotice, setServiceNotice] = useState<string | null>(null);
    const [attachedFiles, setAttachedFiles] = useState<CopilotFileAttachment[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [artifacts, setArtifacts] = useState<Array<{ id: string; title: string; summary: string; content: string; kind?: string }>>([]);

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

        const childrenToSet = rosterChildren.length > 0 ? rosterChildren : [];
        setChildren(childrenToSet as any[]);

        if (parentChildrenError) {
            setServiceNotice(parentChildrenError);
        } else {
            setServiceNotice(null);
        }

        if (rosterChildren.length > 0 && navState?.preferredChildId) {
            const hasMatch = rosterChildren.some((child) => child.id === navState.preferredChildId);
            setSelectedChildId(hasMatch ? navState.preferredChildId : rosterChildren[0].id);
            return;
        }

        if (childrenToSet.length > 0 && !selectedChildId) {
            setSelectedChildId(childrenToSet[0].id);
        } else if (childrenToSet.length === 0) {
            setSelectedChildId(null);
            setPerformanceData(null);
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
            setPerformanceData(null);
        });
    }, [selectedChildId, isDemo, navigate]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesAreaRef = useRef<HTMLDivElement>(null);
    const isNearBottomRef = useRef(true);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const currentChild = children.find(c => c.id === selectedChildId) || null;
    const childName = currentChild?.name || 'your child';
    const alertConcepts = performanceData?.alerts || [];
    const hasParentContextData = children.length > 0 || Boolean(performanceData);

    const buildPrompts = (): string[] => {
        return [
            PARENT_PROGRESS_CHIP,
            PARENT_HOME_SUPPORT_CHIP,
            'Draft a respectful message to my child\'s teacher.',
            'Help me encourage my child about school this week.',
            'Suggest two questions for my next parent-teacher meeting.',
            'Explain the importance of algebra to my middle-schooler.',
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
            fileAttachments: [...attachedFiles],
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
                    dashboardSource: navState?.source ?? 'parent_copilot_page',
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
                fileAttachments: attachedFiles,
            });

            const { cleanContent, suggestions } = parseSuggestionsFromResponse(response, query);

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
            setAttachedFiles([]);

            // Parse artifact payload if present (---ARTIFACT---)
            const marker = '---ARTIFACT---';
            const idx = response.indexOf(marker);
            if (idx >= 0) {
                const tail = response.slice(idx + marker.length).trim();
                try {
                    const obj = JSON.parse(tail);
                    if (obj && obj.title && obj.content) {
                        setArtifacts((prev) => [{ id: String(Date.now()), title: obj.title, summary: obj.summary || '', content: obj.content, kind: obj.kind || 'parent_report' }, ...prev]);
                    }
                } catch (err) {
                    // not JSON — ignore
                }
            }

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

    const handleFileAttach = async (file: File) => {
        if (attachedFiles.length >= 5) return;
        setIsUploading(true);
        const res = await uploadCopilotFile(file);
        setIsUploading(false);
        if (res.success && res.file) {
            setAttachedFiles(prev => [...prev, res.file!]);
        } else {
            console.error('Upload failed:', res.error);
        }
    };

    const handleFileRemove = (fileId: string) => {
        setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
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
        setHasShownGreeting(false);
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
        setHasShownGreeting(false);
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
    const showAuthGate = shouldGateCopilotAccess({ isVerified, isGuest });

    const canCreateNewChat =
        !activeConversationId || messages.some((msg) => msg.role === 'user' || msg.role === 'assistant');

    const sidebarContent = showAuthGate ? <></> : (
        <div className="h-full">
            <CopilotThreadSidebar
                role="parent"
                themeColor="#D97706"
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
            themeColor="#D97706" // Brand Orange
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
            <CopilotMobileHeader themeColor="#D97706" />

            {showAuthGate ? (
                <CopilotAuthGate role="Parent" themeColor="#D97706" />
            ) : (
                <CopilotLayoutShell role="parent" leftRail={sidebarContent}>
                    <div className="flex-1 h-full flex flex-col min-h-0 bg-[#fbfcf8] dark:bg-[var(--elora-chat-canvas)] relative overflow-hidden transition-colors duration-500">
                        <div
                            ref={messagesAreaRef}
                            onScroll={handleMessagesScroll}
                            className="flex-1 overflow-y-auto custom-scrollbar w-full scroll-smooth"
                        >
                            <div className="max-w-[720px] mx-auto px-6 pt-4 sm:pt-10 pb-8 flex flex-col min-h-full">
                                {serviceNotice && (
                                    <div className="rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/30 px-4 py-2 text-xs font-medium text-orange-800 dark:text-orange-400 mb-6 transition-colors duration-500">
                                        {serviceNotice}
                                    </div>
                                )}
                                {!isDemo && (
                                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/20 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 mb-4 transition-colors duration-500">
                                        Parent Copilot conversations are session-only for now and do not persist after refresh.
                                    </div>
                                )}
                                {!isDemo && !hasParentContextData && (
                                    <div className="rounded-xl border border-sky-200 dark:border-sky-900/50 bg-sky-50 dark:bg-sky-950/30 px-4 py-2 text-xs font-medium text-sky-800 dark:text-sky-400 mb-6 transition-colors duration-500">
                                        We do not see child progress data yet, so Copilot will provide general support guidance.
                                    </div>
                                )}
                                {messages.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <CopilotEmptyState
                                            themeColor="#D97706"
                                            userName={parentDisplayName}
                                            description={`I'm your partner in supporting ${childName}'s learning. Understand progress reports, get specific home actions, plan conversations with teachers, or ask me what I can do.`}
                                            prompts={currentPrompts}
                                            handleSend={handleSend}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-4">

                                        {messages.map((msg) => (
                                            <CopilotMessageBubble
                                                key={msg.id}
                                                message={msg}
                                                themeColor="#D97706"
                                                thinkingStripHeader="How I found this"
                                                shouldAutoExpandSteps={messages.filter(m => m.role === 'assistant' && m.steps && m.steps.length > 0).findIndex(m => m.id === msg.id) < 3}
                                                copilotRole="parent"
                                                showFeedback={msg.showFeedback}
                                                onSuggestionClick={handleSend}
                                                feedbackSource="parent_copilot_page"
                                            />
                                        ))}
                                        {isThinking && (
                                            <CopilotThinkingBubble
                                                themeColor="#D97706"
                                                assistantName="Elora"
                                            />
                                        )}
                                        <div ref={messagesEndRef} className="h-4" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="shrink-0 border-t border-slate-200/80 dark:border-[var(--elora-border-subtle)] bg-white dark:bg-[var(--elora-surface-main)] px-6 py-4 z-10 transition-colors duration-500">
                            <div className="max-w-3xl mx-auto space-y-4">
                                {attachedFiles.length > 0 && (
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <span className="text-[12px] text-slate-400 dark:text-[var(--elora-text-muted)]">Context:</span>
                                            </div>
                                            <div className="text-[12px] text-slate-400 dark:text-[var(--elora-text-muted)]">
                                                {isThinking ? (attachedFiles.length > 0 ? 'Reading your materials…' : 'Got it — thinking…') : ''}
                                            </div>
                                        </div>
                                        <div>
                                            <CopilotContextBar sources={attachedFiles.map(f => ({ id: f.id, label: f.name, type: 'File' }))} />
                                        </div>
                                    </div>
                                )}

                                <CopilotInputBar
                                    value={inputValue}
                                    onChange={setInputValue}
                                    onSend={() => handleSend(inputValue)}
                                    isThinking={isThinking}
                                    themeColor="#D97706"
                                    placeholder={`Ask about ${childName}'s progress or what to do at home...`}
                                    microcopy="Elora will anchor help to this item"
                                    files={attachedFiles}
                                    onFileAttach={handleFileAttach}
                                    onFileRemove={handleFileRemove}
                                    isUploading={isUploading}
                                    role="parent"
                                    showPrivacyNote={false}
                                    containerClassName="rounded-[32px]"
                                />
                            </div>
                        </div>

                        {showScrollButton && (
                            <button
                                onClick={scrollToBottom}
                                className="fixed bottom-32 right-8 p-3 bg-white border border-slate-200 rounded-full shadow-lg text-slate-400 hover:text-[#D97706] hover:border-orange-200 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300 z-50"
                                title="Scroll to bottom"
                            >
                                <ChevronDown size={20} />
                            </button>
                        )}
                    </div>
                </CopilotLayoutShell>
            )}
            <ArtifactStudio artifacts={artifacts} onClose={() => setArtifacts([])} />
        </CopilotLayout>
    );
};

export default ParentCopilotPage;
