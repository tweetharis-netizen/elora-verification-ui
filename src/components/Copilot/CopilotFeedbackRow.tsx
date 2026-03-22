import React, { useState } from 'react';

export type CopilotFeedbackRowProps = {
    messageId: string;
    role: 'teacher' | 'student' | 'parent';
    intent?: string;
    onFeedback: (input: { messageId: string; role: string; value: 'yes' | 'no'; intent?: string }) => void;
};

export const CopilotFeedbackRow: React.FC<CopilotFeedbackRowProps> = ({ messageId, role, intent, onFeedback }) => {
    const [selected, setSelected] = useState<'yes' | 'no' | null>(null);

    const getRoleColor = () => {
        switch (role) {
            case 'teacher': return '#14b8a6'; // teal
            case 'student': return '#8b5cf6'; // purple
            case 'parent': return '#f59e0b'; // amber
            default: return '#64748b';
        }
    };

    const handleVote = (value: 'yes' | 'no') => {
        setSelected(value);
        onFeedback({ messageId, role, value, intent });
    };

    const color = getRoleColor();

    return (
        <div className="flex items-center flex-wrap gap-3 mt-3 px-1 text-[13px] text-slate-400 font-medium w-full">
            <span>Was this helpful?</span>
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => handleVote('yes')}
                    className={`px-3 py-1 rounded-full border transition-colors shadow-sm ${selected === 'yes' ? 'text-white' : 'text-slate-500 bg-transparent border-slate-200 hover:border-slate-300'}`}
                    style={selected === 'yes' ? { backgroundColor: color, borderColor: color } : {}}
                >
                    Yes
                </button>
                <button
                    onClick={() => handleVote('no')}
                    className={`px-3 py-1 rounded-full border transition-colors shadow-sm ${selected === 'no' ? 'text-white' : 'text-slate-500 bg-transparent border-slate-200 hover:border-slate-300'}`}
                    style={selected === 'no' ? { backgroundColor: color, borderColor: color } : {}}
                >
                    No
                </button>
            </div>
        </div>
    );
};
