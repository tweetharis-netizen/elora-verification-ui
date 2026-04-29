import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    ChevronDown,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useSidebarState } from '../hooks/useSidebarState';
import { useDemoMode } from '../hooks/useDemoMode';
import { shouldGateCopilotAccess } from '../hooks/useAuthGate';
import { DemoBanner } from '../components/DemoBanner';
import { DemoRoleSwitcher } from '../components/DemoRoleSwitcher';
import { demoTeacherName, demoInsights, demoClasses } from '../demo/demoTeacherScenarioA';
import * as dataService from '../services/dataService';
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
} from '../components/Copilot/CopilotShared';
import CopilotThreadSidebar from '../components/Copilot/CopilotThreadSidebar';
import { askElora } from '../services/askElora';
import { useAutoTitle } from '../hooks/useAutoTitle';
import { useTeacherClasses } from '../hooks/useTeacherClasses';
import type { UseCase } from '../lib/llm/types';

// ── Utilities ─────────────────────────────────────────────────────────────────

const getWeekStartLocal = (value: Date) => {
    const start = new Date(value);
    const day = start.getDay();
    const offset = (day + 6) % 7;
    start.setDate(start.getDate() - offset);
    start.setHours(0, 0, 0, 0);
    return start;
};

const getWeekKey = (value: string | Date) =>
    getWeekStartLocal(new Date(value)).toISOString().slice(0, 10);

const formatWeekStart = (value: string | Date) =>
    new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(getWeekStartLocal(new Date(value)));

const buildCurrentWeekTitle = (className: string) => className;

const buildWeekOfTitle = (createdAt: string, className: string) =>
    `Week of ${formatWeekStart(createdAt)} – ${className}`;

const TEACHER_ASSIGNMENT_DRAFT_CHIP = 'Draft an assignment on this topic for this level';
const TEACHER_ASSIGNMENT_DRAFT_PROMPT =
    'Plan my next assignment on [topic] for [level]. Include objective, task flow, and one formative check.';
const TEACHER_SUMMARY_CHIP = 'Summarise my upcoming assignments';
const TEACHER_SUMMARY_PROMPT =
    'Summarise my upcoming assignments for this week, then list priority next actions.';
const TEACHER_DIFFERENTIATION_CHIP = 'Differentiate this task for struggling learners';
const TEACHER_DIFFERENTIATION_PROMPT =
    'Differentiate tasks for struggling learners while keeping standards clear and achievable.';

const TEACHER_DATA_TRIAGE_PATTERN =
    /\b(behind|struggling|weak|low score|underperform|intervention|triage)\b/i;

const resolveTeacherPromptConfig = (rawText: string): { message: string; useCase: UseCase } => {
    const trimmed = rawText.trim();

    if (trimmed === TEACHER_ASSIGNMENT_DRAFT_CHIP) {
        return {
            message: TEACHER_ASSIGNMENT_DRAFT_PROMPT,
            useCase: 'teacher_chat',
        };
    }

    if (trimmed === TEACHER_SUMMARY_CHIP) {
        return {
            message: TEACHER_SUMMARY_PROMPT,
            useCase: 'teacher_chat',
        };
    }

    if (trimmed === TEACHER_DIFFERENTIATION_CHIP) {
        return {
            message: TEACHER_DIFFERENTIATION_PROMPT,
            useCase: 'teacher_data_triage',
        };
    }

    if (TEACHER_DATA_TRIAGE_PATTERN.test(trimmed)) {
        return {
            message: trimmed,
            useCase: 'teacher_data_triage',
        };
    }

    return {
        message: trimmed,
        useCase: 'teacher_chat',
    };
};

// ── HorizontalChips ───────────────────────────────────────────────────────────

const HorizontalChips: React.FC<{
    prompts: string[];
    onSend: (p: string) => void;
    themeColor: string;
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
                            color: themeColor,
                        }}
                    >
                        {prompt}
                    </button>
                ))}
            </div>
            {showOverlay && (
                <div
                    className="absolute right-0 top-0 h-[calc(100%-4px)] w-8 pointer-events-none rounded-r-full"
                    style={{ background: 'linear-gradient(to right, transparent, white)' }}
                />
            )}
        </div>
    );
};

// ── Page component ────────────────────────────────────────────────────────────

const TeacherCopilotPage: React.FC<{ embeddedInShell?: boolean }> = ({ embeddedInShell = false }) => {
    const { isVerified, isGuest, logout, currentUser, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isDemo = useDemoMode();
    const [isSidebarOpen, setIsSidebarOpen] = useSidebarState(true);

    type TeacherCopilotNavState = {
        source?: string;
        preferredClassId?: string | null;
        contextMode?: 'class' | 'all-classes';
    };

    const navState = (location.state as TeacherCopilotNavState | null) ?? null;
    const initialPreferredClassId = !isDemo && navState?.contextMode === 'class'
        ? (navState.preferredClassId ?? null)
        : null;

    const displayName = isDemo ? demoTeacherName : (currentUser?.name || 'Teacher');
    const showAuthGate = isDemo || shouldGateCopilotAccess({ isVerified, isGuest });

    // ── Core chat state ──
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(isDemo ? 'demo-class-1' : initialPreferredClassId);
    const { data: teacherClasses } = useTeacherClasses();
    const classList = isDemo ? demoClasses : teacherClasses;
    const [serviceNotice, setServiceNotice] = useState<string | null>(null);
    const [insights, setInsights] = useState<any[]>(isDemo ? demoInsights : []);
    const [teacherStats, setTeacherStats] = useState<any[]>([]);

    // ── Thread management state ──
    const [threads, setThreads] = useState<dataService.TeacherCopilotConversation[]>([]);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [activeConversationTitle, setActiveConversationTitle] = useState<string>('Active Thread');
    const [isThreadsLoading, setIsThreadsLoading] = useState(false);


    // ── UI helpers ──
    const [showScrollButton, setShowScrollButton] = useState(false);
    const dataMessageCountRef = useRef(0);
    const hasAppliedInitialContextRef = useRef(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesAreaRef = useRef<HTMLDivElement>(null);
    const isNearBottomRef = useRef(true);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const shouldShowFeedback = () => {
        dataMessageCountRef.current += 1;
        return dataMessageCountRef.current % 3 === 0;
    };

    const hasMessagesInActiveThread = messages.some(m => m.role === 'user' || m.role === 'assistant');
    // We can ALWAYS create a new chat if there's no active thread. If there is an active thread, it MUST have messages.
    const canCreateNewChat = !activeThreadId || hasMessagesInActiveThread;

    // Ensure demo user is "logged in" for backend headers
    useEffect(() => {
        if (isDemo && currentUser?.id !== 'teacher_1' && typeof login === 'function') {
            login('teacher', undefined, false);
        }
    }, [isDemo, currentUser, login]);

    // ── Load context data ─────────────────────────────────────────────────────
    useEffect(() => {
        if (isDemo) {
            setServiceNotice(null);
            setInsights(demoInsights);
            return;
        }

        const load = async () => {
            try {
                const [stats, rawInsights] = await Promise.all([
                    dataService.getTeacherStats(),
                    dataService.getTeacherInsights(),
                ]);
                setServiceNotice(null);
                setTeacherStats(stats);
                setInsights(rawInsights);
            } catch (err: unknown) {
                if (err instanceof dataService.RedirectError) { navigate(err.to); return; }
                const normalized = dataService.toEloraServiceError(err);
                setServiceNotice(dataService.getFriendlyServiceErrorMessage(normalized));
            }
        };

        load();
    }, [isDemo, navigate]);

    // ── Apply navState class context ──────────────────────────────────────────
    useEffect(() => {
        if (isDemo || hasAppliedInitialContextRef.current) return;
        if (navState?.contextMode === 'all-classes') {
            setSelectedClassId(null);
            hasAppliedInitialContextRef.current = true;
            return;
        }
        if (navState?.contextMode === 'class' && navState.preferredClassId && classList.length > 0) {
            const has = classList.some((c) => c.id === navState.preferredClassId);
            setSelectedClassId(has ? navState.preferredClassId : null);
            hasAppliedInitialContextRef.current = true;
            return;
        }
        if (!navState) hasAppliedInitialContextRef.current = true;
    }, [classList, isDemo, navState]);

    useEffect(() => {
        if (!selectedClassId) {
            return;
        }

        const hasSelectedClass = classList.some((classItem) => classItem.id === selectedClassId);
        if (!hasSelectedClass) {
            setSelectedClassId(null);
        }
    }, [classList, selectedClassId]);

    // ── Helpers ───────────────────────────────────────────────────────────────

    const mapPersistedToUiMessage = (
        persisted: dataService.TeacherCopilotConversationMessage,
        conversationId: string,
        conversationTitle?: string | null,
        contextClassId?: string | null
    ): Message => {
        const classId = contextClassId ?? selectedClassId ?? null;
        const className = classId ? (classList.find((c: any) => c.id === classId)?.name ?? null) : null;
        return {
            id: persisted.id,
            role: persisted.role,
            content: persisted.content,
            intent: persisted.intent ?? undefined,
            conversationId,
            persistedAt: persisted.createdAt,
            source: persisted.source ?? undefined,
            threadContext: {
                classId,
                className,
                label: conversationTitle ?? buildCurrentWeekTitle(className ?? 'Overview'),
            },
            showFeedback: persisted.role === 'assistant' ? shouldShowFeedback() : false,
        };
    };

    const getThreadTitle = (conversation: dataService.TeacherCopilotConversation, className: string) => {
        const currentWeekKey = getWeekKey(new Date());
        const conversationWeekKey = getWeekKey(conversation.createdAt);
        const rawTitle = conversation.title?.trim();
        if (conversationWeekKey === currentWeekKey) return buildCurrentWeekTitle(className);
        if (rawTitle && (rawTitle.startsWith('Week of ') || rawTitle.startsWith('This week –'))) return rawTitle;
        if (rawTitle) return `Previous thread - ${className}`;
        return buildWeekOfTitle(conversation.createdAt, className);
    };

    const currentClass = classList.find((c) => c.id === selectedClassId);
    const currentClassName = currentClass?.name || 'Overview';
    const hasTeacherContextData = classList.length > 0 || insights.length > 0;

    // ── Load threads for current context ─────────────────────────────────────
    useEffect(() => {
        if (isDemo) return;

        let cancelled = false;

        const loadThreadsForContext = async () => {
            setIsThreadsLoading(true);
            try {
                let conversations = await dataService.listTeacherConversations({
                    classId: selectedClassId ?? undefined,
                });
                if (cancelled) return;

                // Auto-Cleanup: filter out completely empty threads matching 'New Chat' 
                // that aren't realistically populated yet, unless it's the only one.
                if (conversations.length > 1) {
                    conversations = conversations.filter((c, idx) => {
                        if (idx === 0) return true; // always keep most recent as fallback
                        if (c.title === 'New Chat' && c.updatedAt === c.createdAt) return false;
                        return true;
                    });
                }

                setThreads(conversations);

                if (conversations.length === 0) {
                    setActiveThreadId(null);
                    setActiveConversationTitle(buildCurrentWeekTitle(currentClassName));
                    setMessages([]);
                    return;
                }

                const currentWeekKey = getWeekKey(new Date());
                const currentConversation =
                    conversations.find((c) => getWeekKey(c.createdAt) === currentWeekKey) ?? conversations[0];
                const resolvedTitle = getThreadTitle(currentConversation, currentClassName);

                setActiveThreadId(currentConversation.id);
                setActiveConversationTitle(resolvedTitle);

                const persistedMessages = await dataService.getTeacherConversationMessages(currentConversation.id);
                if (cancelled) return;

                setMessages(
                    persistedMessages.map((p) =>
                        mapPersistedToUiMessage(
                            p,
                            currentConversation.id,
                            resolvedTitle,
                            currentConversation.classId ?? selectedClassId ?? null
                        )
                    )
                );
            } catch (error) {
                console.error('Failed to load teacher copilot conversations:', error);
            } finally {
                if (!cancelled) setIsThreadsLoading(false);
            }
        };

        loadThreadsForContext();
        return () => { cancelled = true; };
    }, [isDemo, selectedClassId, classList.length]);

    // ── Auto-scroll tracking ──────────────────────────────────────────────────
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

    // ── Demo initial state ────────────────────────────────────────────────────
    useEffect(() => {
        if (isDemo && messages.length === 0) {
            const contextName = classList.find((c) => c.id === selectedClassId)?.name || 'Overview';
            setMessages([
                {
                    id: 'msg-1',
                    role: 'assistant' as const,
                    steps: [
                        { id: 's0', text: `Context: ${contextName} — scoping all lookups to this class` },
                        { id: 's1', text: 'Loaded Sec 3 Mathematics insights' },
                        { id: 's2', text: 'Filtered to overdue work and low scores' },
                        { id: 's3', text: 'Ranked by urgency' },
                    ],
                    content:
                        'In Sec 3 Mathematics, three students need your attention before Friday:\n\n**Jordan Lee** — 28% on Algebra Quiz 1 and struggling with factorisation.\n**Priya Nair** — Algebra Quiz 1 not submitted, 3 days overdue.\n**Jordan Smith** — Submitted but scored 20% on the quiz; worth a quick check-in.',
                },
            ]);
        }
    }, [isDemo]);

    // ── Context change ────────────────────────────────────────────────────────
    const handleContextChange = (classId: string | null) => {
        if (classId === selectedClassId) return;
        setSelectedClassId(classId);
    };

    // ── Thread management handlers ────────────────────────────────────────────

    const handleSelectThread = useCallback(async (id: string) => {
        if (id === activeThreadId) return;
        const thread = threads.find((t) => t.id === id);
        if (!thread) return;

        setActiveThreadId(id);
        const title = getThreadTitle(thread, currentClassName);
        setActiveConversationTitle(title);
        setMessages([]);

        try {
            const persistedMessages = await dataService.getTeacherConversationMessages(id);
            setMessages(
                persistedMessages.map((p) =>
                    mapPersistedToUiMessage(p, id, title, thread.classId ?? selectedClassId ?? null)
                )
            );
        } catch (error) {
            console.error('Failed to load thread messages:', error);
        }
    }, [activeThreadId, threads, currentClassName, selectedClassId]);

    const handleNewThread = useCallback(async () => {
        if (activeThreadId && !hasMessagesInActiveThread) {
            // No-op to prevent empty threads
            return;
        }
        
        const preferredTitle = buildCurrentWeekTitle(currentClassName);
        setMessages([]);
        setActiveConversationTitle(preferredTitle);

        if (isDemo) { setActiveThreadId(null); return; }

        try {
            const created = await dataService.createTeacherConversation({
                classId: selectedClassId ?? undefined,
                title: preferredTitle,
            });
            setActiveThreadId(created.id);
            setThreads((prev) => [created, ...prev]);
        } catch (error) {
            console.error('Failed to create new thread:', error);
            setActiveThreadId(null);
        }
    }, [isDemo, currentClassName, selectedClassId]);

    const handleDeleteThread = useCallback(async (id: string) => {
        // Optimistic removal
        setThreads((prev) => prev.filter((t) => t.id !== id));

        if (id === activeThreadId) {
            const remaining = threads.filter((t) => t.id !== id);
            if (remaining.length > 0) {
                const next = remaining[0];
                setActiveThreadId(next.id);
                setActiveConversationTitle(getThreadTitle(next, currentClassName));
                try {
                    const msgs = await dataService.getTeacherConversationMessages(next.id);
                    setMessages(msgs.map((p) => mapPersistedToUiMessage(p, next.id, null, next.classId)));
                } catch { setMessages([]); }
            } else {
                setActiveThreadId(null);
                setActiveConversationTitle(buildCurrentWeekTitle(currentClassName));
                setMessages([]);
            }
        }

        try {
            await dataService.deleteTeacherConversation(id);
        } catch (error) {
            console.error('Failed to delete thread:', error);
        }
    }, [activeThreadId, threads, currentClassName]);

    const handleRenameThread = useCallback(async (id: string, title: string) => {
        // Optimistic update
        setThreads((prev) =>
            prev.map((t) => (t.id === id ? { ...t, title, updatedAt: new Date().toISOString() } : t))
        );
        if (id === activeThreadId) setActiveConversationTitle(title);

        try {
            const updated = await dataService.updateTeacherConversationTitle(id, title);
            setThreads((prev) => prev.map((t) => (t.id === id ? updated : t)));
        } catch (error) {
            console.error('Failed to rename thread:', error);
        }
    }, [activeThreadId]);

    const handlePinThread = useCallback(async (id: string, isPinned: boolean) => {
        // Optimistic update
        setThreads((prev) =>
            prev.map((t) => (t.id === id ? { ...t, isPinned } : t))
        );

        try {
            const updated = await dataService.updateTeacherConversationPin(id, isPinned);
            setThreads((prev) => prev.map((t) => (t.id === id ? updated : t)));
        } catch (error) {
            console.error('Failed to pin thread:', error);
        }
    }, []);

    // ── Auto-title ────────────────────────────────────────────────────────────
    const activeThread = threads.find((t) => t.id === activeThreadId);

    useAutoTitle({
        conversationId: activeThreadId,
        messages,
        currentTitle: activeThread?.title ?? activeConversationTitle,
        onTitleGenerated: (title) => {
            if (activeThreadId) {
                handleRenameThread(activeThreadId, title);
            }
        },
        enabled: !isDemo && !showAuthGate,
    });

    // ── Suggestion prompts ────────────────────────────────────────────────────
    const buildPrompts = (): string[] => {
        const contextClassName = selectedClassId
            ? (classList.find((c) => c.id === selectedClassId)?.name || 'this class')
            : 'all classes';

        const scopedInsights = insights.filter((i) => {
            if (!selectedClassId) return true;
            return i.className === contextClassName || i.className === 'Overview';
        });

        const weakTopic = scopedInsights.find((i) => i.type === 'weak_topic')?.topicTag?.trim();
        const overdueItem = scopedInsights.find((i) => i.type === 'overdue_assignment');
        const attentionPrompt = 'Which students need my attention before Friday?';

        if (!selectedClassId) {
            return [
                TEACHER_ASSIGNMENT_DRAFT_CHIP,
                TEACHER_SUMMARY_CHIP,
                TEACHER_DIFFERENTIATION_CHIP,
                attentionPrompt,
                overdueItem?.assignmentTitle
                    ? `Draft a parent update for overdue work on ${overdueItem.assignmentTitle}.`
                    : 'Draft a parent update for students with overdue work.',
            ];
        }

        return [
            `Draft an assignment on ${weakTopic || 'this topic'} for ${contextClassName}.`,
            TEACHER_SUMMARY_CHIP,
            `Differentiate this task for struggling learners in ${contextClassName}.`,
            attentionPrompt,
            overdueItem?.assignmentTitle
                ? `Draft a message to families about overdue work on ${overdueItem.assignmentTitle}.`
                : `Draft a progress update for families in ${contextClassName}.`,
        ];
    };

    const currentPrompts = buildPrompts();

    // ── Send message ──────────────────────────────────────────────────────────
    const handleSend = async (text: string) => {
        const { message: normalizedMessage, useCase: resolvedUseCase } = resolveTeacherPromptConfig(text);
        const query = normalizedMessage.trim();
        if (!query) return;

        const isFirstMessage = messages.filter((m) => m.role === 'user').length === 0;
        const recentUserPrompts = messages
            .filter((m) => m.role === 'user')
            .map((m) => m.content.trim())
            .filter(Boolean)
            .slice(-3);

        let ensuredConversationId = activeThreadId;
        const preferredCurrentTitle = buildCurrentWeekTitle(currentClassName);
        let ensuredConversationTitle = activeConversationTitle || preferredCurrentTitle;

        if (!isDemo && !ensuredConversationId) {
            try {
                const created = await dataService.createTeacherConversation({
                    classId: selectedClassId ?? undefined,
                    title: preferredCurrentTitle,
                });
                ensuredConversationId = created.id;
                ensuredConversationTitle = preferredCurrentTitle;
                setActiveThreadId(created.id);
                setActiveConversationTitle(ensuredConversationTitle);
                setThreads((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
            } catch (error) {
                console.error('Failed to create conversation. Continuing in local-only mode.', error);
            }
        }

        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: query,
            useCase: resolvedUseCase,
            conversationId: ensuredConversationId ?? undefined,
            threadContext: {
                classId: selectedClassId,
                className: selectedClassId ? (classList.find((c: any) => c.id === selectedClassId)?.name ?? null) : null,
                label: ensuredConversationTitle,
            },
        };

        setMessages((prev) => [...prev, newUserMsg]);
        setInputValue('');
        setIsThinking(true);
        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = '52px';
        }

        if (!isDemo && ensuredConversationId) {
            try {
                const persisted = await dataService.appendTeacherConversationMessage(ensuredConversationId, {
                    role: 'user',
                    content: query,
                    source: 'teacher-copilot-ui',
                });
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === newUserMsg.id
                            ? { ...m, id: persisted.id, persistedAt: persisted.createdAt, source: persisted.source ?? 'teacher-copilot-ui' }
                            : m
                    )
                );
            } catch (error) {
                console.error('Failed to persist user message:', error);
            }
        }

        try {
            setServiceNotice(null);
            const currentClassNameText = selectedClassId
                ? (classList.find((c) => c.id === selectedClassId)?.name || 'this class')
                : 'all classes';

            const contextStep: Step = {
                id: `ctx-${Date.now()}`,
                text: selectedClassId
                    ? `Scoped to ${currentClassNameText} — ${(classList.find((c) => c.id === selectedClassId) as any)?.studentsCount ?? '?'} students`
                    : `Looking across all your classes (${classList.map((c) => c.name).join(', ')})`,
            };

            const classInsights = insights.filter((i) =>
                !selectedClassId ? true : i.className === currentClassNameText
            );
            const overdueCount = classInsights.filter((i) => i.type === 'overdue_assignment').length;
            const weakTopics = Array.from(
                new Set(classInsights.filter((i) => i.type === 'weak_topic').map((i) => i.topicTag))
            ).filter(Boolean);
            const urgentInsights = classInsights
                .slice(0, 5)
                .map((i) => {
                    if (i.type === 'weak_topic') return `${i.topicTag}: ${i.detail}`;
                    if (i.type === 'overdue_assignment') return `${i.studentName || 'A student'} has overdue work (${i.assignmentTitle})`;
                    if (i.type === 'needs_attention') return `${i.studentName} needs attention: ${i.detail}`;
                    return i.detail;
                })
                .join('. ');

            const avgScore = teacherStats.find((s) => s.label === 'Avg. Class Score')?.value || '68%';

            const contextStr = [
                `You are currently looking at ${currentClassNameText}.`,
                `Average class score: ${avgScore}.`,
                urgentInsights ? `Urgent alerts: ${urgentInsights}.` : 'No immediate alerts.',
                overdueCount > 0 ? `Total ${overdueCount} overdue items.` : '',
                weakTopics.length > 0 ? `Students struggling with: ${weakTopics.join(', ')}.` : '',
                `Total classes: ${classList.length}.`,
            ].filter(Boolean).join(' ');

            const response = await askElora({
                message: query,
                role: 'teacher',
                useCase: resolvedUseCase,
                context: contextStr,
                contextMeta: !isDemo ? {
                    role: 'teacher',
                    isDemo,
                    dashboardSource: navState?.source ?? 'teacher_copilot_page',
                    roleContextId: selectedClassId ?? undefined,
                    roleContextLabel: selectedClassId ? currentClassNameText : undefined,
                    selectedClassId: selectedClassId ?? null,
                    selectedClassName: selectedClassId ? currentClassNameText : null,
                    selectedStudentId: null,
                    selectedChildId: null,
                    selectedSubject: selectedClassId ? null : 'all-classes',
                } : undefined,
                isFirstMessage,
                recentUserPrompts,
                lastSelectedClassId: selectedClassId,
                lastSelectedStudentId: null,
                conversationId: ensuredConversationId ?? null,
            });

            const { cleanContent, suggestions } = parseSuggestionsFromResponse(response);

            const assistantMsg: Message = {
                id: Date.now().toString() + '-a',
                role: 'assistant',
                steps: [contextStep],
                content: cleanContent,
                suggestions,
                useCase: resolvedUseCase,
                showFeedback: shouldShowFeedback(),
                conversationId: ensuredConversationId ?? undefined,
                source: 'ask-elora',
                threadContext: {
                    classId: selectedClassId,
                    className: selectedClassId ? (classList.find((c: any) => c.id === selectedClassId)?.name ?? null) : null,
                    label: ensuredConversationTitle,
                },
            };

            setMessages((prev) => [...prev, assistantMsg]);

            if (!isDemo && ensuredConversationId) {
                try {
                    const persisted = await dataService.appendTeacherConversationMessage(ensuredConversationId, {
                        role: 'assistant',
                        content: cleanContent,
                        source: 'ask-elora',
                    });
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMsg.id
                                ? { ...m, id: persisted.id, persistedAt: persisted.createdAt }
                                : m
                        )
                    );
                } catch (error) {
                    console.error('Failed to persist assistant message:', error);
                }
            }
        } catch (error: unknown) {
            if (error instanceof dataService.RedirectError) { navigate(error.to); return; }
            const normalized = dataService.toEloraServiceError(error);
            setServiceNotice(dataService.getFriendlyServiceErrorMessage(normalized));
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString() + '-err',
                    role: 'assistant',
                    content: "I'm sorry, I'm having trouble connecting right now. Please try again!",
                },
            ]);
        } finally {
            setIsThinking(false);
        }
    };

    // ── Input auto-resize ─────────────────────────────────────────────────────
    const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        const el = e.currentTarget;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 128) + 'px'; // 128 = max-h-32
    };

    // ── Sidebar content ───────────────────────────────────────────────────────
    const sidebarContent = showAuthGate ? <></> : (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
                <CopilotThreadSidebar
                    threads={threads}
                    activeId={activeThreadId || ''}
                    onSelect={handleSelectThread}
                    onNew={handleNewThread}
                    onDelete={handleDeleteThread}
                    onRename={handleRenameThread}
                    onPin={handlePinThread}
                    themeColor="#14b8a6"
                    isLoading={isThreadsLoading}
                    canCreateNewChat={canCreateNewChat}
                    classes={classList}
                    selectedClassId={selectedClassId}
                    onClassSelect={handleContextChange}
                />
        </div>
    );

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <CopilotLayout
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            isDemo={isDemo}
            role="Teacher"
            themeColor="#14b8a6"
            logout={logout}
            navigate={navigate}
            demoBanner={!embeddedInShell && isDemo && <DemoBanner />}
            demoRoleSwitcher={!embeddedInShell && isDemo && <DemoRoleSwitcher />}
            hidePrimarySidebar={embeddedInShell || showAuthGate}
            lockToViewportHeight={!embeddedInShell && !showAuthGate && !isDemo}
            hideContextSidebar={true}
            sidebar={<></>}
            contentMaxWidth="max-w-none"
            chatAreaClassName={isDemo ? undefined : "flex-1 h-full flex flex-col min-w-0 bg-slate-50 relative overflow-hidden"}
        >
            <CopilotMobileHeader themeColor="#14b8a6" />

            {showAuthGate ? (
                <CopilotAuthGate role="Teacher" themeColor="#14b8a6" />
            ) : (
                <CopilotLayoutShell role="teacher" leftRail={sidebarContent}>
                    <div className="flex-1 h-full flex flex-col min-h-0 bg-[#fbfcf8] relative overflow-hidden">
                        {/* Messages viewport (primary scroll area) */}
                        <div
                            ref={messagesAreaRef}
                            onScroll={handleMessagesScroll}
                            className="flex-1 overflow-y-auto custom-scrollbar w-full scroll-smooth"
                        >
                            <div className="max-w-[720px] mx-auto px-6 pt-12 pb-8 flex flex-col min-h-full">
                                {serviceNotice && (
                                    <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-medium text-orange-800 mb-6 underline cursor-pointer" onClick={() => window.location.reload()}>
                                        {serviceNotice} (Click to refresh)
                                    </div>
                                )}

                                {!isDemo && !hasTeacherContextData && (
                                    <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-medium text-sky-800 mb-6">
                                        We do not see classes or assignments yet, so Copilot will provide general planning guidance.
                                    </div>
                                )}

                                {messages.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <CopilotEmptyState
                                            themeColor="#14b8a6"
                                            userName={displayName}
                                            title={threads.length === 0 ? 'No Copilot conversations yet. Try one of the suggestions below to get started.' : undefined}
                                            description="I can dig into your class data, help plan assignments, support differentiation, and draft family communications."
                                            handleSend={handleSend}
                                            prompts={currentPrompts}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.map((message) => (
                                            <CopilotMessageBubble
                                                key={message.id}
                                                message={message}
                                                themeColor="#14b8a6"
                                                copilotRole="teacher"
                                                showFeedback={message.showFeedback}
                                                onSuggestionClick={handleSend}
                                                feedbackSource="teacher_copilot_page"
                                            />
                                        ))}
                                        {isThinking && (
                                            <CopilotThinkingBubble
                                                themeColor="#14b8a6"
                                                assistantName="Elora"
                                            />
                                        )}
                                        <div ref={messagesEndRef} className="h-4" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Composer footer (pinned to bottom of chat column) */}
                        <div className="shrink-0 border-t border-slate-200/80 bg-gradient-to-t from-slate-50 via-slate-50/90 to-slate-50/80 px-6 py-4 z-10">
                            <div className="max-w-3xl mx-auto">

                                {/* Suggestion Chips - Floating above input */}
                                {!isThinking && messages.length > 0 && (
                                    <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar pb-1 animate-in slide-in-from-bottom-2 fade-in duration-500">
                                        {currentPrompts.map((prompt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleSend(prompt)}
                                                className="shrink-0 px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm text-[11px] font-bold text-slate-600 hover:bg-[#14b8a6] hover:text-white hover:border-[#14b8a6] transition-all whitespace-nowrap active:scale-95"
                                            >
                                                {prompt}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="relative group shadow-2xl shadow-slate-200/50 rounded-2xl bg-white border border-slate-200 focus-within:border-[#14b8a6] focus-within:ring-4 focus-within:ring-teal-500/5 transition-all duration-300">
                                    <textarea
                                        ref={textareaRef}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onInput={handleTextareaInput}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend(inputValue);
                                            }
                                        }}
                                        placeholder="Message Elora..."
                                        className="w-full bg-transparent px-5 py-4 text-[15px] font-medium outline-none pr-14 resize-none min-h-[56px] max-h-32 text-slate-800 placeholder:text-slate-400"
                                        rows={1}
                                    />
                                    <button
                                        onClick={() => handleSend(inputValue)}
                                        disabled={!inputValue.trim() || isThinking}
                                        className={`absolute right-2 top-2 w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 shadow-sm ${
                                            inputValue.trim() && !isThinking
                                                ? 'bg-[#14b8a6] text-white shadow-lg shadow-teal-500/20 active:scale-90'
                                                : 'bg-slate-50 text-slate-300'
                                        }`}
                                    >
                                        <ArrowRight size={20} strokeWidth={2.5} />
                                    </button>
                                </div>
                                <div className="mt-3 flex items-center justify-center gap-4 opacity-50">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                                        Elora can make mistakes. Check important info.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Fixed Scroll-to-bottom button */}
                        {showScrollButton && (
                            <button
                                onClick={scrollToBottom}
                                className="fixed bottom-32 right-8 p-3 bg-white border border-slate-200 rounded-full shadow-lg text-slate-400 hover:text-[#14b8a6] hover:border-teal-100 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300 z-50 hover:shadow-teal-500/10"
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

    export default TeacherCopilotPage;
