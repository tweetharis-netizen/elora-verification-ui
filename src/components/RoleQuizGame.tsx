import React from 'react';
import { CheckCircle2, XCircle, Heart, Trophy, ArrowRight, LogOut, Edit2, List, MessageSquare } from 'lucide-react';

export type Role = 'student' | 'parent' | 'teacher';

export interface RoleQuizGameProps {
    role: Role;
    mode: 'play' | 'review';
    gameTitle: string;
    topicLabel: string;
    totalQuestions: number;
    currentQuestionIndex: number;
    score: number;
    maxScore: number;
    livesLeft: number;
    question: {
        text: string;
        choices: string[];
        selectedIndex: number | null;
        correctIndex: number;
        explanation: string;
    };
    status: 'idle' | 'answering' | 'checked' | 'finished';
    onSelectChoice: (choiceIndex: number) => void;
    onCheckAnswer: () => void;
    onNextQuestion: () => void;
    onPrevQuestion?: () => void;
    onQuit: () => void;
    onReviewMistakes?: () => void;
}

const ROLE_THEME = {
    student: {
        primary: '#68507B',
        primarySoftBg: '#F4F0F7',
        chipBg: '#EBE4F0',
        chipText: '#4A3957',
        bgGradient: 'linear-gradient(135deg, #F4F0F7 0%, #EBE4F0 100%)',
        border: '#D8CDE0',
    },
    parent: {
        primary: '#DB844A',
        primarySoftBg: '#FDF5F0',
        chipBg: '#F9E6D9',
        chipText: '#A65C2E',
        bgGradient: 'linear-gradient(135deg, #FDF5F0 0%, #F9E6D9 100%)',
        border: '#F2D1BC',
    },
    teacher: {
        primary: '#859864',
        primarySoftBg: '#F4F6F0',
        chipBg: '#E8ECD9',
        chipText: '#5A6B41',
        bgGradient: 'linear-gradient(135deg, #F4F6F0 0%, #E8ECD9 100%)',
        border: '#C3CA92',
    }
};

export const RoleQuizGame: React.FC<RoleQuizGameProps> = ({
    role,
    mode,
    gameTitle,
    topicLabel,
    totalQuestions,
    currentQuestionIndex,
    score,
    maxScore,
    livesLeft,
    question,
    status,
    onSelectChoice,
    onCheckAnswer,
    onNextQuestion,
    onPrevQuestion,
    onQuit,
    onReviewMistakes,
}) => {
    const theme = ROLE_THEME[role];
    const isReview = mode === 'review';
    const displayStatus = isReview ? 'checked' : status;

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center p-2 sm:p-4 font-sans transition-colors duration-500"
            style={{ background: theme.bgGradient }}
        >
            <div className="w-full max-w-3xl bg-[#FAFAFA] rounded-xl shadow-sm border border-black/5 overflow-hidden flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-black/5 bg-white gap-3 shrink-0">
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">{gameTitle} {isReview && <span className="text-gray-500 font-normal text-sm ml-2">(Review Mode)</span>}</h1>
                        <span
                            className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: theme.chipBg, color: theme.chipText }}
                        >
                            {topicLabel}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Progress */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-gray-200 shadow-sm text-xs font-medium text-gray-700">
                            <span>Q{currentQuestionIndex + 1}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-500">{totalQuestions}</span>
                        </div>
                        {/* Score */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-gray-200 shadow-sm text-xs font-medium text-gray-700">
                            <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                            <span>{score}</span>
                        </div>
                        {/* Lives */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-gray-200 shadow-sm text-xs font-medium text-gray-700">
                            <Heart className="w-3.5 h-3.5 text-red-500" fill="currentColor" />
                            <span>{livesLeft}</span>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-4 sm:p-6 flex-1 bg-[#FAFAFA] overflow-y-auto">
                    {displayStatus === 'finished' ? (
                        <div className="flex flex-col items-center justify-center text-center py-8 animate-in fade-in zoom-in duration-500">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                                style={{ backgroundColor: theme.primarySoftBg, color: theme.primary }}
                            >
                                <Trophy className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
                            <p className="text-base text-gray-600 mb-6">
                                You scored {score} out of {maxScore} points.
                            </p>
                            {onReviewMistakes && maxScore - score > 0 && (
                                <button
                                    onClick={onReviewMistakes}
                                    className="px-6 py-2 rounded-lg text-white font-semibold transition-all shadow-sm hover:shadow"
                                    style={{ backgroundColor: theme.primary }}
                                >
                                    Review Mistakes
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto flex flex-col gap-4">
                            <h2 className="text-xl sm:text-2xl font-medium text-gray-900 leading-tight">
                                {question.text}
                            </h2>

                            <div className="flex flex-col gap-2">
                                {question.choices.map((choice, index) => {
                                    const isSelected = question.selectedIndex === index;
                                    const isCorrect = displayStatus === 'checked' && index === question.correctIndex;
                                    const isWrongSelected = displayStatus === 'checked' && isSelected && index !== question.correctIndex;

                                    let choiceBg = 'bg-white';
                                    let choiceBorder = 'border-gray-200';
                                    let choiceText = 'text-gray-700';
                                    let customStyle: React.CSSProperties = {};

                                    if (displayStatus === 'checked') {
                                        if (isCorrect) {
                                            choiceBg = 'bg-green-50';
                                            choiceBorder = 'border-green-500';
                                            choiceText = 'text-green-800';
                                        } else if (isWrongSelected) {
                                            choiceBg = 'bg-red-50';
                                            choiceBorder = 'border-red-500';
                                            choiceText = 'text-red-800';
                                        } else {
                                            choiceBg = 'bg-gray-50 opacity-60';
                                            choiceBorder = 'border-gray-200';
                                            choiceText = 'text-gray-500';
                                        }
                                    } else {
                                        if (isSelected) {
                                            customStyle = {
                                                backgroundColor: theme.primarySoftBg,
                                                borderColor: theme.primary,
                                                color: theme.primary
                                            };
                                        }
                                    }

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => !isReview && displayStatus !== 'checked' && onSelectChoice(index)}
                                            disabled={isReview || displayStatus === 'checked'}
                                            className={`relative w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-between group ${!isReview && displayStatus !== 'checked' && !isSelected ? 'hover:border-gray-300 hover:bg-gray-50' : ''
                                                } ${choiceBg} ${choiceBorder} ${choiceText}`}
                                            style={customStyle}
                                        >
                                            <span className="text-base font-medium">{choice}</span>
                                            {displayStatus === 'checked' && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 ml-2" />}
                                            {displayStatus === 'checked' && isWrongSelected && <XCircle className="w-5 h-5 text-red-500 shrink-0 ml-2" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {displayStatus === 'checked' && (
                                <div
                                    className="p-4 rounded-lg border animate-in slide-in-from-top-2 fade-in duration-300"
                                    style={{ backgroundColor: theme.primarySoftBg, borderColor: theme.border }}
                                >
                                    <h3
                                        className="text-base font-bold mb-1.5 flex items-center gap-2"
                                        style={{ color: theme.primary }}
                                    >
                                        {question.selectedIndex === question.correctIndex ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" />
                                                Correct!
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-4 h-4" />
                                                Let's fix this
                                            </>
                                        )}
                                    </h3>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        {question.explanation}
                                    </p>
                                </div>
                            )}

                            {isReview && role === 'teacher' && (
                                <div className="mt-2 p-4 rounded-lg bg-white border border-gray-200 shadow-sm animate-in fade-in duration-300">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Teacher Tools</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors">
                                            <Edit2 className="w-3.5 h-3.5" />
                                            Edit question
                                        </button>
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors">
                                            <List className="w-3.5 h-3.5" />
                                            Edit options
                                        </button>
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            Edit explanation
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-black/5 bg-white flex items-center justify-between shrink-0">
                    <button
                        onClick={onQuit}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        {isReview ? 'Back to dashboard' : 'Quit'}
                    </button>

                    {!isReview && displayStatus !== 'finished' && (
                        <button
                            onClick={displayStatus === 'checked' ? onNextQuestion : onCheckAnswer}
                            disabled={displayStatus !== 'checked' && question.selectedIndex === null}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
                            style={{
                                backgroundColor: displayStatus !== 'checked' && question.selectedIndex === null ? '#D1D5DB' : theme.primary
                            }}
                        >
                            {displayStatus === 'checked' ? 'Next question' : 'Check answer'}
                            {displayStatus === 'checked' && <ArrowRight className="w-4 h-4" />}
                        </button>
                    )}
                    {isReview && displayStatus !== 'finished' && (
                        <div className="flex items-center gap-2">
                            {onPrevQuestion && (
                                <button
                                    onClick={onPrevQuestion}
                                    disabled={currentQuestionIndex === 0}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-gray-700 text-sm font-semibold transition-all duration-200 disabled:opacity-50 shadow-sm border border-gray-200 hover:bg-gray-50 bg-white"
                                >
                                    Previous
                                </button>
                            )}
                            <button
                                onClick={onNextQuestion}
                                disabled={currentQuestionIndex === totalQuestions - 1}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-semibold transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow"
                                style={{ backgroundColor: theme.primary }}
                            >
                                Next question
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    {!isReview && displayStatus === 'finished' && (
                        <button
                            onClick={onQuit}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow"
                            style={{ backgroundColor: theme.primary }}
                        >
                            Back to dashboard
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export const mockProps: RoleQuizGameProps = {
    role: 'student',
    mode: 'play',
    gameTitle: 'Weekly Challenge',
    topicLabel: 'Fractions · P5',
    totalQuestions: 10,
    currentQuestionIndex: 2,
    score: 250,
    maxScore: 1000,
    livesLeft: 3,
    question: {
        text: 'What is 1/2 + 1/4?',
        choices: ['1/6', '2/6', '3/4', '1/8'],
        selectedIndex: 2,
        correctIndex: 2,
        explanation: 'To add fractions, find a common denominator. 1/2 is the same as 2/4. 2/4 + 1/4 = 3/4.',
    },
    status: 'checked',
    onSelectChoice: (index) => console.log('Selected choice:', index),
    onCheckAnswer: () => console.log('Check answer clicked'),
    onNextQuestion: () => console.log('Next question clicked'),
    onQuit: () => console.log('Quit clicked'),
};
