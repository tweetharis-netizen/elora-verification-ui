import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { getDemoGamePack, getGamePackById, GamePack, createStudentGameSession, submitAssignmentAttempt, QuestionResult } from '../services/dataService';
import { RoleQuizGame } from '../components/RoleQuizGame';
import { Trophy, Flame, Star, ArrowRight, RotateCcw } from 'lucide-react';

export default function StudentGamePage() {
    const navigate = useNavigate();
    const { packId } = useParams();
    const [searchParams] = useSearchParams();
    // If launched from an assignment: ?attemptId=aa_1
    const attemptId = searchParams.get('attemptId');

    const [gamePack, setGamePack] = useState<GamePack | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Gameplay state
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
    const [isAnswerChecked, setIsAnswerChecked] = useState(false);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [livesLeft, setLivesLeft] = useState(3);

    // Analytics & Review state
    const [sessionStartTime, setSessionStartTime] = useState<string>('');
    const [questionStartTime, setQuestionStartTime] = useState<number>(0);
    const [results, setResults] = useState<QuestionResult[]>([]);

    const [isReviewingMistakes, setIsReviewingMistakes] = useState(false);
    const [reviewQuestionIndex, setReviewQuestionIndex] = useState(0);

    useEffect(() => {
        const fetchGame = async () => {
            try {
                setLoading(true);
                let data: GamePack;
                
                if (packId) {
                    try {
                        data = await getGamePackById(packId);
                    } catch (err) {
                        console.warn(`Failed to fetch pack ${packId}, falling back to demo.`, err);
                        // Fallback to internal/temporary demo pack
                        data = await getDemoGamePack();
                    }
                } else {
                    // Fallback to internal/temporary demo pack
                    data = await getDemoGamePack();
                }
                
                setGamePack(data);
                setSessionStartTime(new Date().toISOString());
                setQuestionStartTime(Date.now());
            } catch (err: any) {
                setError(err.message || 'Failed to load game');
            } finally {
                setLoading(false);
            }
        };
        fetchGame();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-[#F4F0F7] text-slate-900">
                <p>Loading game...</p>
            </div>
        );
    }

    if (error || !gamePack) {
        return (
            <div className="flex flex-col items-center min-h-screen bg-[#F4F0F7] pt-[10vh]">
                <p className="text-red-600 mb-4">{error || 'Game not found'}</p>
                <button onClick={() => navigate('/dashboard/student')} className="btn-primary">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const question = gamePack.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === gamePack.questions.length - 1;

    const handleOptionSelect = (index: number) => {
        if (isAnswerChecked) return;
        setSelectedOptionIndex(index);
    };

    const handleCheckAnswer = () => {
        if (selectedOptionIndex === null || isAnswerChecked) return;

        setIsAnswerChecked(true);
        if (selectedOptionIndex === question.correctIndex) {
            setScore(prev => prev + 1);
        } else {
            setLivesLeft(prev => Math.max(0, prev - 1));
        }
    };

    const handleNext = async () => {
        // Record QuestionResult
        const timeSpentSeconds = Math.round((Date.now() - questionStartTime) / 1000);
        const isCorrect = selectedOptionIndex === question.correctIndex;

        const newResult: QuestionResult = {
            questionId: currentQuestionIndex,
            isCorrect,
            timeSpentSeconds,
            studentAnswer: question.options[selectedOptionIndex ?? 0],
            topicTag: question.topic,
            explanation: question.explanation || 'No explanation available.'
        };

        const updatedResults = [...results, newResult];
        setResults(updatedResults);

        // Calculate if game ends this turn
        const willEnd = isLastQuestion || (livesLeft === 0 && !isCorrect && isAnswerChecked);

        if (willEnd) {
            setIsFinished(true);

            // Calculate final state
            const totalQuestions = gamePack.questions.length;
            const finalScore = isCorrect ? score + 1 : score;
            const endTime = new Date().toISOString();
            const status = (livesLeft === 0 && !isCorrect && !isLastQuestion) ? 'abandoned' : 'completed';

            try {
                // 1. Save the game session
                const session = await createStudentGameSession({
                    packId: gamePack.id,
                    score: finalScore,
                    totalQuestions: totalQuestions,
                    accuracy: finalScore / totalQuestions,
                    startTime: sessionStartTime,
                    endTime,
                    status,
                    results: updatedResults
                });

                // 2. If this was launched from an assignment, mark the attempt as submitted
                if (attemptId) {
                    await submitAssignmentAttempt(attemptId, {
                        gameSessionId: session.id,
                        score: Math.round((finalScore / totalQuestions) * 100)
                    });
                }
            } catch (err) {
                console.error('Failed to save game session:', err);
                // Fail silently to keep the game playable
            }
        } else {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOptionIndex(null);
            setIsAnswerChecked(false);
            setQuestionStartTime(Date.now());
        }
    };

    const handleQuit = () => {
        navigate('/dashboard/student');
    };

    let status: 'idle' | 'answering' | 'checked' | 'finished' = 'idle';
    if (isFinished) status = 'finished';
    else if (isAnswerChecked) status = 'checked';
    else if (selectedOptionIndex !== null) status = 'answering';

    const handleReviewMistakes = () => {
        setIsReviewingMistakes(true);
        setReviewQuestionIndex(0);
    };

    if (isFinished && !isReviewingMistakes) {
        const accuracy = Math.round((score / gamePack.questions.length) * 100);
        const xpEarned = score * 10 + (livesLeft * 5);
        const wrongTopics = Array.from(new Set(results.filter(r => !r.isCorrect).map(r => r.topicTag)));
        const streakText = accuracy >= 80 ? "3 Day Streak! 🔥" : "Keep practicing! 💪";

        return (
            <div className="min-h-screen bg-[#F4F0F7] font-sans flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-[#D8CDE0] animate-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-gradient-to-b from-[#68507B] to-[#4A3957] p-8 text-center relative overflow-hidden">
                        {/* Decorative sparks */}
                        <div className="absolute top-4 left-4 text-yellow-300 opacity-50 animate-pulse"><Star size={24} /></div>
                        <div className="absolute bottom-4 right-8 text-yellow-300 opacity-30 animate-pulse delay-100"><Star size={16} /></div>
                        <div className="absolute top-10 right-4 text-yellow-300 opacity-40 animate-pulse delay-200"><Star size={20} /></div>

                        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20 shadow-inner">
                            <Trophy size={48} className="text-yellow-400 drop-shadow-md" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-white mb-2">Quiz Complete!</h1>
                        <p className="text-[#EBE4F0] text-lg font-medium">{gamePack.title}</p>

                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full text-white text-sm font-bold border border-white/10 backdrop-blur-md">
                            {streakText}
                        </div>
                    </div>

                    <div className="p-6 bg-[#FAFAFA]">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center border border-[#EBE4F0] shadow-sm">
                                <span className="text-xs font-bold text-[#68507B] uppercase tracking-wider mb-1">Score</span>
                                <span className="text-3xl font-extrabold text-[#4A3957]">{accuracy}%</span>
                            </div>
                            <div className="bg-orange-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-orange-100 shadow-sm relative overflow-hidden">
                                <div className="absolute -right-2 -top-2 opacity-10 text-orange-500 transform rotate-12">
                                    <Flame size={48} />
                                </div>
                                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1 flex items-center gap-1 z-10"><Flame size={14} /> XP Earned</span>
                                <span className="text-3xl font-extrabold text-orange-500 z-10">+{xpEarned}</span>
                            </div>
                        </div>

                        {wrongTopics.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Topics to Review:</h3>
                                <div className="flex flex-wrap gap-2">
                                    {wrongTopics.map(t => (
                                        <span key={t} className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-100 rounded-lg text-sm font-semibold">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 mt-4">
                            {wrongTopics.length > 0 ? (
                                <button
                                    onClick={handleReviewMistakes}
                                    className="w-full py-3.5 bg-white text-[#68507B] border-2 border-[#EBE4F0] rounded-xl font-bold text-base hover:border-[#68507B] hover:bg-[#F4F0F7] transition-all flex items-center justify-center gap-2"
                                >
                                    <RotateCcw size={18} /> Review Mistakes
                                </button>
                            ) : (
                                <div className="w-full py-3 text-center text-emerald-600 bg-emerald-50 rounded-xl font-bold text-sm border border-emerald-100">
                                    No mistakes to review — great job!
                                </div>
                            )}
                            <button
                                onClick={handleQuit}
                                className="w-full py-3.5 bg-[#68507B] text-white rounded-xl font-bold text-base hover:bg-[#4A3957] shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                Back to Dashboard <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isFinished && isReviewingMistakes) {
        const wrongResults = results.filter(r => !r.isCorrect);
        if (wrongResults.length === 0) return null;

        const currentWrongResult = wrongResults[reviewQuestionIndex];
        const reviewQuestion = gamePack.questions[currentWrongResult.questionId];

        return (
            <RoleQuizGame
                role="student"
                mode="review"
                gameTitle={gamePack.title}
                topicLabel={currentWrongResult.topicTag}
                totalQuestions={wrongResults.length}
                currentQuestionIndex={reviewQuestionIndex}
                score={score}
                maxScore={gamePack.questions.length}
                livesLeft={livesLeft}
                question={{
                    text: reviewQuestion.prompt,
                    choices: reviewQuestion.options,
                    selectedIndex: reviewQuestion.options.indexOf(currentWrongResult.studentAnswer),
                    correctIndex: reviewQuestion.correctIndex,
                    explanation: reviewQuestion.explanation || 'No explanation available.'
                }}
                status="checked"
                onSelectChoice={() => { }}
                onCheckAnswer={() => { }}
                onNextQuestion={() => setReviewQuestionIndex(prev => prev + 1)}
                onPrevQuestion={() => setReviewQuestionIndex(prev => prev - 1)}
                onQuit={handleQuit}
            />
        );
    }

    return (
        <RoleQuizGame
            role="student"
            mode="play"
            gameTitle={gamePack.title}
            topicLabel={gamePack.topic}
            totalQuestions={gamePack.questions.length}
            currentQuestionIndex={currentQuestionIndex}
            score={score}
            maxScore={gamePack.questions.length}
            livesLeft={livesLeft}
            question={{
                text: question?.prompt || 'No question text',
                choices: question?.options || [],
                selectedIndex: selectedOptionIndex,
                correctIndex: question?.correctIndex || 0,
                explanation: question?.explanation || 'No explanation available.'
            }}
            status={status}
            onSelectChoice={handleOptionSelect}
            onCheckAnswer={handleCheckAnswer}
            onNextQuestion={handleNext}
            onQuit={handleQuit}
            onReviewMistakes={results.some(r => !r.isCorrect) ? handleReviewMistakes : undefined}
        />
    );
}
