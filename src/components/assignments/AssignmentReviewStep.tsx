import React, { useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Clock3, FileText, GraduationCap, Sparkles, Lightbulb } from 'lucide-react';
import { Button } from '../ui/Button';
import { type AssignmentAttachment, type AssignmentClassOption, type AssignmentObjective, type AssignmentTask, type AssignmentBasicsState, type AssignmentWizardReport } from './assignmentWizardTypes';

interface AssignmentReviewStepProps {
  basics: AssignmentBasicsState;
  objectives: AssignmentObjective[];
  tasks: AssignmentTask[];
  attachments: AssignmentAttachment[];
  classes: AssignmentClassOption[];
  reviewSummary: string;
  wizardReport: AssignmentWizardReport;
  objectiveCoverage: Record<string, number>;
  totalEstimatedMinutes: number;
  reviewError?: string | null;
  reviewNotice?: string | null;
  isSubmittingMode: 'idle' | 'draft' | 'publish';
  hasRetryableUploads: boolean;
  onBack: () => void;
  onEditStep: (step: 1 | 2 | 3) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onRetryUploads: () => void;
  onFinishWithPendingUploads: () => void;
  reviewFeedback?: string[] | null;
  isReviewFeedbackLoading?: boolean;
  reviewFeedbackError?: string | null;
  onGetReviewFeedback?: () => void;
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function AssignmentReviewStep({
  basics,
  objectives,
  tasks,
  attachments,
  classes,
  reviewSummary,
  wizardReport,
  objectiveCoverage,
  totalEstimatedMinutes,
  reviewError,
  reviewNotice,
  isSubmittingMode,
  hasRetryableUploads,
  onBack,
  onEditStep,
  onSaveDraft,
  onPublish,
  onRetryUploads,
  onFinishWithPendingUploads,
  reviewFeedback,
  isReviewFeedbackLoading,
  reviewFeedbackError,
  onGetReviewFeedback,
}: AssignmentReviewStepProps) {
  const [expandedSourceMaterial, setExpandedSourceMaterial] = useState(false);

  const selectedClass = useMemo(
    () => (basics.classId ? classes.find((classItem) => classItem.id === basics.classId) ?? null : null),
    [basics.classId, classes],
  );

  const resolvedEstimatedDuration = totalEstimatedMinutes > 0 ? totalEstimatedMinutes : basics.estimatedDuration ?? null;

  const sourceMaterialPreview = expandedSourceMaterial
    ? basics.sourceMaterial
    : basics.sourceMaterial.split('\n').slice(0, 3).join('\n');

  const qualitySummary =
    wizardReport.tasks.objectivesCoverage.total > 0 &&
    wizardReport.tasks.objectivesCoverage.covered === wizardReport.tasks.objectivesCoverage.total
      ? `This assignment covers all ${wizardReport.tasks.objectivesCoverage.total} objectives with ${wizardReport.tasks.validCount} tasks. It looks ready to go.`
      : `${wizardReport.tasks.objectivesCoverage.total - wizardReport.tasks.objectivesCoverage.covered} objective${wizardReport.tasks.objectivesCoverage.total - wizardReport.tasks.objectivesCoverage.covered === 1 ? " isn't" : 's are not'} linked to any task. You can update your tasks or publish anyway.`;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Step 4</p>
        <h2 className="text-[24px] font-semibold tracking-tight text-slate-900">Preview and finalize</h2>
        <p className="text-sm leading-6 text-slate-600">Take a final look. Elora can help you spot any gaps or refine the workload before you assign.</p>
        <p className="text-xs text-slate-500">{reviewSummary}</p>
      </div>

      {/* ── AI Quality Coach ── */}
      <div className="rounded-xl border border-[#E2E8F0] bg-[#FAF8FC] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#68507B]" />
            <p className="text-sm font-semibold tracking-tight text-slate-900">Improve this assignment</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={onGetReviewFeedback}
            disabled={isReviewFeedbackLoading}
            isLoading={isReviewFeedbackLoading}
            className="h-9 rounded-lg border-[#DCCFEC] bg-white text-[#68507B]"
          >
            {isReviewFeedbackLoading ? 'Analyzing...' : reviewFeedback ? 'Get new feedback' : 'Get feedback'}
          </Button>
        </div>

        {!reviewFeedback && !isReviewFeedbackLoading && !reviewFeedbackError && (
          <p className="mt-2 text-sm text-slate-600">
            Have Elora check your objectives, tasks, and instructions for clarity and workload.
          </p>
        )}

        {reviewFeedbackError && (
          <p className="mt-2 text-sm text-red-600">{reviewFeedbackError}</p>
        )}

        {reviewFeedback && reviewFeedback.length > 0 && !isReviewFeedbackLoading && (
          <div className="mt-3 space-y-2">
            {reviewFeedback.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-[#DCCFEC] bg-white p-3 shadow-sm">
                <Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-500" />
                <p className="text-sm text-slate-700">{tip}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <section className="rounded-xl border border-[#E2E8F0] bg-slate-50 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
            <GraduationCap size={13} />
            {selectedClass?.name ?? 'No class selected'}
          </span>
          {basics.subject && (
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
              {basics.subject}
            </span>
          )}
          {basics.topic && (
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
              {basics.topic}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
            <CalendarDays size={13} />
            {basics.dueDate || 'No due date'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
            <Clock3 size={13} />
            {resolvedEstimatedDuration ? `${resolvedEstimatedDuration} minutes` : 'Duration not set'}
          </span>
        </div>
      </section>

      <section className="rounded-xl border border-[#E2E8F0] bg-[#F7F5ED] p-4">
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Student preview</p>
            <p className="mt-1 text-xs text-slate-600">This is approximately what your students will see when they open this assignment.</p>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{basics.topic || 'Untitled assignment'}</h3>
            <p className="mt-1 text-sm text-slate-600">Due: {basics.dueDate || 'No due date set'}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Learning objectives</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {objectives.length > 0 ? (
                objectives.map((objective) => <li key={`student-${objective.id}`}>{objective.text || 'Untitled objective'}</li>)
              ) : (
                <li>No objectives added yet.</li>
              )}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Tasks</p>
            <ol className="mt-1 space-y-2 text-sm text-slate-700">
              {tasks.length > 0 ? (
                tasks.map((task, index) => (
                  <li key={`student-task-${task.id}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="font-medium text-slate-800">{index + 1}. {task.title || 'Untitled task'}</p>
                    <p className="mt-1 text-slate-600">{task.description || 'Task instructions will appear here.'}</p>
                  </li>
                ))
              ) : (
                <li>No tasks added yet.</li>
              )}
            </ol>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Materials</p>
            {attachments.length > 0 ? (
              <ul className="mt-1 space-y-1 text-sm text-slate-700">
                {attachments.map((attachment) => (
                  <li key={`student-attachment-${attachment.id}`} className="flex items-center gap-2">
                    <FileText size={14} className="text-slate-400" />
                    <span>{attachment.filename}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-slate-600">No attachments added.</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#E2E8F0] bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Quality report</p>
          <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700">
            Readiness score {wizardReport.overallPersonalizationScore}/100
          </span>
        </div>

        <p className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">{qualitySummary}</p>

        <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700">
            {wizardReport.basics.hasTopic && wizardReport.basics.hasDueDate
              ? 'Basics complete'
              : `Missing basics: ${!wizardReport.basics.hasTopic ? 'topic' : 'due date'}`}
          </p>
          <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700">
            Objectives ready: {wizardReport.objectives.validCount} of {wizardReport.objectives.count}
          </p>
          <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700">
            Tasks ready: {wizardReport.tasks.validCount} of {wizardReport.tasks.count}
          </p>
          <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700">
            {wizardReport.tasks.objectivesCoverage.covered === wizardReport.tasks.objectivesCoverage.total && wizardReport.tasks.objectivesCoverage.total > 0
              ? 'All objectives linked'
              : `${wizardReport.tasks.objectivesCoverage.total - wizardReport.tasks.objectivesCoverage.covered} objective${wizardReport.tasks.objectivesCoverage.total - wizardReport.tasks.objectivesCoverage.covered === 1 ? ' not linked yet' : 's not linked yet'}`}
          </p>
          <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 md:col-span-2">
            {wizardReport.attachments.count > 0
              ? `Attachments added: ${wizardReport.attachments.count}`
              : 'No attachments added (optional).'}
          </p>
        </div>

        {wizardReport.potentialGaps.length > 0 ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-800">Potential gaps</p>
            <ul className="mt-1 space-y-1 text-sm text-amber-900">
              {wizardReport.potentialGaps.map((gap) => (
                <li key={gap}>- {gap}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            No major gaps detected. This assignment looks well structured.
          </p>
        )}
      </section>

      {reviewError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {reviewError}
        </div>
      )}

      {reviewNotice && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
          {reviewNotice}
        </div>
      )}

      <div className="space-y-3">
        <section className="rounded-xl border border-[#E2E8F0] bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Basics</p>
            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="rounded-md px-2 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              Edit basics
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-2">
            <p><span className="font-semibold text-slate-900">Class:</span> {selectedClass?.name ?? 'No class selected'}</p>
            <p><span className="font-semibold text-slate-900">Subject:</span> {basics.subject || 'Not set'}</p>
            <p><span className="font-semibold text-slate-900">Level:</span> {basics.level || 'Not set'}</p>
            <p><span className="font-semibold text-slate-900">Topic:</span> {basics.topic || 'Not set'}</p>
            <p><span className="font-semibold text-slate-900">Due date:</span> {basics.dueDate || 'Not set'}</p>
            <p><span className="font-semibold text-slate-900">Estimated duration:</span> {resolvedEstimatedDuration ? `${resolvedEstimatedDuration} minutes` : 'Not set'}</p>
          </div>

          <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Source material</p>
            {basics.sourceMaterial ? (
              <>
                <p className="whitespace-pre-wrap text-sm text-slate-700">{sourceMaterialPreview}</p>
                {basics.sourceMaterial.split('\n').length > 3 && (
                  <button
                    type="button"
                    onClick={() => setExpandedSourceMaterial((prev) => !prev)}
                    className="mt-2 rounded-md px-2 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    {expandedSourceMaterial ? 'Show less' : 'Show more'}
                  </button>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">No source material provided.</p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-[#E2E8F0] bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Objectives</p>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="rounded-md px-2 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              Edit objectives
            </button>
          </div>

          <ol className="space-y-2">
            {objectives.map((objective, index) => {
              const linkedCount = objectiveCoverage[objective.id] ?? 0;
              return (
                <li key={objective.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <p className="text-sm text-slate-800">
                    <span className="mr-2 font-semibold text-slate-500">{index + 1}.</span>
                    {objective.text || 'Untitled objective'}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {objective.bloomLevel && (
                      <span className="rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800">
                        {objective.bloomLevel}
                      </span>
                    )}
                    {objective.category && (
                      <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        {objective.category}
                      </span>
                    )}
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                        linkedCount > 0
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-100 text-slate-500'
                      }`}
                    >
                      {linkedCount > 0 ? `✓ ${linkedCount} task(s)` : '• No tasks yet'}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="rounded-xl border border-[#E2E8F0] bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Tasks</p>
            <button
              type="button"
              onClick={() => onEditStep(3)}
              className="rounded-md px-2 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              Edit tasks
            </button>
          </div>

          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="text-sm font-semibold text-slate-800">{task.title || 'Untitled task'}</p>
                {task.description && <p className="mt-1 text-sm text-slate-700">{task.description}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {task.type && (
                    <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                      {task.type}
                    </span>
                  )}
                  {typeof task.estimatedMinutes === 'number' && (
                    <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                      {task.estimatedMinutes} min
                    </span>
                  )}
                  {task.objectiveIds.map((objectiveId) => {
                    const objectiveText = objectives.find((objective) => objective.id === objectiveId)?.text ?? 'Objective';
                    return (
                      <span
                        key={`${task.id}-${objectiveId}`}
                        title={objectiveText}
                        className="max-w-[220px] truncate rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800"
                      >
                        {objectiveText}
                      </span>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-[#E2E8F0] bg-slate-50 p-4">
          <p className="mb-3 border-b border-slate-200 pb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Attachments</p>
          {attachments.length > 0 ? (
            <ul className="space-y-2">
              {attachments.map((attachment) => (
                <li key={attachment.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText size={14} className="text-slate-400" />
                    <p className="truncate text-sm text-slate-700">{attachment.filename}</p>
                  </div>
                  <p className="text-xs text-slate-500">{formatBytes(attachment.sizeBytes)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No files attached.</p>
          )}
        </section>
      </div>

      <div className="border-t border-[#E2E8F0] pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft size={15} className="mr-1" />
            Back: Tasks
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {hasRetryableUploads && (
              <>
                <Button type="button" variant="secondary" onClick={onRetryUploads} className="h-10 rounded-lg border-slate-200 bg-white text-slate-700">
                  Retry uploads
                </Button>
                <Button type="button" variant="ghost" onClick={onFinishWithPendingUploads} className="h-10 rounded-lg px-4 text-slate-600">
                  Finish anyway
                </Button>
              </>
            )}

            <Button
              type="button"
              variant="secondary"
              onClick={onSaveDraft}
              isLoading={isSubmittingMode === 'draft'}
              className="h-10 rounded-lg border-slate-200 bg-white text-slate-700"
            >
              Save as draft
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={onPublish}
              isLoading={isSubmittingMode === 'publish'}
              className="h-11 rounded-full px-5 [background-color:#14b8a6] text-white shadow-[0_0_0_1px_rgba(20,184,166,0.38),0_10px_24px_rgba(20,184,166,0.3)]"
            >
              Publish assignment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
