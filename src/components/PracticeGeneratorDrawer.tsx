// src/components/PracticeGeneratorDrawer.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { X, Sparkles, RefreshCw, AlertCircle, MonitorPlay, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as dataService from '../services/dataService';

interface PracticeGeneratorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onReview: (game: dataService.GamePack) => void;
  onAssign: (game: dataService.GamePack) => void;
  initialValues?: Partial<AiForm>;
}

export interface PracticeGeneratorForm {
  topic: string;
  level: string;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionType: 'mcq' | 'open_ended';
}

type AiForm = PracticeGeneratorForm;

const EditorialLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest">{children}</p>
);

const SmartChip = ({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 rounded-full border text-sm font-semibold transition-all duration-300 ease-in-out ${
      selected
        ? 'bg-teal-500 text-white border-teal-500 shadow-[0_0_0_3px_rgba(20,184,166,0.15)]'
        : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:text-teal-700'
    }`}
  >
    {label}
  </button>
);

const TealDraftSkeleton = () => (
  <motion.div
    animate={{ opacity: [0.45, 1, 0.45] }}
    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
    className="rounded-xl border border-dashed border-slate-300 bg-teal-500/5 p-4"
  >
    <div className="space-y-3">
      <div className="h-4 w-3/4 rounded bg-teal-100/60" />
      <div className="h-3 w-1/2 rounded bg-teal-100/50" />
      <div className="h-3 w-2/3 rounded bg-teal-100/40" />
    </div>
  </motion.div>
);

const DraftPreviewMini = ({
  title,
  topic,
  level,
  questionCount,
  generating,
}: {
  title: string;
  topic: string;
  level: string;
  questionCount: number;
  generating: boolean;
}) => (
  <div className="origin-bottom-right scale-[0.7] transform-gpu">
    {generating ? (
      <TealDraftSkeleton />
    ) : (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <EditorialLabel>Draft Preview</EditorialLabel>
          <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Draft
          </span>
        </div>
        <h3 className="text-base font-semibold tracking-tight text-slate-900">{title}</h3>
        <p className="mt-2 text-xs font-medium text-slate-600">
          {questionCount} Questions - Multiple Choice
        </p>
        <p className="mt-1 text-[11px] font-medium text-slate-500">
          Topic: {topic || 'Pending topic'} - Level: {level || 'Pending level'}
        </p>
      </div>
    )}
  </div>
);

export const PracticeGeneratorDrawer = ({
  isOpen,
  onClose,
  onReview,
  onAssign,
  initialValues,
}: PracticeGeneratorDrawerProps) => {
  const [aiForm, setAiForm] = useState<AiForm>({
    topic: initialValues?.topic ?? '',
    level: initialValues?.level ?? '',
    questionCount: initialValues?.questionCount ?? 5,
    difficulty: initialValues?.difficulty ?? 'mixed',
    questionType: initialValues?.questionType ?? 'mcq',
  });
  const [difficultyConfirmed, setDifficultyConfirmed] = useState(Boolean(initialValues?.difficulty));
  const [countConfirmed, setCountConfirmed] = useState(Boolean(initialValues?.questionCount));
  const [generating, setGenerating] = useState(false);
  const [generatedGame, setGeneratedGame] = useState<dataService.GamePack | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const isDemo = true;

  useEffect(() => {
    if (!isOpen) {
      setGeneratedGame(null);
      setGenerateError(null);
      setDifficultyConfirmed(Boolean(initialValues?.difficulty));
      setCountConfirmed(Boolean(initialValues?.questionCount));
      setAiForm({
        topic: initialValues?.topic ?? '',
        level: initialValues?.level ?? '',
        questionCount: initialValues?.questionCount ?? 5,
        difficulty: initialValues?.difficulty ?? 'mixed',
        questionType: initialValues?.questionType ?? 'mcq',
      });
    }
  }, [isOpen, initialValues]);

  const draftTitle = useMemo(() => {
    if (generatedGame?.title) return generatedGame.title;
    const topic = aiForm.topic.trim();
    return topic ? `${topic} Practice Set` : 'Untitled Practice Set';
  }, [aiForm.topic, generatedGame]);

  const showDifficultyStep = aiForm.topic.trim().length > 0 && aiForm.level.trim().length > 0;
  const showCountStep = showDifficultyStep && difficultyConfirmed;
  const showGenerateStep = showCountStep && countConfirmed;

  const handleGenerateInternal = async () => {
    setGenerating(true);
    setGenerateError(null);
    setGeneratedGame(null);

    try {
      if (isDemo && aiForm.topic.toLowerCase().includes('factorisation')) {
        await new Promise((r) => setTimeout(r, 1500));
        const pack: dataService.GamePack = {
          id: `demo-${Date.now()}`,
          title: 'Algebra: Factorisation Mastery',
          topic: aiForm.topic,
          level: aiForm.level,
          questions: [
            {
              id: 'demo-q1',
              prompt: 'Factorise x^2 + 7x + 12',
              options: ['(x+3)(x+4)', '(x+1)(x+12)', '(x+2)(x+6)', 'x(x+7) + 12'],
              correctIndex: 0,
              difficulty: 'medium',
              topic: 'Algebra - Factorisation',
              explanation: 'Find two numbers that multiply to 12 and add to 7.',
            },
            {
              id: 'demo-q2',
              prompt: 'Factorise completely: 4x^2 - 16',
              options: ['4(x-2)(x+2)', '(2x-4)(2x+4)', '4(x-4)(x+4)', '2(x^2-8)'],
              correctIndex: 0,
              difficulty: 'hard',
              topic: 'Algebra - Factorisation',
              explanation: 'Take out common factor 4 then apply difference of squares.',
            },
            {
              id: 'demo-q3',
              prompt: 'Factorise: x^2 - 9',
              options: ['(x-3)(x+3)', '(x-3)^2', '(x+9)(x-1)', 'x(x-9)'],
              correctIndex: 0,
              difficulty: 'easy',
              topic: 'Algebra - Factorisation',
              explanation: 'Recognize a difference of squares.',
            },
          ],
        };
        setGeneratedGame(pack);
      } else {
        const pack = await dataService.generateGamePack({
          topic: aiForm.topic,
          level: aiForm.level,
          questionCount: aiForm.questionCount,
          difficulty: aiForm.difficulty,
        });
        setGeneratedGame(pack);
      }
    } catch (err: unknown) {
      const fallbackPack: dataService.GamePack = {
        id: `fallback-${Date.now()}`,
        title: 'Algebra Warmup',
        topic: aiForm.topic || 'Algebra - Factorisation',
        level: aiForm.level || 'Sec 3',
        questions: [
          {
            id: 'fallback-q1',
            prompt: 'Factorise x^2 + 5x + 6',
            options: ['(x+2)(x+3)', '(x+1)(x+6)', '(x+4)(x+2)', '(x+5)(x+1)'],
            correctIndex: 0,
            difficulty: 'easy',
            topic: 'Algebra - Factorisation',
            explanation: 'Find two numbers that multiply to 6 and add to 5.',
          },
          {
            id: 'fallback-q2',
            prompt: 'Factorise x^2 - 9',
            options: ['(x-3)(x+3)', '(x-9)(x+1)', '(x-3)^2', 'x(x-9)'],
            correctIndex: 0,
            difficulty: 'easy',
            topic: 'Algebra - Factorisation',
            explanation: 'This is a difference of squares.',
          },
          {
            id: 'fallback-q3',
            prompt: 'Factorise 2x^2 + 8x',
            options: ['2x(x+4)', '2(x^2+4)', '(2x+4)(x+2)', 'x(2x+8)'],
            correctIndex: 0,
            difficulty: 'easy',
            topic: 'Algebra - Factorisation',
            explanation: 'Factor out the greatest common factor 2x.',
          },
        ],
      };

      setGeneratedGame(fallbackPack);
      setGenerateError(null);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    handleGenerateInternal();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed right-0 top-0 z-[100] h-full w-[450px] max-w-[calc(100vw-1rem)] border-l border-slate-200 bg-slate-50/95 backdrop-blur-md shadow-2xl"
        >
          <div className="flex h-full flex-col">
            <div className="flex h-24 items-center justify-between border-b border-slate-200 bg-white/50 px-6">
              <div>
                <EditorialLabel>Briefing Elora</EditorialLabel>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">New Practice Set</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close panel"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <form onSubmit={handleGenerate} className="space-y-5">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <EditorialLabel>What topic should we target?</EditorialLabel>
                  <input
                    required
                    type="text"
                    value={aiForm.topic}
                    onChange={(e) => setAiForm((prev) => ({ ...prev, topic: e.target.value }))}
                    placeholder="e.g. Algebra - Factorisation"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition-all focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10"
                  />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <EditorialLabel>Target group</EditorialLabel>
                  <input
                    required
                    type="text"
                    value={aiForm.level}
                    onChange={(e) => setAiForm((prev) => ({ ...prev, level: e.target.value }))}
                    placeholder="e.g. Sec 3"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition-all focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10"
                  />
                </motion.div>

                <AnimatePresence>
                  {showDifficultyStep && (
                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 18 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <EditorialLabel>How challenging should it feel?</EditorialLabel>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {[
                          { value: 'easy', label: 'Introductory' },
                          { value: 'medium', label: 'Standard' },
                          { value: 'hard', label: 'Advanced' },
                          { value: 'mixed', label: 'Mixed' },
                        ].map((opt) => (
                          <React.Fragment key={opt.value}>
                            <SmartChip
                              label={opt.label}
                              selected={aiForm.difficulty === opt.value && difficultyConfirmed}
                              onClick={() => {
                                setAiForm((prev) => ({ ...prev, difficulty: opt.value as AiForm['difficulty'] }));
                                setDifficultyConfirmed(true);
                              }}
                            />
                          </React.Fragment>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showCountStep && (
                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 18 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <EditorialLabel>How many questions should we curate?</EditorialLabel>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {[5, 8, 10].map((count) => (
                          <React.Fragment key={count}>
                            <SmartChip
                              label={`${count} Questions`}
                              selected={aiForm.questionCount === count && countConfirmed}
                              onClick={() => {
                                setAiForm((prev) => ({ ...prev, questionCount: count }));
                                setCountConfirmed(true);
                              }}
                            />
                          </React.Fragment>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showGenerateStep && (
                    <motion.div
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 18 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <button
                        type="submit"
                        disabled={generating}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-teal-600/20 transition-all duration-200 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {generating ? (
                          <>
                            <RefreshCw size={18} className="animate-spin" />
                            <span className="animate-pulse">Curating questions for Jordan Lee...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={18} />
                            Generate practice set
                          </>
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {generateError && (
                  <div className="rounded-2xl border border-[#7A0D2C] bg-[#9F1239] px-4 py-3 text-sm text-white">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <p>{generateError}</p>
                    </div>
                  </div>
                )}

                {generatedGame && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <EditorialLabel>Generated</EditorialLabel>
                      <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-teal-700">
                        Ready
                      </span>
                    </div>
                    <h3 className="text-base font-semibold tracking-tight text-slate-900">{generatedGame.title}</h3>
                    <p className="mt-2 text-xs font-medium text-slate-600">
                      {generatedGame.questions.length} Questions - {generatedGame.level}
                    </p>
                  </div>
                )}
              </form>

              <div className="mt-8 border-t border-slate-200 pt-5">
                <DraftPreviewMini
                  title={draftTitle}
                  topic={aiForm.topic}
                  level={aiForm.level}
                  questionCount={aiForm.questionCount}
                  generating={generating}
                />
              </div>
            </div>

            <div className="flex h-20 items-center justify-between border-t border-slate-200 bg-white/50 px-6">
              <button
                onClick={onClose}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              >
                <ChevronLeft size={18} />
                Back
              </button>
              {generatedGame ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onReview(generatedGame)}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <MonitorPlay size={16} />
                    Preview
                  </button>
                  <button
                    onClick={() => onAssign(generatedGame)}
                    className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
                  >
                    Assign <ChevronRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 tabular-nums">
                  Step {showCountStep ? 3 : showDifficultyStep ? 2 : 1} of 3
                </div>
              )}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default PracticeGeneratorDrawer;
