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
import { useSidebarState } from '../hooks/useSidebarState';
import { demoTeacherName, DEMO_CLASS_LEVEL, demoInsights, demoClasses } from '../demo/demoTeacherScenarioA';
import * as dataService from '../services/dataService';
import {
    CopilotLayout,
    CopilotMessageBubble,
    CopilotEmptyState,
    CopilotMobileHeader,
    CopilotAuthGate,
    CopilotAuthHint,
    Message,
    Step,
    ActionChip,
    shouldShowFeedback
} from '../components/Copilot/CopilotShared';


// MOCK_CLASSES removed in favor of dynamic classList state

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


const TeacherCopilotPage: React.FC = () => {
    const { isVerified, logout, currentUser } = useAuth();
    const navigate = useNavigate();
    const isDemo = useDemoMode();
    const isUnauthenticated = isDemo && !localStorage.getItem('elora_current_user');
    const [showAuthHint, setShowAuthHint] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useSidebarState(true);

    const displayName = isDemo ? demoTeacherName : (currentUser?.name || 'Teacher');

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(isDemo ? 'demo-class-1' : null);
    const [classList, setClassList] = useState<any[]>([]);
    const [isContextPopupOpen, setIsContextPopupOpen] = useState(false);
    const dataMessageCountRef = useRef(0);
    const [insights, setInsights] = useState<any[]>(isDemo ? demoInsights : []);
    const [teacherStats, setTeacherStats] = useState<any[]>([]);

    useEffect(() => {
        if (isDemo) {
            setClassList(demoClasses);
        } else {
            // Load all necessary context data for the copilot
            const loadContextData = async () => {
                try {
                    const [classes, stats, rawInsights] = await Promise.all([
                        dataService.getMyClasses(),
                        dataService.getTeacherStats(),
                        dataService.getTeacherInsights()
                    ]);
                    setClassList(classes);
                    setTeacherStats(stats);
                    setInsights(rawInsights);
                } catch (err) {
                    console.error("Failed to load teacher copilot context:", err);
                }
            };
            loadContextData();
        }
    }, [isDemo]);

    const buildPrompts = (): string[] => {
        const topTopic = insights.find(i => i.type === 'weak_topic')?.topicTag ?? null;
        const overdueTitle = insights.find(i => i.type === 'overdue_assignment')?.assignmentTitle ?? null;

        if (!selectedClassId) {
            return [
                'Who needs my attention across all my classes?',
                'Give me a cross-class summary of this week.',
                topTopic
                    ? `How are my classes doing on ${topTopic}?`
                    : 'Which class is furthest behind right now?',
                overdueTitle
                    ? `Draft a parent message about ${overdueTitle} being overdue.`
                    : 'Draft a general update for parents about learning progress.',
            ];
        } else {
            const currentClassNameText = classList.find(c => c.id === selectedClassId)?.name || 'this class';
            return [
                `Which students need my attention before Friday in ${currentClassNameText}?`,
                topTopic
                    ? `How is ${currentClassNameText} doing on ${topTopic}?`
                    : `What's the main thing to work on in ${currentClassNameText}?`,
                overdueTitle
                    ? `Draft a note to parents about ${overdueTitle} being overdue.`
                    : `Draft a parent update for ${currentClassNameText}.`,
                `What should I focus on before the next ${currentClassNameText} lesson?`,
            ];
        }
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial demo state
    useEffect(() => {
        if (isDemo && messages.length === 0) {
            const contextName = classList.find(c => c.id === selectedClassId)?.name || 'All classes';
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
                        { label: 'See who’s falling behind', actionType: 'navigate', destination: 'needs-attention' }
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

        setSelectedClassId(classId);
        setIsContextPopupOpen(false);
    };

    const currentPrompts = buildPrompts();
    const currentClass = classList.find(c => c.id === selectedClassId);
    const currentClassName = currentClass?.name || 'All classes';
    const contextPillLabel = currentClassName;

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    const handleSend = (text: string) => {
        if (isUnauthenticated) {
            setShowAuthHint(true);
            return;
        }
        const query = text.trim();
        if (!query) return;

        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: query
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInputValue('');
        
        // Reset textarea height after sending
        const textarea = document.querySelector('textarea');
        if (textarea) {
            textarea.style.height = '52px';
        }
        
        setIsThinking(true);

        // Simulate thinking & response
        setTimeout(() => {
            setIsThinking(false);
            const lowerQuery = query.toLowerCase().trim();

            const currentClassNameText = selectedClassId
                ? classList.find(c => c.id === selectedClassId)?.name || 'this class'
                : 'all classes';
            const allClassesList = classList.map(c => c.name).join(', ');

            const contextStep = {
                id: `ctx-${Date.now()}`,
                text: selectedClassId
                    ? `Scoped to ${currentClassNameText} — ${classList.find(c => c.id === selectedClassId)?.studentsCount ?? '?'} students`
                    : `Looking across all your classes (${allClassesList})`,
            };

            // Intent Detection Helpers
            const isSmallTalkKw = (q: string) => /^(hi|hello|hey|thanks|thank you|how are you)$/i.test(q.replace(/[?!.]/g, ''));
            const isAboutKw = (q: string) => /what is (elora|this|copilot)|what can you do|how should i use this|how do i use this/i.test(q);
            const isCommunicationKw = (q: string) => /message|email|note|parent|families|tell|say/i.test(q);
            const isExplanationKw = (q: string) => /explain|help me understand|what is (?!elora|this|copilot)|give me a summary of (?!the class|how)/i.test(q);
            const isFeedbackKw = (q: string) => /feedback|comment|what should i say/i.test(q);
            const isAttentionKw = (q: string) => /attention|struggling|help|behind|at risk|falling behind|improved|most improved|worried about|worry about|miss|slipping|quietly/i.test(q);
            const isPlanningKw = (q: string) => /before friday|this week|today|next lesson|next class|work on|focus on|main thing|should i focus/i.test(q);
            const isTopicKw = (q: string) => /factorisation|algebra|topic|performance|doing on|index laws|fractions/i.test(q);
            // Overview: "how is this class doing", "how are they doing", "is everything ok", "any patterns"
            const isOverviewKw = (q: string) =>
                /(how is|how are|how's) (this class|the class|they|we|my class|my classes) (doing|getting on|overall|lately)/i.test(q) ||
                /(is everything|is it) (ok|okay|mostly ok|fine|alright)/i.test(q) ||
                /(should i be worried|anything (i should|on my radar)|anything you think|are there any patterns|any patterns)/i.test(q) ||
                /how am i doing|how are my classes doing|anything urgent|should i be|on my radar/i.test(q);
            const isSummaryKw = (q: string) => /summary|report|weekly|how are we doing/.test(q);
            // Teacher low-confidence / lost
            const isTeacherLostKw = (q: string) => /feeling (a bit |)lost|overwhelm|don'?t know where to start|not sure what to do/i.test(q);
            const isSensitiveKw = (q: string) => /stress|anxious|unhappy|sad|upset|burnt out/i.test(q);

            const hasSupportedIntent = isAboutKw(lowerQuery) || isCommunicationKw(lowerQuery) || isExplanationKw(lowerQuery) || isFeedbackKw(lowerQuery) || isPlanningKw(lowerQuery) || isAttentionKw(lowerQuery) || isTopicKw(lowerQuery) || isSummaryKw(lowerQuery) || isSensitiveKw(lowerQuery) || isOverviewKw(lowerQuery) || isTeacherLostKw(lowerQuery);

            const isSmallTalk = isSmallTalkKw(lowerQuery) || lowerQuery === "hi" || lowerQuery === "hello";
            const isUnknown = !isSmallTalk && !isAboutKw(lowerQuery) && !hasSupportedIntent;

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
            } else if (isTeacherLostKw(lowerQuery)) {
                steps = [];
                content = "That's completely understandable — there's a lot to keep track of. Let me help you focus on what matters most right now.\n\nThe quickest thing I can do is show you which students need your attention and flag anything that's overdue. Want me to start there?";
                actions = [{ label: 'See who needs attention', actionType: 'navigate', destination: 'needs-attention' }];
            } else if (isSensitiveKw(lowerQuery)) {
                steps = [];
                content = "I hear your concern, and those feelings are real. While I can't offer wellbeing advice, I can help you look at engagement and progress data to see if there are academic patterns worth noting.\n\nFor anything beyond that, reaching out to the school counselor or a colleague is always a good step.";
            } else if (isOverviewKw(lowerQuery)) {
                const summaryScore = teacherStats.find(s => s.label === "Avg. Class Score")?.value || "68%";
                const classInsights = insights.filter(i => !selectedClassId || i.className === currentClassNameText);
                const overdue = classInsights.filter(i => i.type === 'overdue_assignment');

                steps = [
                    contextStep,
                    { id: 'agg', text: `Checked performance for ${currentClassNameText}.` },
                    { id: 'flag', text: overdue.length > 0 ? `Found ${overdue.length} overdue assignments.` : 'No critical flags found.' }
                ];

                if (selectedClassId) {
                    content = `**${currentClassNameText}** is currently at an average accuracy of **${summaryScore}**. ${overdue.length > 0 ? `The most pressing item is **${overdue[0].assignmentTitle}**, which is overdue with no submissions yet.` : 'The class is generally on track with no major flags.'}\n\nWant me to show you who needs the most attention?`;
                } else {
                    const overdueCount = insights.filter(i => i.type === 'overdue_assignment').length;
                    content = `${getScopePrefix()}Your classes are generally on track. The average across your groups is **${summaryScore}**. ${overdueCount > 0 ? `I found ${overdueCount} overdue assignments across all classes.` : 'No urgent overdue items on your radar right now.'}\n\nWant me to dig into a specific class or check the global 'Needs Attention' board?`;
                }
                actions = [
                    { label: 'See who needs attention', actionType: 'navigate', destination: 'needs-attention' },
                    { label: selectedClassId ? `Full report for ${currentClassNameText}` : 'See weekly report', actionType: 'navigate', destination: '/dashboard/teacher' }
                ];
            } else if (isCommunicationKw(lowerQuery)) {
                const overdueInsight = insights.find(i => i.type === 'overdue_assignment' && (!selectedClassId || i.className === currentClassNameText));
                const weakTopicInsight = insights.find(i => i.type === 'weak_topic' && (!selectedClassId || i.className === currentClassNameText));

                const draftClassName = overdueInsight?.className || currentClassNameText;
                const draftAssignmentTitle = overdueInsight?.assignmentTitle || "the latest assignment";
                const draftWeakTopic = weakTopicInsight?.topicTag || null;
                const mentionedStudent = insights.find(i => i.studentName);
                const recipient = mentionedStudent ? `parents of ${mentionedStudent.studentName}` : "parents";

                const draftBody = overdueInsight
                    ? `Here's a draft message for ${recipient} in **${draftClassName}**:\n\n"Hi, just a reminder that **${draftAssignmentTitle}** is still outstanding. If ${mentionedStudent ? mentionedStudent.studentName.split(' ')[0] : 'your child'} needs a hand getting started, encourage them to give it a try this week — it's a short session and I'm happy to follow up with anyone who needs extra support."\n\nEdit as needed before sending.`
                    : `Here's a general draft for **${draftClassName}**:\n\n"Dear parents, we're finishing up our work on ${draftWeakTopic || 'the current unit'} this week. Most students are on track, but a little extra practice at home always helps with confidence. Thanks for your continued support!"\n\nEdit as needed before sending.`;

                steps = [
                    contextStep,
                    { id: 'load-asgn', text: `Loaded assignments for ${draftClassName} — found ${overdueInsight ? `"${draftAssignmentTitle}" (overdue)` : 'no overdue assignments'}` },
                    { id: 'check-topic', text: draftWeakTopic ? `Checked top weak topic: ${draftWeakTopic}` : 'No specific weak topic flagged this week' },
                    { id: 'draft', text: 'Drafted a parent-facing message using this context' }
                ];
                content = getScopePrefix() + draftBody;
                actions = [{ label: `See assignments for ${draftClassName}`, actionType: 'navigate', destination: '/dashboard/teacher' }];
            } else if (isAboutKw(lowerQuery)) {
                steps = [];
                content = "Elora is a teaching platform that tracks your classes, assignments, topics, and how students are progressing. I'm the Copilot built into Elora — I read your class data and turn it into suggestions, summaries, and drafts. I only work with what's actually in your data; I don't guess beyond that.\n\nYou can ask me things like:\n• 'Which students need my attention before Friday?'\n• 'Explain Algebra – Factorisation simply for this class.'\n• 'Draft a short message to parents about an overdue assignment.'";
            } else if (isExplanationKw(lowerQuery)) {
                steps = [];
                const topics: Record<string, string> = {
                    'factorisation': "Factorisation is the process of breaking down an expression into a product of simpler factors. For Sec 3, I'd suggest explaining it as the 'reverse of expansion'.",
                    'index laws': "Index laws are rules used to simplify expressions involving powers of the same base. Key ones to remember are adding indices when multiplying and subtracting when dividing.",
                    'algebra': "Algebra uses symbols to represent numbers in formulas and equations. It's about finding the unknown or expressing relationships clearly.",
                    'fractions': "Fractions represent parts of a whole, defined by a numerator (top) and denominator (bottom)."
                };
                const matchedTopic = Object.keys(topics).find(t => lowerQuery.includes(t));
                content = matchedTopic ? topics[matchedTopic] : "I'm not exactly sure about that topic, but I'd suggest focusing on breaking it down into smaller, visual steps for this class.";

                content += "\n\n**Quick suggestion:** You could assign a short 5-minute practice pack to help the 14 students who are currently below the class average.";
                actions = [{ label: 'See practice packs for this topic', actionType: 'navigate', destination: '/teacher/practice' }];
            } else if (isFeedbackKw(lowerQuery)) {
                const allStudentInsights = insights.filter(i => i.studentName);
                const mentionedInsight = allStudentInsights.find(insight => {
                    if (!insight.studentName) return false;
                    const firstName = insight.studentName.split(' ')[0].toLowerCase();
                    return lowerQuery.includes(firstName);
                });

                const targetInsight = mentionedInsight ?? allStudentInsights[0] ?? null;
                const targetName = targetInsight?.studentName ?? null;
                const targetTopic = targetInsight?.topicTag ?? null;
                const targetDetail = targetInsight?.detail ?? null;

                if (!targetName) {
                    steps = [];
                    const knownNames = allStudentInsights
                        .map(i => i.studentName)
                        .filter(Boolean)
                        .slice(0, 4)
                        .join(', ');
                    content = `Who would you like to give feedback to? I can see data for: ${knownNames || 'students in your classes'}. Try asking "What feedback should I give [name]?"`;
                } else {
                    steps = [
                        contextStep,
                        { id: 'find-student', text: `Checked data for ${targetName}` },
                        { id: 'load-insight', text: targetDetail ?? `Found insight for ${targetName}` },
                    ];
                    const firstName = targetName.split(' ')[0];
                    content = targetTopic
                        ? `For **${targetName}**, here's a suggestion:\n\n"${firstName}, I can see you've been working hard on ${targetTopic}. It's a tricky area and you're not alone — let's spend a few minutes on it next lesson to clear up the parts that are causing you trouble. If you want to get ahead of it, try one short practice round before we meet."\n\nAdapt the tone to match your relationship with them.`
                        : `For **${targetName}**:\n\n"${firstName}, I can see you're making an effort — keep going. Let's connect briefly next lesson to make sure you feel confident about where you're at."\n\nAdapt as needed.`;
                    content = getScopePrefix() + content;
                }
                const groupInsights = insights.filter(i => !selectedClassId || i.className === currentClassNameText);
                const overdueCount = groupInsights.filter(i => i.type === 'overdue_assignment').length;
                const lowScoresCount = groupInsights.filter(i => i.type === 'low_scores').length;
                const weakTopicsCount = groupInsights.filter(i => i.type === 'weak_topic').length;

                steps = [
                    contextStep,
                    { id: 's1', text: `Found ${overdueCount} overdue, ${lowScoresCount} low scores, ${weakTopicsCount} weak topics.` },
                    { id: 's2', text: 'Ranked by urgency: overdue first, then low scores, then weak topics.' }
                ];

                if (groupInsights.length === 0) {
                    content = getScopePrefix() + `Great news — No students currently need attention in **${currentClassNameText}**. Everyone is up to date with their submissions and performing within expected ranges.`;
                } else {
                    const topInsights = groupInsights.slice(0, 3);
                    const insightLines = topInsights.map(i => {
                        const namePart = i.studentName ? `**${i.studentName}**` : `**${i.assignmentTitle}**`;
                        return `• ${namePart} — ${i.detail}`;
                    }).join('\n');

                    content = getScopePrefix() + `In **${currentClassNameText}**, here are the priority areas needing your attention:\n\n${insightLines}`;
                }
                actions = [{ label: 'See who needs attention', actionType: 'navigate', destination: 'needs-attention' }];
            } else if (isPlanningKw(lowerQuery)) {
                const planningInsight = insights.find(i => i.type === 'overdue_assignment' && (!selectedClassId || i.className === currentClassNameText));
                const planningTopic = insights.find(i => i.type === 'weak_topic' && (!selectedClassId || i.className === currentClassNameText))?.topicTag;

                steps = [
                    contextStep,
                    { id: 'load-stats', text: `Checked overdue/upcoming assignments for ${currentClassNameText}.` },
                    { id: 'check-upcoming', text: planningTopic ? `Identified weak topic: ${planningTopic}` : 'Checked weak topic flags — none found.' }
                ];

                if (planningInsight) {
                    content = getScopePrefix() + `Before your next lesson, I'd recommend finishing up **${planningInsight.assignmentTitle}**. It's currently overdue for the class. ${planningTopic ? `A quick recap of **${planningTopic}** could also help the students who are flagging for support.` : ''}`;
                } else if (planningTopic) {
                    content = getScopePrefix() + `For your next lesson, focusing on **${planningTopic}** would be my top recommendation. Based on recent data, some students are struggling with this specific area.`;
                } else {
                    content = getScopePrefix() + `Everything seems to be on track for **${currentClassNameText}**. You might want to introduce new material in the next lesson as there are no pressing overdue assignments or weak topics.`;
                }
                actions = [{ label: 'See practice packs', actionType: 'navigate', destination: '/teacher/practice' }];
            } else if (isTopicKw(lowerQuery)) {
                const topicScore = teacherStats.find(s => s.label === "Avg. Class Score")?.value || "68%";
                const topTopic = insights.find(i => i.type === 'weak_topic' && (!selectedClassId || i.className === currentClassNameText))?.topicTag || "the current topic";

                steps = [
                    contextStep,
                    { id: 'fetch', text: `Loaded data for ${currentClassNameText}.` },
                    { id: 'analyze', text: `Analyzed performance on key topics including ${topTopic}.` }
                ];
                content = selectedClassId
                    ? `In **${currentClassNameText}**, average accuracy on **${topTopic}** is around **${topicScore}**. Several students are currently below this average, so it might be worth assigning a short practice round focused on this area.`
                    : getScopePrefix() + `Across your classes, **${topTopic}** remains a key area for support (avg **${topicScore}**). Most other topics are performing within expected ranges.`;
                actions = [{ label: 'See class performance', actionType: 'navigate', destination: '/dashboard/teacher' }];
            } else if (isSummaryKw(lowerQuery)) {
                const summaryScore = teacherStats.find(s => s.label === "Avg. Class Score")?.value || "N/A";
                const overdueSummry = insights.filter(i => i.type === 'overdue_assignment' && (!selectedClassId || i.className === currentClassNameText));

                steps = [
                    contextStep,
                    { id: 'agg', text: `Gathered performance metrics across ${selectedClassId ? 'this class' : 'all classes'}.` },
                    { id: 'check-flags', text: overdueSummry.length > 0 ? `Found ${overdueSummry.length} overdue assignments.` : 'No critical flags found.' }
                ];

                if (selectedClassId) {
                    content = `**${currentClassNameText}** currently has an average accuracy of **${summaryScore}**. ${overdueSummry.length > 0 ? `The most pressing item is **${overdueSummry[0].assignmentTitle}**, which is overdue.` : 'Things are looking steady with no major flags.'}\n\nWant to see more details?`;
                } else {
                    const overdueCount = insights.filter(i => i.type === 'overdue_assignment').length;
                    content = getScopePrefix() + `Overall your classes are performing with an average of **${summaryScore}**. I found ${overdueCount} overdue assignments that might need your attention. \n\nI recommend jumping into the 'Needs Attention' board for the full breakdown.`;
                }

                actions = [
                    {
                        label: selectedClassId ? `See full report for ${currentClassNameText}` : 'See weekly report',
                        actionType: 'navigate',
                        destination: '/dashboard/teacher'
                    },
                    { label: 'See who needs attention', actionType: 'navigate', destination: 'needs-attention' }
                ];
            } else if (isUnknown) {
                steps = [];
                const topWeakTopicForContext = insights.find(i => i.type === 'weak_topic')?.topicTag ?? null;
                const contextHint = selectedClassId
                    ? `things I can help you with for ${currentClassNameText}`
                    : 'things I can help you with across your classes';
                content = `I didn't quite follow that. Here are some ${contextHint}:\n• 'Which students need my attention before Friday?'\n• 'How is this class doing on ${topWeakTopicForContext ?? 'the current topic'}?'\n• 'Draft a note to parents about an overdue assignment.'\n• 'What should I focus on before our next lesson?'`;
            }

            const resolvedIntent = isSmallTalk ? 'smalltalk' :
                isTeacherLostKw(lowerQuery) ? 'teacherlost' :
                    isSensitiveKw(lowerQuery) ? 'sensitive' :
                        isOverviewKw(lowerQuery) ? 'overview' :
                            isCommunicationKw(lowerQuery) ? 'communication' :
                                isAttentionKw(lowerQuery) ? 'attention' :
                                    isPlanningKw(lowerQuery) ? 'planning' :
                                        isTopicKw(lowerQuery) ? 'topic' :
                                            isSummaryKw(lowerQuery) ? 'summary' : 'unknown';

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
        if (action.actionType === 'navigate') {
            if (action.destination === 'needs-attention') {
                navigate(isDemo ? '/teacher/demo' : '/dashboard/teacher');
                // Note: ideally we tab-switch or scroll to Needs Attention, but navigating back is fine for v1
            } else if (action.destination) {
                navigate(action.destination);
            }
        }
    };

    return (
        <CopilotLayout
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            isDemo={isDemo}
            role="Teacher"
            themeColor="#14b8a6"
            logout={logout}
            navigate={navigate}
            demoBanner={isDemo && <DemoBanner />}
            demoRoleSwitcher={isDemo && <DemoRoleSwitcher />}
            sidebar={
                isUnauthenticated ? (
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <EloraLogo className="w-8 h-8" />
                            <span className="text-xl font-bold tracking-tight text-teal-600">Elora</span>
                        </div>
                        <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100">
                            <p className="text-sm text-teal-800 leading-relaxed italic">
                                "The best classroom support starts with seeing what matters most in your class data."
                            </p>
                        </div>
                        
                        <div className="mt-8 space-y-4 opacity-50 pointer-events-none">
                             <div className="h-4 w-24 bg-slate-200 rounded" />
                             <div className="space-y-2">
                                 <div className="h-10 w-full bg-slate-100 rounded-xl" />
                                 <div className="h-10 w-full bg-slate-100 rounded-xl" />
                                 <div className="h-10 w-full bg-slate-100 rounded-xl" />
                             </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-6 border-b border-[#EAE7DD]">
                            <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-1">Copilot</h2>
                            <p className="text-sm font-medium text-teal-600 flex items-center gap-1.5">
                                <Sparkles size={14} />
                                Connected to class data
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 no-scrollbar">
                            {/* Context Selection Pill */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsContextPopupOpen(!isContextPopupOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 hover:bg-teal-100/80 border border-teal-200 rounded-full text-teal-700 transition-colors w-fit"
                                >
                                    {selectedClassId && insights.some(i => i.className === currentClassName) && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                                    )}
                                    <span className="text-xs font-bold whitespace-nowrap">
                                        {contextPillLabel}
                                    </span>
                                    <ChevronDown size={14} className={`shrink-0 transition-transform ${isContextPopupOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Desktop Popover */}
                                {isContextPopupOpen && (
                                    <>
                                        <div className="fixed inset-0 z-30 hidden md:block" onClick={() => setIsContextPopupOpen(false)} />
                                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-40 hidden md:block py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="px-4 py-2 mb-1">
                                                <p className="text-[11px] font-medium text-slate-400">Copilot will answer using data from this class only.</p>
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
                                                    </div>
                                                </button>
                                                <div className="my-1 border-t border-slate-100" />
                                                {classList.map((cls) => {
                                                    const classHasInsight = insights.some(i => i.className === cls.name);
                                                    return (
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
                                                                    <span className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                                                                        {classHasInsight && <span className="inline-block w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-0.5" />}
                                                                        {cls.name}
                                                                    </span>
                                                                    {selectedClassId === cls.id && <Check size={16} className="text-teal-600" />}
                                                                </div>
                                                                <p className="text-[11px] text-slate-500">{cls.studentsCount} students</p>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
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
                    </>
                )
            }
        >
            <CopilotMobileHeader themeColor="#14b8a6" />

            {isUnauthenticated ? (
                <CopilotAuthGate role="Teacher" themeColor="#14b8a6" />
            ) : (
                <>
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                        {messages.length === 0 ? (
                            <CopilotEmptyState
                                themeColor="#14b8a6"
                                userName={displayName}
                                description="I can uncover trends in your classes, draft feedback or messages, explain topics, and prioritize students who need your support."
                                prompts={currentPrompts}
                                handleSend={handleSend}
                            />
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#EAE7DD]">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-teal-50 p-2 rounded-xl border border-teal-100 hidden md:block">
                                            <Sparkles className="w-6 h-6 text-teal-600" />
                                        </div>
                                        <div>
                                            <h1 className="text-xl font-bold text-slate-900 leading-tight">Copilot</h1>
                                            <p className="text-sm text-slate-500 font-medium">
                                                Your classroom AI assistant
                                            </p>
                                        </div>
                                    </div>

                                    {/* Context Selection Pill */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsContextPopupOpen(!isContextPopupOpen)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 hover:bg-teal-100/80 border border-teal-200 rounded-full text-teal-700 transition-colors w-fit shadow-sm"
                                        >
                                            <Layers size={14} className="shrink-0" />
                                            {selectedClassId && insights.some(i => i.className === currentClassName) && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                                            )}
                                            <span className="text-xs font-bold whitespace-nowrap">
                                                {contextPillLabel}
                                            </span>
                                            <ChevronDown size={14} className={`shrink-0 transition-transform ${isContextPopupOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                </div>

                                {messages.map((msg) => (
                                    <CopilotMessageBubble
                                        key={msg.id}
                                        message={msg}
                                        themeColor="#14b8a6"
                                        onActionClick={handleActionClick}
                                        shouldAutoExpandSteps={messages.filter(m => m.role === 'assistant' && m.steps && m.steps.length > 0).findIndex(m => m.id === msg.id) < 3}
                                        copilotRole="teacher"
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

                    <div className="p-4 md:p-6 bg-white border-t border-[#EAE7DD]">
                        <div className="max-w-4xl mx-auto space-y-4">
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
                                        placeholder="Ask about your class..."
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/20 resize-none flex-1 min-h-[52px] max-h-48 overflow-y-auto transition-[height] duration-100"
                                        rows={1}
                                        onInput={(e) => {
                                            const target = e.currentTarget;
                                            target.style.height = 'auto';
                                            target.style.height = `${Math.min(target.scrollHeight, 192)}px`;
                                        }}
                                        style={{ height: '52px' }}
                                    />
                                    <button
                                        onClick={() => handleSend(inputValue)}
                                        disabled={!inputValue.trim() || isThinking}
                                        className="absolute right-2.5 top-3 p-1.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-lg transition-colors"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isContextPopupOpen && (
                        <div className="md:hidden fixed inset-0 z-[60] flex flex-col justify-end">
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setIsContextPopupOpen(false)} />
                            <div className="relative bg-white rounded-t-3xl shadow-2xl p-6 flex flex-col max-h-[70%]">
                                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 shrink-0" />
                                <h3 className="text-lg font-bold text-slate-900 mb-1">Select Context</h3>
                                <p className="text-sm text-slate-500 mb-6">Copilot will answer using data from this class only.</p>
                                <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pb-6 no-scrollbar">
                                    <button
                                        onClick={() => handleContextChange(null)}
                                        className={`w-full text-left px-4 py-4 rounded-2xl flex items-center gap-4 ${!selectedClassId ? 'bg-teal-50 border-2 border-teal-200' : 'bg-slate-50 border-2 border-transparent'}`}
                                    >
                                        <div className={`p-2 rounded-xl ${!selectedClassId ? 'bg-teal-100 text-teal-600' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                            <GraduationCap size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[15px] font-bold text-slate-900">All classes</div>
                                        </div>
                                        {!selectedClassId && <Check size={20} className="text-teal-600" />}
                                    </button>
                                    {classList.map((cls) => {
                                        const classHasInsight = insights.some(i => i.className === cls.name);
                                        return (
                                            <button
                                                key={cls.id}
                                                onClick={() => handleContextChange(cls.id)}
                                                className={`w-full text-left px-4 py-4 rounded-2xl flex items-center gap-4 ${selectedClassId === cls.id ? 'bg-teal-50 border-2 border-teal-200' : 'bg-slate-50 border-2 border-transparent'}`}
                                            >
                                                <div className={`p-2 rounded-xl ${selectedClassId === cls.id ? 'bg-teal-100 text-teal-600' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                                    <BookOpen size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        {classHasInsight && <span className="inline-block w-2 h-2 rounded-full bg-orange-500 shrink-0" />}
                                                        <span className="text-[15px] font-bold text-slate-900">{cls.name}</span>
                                                    </div>
                                                </div>
                                                {selectedClassId === cls.id && <Check size={20} className="text-teal-600" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            <CopilotAuthHint 
                isVisible={showAuthHint} 
                onClose={() => setShowAuthHint(false)} 
                themeColor="#14b8a6"
            />
        </CopilotLayout>
    );
};

export default TeacherCopilotPage;

