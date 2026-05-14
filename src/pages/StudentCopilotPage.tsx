import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    ChevronDown,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useDemoMode } from '../hooks/useDemoMode';
import { shouldGateCopilotAccess } from '../hooks/useAuthGate';
import { useSidebarState } from '../hooks/useSidebarState';
import { useStudentClasses } from '../hooks/useStudentClasses';
import { DemoBanner } from '../components/DemoBanner';
import { DemoRoleSwitcher } from '../components/DemoRoleSwitcher';
import { askElora } from '../services/askElora';
import { uploadCopilotFile } from '../services/fileUploadService';
import { ActionProposalModal } from '../components/StudentCopilot/ActionProposalModal';
import {
    demoStudentData,
    demoStudentStreak,
    demoGameSessions,
    demoStudentClasses,
    demoStudentName,
} from '../demo/demoStudentScenarioA';
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
    shouldShowFeedback
} from '../components/Copilot/CopilotShared';
import { CopilotInputBar } from '../components/Copilot/CopilotInputBar';
import CopilotThreadSidebar from '../components/Copilot/CopilotThreadSidebar';
import type { UseCase, CopilotFileAttachment } from '../lib/llm/types';

const getIsoWeekKey = (value: Date) => {
    const date = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-${String(weekNo).padStart(2, '0')}`;
};

const buildWeeklyTitle = (subjectLabel: string) => subjectLabel;

const topicExplanations: Record<string, string> = {
    'Algebra – Factorisation': "Factorisation is like 'un-multiplying'. You're taking an expression and finding simpler terms that multiply together to make it. For example, x² + 5x + 6 becomes (x+2)(x+3). It's a key skill for solving complex equations later on.",
    'Quadratic Equations': "A quadratic equation is any equation that can be written in the form ax² + bx + c = 0. The graph of these equations always forms a curve called a parabola. They are used everywhere from physics to business to model curved paths or changing rates.",
    'Linear Inequalities': "Inequalities are like equations but use signs like > or < instead of =. They describe a range of possible answers rather than just one. For example, 2x > 6 means x must be any number greater than 3.",
    'Fractions': "Fractions represent parts of a whole. The top number (numerator) tells you how many parts you have, and the bottom number (denominator) tells you how many parts make up the full whole. Adding them is easiest when the denominators are the same!",
    'Kinematics': "Kinematics is the study of motion. We use terms like displacement, velocity, and acceleration to describe how objects move without worrying about the forces that cause the movement. It's the foundation of almost everything in classical physics."
};

const STUDENT_EXPLAIN_CHIP = 'Explain this concept simply';
const STUDENT_EXPLAIN_PROMPT =
    'Explain this concept to me in simpler language, then give one short example.';
const STUDENT_PRACTICE_CHIP = 'Give me practice questions about this topic';
const STUDENT_PRACTICE_PROMPT =
    'Give me practice questions about this topic with one easy, one medium, and one challenge question.';
const STUDENT_PREP_CHIP = 'Help me prepare for my next assignment';
const STUDENT_PREP_PROMPT =
    'Help me review for my next assignment or test on this topic with a short study plan.';
const STUDENT_STUDY_MODE_HINT_PATTERN = /\b(study session|ask me questions|quiz me|drill me|practice session)\b/i;

const resolveStudentPromptConfig = ({
    rawText,
    activeUseCase,
}: {
    rawText: string;
    activeUseCase: UseCase;
}): { message: string; useCase: UseCase } => {
    const trimmed = rawText.trim();

    if (trimmed === STUDENT_EXPLAIN_CHIP) {
        return {
            message: STUDENT_EXPLAIN_PROMPT,
            useCase: 'student_chat',
        };
    }

    if (trimmed === STUDENT_PRACTICE_CHIP) {
        return {
            message: STUDENT_PRACTICE_PROMPT,
            useCase: 'student_study_help',
        };
    }

    if (trimmed === STUDENT_PREP_CHIP) {
        return {
            message: STUDENT_PREP_PROMPT,
            useCase: 'student_study_help',
        };
    }

    if (activeUseCase === 'student_study_mode' || STUDENT_STUDY_MODE_HINT_PATTERN.test(trimmed)) {
        return {
            message: trimmed,
            useCase: 'student_study_mode',
        };
    }

    return {
        message: trimmed,
        useCase: 'student_chat',
    };
};

/**
 * Detect if a raw user message is "freeform" (not a quick-action chip).
 * Returns true if the message does not match any quick-action pattern.
 */
const isFreeformMessage = (rawText: string, activeUseCase: UseCase): boolean => {
    const trimmed = rawText.trim();
    
    const quickActionChips = [
        STUDENT_EXPLAIN_CHIP,
        STUDENT_PRACTICE_CHIP,
        STUDENT_PREP_CHIP,
    ];

    if (quickActionChips.includes(trimmed)) {
        return false;
    }

    // If it's detected as study mode by pattern, it's not considered "freeform" for guard purposes
    if (STUDENT_STUDY_MODE_HINT_PATTERN.test(trimmed)) {
        return false;
    }

    return true;
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
                        className="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium whitespace-nowrap transition-all duration-200 border shadow-sm hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0"
                        style={{
                            backgroundColor: themeColor + '10',
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
                    style={{ background: 'linear-gradient(to right, transparent, var(--elora-surface-main))' }}
                />
            )}
        </div>
    );
};

const StudentCopilotPage: React.FC<{ embeddedInShell?: boolean }> = ({ embeddedInShell = false }) => {
    const DEMO_STUDENT_ID = 'demo-student-jordan';
    const { logout, currentUser, login, isGuest, isVerified } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isDemo = useDemoMode();
    const showAuthGate = shouldGateCopilotAccess({ isVerified, isGuest });
    const [isSidebarOpen, setIsSidebarOpen] = useSidebarState(true);

    type StudentCopilotNavState = {
        source?: string;
        preferredSubjectId?: string;
        weakTopic?: string | null;
        topTasks?: Array<{ title?: string; className?: string }>;
    };

    const navState = (location.state as StudentCopilotNavState | null) ?? null;
    const initialSubjectId = navState?.preferredSubjectId && navState.preferredSubjectId !== 'all'
        ? navState.preferredSubjectId
        : 'all';
    
    // Context selector state
    const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId);

    // Initialise student data state
    const [assignments, setAssignments] = useState<any[]>([]);
    const [recentPerformance, setRecentPerformance] = useState<any>(null);
    const [streakData, setStreakData] = useState<any>(null);
    const [gameSessions, setGameSessions] = useState<any[]>([]);
    const { data: studentClasses } = useStudentClasses();

    // Demo user auto-login
    useEffect(() => {
        if (isDemo && currentUser?.id !== 'student_1' && typeof login === 'function') {
            login('student', undefined, false);
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
                    setServiceNotice(null);
                    setAssignments(studentData.assignments);
                    setRecentPerformance(studentData.recentPerformance);
                    setGameSessions(sessions);
                    setStreakData(streak);
                } catch (err: unknown) {
                    if (err instanceof dataService.RedirectError) {
                        navigate(err.to);
                        return;
                    }

                    const normalized = dataService.toEloraServiceError(err);
                    setServiceNotice(dataService.getFriendlyServiceErrorMessage(normalized));
                    setAssignments([]);
                    setRecentPerformance({ scores: [], weakTopics: [] });
                    setGameSessions([]);
                    setStreakData(null);
                }
            }
        };
        fetchData();
    }, [isDemo, navigate]);

    const [messages, setMessages] = useState<Message[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [activeConversationTitle, setActiveConversationTitle] = useState<string>('Active Thread');
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [serviceNotice, setServiceNotice] = useState<string | null>(null);
    const [attachedFiles, setAttachedFiles] = useState<CopilotFileAttachment[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [activeCopilotUseCase, setActiveCopilotUseCase] = useState<UseCase>('student_chat');
    const [threads, setThreads] = useState<dataService.StudentCopilotConversation[]>([]);
    const [isThreadsLoading, setIsThreadsLoading] = useState(false);
    const [consecutiveFreeformCount, setConsecutiveFreeformCount] = useState(0);
    const [showActionProposal, setShowActionProposal] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesAreaRef = useRef<HTMLDivElement>(null);
    const isNearBottomRef = useRef(true);
    const [showScrollButton, setShowScrollButton] = useState(false);

    // Derived logic from Student Dashboard
    const primaryFocusTopic = recentPerformance?.weakTopics?.[0] ?? null;

    // Derived subjects list for selector. For real users, include class roster names
    // so context switching still works even before assignment data is populated.
    const assignmentSubjects = assignments
        .map((a) => a.className)
        .filter((subject): subject is string => typeof subject === 'string' && subject.trim().length > 0);
    const rosterSubjects = isDemo
        ? demoStudentClasses.map((cls) => cls.name)
        : studentClasses
            .map((cls) => cls.name)
            .filter((subject): subject is string => typeof subject === 'string' && subject.trim().length > 0);
    const subjects = Array.from(new Set([...assignmentSubjects, ...rosterSubjects]));
    const selectedSubjectName = selectedSubjectId === 'all' ? 'All subjects' : selectedSubjectId;
    const subjectFilter = selectedSubjectName === 'All subjects' ? undefined : selectedSubjectName;
    const weekKey = getIsoWeekKey(new Date());
    const weeklyTitle = buildWeeklyTitle(selectedSubjectName);

    // Filtered data based on context
    const filteredAssignments = selectedSubjectId === 'all'
        ? assignments
        : assignments.filter(a => a.className === selectedSubjectId);
    
    const filteredPending = filteredAssignments.filter(a => ['not_started', 'danger', 'warning', 'info'].includes(a.status || ''));
    const hasStudentContextData = assignments.length > 0 || subjects.length > 0;

    // Thread management helpers
    const hasMessagesInActiveThread = messages.some(m => m.role === 'user' || m.role === 'assistant');
    const canCreateNewChat = !activeConversationId || hasMessagesInActiveThread;

    useEffect(() => {
        if (selectedSubjectId === 'all') {
            return;
        }

        if (!subjects.includes(selectedSubjectId)) {
            setSelectedSubjectId('all');
        }
    }, [selectedSubjectId, subjects]);

    const weakTopic = navState?.weakTopic?.trim() || primaryFocusTopic;

    const currentPrompts = [
        STUDENT_EXPLAIN_CHIP,
        STUDENT_PRACTICE_CHIP,
        STUDENT_PREP_CHIP,
        weakTopic ? `Quiz me on ${weakTopic}.` : 'Quiz me on this topic.',
        'Give me a 20-minute revision plan for tonight.',
    ];

    const toUiMessage = (
        persisted: dataService.StudentCopilotConversationMessage,
        conversationId: string,
        conversationTitle: string
    ): Message => {
        return {
            id: persisted.id,
            role: persisted.role,
            content: persisted.content,
            intent: persisted.intent ?? undefined,
            source: persisted.source ?? undefined,
            conversationId,
            threadContext: {
                label: conversationTitle,
            },
            persistedAt: persisted.createdAt,
            showFeedback: persisted.role === 'assistant' ? shouldShowFeedback() : false,
        };
    };

    useEffect(() => {
        if (isDemo || !currentUser || currentUser.role !== 'student') {
            return;
        }

        let cancelled = false;

        const loadConversations = async () => {
            setIsThreadsLoading(true);
            try {
                const conversations = await dataService.listStudentConversations({
                    weekKey,
                    subject: subjectFilter,
                });
                if (cancelled) return;

                // Auto-cleanup: filter out completely empty threads
                let filtered = conversations.length > 1
                    ? conversations.filter((c, idx) => {
                        if (idx === 0) return true;
                        if (c.title === 'New Chat' && c.updatedAt === c.createdAt) return false;
                        return true;
                    })
                    : conversations;

                setThreads(filtered);

                if (filtered.length === 0) {
                    setActiveConversationId(null);
                    setActiveConversationTitle(weeklyTitle);
                    setMessages([]);
                    return;
                }

                const currentConversation = filtered[0];
                const resolvedTitle = currentConversation.title?.trim() || weeklyTitle;
                setActiveConversationId(currentConversation.id);
                setActiveConversationTitle(resolvedTitle);

                const persistedMessages = await dataService.getStudentConversationMessages(currentConversation.id);
                if (cancelled) return;

                setMessages(
                    persistedMessages.map((p) =>
                        toUiMessage(p, currentConversation.id, resolvedTitle)
                    )
                );
            } catch (error) {
                console.error('Failed to load student copilot conversations:', error);
            } finally {
                if (!cancelled) setIsThreadsLoading(false);
            }
        };

        loadConversations();
        return () => { cancelled = true; };
    }, [isDemo, currentUser?.id, currentUser?.role, weekKey, weeklyTitle, subjectFilter]);

    const ensureActiveConversation = async () => {
        if (activeConversationId) {
            return {
                id: activeConversationId,
                title: activeConversationTitle,
            };
        }

        const existing = await dataService.listStudentConversations({
            weekKey,
            subject: subjectFilter,
        });
        if (existing.length > 0) {
            const latest = existing[0];
            const resolvedTitle = latest.title?.trim() || weeklyTitle;
            setActiveConversationId(latest.id);
            setActiveConversationTitle(resolvedTitle);
            return {
                id: latest.id,
                title: resolvedTitle,
            };
        }

        const created = await dataService.createStudentConversation({
            weekKey,
            subject: subjectFilter,
            title: weeklyTitle,
            threadType: 'weekly_subject',
        });

        const createdTitle = created.title?.trim() || weeklyTitle;
        setActiveConversationId(created.id);
        setActiveConversationTitle(createdTitle);

        return {
            id: created.id,
            title: createdTitle,
        };
    };

    const handleSelectThread = useCallback(async (id: string) => {
        if (id === activeConversationId) return;
        const thread = threads.find((t) => t.id === id);
        if (!thread) return;

        setActiveCopilotUseCase('student_chat');
        setActiveConversationId(id);
        const title = thread.title?.trim() || weeklyTitle;
        setActiveConversationTitle(title);
        setMessages([]);

        try {
            const persistedMessages = await dataService.getStudentConversationMessages(id);
            setMessages(
                persistedMessages.map((p) =>
                    toUiMessage(p, id, title)
                )
            );
        } catch (error) {
            console.error('Failed to load thread messages:', error);
        }
    }, [activeConversationId, threads, weeklyTitle]);

    const handleNewThread = useCallback(async () => {
        if (activeConversationId && messages.some(m => m.role === 'user' || m.role === 'assistant')) {
            // Already has messages, can create new
        } else if (activeConversationId) {
            // No messages yet, don't create
            return;
        }

        setMessages([]);
        setActiveConversationTitle(weeklyTitle);
        setActiveCopilotUseCase('student_chat');

        if (isDemo) { 
            setActiveConversationId(null); 
            return; 
        }

        try {
            const created = await dataService.createStudentConversation({
                weekKey,
                subject: subjectFilter,
                title: weeklyTitle,
                threadType: 'weekly_subject',
            });
            setActiveConversationId(created.id);
            setActiveConversationTitle(weeklyTitle);
            setThreads((prev) => [created, ...prev]);
        } catch (error) {
            console.error('Failed to create new thread:', error);
            setActiveConversationId(null);
        }
    }, [isDemo, weeklyTitle, activeConversationId, messages, weekKey, subjectFilter]);

    const handleDeleteThread = useCallback(async (id: string) => {
        setThreads((prev) => prev.filter((t) => t.id !== id));

        if (id === activeConversationId) {
            const remaining = threads.filter((t) => t.id !== id);
            if (remaining.length > 0) {
                const next = remaining[0];
                setActiveConversationId(next.id);
                setActiveConversationTitle(next.title?.trim() || weeklyTitle);
                try {
                    const msgs = await dataService.getStudentConversationMessages(next.id);
                    setMessages(msgs.map((p) => toUiMessage(p, next.id, next.title?.trim() || weeklyTitle)));
                } catch { setMessages([]); }
            } else {
                setActiveConversationId(null);
                setActiveConversationTitle(weeklyTitle);
                setMessages([]);
            }
        }

        try {
            // Note: Student backend may not support delete yet
            // await dataService.deleteStudentConversation(id);
        } catch (error) {
            console.error('Failed to delete thread:', error);
        }
    }, [activeConversationId, threads, weeklyTitle]);

    const handleRenameThread = useCallback(async (id: string, title: string) => {
        setThreads((prev) =>
            prev.map((t) => (t.id === id ? { ...t, title, updatedAt: new Date().toISOString() } : t))
        );
        if (id === activeConversationId) setActiveConversationTitle(title);

        try {
            // Note: Student backend may not support rename yet
            // await dataService.updateStudentConversationTitle(id, title);
        } catch (error) {
            console.error('Failed to rename thread:', error);
        }
    }, [activeConversationId]);

    const handlePinThread = useCallback(async (id: string, isPinned: boolean) => {
        setThreads((prev) =>
            prev.map((t) => (t.id === id ? { ...t, isPinned } : t))
        );

        try {
            // Note: Student backend does not support pin yet - this is a no-op
            // await dataService.updateStudentConversationPin(id, isPinned);
        } catch (error) {
            console.error('Failed to pin thread:', error);
        }
    }, []);

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

    const handleSend = async (text: string) => {
        const { message: normalizedMessage, useCase: resolvedUseCase } = resolveStudentPromptConfig({
            rawText: text,
            activeUseCase: activeCopilotUseCase,
        });
        const query = normalizedMessage.trim();
        if (!query || showAuthGate) return;

        // Guardrail: track consecutive freeform messages
        const isFreeform = isFreeformMessage(text, activeCopilotUseCase);
        let updatedFreeformCount = isFreeform ? consecutiveFreeformCount + 1 : 0;
        setConsecutiveFreeformCount(updatedFreeformCount);

        // If we've hit 2 consecutive freeform messages, show action proposal
        if (updatedFreeformCount >= 2) {
            setShowActionProposal(true);
            // Reset input but don't send the message yet
            setInputValue('');
            return;
        }

        if (resolvedUseCase !== activeCopilotUseCase) {
            setActiveCopilotUseCase(resolvedUseCase);
        }

        const isFirstMessage = messages.filter((msg) => msg.role === 'user').length === 0;
        const recentUserPrompts = messages
            .filter((msg) => msg.role === 'user')
            .map((msg) => msg.content.trim())
            .filter(Boolean)
            .slice(-3);

        let conversationIdForMessage: string | null = null;
        let conversationTitleForMessage = activeConversationTitle || weeklyTitle;

        if (!isDemo && currentUser?.role === 'student') {
            try {
                const ensured = await ensureActiveConversation();
                conversationIdForMessage = ensured.id;
                conversationTitleForMessage = ensured.title;
            } catch (error) {
                console.error('Failed to ensure student conversation:', error);
            }
        }

        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: query,
            useCase: resolvedUseCase,
            conversationId: conversationIdForMessage ?? undefined,
            threadContext: {
                label: conversationTitleForMessage,
            },
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInputValue('');
        setIsThinking(true);
        setServiceNotice(null);

        try {
            if (conversationIdForMessage && !isDemo) {
                try {
                    await dataService.appendStudentConversationMessage(conversationIdForMessage, {
                        role: 'user',
                        content: query,
                        source: 'copilot_page',
                    });
                } catch (persistError) {
                    console.error('Failed to persist student user message:', persistError);
                }
            }

            // Build Context for Elora
            const contextStr = [
                `Student profile: ${isDemo ? demoStudentName : (currentUser?.name || 'Student')}.`,
                `Subject Selector: ${selectedSubjectName}.`,
                primaryFocusTopic ? `Your current focus area is ${primaryFocusTopic}.` : '',
                filteredPending[0] ? `Upcoming/Overdue task: "${filteredPending[0].title}" (Status: ${filteredPending[0].statusLabel || filteredPending[0].status}).` : 'No urgent assignments.',
                streakData ? `Average this week: ${streakData.scoreThisWeek}%. Trend: ${streakData.trend}.` : ''
            ].filter(Boolean).join(' ');

            const selectedDemoClass = isDemo
                ? demoStudentClasses.find((cls) => cls.name === selectedSubjectId)
                : null;
            const selectedRealClass = !isDemo
                ? studentClasses.find((cls) => cls.name === selectedSubjectId)
                : null;
            const resolvedStudentId = isDemo ? DEMO_STUDENT_ID : (currentUser?.id ?? null);
            const resolvedClassId = isDemo
                ? (selectedDemoClass?.id ?? null)
                : (selectedRealClass?.id ?? null);

            const response = await askElora({
                message: query,
                role: 'student',
                useCase: resolvedUseCase,
                context: contextStr,
                contextMeta: !isDemo ? {
                    role: 'student',
                    isDemo,
                    dashboardSource: navState?.source ?? 'student_copilot_page',
                    roleContextId: selectedSubjectId === 'all' ? undefined : (resolvedClassId ?? selectedSubjectId),
                    roleContextLabel: selectedSubjectId === 'all' ? undefined : selectedSubjectName,
                    selectedClassId: resolvedClassId,
                    selectedClassName: selectedSubjectId === 'all' ? null : selectedSubjectId,
                    selectedStudentId: resolvedStudentId,
                    selectedStudentName: currentUser?.name ?? null,
                    selectedChildId: null,
                    selectedSubject: selectedSubjectId === 'all' ? undefined : selectedSubjectName,
                } : undefined,
                isFirstMessage,
                recentUserPrompts,
                lastSelectedClassId: subjectFilter ?? null,
                lastSelectedStudentId: resolvedStudentId,
                conversationId: conversationIdForMessage,
                fileAttachments: attachedFiles,
            });

            const { cleanContent, suggestions } = parseSuggestionsFromResponse(response);

            const eloraMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: cleanContent,
                suggestions,
                useCase: resolvedUseCase,
                showFeedback: shouldShowFeedback(),
                conversationId: conversationIdForMessage ?? undefined,
                source: 'copilot_page',
                threadContext: {
                    label: conversationTitleForMessage,
                },
            };

            if (conversationIdForMessage && !isDemo) {
                try {
                    await dataService.appendStudentConversationMessage(conversationIdForMessage, {
                        role: 'assistant',
                        content: cleanContent,
                        source: 'copilot_page',
                    });
                } catch (persistError) {
                    console.error('Failed to persist student assistant message:', persistError);
                }
            }

            setMessages(prev => [...prev, eloraMsg]);
            setAttachedFiles([]);
        } catch (error: unknown) {
            if (error instanceof dataService.RedirectError) {
                navigate(error.to);
                return;
            }

            const normalized = dataService.toEloraServiceError(error);
            setServiceNotice(dataService.getFriendlyServiceErrorMessage(normalized));
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm sorry, I'm having trouble connecting right now. Can we try again in a moment?"
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleSelectTask = () => {
        setShowActionProposal(false);
        setConsecutiveFreeformCount(0);
        if (filteredPending[0]) {
            handleSend(`Help me with this task: ${filteredPending[0].title}`);
        }
    };

    const handleSelectSprint = () => {
        setShowActionProposal(false);
        setConsecutiveFreeformCount(0);
        handleSend('Let\'s do a 10-minute focused drill. Quiz me on what I\'ve been working on.');
    };

    const handleSelectTopic = () => {
        setShowActionProposal(false);
        setConsecutiveFreeformCount(0);
        if (weakTopic) {
            handleSend(`Help me master ${weakTopic} with targeted practice.`);
        }
    };

    const handleFileAttach = async (file: File) => {
        if (attachedFiles.length >= 5) return;
        setIsUploading(true);
        try {
            const result = await uploadCopilotFile(file);
            if (result.success && result.file) {
                setAttachedFiles((prev) => [...prev, result.file!]);
            } else if (result.error) {
                setServiceNotice(result.error);
            }
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileRemove = (fileId: string) => {
        setAttachedFiles((prev) => prev.filter((file) => file.id !== fileId));
    };

    const sidebarContent = showAuthGate ? <></> : (
        <div className="flex-1 flex flex-col min-h-0 bg-white">
            <CopilotThreadSidebar
                threads={threads}
                activeId={activeConversationId || ''}
                onSelect={handleSelectThread}
                onNew={handleNewThread}
                onDelete={handleDeleteThread}
                onRename={handleRenameThread}
                onPin={handlePinThread}
                role="student"
                themeColor="#68507B"
                isLoading={isThreadsLoading}
                canCreateNewChat={canCreateNewChat}
                classes={subjects.map((subject) => ({ id: subject, name: subject }))}
                selectedClassId={selectedSubjectId === 'all' ? null : selectedSubjectId}
                onClassSelect={(id) => setSelectedSubjectId(id ?? 'all')}
            />
        </div>
    );

    return (
        <CopilotLayout
            role="Student"
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            isDemo={isDemo}
            themeColor="#68507B"
            logout={logout}
            navigate={navigate}
            hideContextSidebar={true}
            sidebar={<></>}
            demoBanner={!embeddedInShell && isDemo && <DemoBanner />}
            demoRoleSwitcher={!embeddedInShell && isDemo && <DemoRoleSwitcher />}
            hidePrimarySidebar={embeddedInShell || showAuthGate}
            lockToViewportHeight={!embeddedInShell && !showAuthGate}
            contentMaxWidth="max-w-none"
            chatAreaClassName={isDemo ? undefined : "flex-1 h-full flex flex-col min-w-0 bg-slate-50 dark:bg-[var(--elora-chat-canvas)] relative overflow-hidden transition-colors duration-500"}
        >
            <CopilotMobileHeader themeColor="#68507B" />

            {showAuthGate ? (
                <CopilotAuthGate role="Student" themeColor="#68507B" />
            ) : (
                <CopilotLayoutShell role="student" leftRail={sidebarContent}>
                    <div className="flex-1 h-full flex flex-col min-h-0 bg-[#fbfcf8] dark:bg-[var(--elora-chat-canvas)] relative overflow-hidden transition-colors duration-500">
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

                                {!isDemo && !hasStudentContextData && (
                                    <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-medium text-sky-800 mb-6">
                                        We do not see assignments or classes yet, so Copilot will give general study guidance.
                                    </div>
                                )}

                                {messages.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <CopilotEmptyState
                                            themeColor="#68507B"
                                            userName={currentUser?.name}
                                            title={threads.length === 0 ? 'No Copilot conversations yet. Try one of the suggestions below to get started.' : undefined}
                                            description="I can explain tricky topics, quiz you, and help build a realistic revision plan."
                                            prompts={currentPrompts}
                                            handleSend={handleSend}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="mb-6 md:mb-8">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#68507B] mb-2">
                                                {activeConversationTitle}
                                            </p>
                                        </div>
                                        {messages.map((msg) => (
                                            <CopilotMessageBubble
                                                key={msg.id}
                                                message={msg}
                                                themeColor="#68507B"
                                                shouldAutoExpandSteps={messages.filter(m => m.role === 'assistant' && m.steps && m.steps.length > 0).findIndex(m => m.id === msg.id) < 3}
                                                copilotRole="student"
                                                showFeedback={msg.showFeedback}
                                                onSuggestionClick={handleSend}
                                                feedbackSource="student_copilot_page"
                                            />
                                        ))}
                                        {isThinking && (
                                            <CopilotThinkingBubble
                                                themeColor="#68507B"
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
                                {messages.length > 0 && (
                                    <div className="relative">
                                        <HorizontalChips prompts={currentPrompts} onSend={handleSend} themeColor="#68507B" />
                                    </div>
                                )}

                                <div className="flex-1">
                                    <CopilotInputBar
                                        value={inputValue}
                                        onChange={setInputValue}
                                        onSend={() => handleSend(inputValue)}
                                        isThinking={isThinking}
                                        themeColor="#68507B"
                                        placeholder="Ask about a topic, assignment, or study plan..."
                                        files={attachedFiles}
                                        onFileAttach={handleFileAttach}
                                        onFileRemove={handleFileRemove}
                                        isUploading={isUploading}
                                        role="student"
                                        showPrivacyNote={false}
                                        containerClassName="rounded-[32px]"
                                    />
                                </div>
                            </div>
                        </div>

                        {showScrollButton && (
                            <button
                                onClick={scrollToBottom}
                                className="fixed bottom-32 right-8 p-3 bg-white border border-slate-200 rounded-full shadow-lg text-slate-400 hover:text-[#68507B] hover:border-[#68507B]/30 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300 z-50"
                                title="Scroll to bottom"
                            >
                                <ChevronDown size={20} />
                            </button>
                        )}
                    </div>
                </CopilotLayoutShell>
            )}
            <ActionProposalModal
                isOpen={showActionProposal}
                weakTopic={weakTopic}
                nearestTask={filteredPending[0]}
                onSelectTask={handleSelectTask}
                onSelectSprint={handleSelectSprint}
                onSelectTopic={handleSelectTopic}
                themeColor="#68507B"
            />
        </CopilotLayout>
    );
};

export default StudentCopilotPage;
