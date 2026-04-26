import React, { useEffect, useRef } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Clock3, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { TASK_TYPE_OPTIONS, type AssignmentObjective, type AssignmentTask, type TaskFieldError } from './assignmentWizardTypes';

interface AssignmentTasksStepProps {
  tasks: AssignmentTask[];
  objectives: AssignmentObjective[];
  taskErrors: Record<string, TaskFieldError>;
  stepError?: string | null;
  focusTaskId?: string | null;
  validTasksCount: number;
  coveredObjectivesCount: number;
  totalObjectivesCount: number;
  unlinkedObjectivesCount: number;
  totalEstimatedMinutes: number;
  fallbackEstimatedMinutes: number | null;
  onBack: () => void;
  onNext: () => void;
  onAddTask: () => void;
  onAddQuickTask: (preset: 'warmup' | 'main' | 'reflection') => void;
  onUpdateTask: (id: string, updates: Partial<AssignmentTask>) => void;
  onRemoveTask: (id: string) => void;
  onMoveTask: (id: string, direction: 'up' | 'down') => void;
  onBlurTaskField: (id: string, field: keyof TaskFieldError) => void;
  /** Called when the teacher clicks "Generate task plan". Parent handles demo gating. */
  onSuggestTasksPlan: () => void | Promise<void>;
  isSuggestTasksLoading?: boolean;
  suggestTasksError?: string | null;
}

const toOneLine = (value: string) => {
  if (value.length <= 72) return value;
  return `${value.slice(0, 72)}...`;
};

export default function AssignmentTasksStep({
  tasks,
  objectives,
  taskErrors,
  stepError,
  focusTaskId,
  validTasksCount,
  coveredObjectivesCount,
  totalObjectivesCount,
  unlinkedObjectivesCount,
  totalEstimatedMinutes,
  fallbackEstimatedMinutes,
  onBack,
  onNext,
  onAddTask,
  onAddQuickTask,
  onUpdateTask,
  onRemoveTask,
  onMoveTask,
  onBlurTaskField,
  onSuggestTasksPlan,
  isSuggestTasksLoading = false,
  suggestTasksError = null,
}: AssignmentTasksStepProps) {
  const taskTitleRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!focusTaskId) return;
    const input = taskTitleRefs.current[focusTaskId];
    if (!input) return;
    input.focus();
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusTaskId]);

  const shownTotalMinutes = totalEstimatedMinutes > 0 ? totalEstimatedMinutes : fallbackEstimatedMinutes ?? 0;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Step 3</p>
        <h2 className="text-[24px] font-semibold tracking-tight text-slate-900">Assignment tasks</h2>
        <p className="text-sm leading-6 text-slate-600">Let's build the journey. Break this assignment into manageable steps for your students.</p>
      </div>

      <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
        Start with a warm-up, then your main activity, and finish with a quick wrap-up or reflection if you like.
      </p>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Valid tasks</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{validTasksCount} of {tasks.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Objective coverage</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{coveredObjectivesCount} of {totalObjectivesCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Estimated time</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{shownTotalMinutes} min</p>
        </div>
      </div>

      {stepError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {stepError}
        </div>
      )}

      <div className="rounded-xl border border-[#E2E8F0] bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Task summary</p>
            <p className="mt-1 text-sm text-slate-700">Tasks: {validTasksCount} of {tasks.length} complete</p>
          </div>
          <Sparkles size={14} className="text-emerald-700" />
        </div>
        <p className="mt-1 text-sm text-slate-700">Objective coverage: {coveredObjectivesCount} of {totalObjectivesCount} objectives linked to at least one task.</p>
        <p className="mt-1 text-sm text-slate-700">Estimated total time: {shownTotalMinutes} minutes.</p>
        {unlinkedObjectivesCount > 0 && (
          <p className="mt-1 text-xs font-medium text-amber-700">
            {unlinkedObjectivesCount} objective{unlinkedObjectivesCount > 1 ? 's are' : ' is'} still not linked to a task.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
        <div className="mb-3 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">Student tasks</p>
        </div>
        <p className="text-xs text-slate-500">Be specific - students should know exactly what to do for each task.</p>

        {/* ── Generate task plan ── */}
        <div className="mt-3">
          <button
            type="button"
            id="btn-generate-task-plan"
            onClick={() => void onSuggestTasksPlan()}
            disabled={isSuggestTasksLoading}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              isSuggestTasksLoading
                ? 'cursor-not-allowed border-emerald-200 bg-emerald-50 text-emerald-400'
                : 'border-emerald-500 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800'
            }`}
          >
            <Sparkles size={14} className={isSuggestTasksLoading ? 'animate-pulse' : ''} />
            {isSuggestTasksLoading ? 'Generating…' : 'Generate task plan'}
          </button>

          {suggestTasksError && (
            <p className="mt-2 text-xs text-amber-700">{suggestTasksError}</p>
          )}
        </div>

        {/* ── Quick-add buttons ── */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onAddQuickTask('warmup')}
            className="h-9 rounded-full border-emerald-200 bg-white text-emerald-800"
          >
            Add warm-up
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onAddQuickTask('main')}
            className="h-9 rounded-full border-emerald-200 bg-white text-emerald-800"
          >
            Add main task
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onAddQuickTask('reflection')}
            className="h-9 rounded-full border-emerald-200 bg-white text-emerald-800"
          >
            Add reflection
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task, index) => {
          const error = taskErrors[task.id] ?? {};
          return (
            <div key={task.id} className="rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-[inset_0_2px_0_rgba(15,23,42,0.03)] md:p-4">
              <div className="mb-3 flex items-start justify-between gap-3 border-l-4 border-emerald-500 pl-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">Task {index + 1}</p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onMoveTask(task.id, 'up')}
                    className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Move task up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveTask(task.id, 'down')}
                    className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Move task down"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveTask(task.id)}
                    className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-600"
                    aria-label="Remove task"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                  <div className="md:col-span-5">
                  <label className="mb-[6px] block text-xs font-medium text-slate-600">Task title</label>
                  <input
                    ref={(element) => {
                      taskTitleRefs.current[task.id] = element;
                    }}
                    value={task.title}
                    placeholder="Quick check: Comparing fractions"
                    onChange={(event) => onUpdateTask(task.id, { title: event.target.value })}
                    onBlur={() => onBlurTaskField(task.id, 'title')}
                    className={`h-11 w-full rounded-lg border bg-white px-3 text-[14px] text-slate-800 outline-none transition-colors focus:border-[#14b8a6]/60 focus:ring-0 shadow-[inset_0_2px_0_rgba(15,23,42,0.04)] ${
                      error.title ? 'border-red-300 bg-red-50/30' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {error.title && <p className="mt-1 text-xs font-medium text-red-600">{error.title}</p>}
                  </div>

                  <div className="md:col-span-4">
                  <label className="mb-[6px] block text-xs font-medium text-slate-600">Task type</label>
                  <select
                    value={task.type ?? ''}
                    onChange={(event) => onUpdateTask(task.id, { type: event.target.value ? (event.target.value as AssignmentTask['type']) : undefined })}
                    className="h-11 w-full appearance-none rounded-lg border border-[#E2E8F0] bg-white px-3 text-[14px] text-slate-800 outline-none transition-colors focus:border-[#14b8a6]/60 focus:ring-0 shadow-[inset_0_2px_0_rgba(15,23,42,0.04)]"
                  >
                    <option value="">Select type</option>
                    {TASK_TYPE_OPTIONS.map((typeOption) => (
                      <option key={typeOption} value={typeOption}>
                        {typeOption}
                      </option>
                    ))}
                  </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="mb-[6px] flex items-center gap-1 text-xs font-medium text-slate-600">
                      <Clock3 size={13} />
                      Estimated minutes
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={task.estimatedMinutes ?? ''}
                      onChange={(event) => {
                        const value = event.target.value;
                        onUpdateTask(task.id, { estimatedMinutes: value ? Number(value) : undefined });
                      }}
                      className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-[14px] text-slate-800 outline-none transition-colors focus:border-[#14b8a6]/60 focus:ring-0 shadow-[inset_0_2px_0_rgba(15,23,42,0.04)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-[6px] block text-xs font-medium text-slate-600">Instructions</label>
                  <textarea
                    value={task.description}
                    rows={3}
                    placeholder="Describe exactly what students should do and how they should submit their work."
                    onChange={(event) => onUpdateTask(task.id, { description: event.target.value })}
                    onBlur={() => onBlurTaskField(task.id, 'description')}
                    className={`w-full rounded-lg border bg-white px-3 py-2.5 text-[14px] text-slate-800 outline-none transition-colors focus:border-[#14b8a6]/60 focus:ring-0 shadow-[inset_0_2px_0_rgba(15,23,42,0.04)] ${
                      error.description ? 'border-red-300 bg-red-50/30' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {error.description && <p className="mt-1 text-xs font-medium text-red-600">{error.description}</p>}
                </div>

                <div>
                    <p className="mb-[6px] block text-xs font-medium text-slate-600">Linked objectives</p>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {objectives.map((objective) => {
                        const selected = task.objectiveIds.includes(objective.id);
                        return (
                          <label
                            key={`${task.id}-${objective.id}`}
                            title={objective.text}
                            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                              selected
                                ? 'border-teal-300 bg-teal-50 text-teal-800'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(event) => {
                                const nextIds = event.target.checked
                                  ? [...task.objectiveIds, objective.id]
                                  : task.objectiveIds.filter((id) => id !== objective.id);
                                onUpdateTask(task.id, { objectiveIds: nextIds });
                              }}
                              onBlur={() => onBlurTaskField(task.id, 'objectiveIds')}
                              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                            />
                            <span className="min-w-0 truncate">{toOneLine(objective.text)}</span>
                          </label>
                        );
                      })}
                    </div>
                    {error.objectiveIds && <p className="mt-1 text-xs font-medium text-red-600">{error.objectiveIds}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-[#E2E8F0] pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft size={15} className="mr-1" />
            Back: Objectives
          </button>

          <Button
            type="button"
            variant="secondary"
            onClick={onAddTask}
            leftIcon={<Plus size={15} />}
            className="h-10 rounded-lg border-slate-200 bg-white text-slate-700"
          >
            Add task
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={onNext}
            rightIcon={<ArrowRight size={16} strokeWidth={1.5} />}
            className="h-11 rounded-full px-5 [background-color:#14b8a6] text-white shadow-[0_0_0_1px_rgba(20,184,166,0.38),0_10px_24px_rgba(20,184,166,0.3)]"
          >
            Next: Review
          </Button>
        </div>
      </div>
    </div>
  );
}
