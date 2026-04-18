import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, RefreshCw, AlertCircle, ChevronRight } from 'lucide-react';
import { askElora } from '../services/askElora';

type Role = 'teacher' | 'student' | 'parent';

type AskEloraStatus = 'idle' | 'loading' | 'success' | 'error';

type SuggestionKind = 'practice_task' | 'parent_message' | 'lesson_idea' | 'general';

export interface EloraAssistantSuggestion {
    kind: SuggestionKind;
    title: string;
    body: string;
    suggestedTargets?: string[];
    suggestedPackId?: string;
}

export interface AccentClasses {
    chipBg: string;
    buttonBg: string;
    iconBg: string;
    text: string;
}

export interface EloraAssistantCardProps {
    role: Role;
    title: string;
    description: string;
    assistantName?: string;
    suggestedPrompts?: string[];
    accentClasses: AccentClasses;
    fetchSuggestion?: () => Promise<EloraAssistantSuggestion>;
    status?: AskEloraStatus;
    suggestion?: EloraAssistantSuggestion | null;
    error?: string | null;
    onRefresh?: () => Promise<void> | void;
    emptyStateText?: string;
    defaultExpanded?: boolean;
    isDemo?: boolean;
    onAsk?: (prompt: string) => Promise<string>;
    badgeText?: string;
    helperText?: string;
}

export const EloraAssistantCard = ({
    role,
    title,
    description,
    assistantName,
    suggestedPrompts = [],
    accentClasses,
    fetchSuggestion,
    status,
    suggestion,
    error,
    onRefresh,
    emptyStateText,
    defaultExpanded = false,
    isDemo = false,
    onAsk,
    badgeText,
    helperText,
}: EloraAssistantCardProps) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [localStatus, setLocalStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(isDemo ? 'success' : 'idle');
    const [localSuggestion, setLocalSuggestion] = useState<any>(null);

    // Skip loading skeletons for this card in demo mode.
    // effectiveStatus will be 'success' if isDemo is true, unless it's explicitly 'error'.
    const effectiveStatus = isDemo ? (status === 'error' ? 'error' : 'success') : (status ?? localStatus);
    const [localError, setLocalError] = useState<string | null>(null);
    const [customPrompt, setCustomPrompt] = useState('');
    const [customAnswer, setCustomAnswer] = useState<string | null>(null);
    const [isAsking, setIsAsking] = useState(false);
    const [askError, setAskError] = useState<string | null>(null);

    const effectiveSuggestion = suggestion ?? localSuggestion;
    const effectiveError = error ?? (isDemo ? null : localError);

    const assistantLabel = assistantName?.trim() ? assistantName.trim() : 'Elora';

    // roleHeading hidden by user request for cleaner layout

    const getInitialPlaceholder = (roleParam: Role): EloraAssistantSuggestion => {
        const assistant = assistantLabel;
        if (roleParam === 'teacher') {
            if (isDemo) {
                return {
                    kind: 'lesson_idea',
                    title: `${assistant} suggestion: Target factorisation`,
                    body: `3 students are struggling with factorisation. I've prepared a targeted practice game focusing on 'Difference of Two Squares'. Would you like to assign it?`,
                };
            }
            return {
                kind: 'practice_task',
                title: `${assistant} tip: Coach a class activity`,
                body: `Ask ${assistant} for a short class activity that helps students with mixed readiness in your current topic.`,
            };
        }

        if (roleParam === 'student') {
            return {
                kind: 'lesson_idea',
                title: `${assistant} tip: Focus your practice`,
                body: `Pick one weak topic and ask ${assistant} for a 10-minute practice test to improve your score.`,
            };
        }

        return {
            kind: 'parent_message',
            title: `${assistant} tip: Progress conversation`,
            body: emptyStateText || `Ask ${assistant} for a quick explanation of what to celebrate in your child's progress today.`,
        };
    };

    const loadSuggestion = async () => {
        setLocalStatus('loading');
        setLocalError(null);
        try {
            if (fetchSuggestion) {
                const result = await fetchSuggestion();
                setLocalSuggestion(result);
            } else {
                setLocalSuggestion(getInitialPlaceholder(role));
            }
            setLocalStatus('success');
        } catch (err: unknown) {
            setLocalError(err instanceof Error ? err.message : 'Failed to load suggestion');
            setLocalStatus('error');
        }
    };

    const refreshSuggestion = async () => {
        if (onRefresh) {
            await onRefresh();
            return;
        }
        await loadSuggestion();
    };

    const handleAsk = async (prompt: string) => {
        if (!prompt.trim()) return;
        setIsAsking(true);
        setAskError(null);
        setCustomAnswer(null);
        try {
            const answer = onAsk ? await onAsk(prompt) : await askElora({ message: prompt, role });
            setCustomAnswer(answer);
        } catch (err: unknown) {
            setAskError(err instanceof Error ? err.message : 'Failed to get an answer from Elora.');
        } finally {
            setIsAsking(false);
        }
    };

    useEffect(() => {
        if (!isExpanded) {
            return;
        }

        // If parent provided status, let parent control the data loading.
        if (status) {
            return;
        }

        if (localStatus === 'idle') {
            void loadSuggestion();
        }
    }, [isExpanded, status, localStatus]);

    return (
        <div className="bg-white rounded-2xl border border-[#EAE7DD] shadow-sm p-5 lg:p-6 transition-all duration-300">
            {!isExpanded ? (
                <button
                    onClick={() => setIsExpanded(true)}
                    className="w-full flex items-center gap-3 text-left group"
                >
                    <div className={`${accentClasses.iconBg} w-7 h-7 rounded-lg border ${accentClasses.text} border-current/20 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0`}>
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-slate-800 font-semibold tracking-tight leading-snug">{title}</p>
                        <p className="text-[12px] text-slate-400 truncate font-medium mt-0.5">{description}</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
            ) : (
                <div className="flex flex-col gap-4">
                    {/* Header: icon + title + subtitle */}
                    <div className="flex items-start gap-3">
                        <div className={`${accentClasses.iconBg} w-8 h-8 rounded-lg border ${accentClasses.text} border-current/20 flex items-center justify-center mt-0.5 shrink-0`}>
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-[14px] font-semibold text-slate-900 leading-snug">{title}</h3>
                                {badgeText && (
                                    <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${accentClasses.text} ${accentClasses.chipBg} border border-current/10 rounded-md whitespace-nowrap`}>
                                        {badgeText}
                                    </span>
                                )}
                            </div>
                            <p className="text-[12px] text-slate-500 leading-relaxed mt-0.5">{description}</p>
                            {helperText && (
                                <p className={`text-[11px] ${accentClasses.text} opacity-80 font-medium italic leading-relaxed mt-1`}>{helperText}</p>
                            )}
                        </div>
                    </div>

                    {/* Suggested prompts */}
                    <div className="flex flex-wrap gap-1.5">
                        {(suggestedPrompts.length > 0 ? suggestedPrompts : ['Quick Summary']).map((prompt) => (
                            <button
                                key={prompt}
                                onClick={() => {
                                    setCustomPrompt(prompt);
                                    void handleAsk(prompt);
                                }}
                                className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border ${accentClasses.chipBg} ${accentClasses.text} border-current/10 hover:brightness-95 transition-all leading-none`}
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>

                    {/* Conversation / AI response area */}
                    {effectiveStatus === 'idle' && (
                        <p className="text-[12px] text-slate-400 leading-relaxed">
                            {emptyStateText || 'Ask a question to get started.'}
                        </p>
                    )}
                    {effectiveStatus === 'loading' && (
                        <div className="space-y-1.5 animate-pulse py-1">
                            <div className="h-2.5 bg-slate-100 rounded-full w-3/4" />
                            <div className="h-2 bg-slate-50 rounded-full w-1/2" />
                        </div>
                    )}
                    {effectiveStatus === 'error' && effectiveError && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-red-50/50 border border-red-100 text-red-700 rounded-xl p-3">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                <p className="text-xs font-semibold">{effectiveError}</p>
                            </div>
                            <button
                                onClick={refreshSuggestion}
                                className={`${accentClasses.buttonBg} text-white rounded-lg px-3 py-2 text-[11px] font-bold hover:brightness-110 transition shadow-sm`}
                            >
                                Retry
                            </button>
                        </div>
                    )}
                    {effectiveStatus === 'success' && effectiveSuggestion && (
                        <div className="space-y-2.5 bg-slate-50/60 rounded-xl p-3.5 border border-slate-100/60">
                            <h4 className="text-[13px] font-semibold text-slate-900 leading-snug">{effectiveSuggestion.title}</h4>
                            <p className="text-[12px] text-slate-600 leading-relaxed">{effectiveSuggestion.body}</p>
                            <div className="flex items-center justify-between pt-0.5">
                                <div className="flex items-center gap-2">
                                    {effectiveSuggestion.suggestedPackId && (
                                        <button
                                            onClick={() => {
                                                window.location.href = `/play/${effectiveSuggestion.suggestedPackId}`;
                                            }}
                                            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-[11px] font-bold hover:bg-slate-50 transition shadow-sm"
                                        >
                                            Start Practice
                                        </button>
                                    )}
                                    <button
                                        onClick={refreshSuggestion}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white ${accentClasses.buttonBg} hover:brightness-110 transition shadow-sm`}
                                    >
                                        <RefreshCw size={12} />
                                        New tip
                                    </button>
                                </div>
                                <span className="text-[10px] text-slate-300 font-medium">{assistantLabel}</span>
                            </div>
                        </div>
                    )}

                    {/* Input + Ask button */}
                    <div className="space-y-2.5 pt-1">
                        <div className="flex items-center gap-2">
                            <input
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder="Ask about your class..."
                                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400/20 bg-white/60 placeholder:text-slate-400"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        void handleAsk(customPrompt);
                                    }
                                }}
                            />
                            <button
                                onClick={() => void handleAsk(customPrompt)}
                                disabled={!customPrompt.trim() || isAsking}
                                className={`${accentClasses.buttonBg} text-white rounded-xl px-4 py-2 text-xs font-bold disabled:opacity-50 shadow-sm hover:brightness-110 transition shrink-0`}
                            >
                                {isAsking ? '...' : 'Ask'}
                            </button>
                        </div>
                        {askError && <p className="text-[11px] text-red-600 font-medium">{askError}</p>}
                        {customAnswer && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="px-4 py-3 bg-white border border-slate-100 rounded-2xl text-[12px] text-slate-700 whitespace-pre-wrap leading-relaxed shadow-sm"
                            >
                                {customAnswer}
                            </motion.div>
                        )}
                    </div>

                    <button
                        onClick={() => setIsExpanded(false)}
                        className="text-[11px] text-slate-300 hover:text-slate-500 font-medium mx-auto block pt-1 transition-colors"
                    >
                        Collapse
                    </button>
                </div>
            )}
        </div>
    );
};

export default EloraAssistantCard;
