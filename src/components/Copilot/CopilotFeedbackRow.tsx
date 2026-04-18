import React, { useState } from 'react';
import { ThumbsDown, ThumbsUp, X } from 'lucide-react';
import type { CopilotFeedbackReason, CopilotFeedbackRating, UserRole } from '../../lib/llm/types';

export type CopilotFeedbackRowProps = {
    messageId: string;
    role: UserRole;
    useCase: string;
    threadId?: string;
    onFeedback: (input: {
        messageId: string;
        role: UserRole;
        useCase: string;
        threadId?: string;
        rating: CopilotFeedbackRating;
        reason?: CopilotFeedbackReason;
        comment?: string;
    }) => void;
};

const REASON_OPTIONS: Array<{ label: string; value: CopilotFeedbackReason }> = [
    { label: 'Not accurate', value: 'not_accurate' },
    { label: 'Too long', value: 'too_long' },
    { label: 'Not my level', value: 'not_my_level' },
    { label: 'Other', value: 'other' },
];

export const CopilotFeedbackRow: React.FC<CopilotFeedbackRowProps> = ({
    messageId,
    role,
    useCase,
    threadId,
    onFeedback,
}) => {
    const [selected, setSelected] = useState<CopilotFeedbackRating | null>(null);
    const [showReasonSheet, setShowReasonSheet] = useState(false);
    const [selectedReason, setSelectedReason] = useState<CopilotFeedbackReason>('not_accurate');
    const [comment, setComment] = useState('');

    const getRoleColor = () => {
        switch (role) {
            case 'teacher': return '#14b8a6'; // teal
            case 'student': return '#8b5cf6'; // purple
            case 'parent': return '#f59e0b'; // amber
            default: return '#64748b';
        }
    };

    const handleUpvote = () => {
        setSelected('up');
        setShowReasonSheet(false);
        onFeedback({
            messageId,
            role,
            useCase,
            threadId,
            rating: 'up',
            reason: 'helpful',
        });
    };

    const handleDownvote = () => {
        setSelected('down');
        setShowReasonSheet(true);
    };

    const submitDownvoteReason = () => {
        onFeedback({
            messageId,
            role,
            useCase,
            threadId,
            rating: 'down',
            reason: selectedReason,
            comment: comment.trim().slice(0, 200) || undefined,
        });
        setShowReasonSheet(false);
    };

    const color = getRoleColor();

    return (
        <div className="w-full mt-2">
            <div className="flex items-center flex-wrap gap-2 px-1 text-[12px] text-slate-400 font-medium">
                <span>Rate this answer</span>
                <button
                    onClick={handleUpvote}
                    className={`p-1.5 rounded-lg border transition-colors ${selected === 'up' ? 'text-white' : 'text-slate-500 bg-transparent border-slate-200 hover:border-slate-300'}`}
                    style={selected === 'up' ? { backgroundColor: color, borderColor: color } : {}}
                    title="Helpful"
                >
                    <ThumbsUp size={14} />
                </button>
                <button
                    onClick={handleDownvote}
                    className={`p-1.5 rounded-lg border transition-colors ${selected === 'down' ? 'text-white' : 'text-slate-500 bg-transparent border-slate-200 hover:border-slate-300'}`}
                    style={selected === 'down' ? { backgroundColor: color, borderColor: color } : {}}
                    title="Not helpful"
                >
                    <ThumbsDown size={14} />
                </button>
            </div>

            {showReasonSheet && (
                <div className="mt-2 ml-1 rounded-xl border border-slate-200 bg-white p-3 shadow-sm max-w-md animate-in fade-in duration-200">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-slate-700">What didn&apos;t work?</p>
                        <button
                            onClick={() => setShowReasonSheet(false)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            title="Close"
                        >
                            <X size={12} />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2">
                        {REASON_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setSelectedReason(option.value)}
                                className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors ${selectedReason === option.value ? 'text-white' : 'text-slate-600 border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
                                style={selectedReason === option.value ? { backgroundColor: color, borderColor: color } : {}}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value.slice(0, 200))}
                        rows={2}
                        placeholder="Optional comment"
                        className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">{comment.length}/200</span>
                        <button
                            onClick={submitDownvoteReason}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white"
                            style={{ backgroundColor: color }}
                        >
                            Submit
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
