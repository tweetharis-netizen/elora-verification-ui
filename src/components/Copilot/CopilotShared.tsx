import React, { useState, useEffect, useRef } from 'react';
import { 
    Sparkles, 
    ChevronUp, 
    ChevronDown, 
    CheckCircle2, 
    ArrowRight, 
    Plus, 
    Send, 
    LayoutDashboard,
    BookOpen,
    Gamepad2,
    Users,
    Settings,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    Layers,
    Check,
    GraduationCap,
    BarChart2,
    FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { EloraLogo } from '../EloraLogo';
import { CopilotFeedbackRow } from './CopilotFeedbackRow';
import { getRoleSidebarTheme, type RoleSidebarTheme, type EloraRole } from '../../lib/roleTheme';

// --- Shared Types ---
export type Step = {
    id: string;
    text: string;
};

export type ActionChip = {
    label: string;
    actionType: 'navigate';
    destination?: string;
};

export type Message = {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    steps?: Step[];
    actions?: ActionChip[];
    intent?: string;
    /** Whether to show the feedback row for this message (~5% chance) */
    showFeedback?: boolean;
};

export const handleFeedback = (feedback: { messageId: string; role: string; value: 'yes' | 'no'; intent?: string }) => {
    console.log('Copilot feedback', feedback);
};

export const getParentGreeting = (childFirstName?: string) => {
    const hour = new Date().getHours();
    const nameStr = childFirstName ? ` ${childFirstName}` : '';
    const nameDisplay = childFirstName ? childFirstName : 'my child';
    const kidsStr = childFirstName ? ` ${childFirstName}'s` : ` my child's`;
    
    // As per specification:
    // If multiple children / no child selected (childFirstName is null/undefined if we want the generic form)
    // Actually Section 3.1 explicitly says:
    // Morning: Good morning. How’s Liam getting on?
    // Afternoon: Good afternoon. Want to check in on Liam?
    // Evening: Good evening. This is a good time to catch up on Liam’s week.
    // Late night: Hi. Anything you want to check on?
    if (!childFirstName) {
        if (hour >= 5 && hour < 12) return 'Good morning. How are the kids getting on?';
        if (hour >= 12 && hour < 17) return 'Good afternoon. Want to check in on the kids?';
        if (hour >= 17 && hour < 21) return 'Good evening. This is a good time to catch up on the kids\' week.';
        return 'Hi. Anything you want to check on?';
    }

    if (hour >= 5 && hour < 12) return `Good morning. How’s ${childFirstName} getting on?`;
    if (hour >= 12 && hour < 17) return `Good afternoon. Want to check in on ${childFirstName}?`;
    if (hour >= 17 && hour < 21) return `Good evening. This is a good time to catch up on ${childFirstName}’s week.`;
    return 'Hi. Anything you want to check on?';
};

export const getPronoun = (gender: 'male' | 'female' | 'non-binary') => {
    switch (gender) {
        case 'male':
            return { pSub: 'he', pObj: 'him', pPos: 'his', pIs: 'is' };
        case 'female':
            return { pSub: 'she', pObj: 'her', pPos: 'her', pIs: 'is' };
        default:
            return { pSub: 'they', pObj: 'them', pPos: 'their', pIs: 'are' };
    }
};


// --- Shared Components ---

/**
 * Main Layout for both Teacher and Student Copilot
 */
export const CopilotLayout: React.FC<{
    sidebar: React.ReactNode;
    children: React.ReactNode;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    isDemo: boolean;
    role: 'Teacher' | 'Student' | 'Parent';
    themeColor?: string;
    logout: () => void;
    navigate: (path: string) => void;
    demoBanner?: React.ReactNode;
    demoRoleSwitcher?: React.ReactNode;
}> = ({ 
    sidebar, 
    children, 
    isSidebarOpen, 
    setIsSidebarOpen, 
    isDemo,
    role,
    themeColor = '#14b8a6', // default teal
    logout,
    navigate,
    demoBanner,
    demoRoleSwitcher
}) => {
    const roleKey = role.toLowerCase() as EloraRole;
    const sidebarTheme = getRoleSidebarTheme(roleKey);
    // NavItem component inside CopilotLayout (mostly for sidebar)
    const NavItem = ({ icon, label, active = false, onClick, collapsed }: { icon: any, label: string, active?: boolean, onClick?: () => void, collapsed: boolean }) => {
        const activeClasses = `${sidebarTheme.navActiveBg} ${sidebarTheme.navActiveText}`;
        const inactiveClasses = `${sidebarTheme.navInactiveText} ${sidebarTheme.navHoverBg} ${sidebarTheme.navHoverText}`;
        return (
            <a
                onClick={(e) => { e.preventDefault(); onClick?.(); }}
                href="#"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative ${active ? activeClasses : inactiveClasses} ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? label : undefined}
            >
                <div className="flex items-center justify-center">
                    {icon}
                </div>
                {!collapsed && <span className="whitespace-nowrap">{label}</span>}
                {active && !collapsed && (
                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white" />
                )}
            </a>
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#FDFBF5] font-sans text-slate-900 overflow-hidden">
            {isDemo && (
                <>
                    {demoBanner}
                    {demoRoleSwitcher}
                </>
            )}

            <div className="flex flex-1 overflow-hidden relative">
                {/* --- Sidebar --- */}
                <aside
                    className={`flex flex-col h-screen sticky top-0 shrink-0 shadow-xl z-20 transition-[width] duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'} ${sidebarTheme.asideBg} ${sidebarTheme.text}`}
                >
                    <div className={`h-20 flex items-center border-b ${sidebarTheme.headerBorder} px-6 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
                        <Link to="/" className="flex items-center text-white/90 hover:text-white transition-colors overflow-hidden">
                            <EloraLogo className="w-8 h-8 text-current" withWordmark={isSidebarOpen} />
                        </Link>
                        {isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="text-white/50 hover:text-white transition-colors"
                            >
                                <PanelLeftClose size={20} />
                            </button>
                        )}
                    </div>

                    <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
                        <NavItem
                            icon={<LayoutDashboard size={20} />}
                            label={role === 'Teacher' ? "Dashboard" : "Overview"}
                            onClick={() => navigate(isDemo ? (role === 'Teacher' ? '/teacher/demo' : '/student/demo') : (role === 'Teacher' ? '/dashboard/teacher' : '/dashboard/student'))}
                            collapsed={!isSidebarOpen}
                        />
                        <NavItem
                            icon={<BookOpen size={20} />}
                            label={role === 'Teacher' ? "Classes" : "My Classes"}
                            onClick={() => navigate(isDemo ? (role === 'Teacher' ? '/teacher/demo' : '/student/demo') : (role === 'Teacher' ? '/dashboard/teacher' : '/dashboard/student'))}
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
                            label={role === 'Teacher' ? "Practice & quizzes" : "Practice & Quizzes"}
                            onClick={() => navigate(isDemo ? (role === 'Teacher' ? '/teacher/demo' : '/student/demo') : (role === 'Teacher' ? '/dashboard/teacher' : '/dashboard/student'))}
                            collapsed={!isSidebarOpen}
                        />
                        {role === 'Student' && (
                            <>
                                <NavItem icon={<FileText size={20} />} label="Assignments & Quizzes" collapsed={!isSidebarOpen} />
                                <NavItem icon={<BarChart2 size={20} />} label="Reports" collapsed={!isSidebarOpen} />
                            </>
                        )}
                        {role === 'Parent' && (
                            <>
                                <NavItem icon={<Users size={20} />} label="My Children" collapsed={!isSidebarOpen} />
                                <NavItem icon={<BarChart2 size={20} />} label="Progress" collapsed={!isSidebarOpen} />
                            </>
                        )}
                        {role === 'Teacher' && <NavItem icon={<Users size={20} />} label="Students" collapsed={!isSidebarOpen} />}
                    </nav>

                    <div className={`p-4 border-t ${sidebarTheme.footerBorder} space-y-1.5`}>
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="flex items-center justify-center w-full p-2.5 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors mb-2"
                            >
                                <PanelLeftOpen size={20} />
                            </button>
                        )}
                        <NavItem icon={<Settings size={20} />} label="Settings" collapsed={!isSidebarOpen} />
                        <button
                            onClick={logout}
                            className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors ${!isSidebarOpen ? 'justify-center' : ''}`}
                            title={!isSidebarOpen ? "Sign out" : undefined}
                        >
                            <LogOut size={20} className="shrink-0" />
                            {isSidebarOpen && <span className="whitespace-nowrap">Sign out</span>}
                        </button>
                    </div>
                </aside>

                {/* --- Main Content Area --- */}
                <div className="flex-1 flex flex-col md:flex-row h-screen overflow-hidden">
                    {/* Left Column (Context Sidebar) */}
                    <div className="hidden md:flex w-72 bg-white border-r border-[#EAE7DD] flex-col shrink-0 overflow-hidden">
                        {sidebar}
                    </div>

                    {/* Right Column (Chat Area) */}
                    <div className="flex-1 flex flex-col bg-[#FDFBF5] relative min-w-0">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Mobile Header with Copilot branding
 */
export const CopilotMobileHeader: React.FC<{ 
    themeColor?: string 
}> = ({ 
    themeColor = '#14b8a6' 
}) => (
    <div className="md:hidden p-4 bg-white border-b border-[#EAE7DD] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: themeColor + '15', color: themeColor }}>
                <Sparkles size={18} />
            </div>
            <h2 className="font-bold text-slate-900">Elora Copilot</h2>
        </div>
        <div className="text-[10px] font-bold px-2 py-1 rounded-full border" style={{ color: themeColor, backgroundColor: themeColor + '05', borderColor: themeColor + '15' }}>
            LIVE DATA
        </div>
    </div>
);

/**
 * Thinking Strip component
 */
export const ThinkingStrip: React.FC<{ 
    steps: Step[], 
    defaultExpanded?: boolean, 
    themeColor?: string,
    headerText?: string
}> = ({ 
    steps, 
    defaultExpanded, 
    themeColor = '#14b8a6',
    headerText = 'How I figured this out'
}) => {
    const [expanded, setExpanded] = useState(defaultExpanded ?? (window.innerWidth >= 768));

    return (
        <div className="mb-2 w-full">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors bg-white/50 px-2.5 py-1 rounded-md mb-1 border border-slate-200"
            >
                <Sparkles size={12} style={{ color: themeColor }} />
                <span>{headerText} &middot; {steps.length} steps {!expanded && '↓'}</span>
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {expanded && (
                <div className="pl-2 border-l-2 space-y-2 mb-2 ml-1" style={{ borderColor: themeColor + '40' }}>
                    {steps.map((step) => (
                        <div key={step.id} className="flex items-start gap-2 text-[13px] text-slate-600">
                            <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: themeColor }} />
                            <span>{step.text}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * A message bubble in the chat
 */
export const CopilotMessageBubble: React.FC<{ 
    message: Message, 
    themeColor?: string, 
    onActionClick?: (action: ActionChip) => void,
    shouldAutoExpandSteps?: boolean,
    thinkingStripHeader?: string,
    copilotRole?: 'teacher' | 'student' | 'parent',
    /** Pre-computed flag: show feedback row for this message (call shouldShowFeedback() once at render site) */
    showFeedback?: boolean
}> = ({ 
    message, 
    themeColor = '#14b8a6', 
    onActionClick, 
    shouldAutoExpandSteps = false,
    thinkingStripHeader,
    copilotRole,
    showFeedback = false
}) => {
    if (message.role === 'system') {
        return (
            <div className="flex justify-center my-4">
                <div className="text-[12px] font-bold text-slate-400 flex items-center gap-2 text-center">
                    <span className="h-[1px] w-8 bg-slate-200" />
                    {message.content}
                    <span className="h-[1px] w-8 bg-slate-200" />
                </div>
            </div>
        );
    }

    return (
        <div className={`flex w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] md:max-w-2xl flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                {message.role === 'assistant' && message.steps && message.steps.length > 0 && (
                    <ThinkingStrip steps={message.steps} defaultExpanded={shouldAutoExpandSteps} themeColor={themeColor} headerText={thinkingStripHeader} />
                )}

                <div
                    className={`px-5 py-4 rounded-2xl text-[14px] md:text-[15px] shadow-sm ${message.role === 'user'
                            ? 'text-white rounded-br-sm'
                            : 'bg-white border border-[#EAE7DD] text-slate-800 rounded-tl-sm'
                        }`}
                    style={message.role === 'user' ? { backgroundColor: themeColor } : {}}
                >
                    <div className="whitespace-pre-wrap leading-relaxed">
                        {message.content.split('**').map((part, i) => (
                            i % 2 === 1 ? <strong key={part + i}>{part}</strong> : part
                        ))}
                    </div>
                </div>

                {/* Feedback row — only shown for ~1-in-20 assistant messages */}
                {message.role === 'assistant' && copilotRole && showFeedback && (
                    <CopilotFeedbackRow 
                        messageId={message.id}
                        role={copilotRole}
                        intent={message.intent}
                        onFeedback={handleFeedback}
                    />
                )}

                {message.actions && message.actions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {message.actions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => onActionClick?.(action)}
                                className="text-[12px] md:text-[13px] font-medium border px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 shadow-sm"
                                style={{
                                    color: themeColor,
                                    backgroundColor: themeColor + '0d',
                                    borderColor: themeColor + '33'
                                }}
                            >
                                {action.label}
                                <ArrowRight size={14} />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Returns true with ~5% probability (≈1-in-20).
 * Call this once when creating/rendering a message, then store the result
 * so it does not change on re-renders.
 */
export const shouldShowFeedback = (): boolean => Math.random() < 0.05;

/**
 * Empty State for a clean chat interface
 */
export const CopilotEmptyState: React.FC<{
    themeColor?: string;
    title?: string;
    description: string;
    prompts: string[];
    handleSend: (p: string) => void;
    userName?: string;
    customGreeting?: string;
}> = ({ 
    themeColor = '#14b8a6', 
    title, 
    description,
    prompts,
    handleSend,
    userName,
    customGreeting
}) => {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'Good morning';
        if (hour >= 12 && hour < 17) return 'Good afternoon';
        if (hour >= 17 && hour < 21) return 'Good evening';
        return 'Hi';
    };

    const getGreetingName = (name?: string) => {
        if (!name || name === 'Teacher' || name === 'Parent') return null;
        
        const parts = name.trim().split(/\s+/);
        if (parts.length === 0) return null;

        const titles = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.', 'Mdm.', 'Mr', 'Ms', 'Mrs', 'Dr'];
        
        // If it's just a title by itself, ignore it
        if (parts.length === 1 && titles.some(t => parts[0].toLowerCase() === t.toLowerCase())) {
            return null;
        }

        // Return full name for "Ms. Tan" instead of dropping the title
        if (parts.length >= 2 && titles.some(t => parts[0].toLowerCase() === t.toLowerCase())) {
            return name.trim();
        }
        
        // Otherwise use the first word (existing behavior)
        return parts[0];
    };

    const greeting = getGreeting();
    const gName = getGreetingName(userName);
    const finalTitle = title || (gName ? `${greeting}, ${gName}.` : `${greeting}.`);

    const scrollRef = useRef<HTMLDivElement>(null);
    const [showOverlay, setShowOverlay] = useState(false);

    useEffect(() => {
        const checkScroll = () => {
            if (scrollRef.current) {
                const { scrollWidth, clientWidth } = scrollRef.current;
                setShowOverlay(scrollWidth > clientWidth);
            }
        };

        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [prompts]);

    return (
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto text-center px-4 py-12">
            <div className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform`} style={{ backgroundColor: themeColor }}>
                <Sparkles className="text-white w-8 h-8" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                {customGreeting ? customGreeting : finalTitle}
            </h2>
            <p className="text-slate-500 text-sm md:text-base mb-10 leading-relaxed font-medium">
                {description}
            </p>
            <div className="relative w-full mt-6">
                <div 
                    ref={scrollRef}
                    className="flex flex-row gap-2 w-full overflow-x-auto no-scrollbar"
                >
                    {prompts.map((prompt, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSend(prompt)}
                            className="w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors flex items-center justify-between gap-2 shadow-sm"
                            style={{
                                backgroundColor: themeColor + '05',
                                borderColor: themeColor + '1a',
                                color: themeColor
                            }}
                        >
                            <span className="text-slate-800">{prompt}</span>
                            <ArrowRight size={14} className="shrink-0 opacity-60" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
