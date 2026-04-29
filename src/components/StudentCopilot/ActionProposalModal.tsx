import React from 'react';
import { AlertCircle, Clock, Target, BookOpen } from 'lucide-react';

interface ActionProposalModalProps {
    isOpen: boolean;
    weakTopic: string | null;
    nearestTask: { title?: string; dueDate?: string } | null;
    onSelectTask: () => void;
    onSelectSprint: () => void;
    onSelectTopic: () => void;
    themeColor: string;
}

export const ActionProposalModal: React.FC<ActionProposalModalProps> = ({
    isOpen,
    weakTopic,
    nearestTask,
    onSelectTask,
    onSelectSprint,
    onSelectTopic,
    themeColor,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 animate-in fade-in duration-200">
            <div className="w-full md:w-[500px] bg-white rounded-t-2xl md:rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 animate-in slide-in-from-bottom duration-300 md:slide-in-from-center">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: themeColor }} />
                    <div>
                        <h3 className="font-semibold text-slate-900">Let's focus on what matters</h3>
                        <p className="text-sm text-slate-600 mt-1">
                            Pick a concrete goal to keep your study session on track.
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    {nearestTask && (
                        <button
                            onClick={onSelectTask}
                            className="w-full p-4 rounded-lg border-2 transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                            style={{
                                borderColor: themeColor + '33',
                                backgroundColor: themeColor + '05',
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = themeColor;
                                e.currentTarget.style.boxShadow = `0 0 0 3px ${themeColor}20`;
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = themeColor + '33';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div className="flex items-start gap-3">
                                <Target className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: themeColor }} />
                                <div className="text-left">
                                    <div className="font-medium text-slate-900">Tackle your nearest task</div>
                                    <div className="text-xs text-slate-600 mt-1">
                                        {nearestTask.title}
                                        {nearestTask.dueDate && ` – Due soon`}
                                    </div>
                                </div>
                            </div>
                        </button>
                    )}

                    <button
                        onClick={onSelectSprint}
                        className="w-full p-4 rounded-lg border-2 transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                            borderColor: themeColor + '33',
                            backgroundColor: themeColor + '05',
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = themeColor;
                            e.currentTarget.style.boxShadow = `0 0 0 3px ${themeColor}20`;
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = themeColor + '33';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: themeColor }} />
                            <div className="text-left">
                                <div className="font-medium text-slate-900">10-minute focused sprint</div>
                                <div className="text-xs text-slate-600 mt-1">
                                    Let me guide you through a quick, high-energy drill
                                </div>
                            </div>
                        </div>
                    </button>

                    {weakTopic && (
                        <button
                            onClick={onSelectTopic}
                            className="w-full p-4 rounded-lg border-2 transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                            style={{
                                borderColor: themeColor + '33',
                                backgroundColor: themeColor + '05',
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = themeColor;
                                e.currentTarget.style.boxShadow = `0 0 0 3px ${themeColor}20`;
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = themeColor + '33';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div className="flex items-start gap-3">
                                <BookOpen className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: themeColor }} />
                                <div className="text-left">
                                    <div className="font-medium text-slate-900">Review weak area: {weakTopic}</div>
                                    <div className="text-xs text-slate-600 mt-1">
                                        Master this concept with targeted practice
                                    </div>
                                </div>
                            </div>
                        </button>
                    )}
                </div>

                <div className="pt-4 border-t border-slate-200">
                    <button
                        onClick={() => {
                            // User can dismiss and continue freeform if they really want to
                            // But there's no explicit close button - they must pick an action
                            // This is intentionally missing to encourage making a choice
                        }}
                        className="w-full text-sm text-slate-500 hover:text-slate-600 transition-colors py-2"
                    >
                        Or continue without picking
                    </button>
                </div>
            </div>
        </div>
    );
};
