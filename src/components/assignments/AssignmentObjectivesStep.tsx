import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Info, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { BLOOM_LEVEL_OPTIONS, type AssignmentObjective } from './assignmentWizardTypes';

type ObjectiveSuggestionsState = 'idle' | 'loading' | 'success' | 'error';

interface AssignmentObjectivesStepProps {
  objectives: AssignmentObjective[];
  objectiveErrors: Record<string, { text?: string }>;
  stepError?: string | null;
  suggestions: string[];
  suggestionsState: ObjectiveSuggestionsState;
  suggestionsError?: string | null;
  canSuggestObjectives: boolean;
  suggestObjectivesHint?: string | null;
  validObjectivesCount: number;
  hasBloomLevels: boolean;
  hasCategories: boolean;
  objectiveCoverage: Record<string, number>;
  focusObjectiveId?: string | null;
  onBack: () => void;
  onNext: () => void;
  onAddObjective: () => void;
  onSuggestObjectives: () => void;
  onAddSuggestedObjective: (text: string) => void;
  onUpdateObjective: (id: string, updates: Partial<AssignmentObjective>) => void;
  onRemoveObjective: (id: string) => void;
  onMoveObjective: (id: string, direction: 'up' | 'down') => void;
  onBlurObjective: (id: string) => void;
}

export default function AssignmentObjectivesStep({
  objectives,
  objectiveErrors,
  stepError,
  suggestions,
  suggestionsState,
  suggestionsError,
  canSuggestObjectives,
  suggestObjectivesHint,
  validObjectivesCount,
  hasBloomLevels,
  hasCategories,
  objectiveCoverage,
  focusObjectiveId,
  onBack,
  onNext,
  onAddObjective,
  onSuggestObjectives,
  onAddSuggestedObjective,
  onUpdateObjective,
  onRemoveObjective,
  onMoveObjective,
  onBlurObjective,
}: AssignmentObjectivesStepProps) {
  const objectiveInputRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const [showWhyObjectives, setShowWhyObjectives] = useState(false);

  useEffect(() => {
    if (!focusObjectiveId) return;
    const input = objectiveInputRefs.current[focusObjectiveId];
    if (!input) return;
    input.focus();
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusObjectiveId]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Step 2</p>
        <h2 className="text-[24px] font-semibold tracking-tight text-slate-900">Learning objectives</h2>
        <p className="text-sm leading-6 text-slate-600">What should your students take away from this? Good objectives make expectations clear.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-[#EAE4F2] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-slate-700">Aim for 2-4 clear, student-friendly objectives.</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onSuggestObjectives}
              disabled={!canSuggestObjectives || suggestionsState === 'loading'}
              isLoading={suggestionsState === 'loading'}
              leftIcon={<Sparkles size={14} />}
              className="h-9 rounded-lg border-[#DCCFEC] bg-white text-[#68507B]"
              title={!canSuggestObjectives ? suggestObjectivesHint ?? undefined : undefined}
            >
              {suggestionsState === 'loading' ? 'Generating...' : 'Suggest objectives'}
            </Button>
            <button
              type="button"
              onClick={() => setShowWhyObjectives((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[#68507B] transition-colors hover:bg-white/70"
            >
              <Info size={13} />
              Why objectives matter
            </button>
          </div>
        </div>
        {!canSuggestObjectives && suggestObjectivesHint && (
          <p className="mt-2 text-xs text-[#68507B]">{suggestObjectivesHint}</p>
        )}
        <p className="mt-2 text-xs text-[#68507B]">Elora suggests ideas; you stay in control.</p>
        {showWhyObjectives && (
          <p className="mt-2 rounded-lg border border-white/80 bg-white/80 px-3 py-2 text-xs leading-5 text-slate-700">
            Good objectives make your expectations clear. They help students see what success looks like and guide how you design tasks.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Valid objectives</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{validObjectivesCount} of {objectives.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Bloom tagging</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{hasBloomLevels ? 'Added' : 'Not added yet'}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Category tagging</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{hasCategories ? 'Added' : 'Not added yet'}</p>
        </div>
      </div>

      {stepError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {stepError}
        </div>
      )}

      <section className="rounded-xl border border-[#E2E8F0] bg-white p-4">
        <div className="mb-3 flex items-center gap-2 border-l-4 border-[#8D769A] pl-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">Learning objectives</p>
        </div>

        <div className="space-y-3">
          {objectives.map((objective, index) => {
            const error = objectiveErrors[objective.id]?.text;
            const linkedCount = objectiveCoverage[objective.id] ?? 0;
            return (
              <div key={objective.id} className="rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-[inset_0_2px_0_rgba(15,23,42,0.03)] md:p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex rounded-full border border-[#DCCFEC] bg-[#F4EDF9] px-2.5 py-0.5 text-[11px] font-semibold text-[#68507B]">
                      Objective {index + 1}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                        linkedCount > 0
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-100 text-slate-600'
                      }`}
                    >
                      {linkedCount > 0 ? `Linked to ${linkedCount} task${linkedCount > 1 ? 's' : ''}` : 'Not linked yet'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onMoveObjective(objective.id, 'up')}
                      className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Move objective up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveObjective(objective.id, 'down')}
                      className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Move objective down"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveObjective(objective.id)}
                      className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-600"
                      aria-label="Remove objective"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-[6px] block text-xs font-medium text-slate-600">Objective text</label>
                    <textarea
                      ref={(element) => {
                        objectiveInputRefs.current[objective.id] = element;
                      }}
                      value={objective.text}
                      rows={3}
                      placeholder="Students will be able to..."
                      onChange={(event) => onUpdateObjective(objective.id, { text: event.target.value })}
                      onBlur={() => onBlurObjective(objective.id)}
                      className={`w-full rounded-lg border bg-white px-3 py-2.5 text-[14px] text-slate-800 outline-none transition-colors focus:border-[#14b8a6]/60 focus:ring-0 shadow-[inset_0_2px_0_rgba(15,23,42,0.04)] ${
                        error ? 'border-red-300 bg-red-50/30' : 'border-[#E2E8F0]'
                      }`}
                    />
                    {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
                  </div>

                  <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-2">
                    <div>
                      <label className="mb-[6px] block text-xs font-medium text-slate-600">Bloom level</label>
                      <select
                        value={objective.bloomLevel ?? ''}
                        onChange={(event) => onUpdateObjective(objective.id, { bloomLevel: event.target.value ? (event.target.value as AssignmentObjective['bloomLevel']) : undefined })}
                        className="h-10 w-full appearance-none rounded-lg border border-[#E2E8F0] bg-white px-3 text-[14px] text-slate-800 outline-none transition-colors focus:border-[#14b8a6]/60 focus:ring-0"
                      >
                        <option value="">Select level</option>
                        {BLOOM_LEVEL_OPTIONS.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-[6px] block text-xs font-medium text-slate-600">Category / strand</label>
                      <input
                        value={objective.category ?? ''}
                        placeholder="Number & Operations"
                        onChange={(event) => onUpdateObjective(objective.id, { category: event.target.value || undefined })}
                        className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-[14px] text-slate-800 outline-none transition-colors focus:border-[#14b8a6]/60 focus:ring-0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="rounded-xl border border-[#E2E8F0] bg-slate-50 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles size={14} className="text-[#68507B]" />
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Suggestions (optional)</p>
        </div>
        {suggestionsState === 'error' && suggestionsError ? (
          <p className="text-xs text-red-700">{suggestionsError}</p>
        ) : suggestionsState === 'loading' ? (
          <p className="text-xs text-slate-500">Generating suggestions...</p>
        ) : suggestions.length > 0 ? (
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <div key={suggestion} className="flex items-start justify-between gap-3 rounded-lg border border-[#DCCFEC] bg-white px-3 py-2.5">
                <p className="text-sm text-slate-700">{suggestion}</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onAddSuggestedObjective(suggestion)}
                  className="h-8 shrink-0 rounded-md border-[#DCCFEC] bg-[#F4EDF9] text-[#68507B]"
                >
                  Use this
                </Button>
              </div>
            ))}
          </div>
        ) : suggestionsState === 'success' ? (
          <p className="text-xs text-slate-500">No suggestions right now. You can still write your own objectives.</p>
        ) : (
          <p className="text-xs text-slate-500">You can write your own objectives, or use AI to get suggestions based on your topic.</p>
        )}
      </div>

      <div className="border-t border-[#E2E8F0] pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft size={15} className="mr-1" />
            Back
          </button>

          <Button
            type="button"
            variant="secondary"
            onClick={onAddObjective}
            leftIcon={<Plus size={15} />}
            className="h-10 rounded-lg border-slate-200 bg-white text-slate-700"
          >
            Add objective
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={onNext}
            rightIcon={<ArrowRight size={16} strokeWidth={1.5} />}
            className="h-11 rounded-full px-5 [background-color:#14b8a6] text-white shadow-[0_0_0_1px_rgba(20,184,166,0.38),0_10px_24px_rgba(20,184,166,0.3)]"
          >
            Next: Tasks
          </Button>
        </div>
      </div>
    </div>
  );
}
