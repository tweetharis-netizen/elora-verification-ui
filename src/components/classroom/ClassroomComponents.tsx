import React, { useState, KeyboardEvent } from 'react';
import { Settings, Plus, User, ClipboardList, Paperclip, Link2, Sparkles, MessageSquare, ChevronDown, ChevronUp, AlertCircle, Video, MoreHorizontal, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    CLASS_THEME_COLORS,
    inferClassTheme,
    resolveClassTheme,
    getClassThemeVariants,
    resolveClassThemeSettings,
    getSubjectThemeDefaults,
    applySubjectThemeDefaults,
} from '../../lib/classTheme';

export {
    CLASS_THEME_COLORS,
    inferClassTheme,
    resolveClassTheme,
    getClassThemeVariants,
    resolveClassThemeSettings,
    getSubjectThemeDefaults,
    applySubjectThemeDefaults,
};

function hasUrgentStatus(status: string | undefined): boolean {
    if (!status) return false;
    const lower = status.toLowerCase();
    return lower.includes('overdue') || lower.includes('missing') || lower.includes('needs grading') || lower.includes('attention');
}

function resolveClassroomTheme({
    currentClass,
    theme,
    themeColor,
    bannerStyle,
    playfulBackground,
    subject,
    role,
}: any) {
    const inferred = inferClassTheme({
        id: currentClass?.id || theme?.id || 'classroom',
        name: currentClass?.name || theme?.name || 'Classroom',
        subject: subject ?? theme?.subject ?? currentClass?.subject,
        themeColor: theme?.themeColor ?? themeColor ?? currentClass?.themeColor,
        bannerStyle: theme?.bannerStyle ?? bannerStyle ?? currentClass?.bannerStyle,
        playfulBackground: typeof theme?.playfulBackground === 'boolean'
            ? theme.playfulBackground
            : typeof playfulBackground === 'boolean'
                ? playfulBackground
                : currentClass?.playfulBackground,
    });
    inferred.themeColor = 'teal';
    
    return inferred;
}

export function ClassroomHeader({
    currentClass,
    classroomTitle,
    role = 'teacher',
    sublines,
    onOpenSettings,
    onPrimaryAction,
    primaryActionLabel,
    primaryActionIcon,
    classCodeLabel,
    theme,
    themeColor,
    themeAccent,
    bannerStyle,
    playfulBackground,
    subject,
    leftUtilityBadge,
    rightUtilityBadge,
}: any) {
    const resolvedTheme = resolveClassroomTheme({
        currentClass,
        theme,
        themeColor: themeColor ?? themeAccent,
        bannerStyle,
        playfulBackground,
        subject,
        role,
    });
    const themeStyles = resolveClassTheme(resolvedTheme.themeColor);
    const isPlayful = resolvedTheme.playfulBackground;
    const finalBannerStyle = resolvedTheme.bannerStyle;

    const displaySublines = (sublines || [
        currentClass?.studentsCount && `${currentClass.studentsCount} Students`,
    ].filter(Boolean)).filter(Boolean);
    const subjectChipLabel = [currentClass?.subject, currentClass?.section].filter(Boolean).join(' · ');

    return (
        <div className={`relative overflow-hidden rounded-t-2xl bg-gradient-to-br ${themeStyles.banner} px-6 py-5 sm:px-8 sm:py-6 min-h-[140px] sm:min-h-[150px] lg:min-h-[160px] flex flex-col justify-end`}>
            {/* Playful background shapes */}
            {isPlayful && (
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
                    <div className={`absolute top-10 left-10 w-32 h-32 rounded-full blur-xl bg-white`} />
                    <div className={`absolute bottom-10 right-20 w-48 h-48 rounded-[3rem] rotate-45 blur-xl bg-white`} />
                </div>
            )}

            {/* Banner style illustration (simple representations for now) */}
            {finalBannerStyle !== 'default' && (
                <div className="absolute inset-0 z-0 opacity-10 flex items-center justify-center pointer-events-none">
                    {finalBannerStyle === 'math' && <div className="text-9xl font-serif tracking-widest leading-none select-none">∑ ∫ π</div>}
                    {finalBannerStyle === 'science' && <div className="text-9xl font-mono tracking-widest leading-none select-none">H₂O</div>}
                    {finalBannerStyle === 'language' && <div className="text-9xl font-serif tracking-widest italic select-none">"Aa"</div>}
                    {finalBannerStyle === 'arts' && <div className="text-9xl select-none">🎨</div>}
                </div>
            )}

            {/* Dark gradient overlay for contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-0 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 via-black/10 to-transparent z-[1] pointer-events-none" />

            <div className="relative z-10 flex h-full w-full flex-col justify-between gap-4 text-white">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 max-w-3xl">
                        <div className="text-[11px] font-medium uppercase tracking-widest text-white/75">Command Center</div>
                        {subjectChipLabel && (
                            <div className="mt-2">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${themeStyles.headerSubjectBg} ${themeStyles.headerSubjectBorder} ${themeStyles.headerSubjectText}`}>
                                    {subjectChipLabel}
                                </span>
                            </div>
                        )}
                    </div>

                    {(onPrimaryAction || onOpenSettings) && (
                        <div className="shrink-0">
                            <button
                                onClick={onPrimaryAction || onOpenSettings}
                                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
                            >
                                {primaryActionIcon}
                                {primaryActionLabel || 'Class Settings'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    <div className="min-w-0 max-w-3xl">
                        <h2 className="truncate text-3xl lg:text-4xl font-semibold tracking-tight leading-tight drop-shadow-md">
                            {classroomTitle}
                        </h2>
                        {displaySublines.length > 0 && (
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] font-medium text-white/90 drop-shadow">
                                {displaySublines.map((text: string, idx: number, arr: string[]) => (
                                    <React.Fragment key={idx}>
                                        <span>{text}</span>
                                        {idx < arr.length - 1 && <span className="font-normal text-white/50">·</span>}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            {leftUtilityBadge && (
                                <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-white/90 backdrop-blur-md">
                                    {leftUtilityBadge}
                                </span>
                            )}
                            {rightUtilityBadge && (
                                <span className={`inline-flex items-center rounded-full border ${themeStyles.headerCodeBorder} bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-white/90 backdrop-blur-md`}>
                                    {rightUtilityBadge}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {currentClass?.joinCode && (
                                <span className={`inline-flex items-center rounded-full border ${themeStyles.headerCodeBorder} bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-white/90 backdrop-blur-md`}>
                                    Class Code: {currentClass.joinCode}
                                </span>
                            )}
                            {currentClass?.studentsCount && (
                                <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-white/90 backdrop-blur-md">
                                    {currentClass.studentsCount} Students
                                </span>
                            )}
                            {role === 'teacher' && onOpenSettings && (
                                <button
                                    onClick={onOpenSettings}
                                    className="bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md p-2.5 rounded-xl border border-white/20 shadow-lg text-white"
                                    aria-label="Class settings"
                                >
                                    <Settings size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {!isPlayful && (
                <div className="absolute bottom-0 right-0 w-80 h-80 -mb-24 -mr-24 rounded-full blur-3xl opacity-30 bg-white pointer-events-none" />
            )}
        </div>
    );
}

export function ClassroomTabs({ activeTab, onTabChange, tabs, themeColor, themeAccent, theme, subject, currentClass, role = 'teacher', className = '' }: any) {
    const resolvedTheme = resolveClassroomTheme({
        currentClass,
        theme,
        themeColor: themeColor ?? themeAccent,
        subject,
        role,
    });
    const activeColor = '#0D9488';
    const displayTabs = tabs || [
        { id: 'stream', label: 'Stream' },
        { id: 'classwork', label: 'Classwork' },
        { id: 'people', label: 'People' },
        { id: 'grades', label: 'Grades' },
    ];

    return (
        <div className={`relative flex items-end gap-1 overflow-x-auto no-scrollbar border-b border-[#EAE7DD] bg-transparent ${className}`.trim()}>
            {displayTabs.map((tab: any) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`group relative px-4 py-3 pb-3 text-[15px] font-semibold transition-colors duration-200 outline-none ${isActive ? '' : 'text-slate-500 hover:text-slate-700'}`}
                        style={isActive ? { color: activeColor } : undefined}
                    >
                        {tab.label}
                        <div
                            className={`absolute left-0 right-0 bottom-0 h-[3px] rounded-full transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`}
                            style={{ backgroundColor: activeColor }}
                        />
                    </button>
                );
            })}
        </div>
    );
}

export function StreamLayout({ isComposerOpen, setIsComposerOpen, isComposerAIMode, setIsComposerAIMode, composerText, setComposerText, teacherAnnouncements, setTeacherAnnouncements, displayName, classroomStreamItems, onNavigateToWork, role = 'teacher', themeColor, themeAccent, theme, subject, currentClass }: any) {
    const resolvedTheme = resolveClassroomTheme({
        currentClass,
        theme,
        themeColor: themeColor ?? themeAccent,
        subject,
        role,
    });
    const themeStyles = resolveClassTheme(resolvedTheme.themeColor);
    const iconShellClass = 'bg-teal-500/10 text-teal-600';

    return (
        <div className="flex flex-col gap-6">
            {role !== 'student' && (
                <div className="rounded-xl border border-[#EAE7DD] bg-white shadow-sm overflow-hidden transition-all duration-200">
                    {!isComposerOpen ? (
                        <button
                            onClick={() => setIsComposerOpen(true)}
                            className="w-full text-left px-5 py-4 text-slate-500 hover:bg-slate-50 transition-colors flex items-center gap-3"
                        >
                            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0 text-teal-600">
                                <User size={16} />
                            </div>
                            <span className="text-sm font-medium">Share an update with your class...</span>
                        </button>
                    ) : (
                        <div className={`flex flex-col border ${themeStyles.chipBorder} ${isComposerAIMode ? themeStyles.chipBg : 'bg-white'}`}>
                            <div className="px-5 py-4">
                                <textarea
                                    autoFocus
                                    rows={isComposerAIMode ? 1 : 3}
                                    placeholder={isComposerAIMode ? "What should this announcement be about?" : "Share with your class..."}
                                    value={composerText}
                                    onChange={(e) => setComposerText(e.target.value)}
                                    className="w-full bg-transparent border-none resize-none focus:ring-0 focus:outline-none p-0 text-sm text-slate-900 placeholder-slate-400"
                                />
                            </div>
                            <div className={`border-t ${themeStyles.chipBorder} px-4 py-3 flex items-center justify-between bg-slate-50/50`}>
                                <div className="flex items-center gap-2">
                                    <button title="Attach file" className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                                        <Paperclip size={18} />
                                    </button>
                                    <div className="w-px h-5 bg-slate-200 mx-1"></div>
                                    <button
                                        onClick={() => {
                                            setIsComposerAIMode(!isComposerAIMode);
                                            if (!isComposerAIMode && !composerText) {
                                                setComposerText("Remind students about the upcoming math quiz and provide some study tips.");
                                            }
                                        }}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                            isComposerAIMode
                                                ? `${themeStyles.chipBg} ${themeStyles.chipText}`
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        <Sparkles size={14} />
                                        Draft with Elora
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setIsComposerOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                                        Cancel
                                    </button>
                                    <button
                                        disabled={!composerText.trim()}
                                        onClick={() => {
                                            if (composerText.trim()) {
                                                setTeacherAnnouncements([{
                                                    id: Date.now().toString(),
                                                    text: composerText,
                                                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                                    author: displayName || 'Teacher'
                                                }, ...teacherAnnouncements]);
                                                setIsComposerOpen(false);
                                                setComposerText("");
                                                setIsComposerAIMode(false);
                                            }
                                        }}
                                        className={`px-5 py-2 ${themeStyles.solidBg} ${themeStyles.solidHoverBg} disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-sm transition-colors`}
                                    >
                                        Post
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {role === 'student' && (
                <div className={`${themeStyles.chipBg} border ${themeStyles.chipBorder} rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]`}>
                    <h3 className={`font-semibold text-lg mb-2 ${themeStyles.chipText}`}>What's new in this class</h3>
                    <p className={`text-sm ${themeStyles.chipText}`}>
                        You have {classroomStreamItems.filter((i: any) => hasUrgentStatus(i.badgeLabel)).length} urgent items pending in this class.
                    </p>
                </div>
            )}

            <div className="space-y-4">
                {role !== 'student' && (
                    <div className={`rounded-xl border ${themeStyles.chipBorder} ${themeStyles.chipBg} px-4 py-3`}>
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full bg-white border ${themeStyles.chipBorder} ${themeStyles.streamIconText}`}>
                                <Sparkles size={14} />
                            </span>
                            <p className={`text-sm font-semibold ${themeStyles.chipText}`}>
                                Elora will soon surface insights like “3 students are falling behind on Algebra”.
                            </p>
                        </div>
                    </div>
                )}

                {teacherAnnouncements.length === 0 && classroomStreamItems.length === 0 ? (
                    <div className="bg-[#FDFBF5] border border-dashed border-[#EAE7DD] rounded-xl px-4 py-8 text-center">
                        <p className="text-sm text-slate-600 font-medium">No recent activity yet for this class.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {teacherAnnouncements.map((announcement: any) => (
                                <div key={announcement.id} className="bg-white border border-[#EAEAEA] rounded-xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-slate-300 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconShellClass}`}>
                                            <User size={20} className={themeStyles.streamIconText} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-[15px] text-slate-900">{announcement.author}</div>
                                            <div className="text-xs font-medium text-slate-500">{announcement.timestamp}</div>
                                            <span className={`mt-1 inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${themeStyles.streamLabelBg} ${themeStyles.streamLabelText}`}>
                                                Teacher announcement
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 text-slate-800 text-[15px] leading-relaxed whitespace-pre-wrap">
                                    {announcement.text}
                                </div>
                            </div>
                        ))}
                        
                        {classroomStreamItems.map((item: any) => {
                            const statusToken = item.badgeLabel || item.severity || item.type;
                            const isUrgent = hasUrgentStatus(statusToken);
                            const EventIcon = isUrgent ? AlertCircle : ClipboardList;
                            const borderLeft = isUrgent ? 'border-l-[#9F1239]' : themeStyles.topicBorder;
                            const itemTitle = item.title || item.message;
                            const itemBody = item.message || item.detail || '';
                            const itemMeta = item.meta || item.timestamp || item.statusLabel || statusToken;

                            return (
                                <div key={item.id} className={`bg-white border border-[#EAEAEA] border-l-4 rounded-xl px-4 py-3 flex items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${borderLeft}`}>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconShellClass}`}>
                                        <EventIcon size={16} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-sm font-semibold text-slate-900 leading-snug">{itemTitle}</h4>
                                        {itemBody && <div className="text-sm text-slate-600 mt-1">{itemBody}</div>}
                                        <div className="text-xs text-slate-500 mt-0.5">{itemMeta}</div>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-2">
                                        <button onClick={onNavigateToWork} className="px-3 py-1.5 bg-white border border-[#EAE7DD] rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                                            View
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export function ClassworkTab({ classroomTopicGroups, onNavigateToWork, role = 'teacher', themeColor, themeAccent, theme, subject, currentClass }: any) {
    const resolvedTheme = resolveClassroomTheme({
        currentClass,
        theme,
        themeColor: themeColor ?? themeAccent,
        subject,
        role,
    });
    const themeStyles = resolveClassTheme(resolvedTheme.themeColor);
    const iconShellClass = 'bg-teal-500/10 text-teal-600';

    return (
        <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Classwork</h3>
                    <p className="text-sm text-slate-500 mt-1">Organized by topic.</p>
                </div>
                {role !== 'student' && (
                    <button onClick={onNavigateToWork} className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border ${themeStyles.outlineBorder} ${themeStyles.outlineHoverBg} ${themeStyles.outlineText} rounded-lg text-xs font-semibold transition-colors`}>
                        <Plus size={14} /> Create
                    </button>
                )}
            </div>

            {classroomTopicGroups.length === 0 ? (
                <div className="mt-5 bg-[#FDFBF5] border border-dashed border-[#EAE7DD] rounded-xl p-6">
                    <p className="text-sm text-slate-600 font-medium">No classwork yet for this class.</p>
                </div>
            ) : (
                <div className="mt-6 space-y-7">
                    {classroomTopicGroups.map((group: any) => (
                        <section key={group.topicId}>
                            <div className={`flex items-baseline gap-2 border-l-4 ${themeStyles.topicBorder} pl-3`}>
                                <h4 className="text-base font-semibold text-slate-900 tracking-tight">{group.topicName}</h4>
                                <span className="text-xs font-medium text-slate-500">· {group.items.length} items</span>
                            </div>
                            <div className="mt-3 grid grid-cols-1 gap-3">
                                {group.items.map((item: any) => {
                                    const isUrgent = hasUrgentStatus(item.status);
                                    return (
                                        <div key={item.id} className={`bg-white border border-[#EAEAEA] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 flex flex-wrap items-start justify-between gap-3 ${isUrgent ? 'border-l-4 border-l-[#9F1239]' : ''}`}>
                                            <div className="min-w-0 flex items-start gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconShellClass}`}>
                                                    <ClipboardList size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">{item.type}</p>
                                                    <h5 className="mt-1 text-sm sm:text-[15px] font-semibold text-slate-900 truncate">{item.title}</h5>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                                <div className={`text-xs ${isUrgent ? 'font-semibold text-[#9F1239]' : 'text-slate-500'}`}>{item.dueDateRaw ? `Due ${item.dueLabel}` : 'No due date'}</div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${themeStyles.chipBg} ${themeStyles.chipText} ${themeStyles.chipBorder}`}>
                                                        {item.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}

function getStatusGroup(status: string | undefined) {
    const value = String(status || '').toLowerCase();
    if (value.includes('overdue')) return 'Overdue';
    if (value.includes('due_soon') || value.includes('due soon')) return 'Due Soon';
    if (value.includes('completed')) return 'Completed';
    return 'Upcoming';
}

function StatusPill({ status }: { status: string }) {
    const value = String(status).toLowerCase();
    const className = value.includes('overdue')
        ? 'bg-rose-50 text-rose-700 border-rose-200'
        : value.includes('due_soon') || value.includes('due soon')
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : value.includes('completed')
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-sky-50 text-sky-700 border-sky-200';

    return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${className}`}>{status}</span>;
}

export function AssignmentsPracticeTab({
    assignments = [],
    practices = [],
    role = 'student',
}: {
    assignments: any[];
    practices: any[];
    role?: 'student' | 'teacher';
}) {
    const workItems = [
        ...assignments.map((item) => ({ ...item, itemType: 'Assignment' })),
        ...practices.map((item) => ({ ...item, itemType: 'Practice' })),
    ];

    const grouped = workItems.reduce((acc: Record<string, any[]>, item) => {
        const status = role === 'student' ? (item.studentStatus || item.status) : item.status;
        const group = getStatusGroup(status);
        if (!acc[group]) acc[group] = [];
        acc[group].push(item);
        return acc;
    }, {});

    const sectionOrder = ['Overdue', 'Due Soon', 'Upcoming', 'Completed'];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Assignments & Practice</h3>
                    <p className="text-sm text-slate-500 mt-1">Unified view of classwork and practice sets.</p>
                </div>
            </div>

            {sectionOrder.map((section) => {
                const items = grouped[section] || [];
                if (items.length === 0) return null;

                return (
                    <section key={section} className="space-y-3">
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-600">{section}</h4>
                            <span className="text-xs text-slate-500">{items.length}</span>
                        </div>

                        <div className="space-y-3">
                            {items.map((item) => {
                                const status = role === 'student' ? (item.studentStatus || item.status) : item.status;
                                const dueLabel = item.dueDate
                                    ? new Date(item.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                    : 'No due date';

                                return (
                                    <article key={item.id} className="rounded-xl border border-[#EAEAEA] bg-white px-4 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{item.itemType}</p>
                                                <h5 className="mt-1 text-sm font-semibold text-slate-900 truncate">{item.title}</h5>
                                                <p className="mt-1 text-xs text-slate-500">{item.topic}</p>
                                            </div>
                                            <StatusPill status={status} />
                                        </div>

                                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                                            <div className="flex items-center gap-1.5"><Clock size={13} /> Due {dueLabel}</div>
                                            {role === 'teacher' ? (
                                                <>
                                                    <div className="font-medium">Submitted {item.submittedCount}/{item.totalCount}</div>
                                                    <div className="font-medium">Avg score {item.averageScore ?? '--'}%</div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="font-medium">Your score {item.studentScore ?? '--'}%</div>
                                                    <div className="font-medium">{item.questionCount ? `${item.questionCount} questions` : item.statusLabel}</div>
                                                </>
                                            )}
                                        </div>

                                        {item.needsAttention && (
                                            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                                                <AlertCircle size={12} /> Needs attention
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                );
            })}

            {workItems.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#EAE7DD] bg-[#FDFBF5] p-6 text-center">
                    <p className="text-sm font-medium text-slate-700">No assignments or practice items yet.</p>
                </div>
            )}
        </div>
    );
}

export function PeopleTab({ currentClass, role = 'teacher', themeColor, themeAccent, theme, subject }: any) {
    const resolvedTheme = resolveClassroomTheme({
        currentClass,
        theme,
        themeColor: themeColor ?? themeAccent,
        subject,
        role,
    });
    const themeStyles = resolveClassTheme(resolvedTheme.themeColor);
    const students = currentClass?.students || mockStudents; // Fallback to mock data if empty
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 tracking-tight">People</h3>
                <span className="text-sm font-medium text-slate-500">{students?.length || 0} students</span>
            </div>
            
            <div className="bg-white border border-[#EAE7DD] rounded-2xl overflow-hidden shadow-sm">
                <div className="border-b border-[#EAE7DD] bg-slate-50 px-5 py-3">
                    <h4 className="text-sm font-semibold text-slate-700">Teachers</h4>
                </div>
                <div className="px-5 py-4">
                    <div className="flex items-center gap-3 w-full">
                        {role !== 'student' ? (
                            <>
                                <div className={`w-10 h-10 rounded-full ${themeStyles.chipBg} border ${themeStyles.chipBorder} flex items-center justify-center shrink-0`}>
                                    <span className={`font-semibold ${themeStyles.chipText}`}>ME</span>
                                </div>
                                <span className="font-semibold text-slate-900">Mr. T. Explorer</span>
                            </>
                        ) : (
                            <>
                                <div className={`w-10 h-10 rounded-full ${themeStyles.chipBg} border ${themeStyles.chipBorder} flex items-center justify-center shrink-0`}>
                                    <User className={`${themeStyles.chipText} w-5 h-5`} />
                                </div>
                                <span className="font-semibold text-slate-900">Mr. T. Explorer</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6 bg-white border border-[#EAE7DD] rounded-2xl overflow-hidden shadow-sm">
                <div className="border-b border-[#EAE7DD] bg-slate-50 px-5 py-3 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-700">Classmates</h4>
                </div>
                <div className="divide-y divide-[#EAE7DD]">
                    {students?.map((student: any) => (
                        <div key={student.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0"></div>
                                <span className="font-medium text-slate-800">{student.name} {role === 'student' && student.id === 'demo-student-jordan' && "(You)"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px]">
                                {student.participationLevel && (
                                    <span className={`inline-flex rounded-full border px-2 py-0.5 font-semibold ${
                                        student.participationLevel === 'high'
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                            : student.participationLevel === 'medium'
                                                ? 'border-amber-200 bg-amber-50 text-amber-700'
                                                : 'border-slate-200 bg-slate-100 text-slate-700'
                                    }`}>
                                        {student.participationLevel} participation
                                    </span>
                                )}
                                {student.riskFlag && (
                                    <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 font-semibold text-rose-700">
                                        at risk
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function GradesTab({ currentClass, role = 'teacher', themeColor, subject }: any) {
    const themeStyles = getClassThemeVariants({
        subject: subject ?? currentClass?.subject,
        themeColor: themeColor ?? currentClass?.themeColor ?? 'teal',
    });
    const students = currentClass?.students || mockStudents;
    const assignments = [
        { id: 'a1', title: 'Fractions Quiz', score: '85%', status: 'Graded' },
        { id: 'a2', title: 'Algebra Homework', score: 'Pending', status: 'Submitted' },
        { id: 'a3', title: 'Geometry Intro', score: '--', status: 'Missing' }
    ];
    
    if (role === 'student') {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-baseline gap-3">
                    <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Your Grades</h3>
                    <span className="text-sm font-medium text-slate-500">Overall: 85%</span>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        {assignments.map(a => (
                            <div key={a.id} className="flex flex-wrap items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex flex-col gap-1">
                                    <span className="font-semibold text-slate-800">{a.title}</span>
                                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit ${
                                        a.status === 'Missing' ? 'bg-rose-50 text-[#9F1239]' :
                                        a.status === 'Submitted' ? 'bg-blue-50 text-blue-700' :
                                        'bg-slate-100 text-slate-700'
                                    }`}>
                                        {a.status}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-semibold text-slate-900 tabular-nums">{a.score}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Grades</h3>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr className={`border-b ${themeStyles.gradesBorder} bg-slate-50/50`}>
                            <th className="py-4 px-5 text-sm font-semibold text-slate-700">Student</th>
                            {assignments.map(a => (
                                <th key={a.id} className="py-4 px-5 text-sm font-semibold text-slate-700">{a.title}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {students?.map((s: any) => (
                            <tr key={s.id} className="hover:bg-slate-50">
                                <td className="py-3 px-5 font-semibold text-slate-800">{s.name}</td>
                                {assignments.map(a => (
                                    <td key={a.id} className="py-3 px-5 text-sm">--</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const mockStudents = [
    { id: 'demo-student-jordan', name: 'Jordan Lee', score: '58%', needsAttention: true },
    { id: 'demo-student-priya', name: 'Priya Nair', score: '62%', needsAttention: true },
    { id: 'demo-student-alex', name: 'Alex Chen', score: '70%', needsAttention: false },
    { id: 'demo-student-alice', name: 'Alice Adams', score: '92%', needsAttention: false },
    { id: 'demo-student-bob', name: 'Bob Barnett', score: '88%', needsAttention: false },
];