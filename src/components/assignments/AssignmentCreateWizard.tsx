import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Calendar, Check, ChevronDown, Clock, FileText, GraduationCap, ListChecks, Paperclip, Target, X } from 'lucide-react';
import { Button } from '../ui/Button';
import AssignmentObjectivesStep from './AssignmentObjectivesStep';
import AssignmentTasksStep from './AssignmentTasksStep';
import AssignmentReviewStep from './AssignmentReviewStep';
import { AuthGateModal } from '../auth/AuthGateModal';
import { useAuth } from '../../auth/AuthContext';
import { shouldGateCopilotAccess, useAuthGate } from '../../hooks/useAuthGate';
import { useDemoMode } from '../../hooks/useDemoMode';
import * as dataService from '../../services/dataService';
import {
  type AssignmentAttachment,
  type AssignmentBasicsState,
  type AssignmentClassOption,
  type AssignmentObjective,
  type AssignmentTask,
  type AssignmentWizardReport,
  type AssignmentWizardState,
  type AssignmentWizardStep,
  type BasicsErrors,
  type ObjectiveFieldError,
  type TaskFieldError,
  type ValidationResult,
} from './assignmentWizardTypes';

export type { AssignmentBasicsState, AssignmentClassOption, AssignmentWizardStep } from './assignmentWizardTypes';

type FocusedField = 'subject' | 'level' | 'topic' | 'dueDate' | 'estimatedDuration' | null;
type ObjectiveSuggestionsState = 'idle' | 'loading' | 'success' | 'error';

interface AssignmentCreateWizardProps {
  classes: AssignmentClassOption[];
  isLoadingClasses?: boolean;
  onCancel: () => void;
  onComplete?: () => void;
  onBasicsPreviewChange?: (basics: AssignmentBasicsState) => void;
}

interface AssignmentBasicsStepProps {
  basics: AssignmentBasicsState;
  errors: BasicsErrors;
  classes: AssignmentClassOption[];
  isLoadingClasses: boolean;
  attachedFiles: AssignmentAttachment[];
  focusedField: FocusedField;
  onChange: (updates: Partial<AssignmentBasicsState>) => void;
  onAttachFiles: (files: FileList | File[]) => void;
  onRemoveAttachedFile: (id: string) => void;
  onFocusField: (field: Exclude<FocusedField, null>) => void;
  onBlurFocusedField: () => void;
  onBlurRequiredField: (field: 'topic' | 'dueDate') => void;
  onNext: () => void;
  onCancel: () => void;
}

const stepLabels: Array<{
  step: AssignmentWizardStep;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  activeBackground: string;
  accent: string;
}> = [
  { step: 1, title: 'Basics', icon: BookOpen, activeBackground: 'var(--accent-teal-soft)', accent: 'var(--accent-teal)' },
  { step: 2, title: 'Objectives', icon: Target, activeBackground: 'var(--elora-info-bg)', accent: 'var(--elora-secondary)' },
  { step: 3, title: 'Tasks', icon: ListChecks, activeBackground: 'var(--elora-success-bg)', accent: 'var(--toast-success)' },
  { step: 4, title: 'Review', icon: FileText, activeBackground: 'var(--surface-alt)', accent: 'var(--accent-teal)' },
];

const initialWizardState: AssignmentWizardState = {
  basics: {
    classId: null,
    subject: '',
    level: '',
    topic: '',
    dueDate: '',
    estimatedDuration: null,
    sourceMaterial: '',
  },
  objectives: [],
  tasks: [],
  attachments: [],
};

const labelClassName = 'mb-[6px] block text-xs font-medium text-[var(--elora-text-muted)]';
const inputBaseClassName = "h-11 w-full rounded-lg border border-[var(--elora-border-subtle)] bg-[var(--elora-surface-main)] pl-10 pr-3 text-[14px] text-[var(--elora-text-strong)] outline-none transition-colors focus:border-[var(--elora-primary)]/60 focus:ring-0 shadow-[inset_0_2px_0_rgba(15,23,42,0.04)]";

const inferClassLevel = (classOption: AssignmentClassOption | null) => {
  if (!classOption) return '';
  if (classOption.level?.trim()) return classOption.level.trim();
  return classOption.name.match(/(Sec\s*\d+|Grade\s*\d+|Year\s*\d+)/i)?.[0] ?? '';
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const generateClientId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const normalizeObjectiveOrder = (objectives: AssignmentObjective[]) =>
  [...objectives]
    .sort((a, b) => a.order - b.order)
    .map((objective, index) => ({ ...objective, order: index }));

const normalizeTaskOrder = (tasks: AssignmentTask[]) =>
  [...tasks]
    .sort((a, b) => a.order - b.order)
    .map((task, index) => ({ ...task, order: index }));

const createObjective = (text: string, order: number, source: AssignmentObjective['source']): AssignmentObjective => ({
  id: generateClientId(),
  text,
  order,
  source,
});

const createTask = (
  order: number,
  objectiveIds: string[],
  source: AssignmentTask['source'],
  title = '',
  description = '',
): AssignmentTask => ({
  id: generateClientId(),
  title,
  description,
  objectiveIds,
  order,
  source,
});

function analyzeAssignmentWizard(state: AssignmentWizardState): AssignmentWizardReport {
  const validObjectives = state.objectives.filter((objective) => objective.text.trim().length > 0);
  const validTasks = state.tasks.filter(
    (task) => task.title.trim().length > 0 && task.description.trim().length > 0 && task.objectiveIds.length > 0,
  );

  const objectiveIdSet = new Set(validObjectives.map((objective) => objective.id));
  const coveredObjectiveIds = new Set<string>();

  state.tasks.forEach((task) => {
    task.objectiveIds.forEach((objectiveId) => {
      if (objectiveIdSet.has(objectiveId)) {
        coveredObjectiveIds.add(objectiveId);
      }
    });
  });

  const estimatedMinutesValues = state.tasks
    .map((task) => task.estimatedMinutes)
    .filter((minutes): minutes is number => typeof minutes === 'number' && Number.isFinite(minutes) && minutes > 0);

  const averageEstimatedMinutes = estimatedMinutesValues.length > 0
    ? Math.round(estimatedMinutesValues.reduce((sum, minutes) => sum + minutes, 0) / estimatedMinutesValues.length)
    : null;

  let score = 0;
  if (state.basics.classId) score += 20;
  if (state.basics.level.trim()) score += 10;
  if (state.basics.subject.trim()) score += 10;
  if (state.basics.topic.trim()) score += 10;
  if (state.basics.dueDate.trim()) score += 10;
  if (validObjectives.length >= 2) score += 15;
  if (validTasks.length >= 2) score += 15;
  if (coveredObjectiveIds.size === validObjectives.length && validObjectives.length > 0) score += 10;

  const potentialGaps: string[] = [];
  if (!state.basics.classId) potentialGaps.push('No class selected.');
  if (!state.basics.level.trim()) potentialGaps.push('Level/grade is missing.');
  if (validObjectives.length < 2) potentialGaps.push('Add at least 2 learning objectives.');
  if (validTasks.length < 2) potentialGaps.push('Add at least 2 tasks with clear instructions.');
  if (coveredObjectiveIds.size < validObjectives.length) potentialGaps.push('Some objectives are not linked to tasks.');

  return {
    basics: {
      hasClass: Boolean(state.basics.classId),
      hasSubject: state.basics.subject.trim().length > 0,
      hasLevel: state.basics.level.trim().length > 0,
      hasDueDate: state.basics.dueDate.trim().length > 0,
      hasTopic: state.basics.topic.trim().length > 0,
    },
    objectives: {
      count: state.objectives.length,
      validCount: validObjectives.length,
      hasBloomLevels: validObjectives.some((objective) => Boolean(objective.bloomLevel)),
      hasCategories: validObjectives.some((objective) => Boolean(objective.category?.trim())),
    },
    tasks: {
      count: state.tasks.length,
      validCount: validTasks.length,
      averageEstimatedMinutes,
      objectivesCoverage: {
        covered: coveredObjectiveIds.size,
        total: validObjectives.length,
      },
    },
    attachments: {
      count: state.attachments.length,
      files: state.attachments.map((attachment) => ({
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
      })),
    },
    potentialGaps,
    overallPersonalizationScore: Math.min(100, score),
  };
}

const FieldIcon = ({
  icon,
  isFocused,
}: {
  icon: React.ReactNode;
  isFocused: boolean;
}) => {
  return (
    <span className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isFocused ? 'text-teal-600' : 'text-slate-400'}`}>
      {icon}
    </span>
  );
};

const AssignmentBasicsStep = ({
  basics,
  errors,
  classes,
  isLoadingClasses,
  attachedFiles,
  focusedField,
  onChange,
  onAttachFiles,
  onRemoveAttachedFile,
  onFocusField,
  onBlurFocusedField,
  onBlurRequiredField,
  onNext,
  onCancel,
}: AssignmentBasicsStepProps) => {
  const dueDateInputId = 'assignment-due-date';
  const dueDateInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const canAdvance = basics.topic.trim().length > 0 && basics.dueDate.trim().length > 0;
  const selectedClass = basics.classId ? classes.find((classOption) => classOption.id === basics.classId) ?? null : null;
  const selectedClassLevel = inferClassLevel(selectedClass);
  const isSubjectLocked = Boolean(selectedClass?.subject);
  const isLevelLocked = Boolean(selectedClassLevel);

  const openDueDatePicker = () => {
    const inputEl = dueDateInputRef.current;
    if (!inputEl) return;
    inputEl.focus();
    if (typeof inputEl.showPicker === 'function') {
      inputEl.showPicker();
    }
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Step 1</p>
        <h2 className="text-[24px] font-semibold tracking-tight text-slate-900">Basics</h2>
        <p className="text-sm leading-6 text-slate-600">Let's set the scene. Who is this for, and what's the core focus?</p>
        <p className="text-xs text-slate-500">Elora will use these details to help tailor your objectives and tasks later on.</p>
      </div>

      <section className="rounded-xl border border-[var(--elora-border-subtle)] bg-[var(--elora-surface-alt)] p-4">
        <div className="mb-3 flex items-center gap-2 border-l-4 border-[#0D9488] pl-3">
          <BookOpen size={14} className="text-teal-700" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">Class and context</p>
        </div>
        <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-12">
          <div className="md:col-span-4">
            <label className={labelClassName}>Class</label>
            <div className="relative">
              <select
                value={basics.classId ?? ''}
                onChange={(event) => onChange({ classId: event.target.value || null })}
                className="h-11 w-full appearance-none rounded-lg border border-[var(--elora-border-subtle)] bg-[var(--elora-surface-main)] px-3 pr-9 text-[14px] text-[var(--elora-text-strong)] outline-none transition-colors focus:border-[var(--elora-primary)]/60 focus:ring-0 shadow-[inset_0_2px_0_rgba(15,23,42,0.04)] disabled:cursor-not-allowed disabled:bg-[var(--elora-surface-alt)] disabled:text-[var(--elora-text-muted)]"
                disabled={isLoadingClasses || classes.length === 0}
              >
                <option value="">
                  {isLoadingClasses
                    ? 'Loading classes...'
                    : classes.length === 0
                      ? 'No classes yet'
                      : 'Select a class'}
                </option>
                {classes.map((classOption) => {
                  const levelLabel = inferClassLevel(classOption);
                  const detailBits = [classOption.subject, levelLabel].filter(Boolean).join(' - ');
                  return (
                    <option key={classOption.id} value={classOption.id}>
                      {detailBits ? `${classOption.name} - ${detailBits}` : classOption.name}
                    </option>
                  );
                })}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <ChevronDown size={16} />
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">Optional. Helps Elora tailor suggestions to this group.</p>
            {errors.classId && <p className="mt-1 text-xs font-medium text-red-600">{errors.classId}</p>}
          </div>

          <div className="md:col-span-4">
            <label className={labelClassName}>Subject</label>
            <div className="relative">
              <FieldIcon icon={<BookOpen size={16} strokeWidth={1.5} />} isFocused={focusedField === 'subject'} />
              <input
                value={basics.subject}
                onChange={(event) => onChange({ subject: event.target.value })}
                onFocus={() => onFocusField('subject')}
                onBlur={onBlurFocusedField}
                placeholder="Mathematics"
                readOnly={isSubjectLocked}
                aria-readonly={isSubjectLocked}
                className={`${inputBaseClassName} ${isSubjectLocked ? 'bg-slate-50 text-slate-500' : ''}`}
              />
            </div>
          </div>

          <div className="md:col-span-4">
            <label className={labelClassName}>Level / grade</label>
            <div className="relative">
              <FieldIcon icon={<GraduationCap size={16} strokeWidth={1.5} />} isFocused={focusedField === 'level'} />
              <input
                value={basics.level}
                onChange={(event) => onChange({ level: event.target.value })}
                onFocus={() => onFocusField('level')}
                onBlur={onBlurFocusedField}
                placeholder="Grade 7"
                readOnly={isLevelLocked}
                aria-readonly={isLevelLocked}
                className={`${inputBaseClassName} ${isLevelLocked ? 'bg-slate-50 text-slate-500' : ''}`}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--elora-border-subtle)] bg-[var(--elora-surface-main)] p-4">
        <div className="mb-3 flex items-center gap-2 border-l-4 border-[#0D9488] pl-3">
          <Calendar size={14} className="text-teal-700" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">Assignment details</p>
        </div>
        <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-12">
          <div className="md:col-span-12">
            <label className={`${labelClassName} text-[var(--elora-text-strong)]`}>Topic / unit</label>
            <p className="mb-1 text-xs text-slate-500">In one sentence: what is this assignment about?</p>
            <div className="relative">
              <FieldIcon icon={<FileText size={16} strokeWidth={1.5} />} isFocused={focusedField === 'topic'} />
              <input
                value={basics.topic}
                onChange={(event) => onChange({ topic: event.target.value })}
                onFocus={() => onFocusField('topic')}
                onBlur={() => onBlurRequiredField('topic')}
                placeholder="Fractions and ratios"
                className={`${inputBaseClassName} ${errors.topic ? 'border-red-300 bg-red-50/30' : ''}`}
              />
            </div>
            {errors.topic && <p className="mt-1 text-xs font-medium text-red-600">{errors.topic}</p>}
          </div>

          <div className="md:col-span-6">
            <label className={labelClassName}>Due date</label>
            <div className="relative" onClick={openDueDatePicker}>
              <FieldIcon icon={<Calendar size={16} strokeWidth={1.5} />} isFocused={focusedField === 'dueDate'} />
              <input
                id={dueDateInputId}
                ref={dueDateInputRef}
                type="date"
                value={basics.dueDate}
                onChange={(event) => onChange({ dueDate: event.target.value })}
                onFocus={() => onFocusField('dueDate')}
                onBlur={() => {
                  onBlurFocusedField();
                  onBlurRequiredField('dueDate');
                }}
                className={`${inputBaseClassName} pr-12 [font-family:'Geist_Mono','JetBrains_Mono',ui-monospace,SFMono-Regular,Menlo,monospace] ${errors.dueDate ? 'border-red-300 bg-red-50/30' : ''}`}
              />
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  openDueDatePicker();
                }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Open due date picker"
              >
                <Calendar size={16} strokeWidth={1.6} />
              </button>
            </div>
            {errors.dueDate && <p className="mt-1 text-xs font-medium text-red-600">{errors.dueDate}</p>}
          </div>

          <div className="md:col-span-6">
            <label className={`${labelClassName} inline-flex items-center gap-1`}>
              <Clock size={13} />
              Estimated duration (minutes)
            </label>
            <div className="relative">
              <FieldIcon icon={<Clock size={16} strokeWidth={1.5} />} isFocused={focusedField === 'estimatedDuration'} />
              <input
                type="number"
                min={1}
                value={basics.estimatedDuration ?? ''}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  onChange({ estimatedDuration: nextValue === '' ? null : Number(nextValue) });
                }}
                onFocus={() => onFocusField('estimatedDuration')}
                onBlur={onBlurFocusedField}
                placeholder="45"
                className={`${inputBaseClassName} [font-family:'Geist_Mono','JetBrains_Mono',ui-monospace,SFMono-Regular,Menlo,monospace]`}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--elora-border-subtle)] bg-[var(--elora-surface-main)] p-4">
        <div className="mb-3 flex items-center gap-2 border-l-4 border-[#0D9488] pl-3">
          <Paperclip size={14} className="text-teal-700" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">Materials for this assignment</p>
        </div>
        <div className="md:col-span-12">
          <label className={labelClassName}>Source material</label>
          <div className="relative">
            <span className="absolute right-2.5 top-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              AI-Ready
            </span>
            <textarea
              value={basics.sourceMaterial}
              onChange={(event) => onChange({ sourceMaterial: event.target.value })}
              placeholder="Paste key notes, textbook excerpts, or a short brief to guide the next steps."
              rows={5}
              className="w-full rounded-lg border border-dashed border-[var(--elora-border-subtle)] bg-[var(--elora-surface-main)] px-3 py-2.5 pr-24 text-[14px] text-[var(--elora-text-strong)] outline-none transition-colors focus:border-[var(--elora-primary)]/60 focus:ring-0 shadow-[inset_0_2px_0_rgba(15,23,42,0.04)]"
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">Optional. Add notes, excerpts, or a short brief to guide objectives and tasks.</p>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.rtf,.csv,.md,.png,.jpg,.jpeg,.webp"
            onChange={(event) => {
              if (!event.target.files || event.target.files.length === 0) return;
              onAttachFiles(event.target.files);
              event.currentTarget.value = '';
            }}
          />

          <div className="mt-3 rounded-lg border border-[var(--elora-border-subtle)] bg-[var(--elora-surface-alt)] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">Optional. Add files like PDFs, slides, or docs relevant to this assignment.</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={triggerFilePicker}
                leftIcon={<Paperclip size={14} />}
                className="h-9 shrink-0 rounded-lg border-[var(--elora-border-subtle)] bg-[var(--elora-surface-main)] text-[var(--elora-text-secondary)]"
              >
                Attach file
              </Button>
            </div>

            {attachedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachedFiles.map((attachedFile) => (
                    <div
                    key={attachedFile.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-[var(--elora-border-subtle)] bg-[var(--elora-surface-main)] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-slate-700">{attachedFile.filename}</p>
                      <p className="text-[11px] text-slate-500">{formatBytes(attachedFile.sizeBytes)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveAttachedFile(attachedFile.id)}
                      className="rounded-md p-1 text-[var(--elora-text-muted)] transition-colors hover:bg-[var(--elora-surface-alt)] hover:text-[var(--elora-text-strong)]"
                      aria-label={`Remove ${attachedFile.filename}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <p className="text-xs text-slate-500">You can still create an assignment without linking it to a class.</p>

      <div className="border-t border-[var(--elora-border-subtle)] pt-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-[var(--elora-text-muted)] transition-colors hover:bg-[var(--elora-surface-alt)] hover:text-[var(--elora-text-strong)]"
          >
            Cancel
          </button>

          <div className="sticky bottom-3 z-10">
            <Button
              type="button"
              variant="primary"
              onClick={onNext}
              rightIcon={<ArrowRight size={16} strokeWidth={1.5} />}
              className={`h-11 rounded-full px-5 [background-color:#14b8a6] text-white transition-none ${
                canAdvance
                  ? 'opacity-100 shadow-[0_0_0_1px_rgba(20,184,166,0.38),0_10px_24px_rgba(20,184,166,0.3)]'
                  : 'opacity-50 shadow-none'
              }`}
              style={{ opacity: canAdvance ? 1 : 0.5 }}
            >
              Next: Objectives
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AssignmentCreateWizard({
  classes,
  isLoadingClasses = false,
  onCancel,
  onComplete,
  onBasicsPreviewChange,
}: AssignmentCreateWizardProps) {
  const { currentUser, isGuest, isVerified } = useAuth();
  const isDemo = useDemoMode();
  const { isGateOpen, gateActionName, closeGate, openGate } = useAuthGate();

  const [currentStep, setCurrentStep] = useState<AssignmentWizardStep>(1);
  const [wizardState, setWizardState] = useState<AssignmentWizardState>(initialWizardState);
  const [errors, setErrors] = useState<BasicsErrors>({});
  const [focusedField, setFocusedField] = useState<FocusedField>(null);
  const [touched, setTouched] = useState<Record<'topic' | 'dueDate', boolean>>({ topic: false, dueDate: false });
  const [attemptedNext, setAttemptedNext] = useState(false);

  const [objectiveTouched, setObjectiveTouched] = useState<Record<string, boolean>>({});
  const [objectiveErrors, setObjectiveErrors] = useState<Record<string, ObjectiveFieldError>>({});
  const [objectivesStepError, setObjectivesStepError] = useState<string | null>(null);
  const [focusObjectiveId, setFocusObjectiveId] = useState<string | null>(null);

  const [taskTouched, setTaskTouched] = useState<Record<string, Record<'title' | 'description' | 'objectiveIds', boolean>>>({});
  const [taskErrors, setTaskErrors] = useState<Record<string, TaskFieldError>>({});
  const [tasksStepError, setTasksStepError] = useState<string | null>(null);
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);

  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);
  const [submitMode, setSubmitMode] = useState<'idle' | 'draft' | 'publish'>('idle');
  const [pendingUploadState, setPendingUploadState] = useState<{
    assignmentId: string;
    failedAttachments: AssignmentAttachment[];
    mode: 'draft' | 'publish';
  } | null>(null);
  const [objectiveSuggestions, setObjectiveSuggestions] = useState<string[]>([]);
  const [objectiveSuggestionsState, setObjectiveSuggestionsState] = useState<ObjectiveSuggestionsState>('idle');
  const [objectiveSuggestionsError, setObjectiveSuggestionsError] = useState<string | null>(null);

  const [isSuggestTasksLoading, setIsSuggestTasksLoading] = useState(false);
  const [suggestTasksError, setSuggestTasksError] = useState<string | null>(null);

  const [reviewFeedback, setReviewFeedback] = useState<string[] | null>(null);
  const [isReviewFeedbackLoading, setIsReviewFeedbackLoading] = useState(false);
  const [reviewFeedbackError, setReviewFeedbackError] = useState<string | null>(null);

  const suggestObjectivesInFlightRef = useRef(false);
  const suggestTasksInFlightRef = useRef(false);
  const reviewFeedbackInFlightRef = useRef(false);

  const classMap = useMemo(() => {
    return new Map(classes.map((classOption) => [classOption.id, classOption]));
  }, [classes]);

  useEffect(() => {
    if (classes.length !== 1 || wizardState.basics.classId) return;

    const singleClass = classes[0];
    const inferredLevel = inferClassLevel(singleClass);

    setWizardState((prev) => ({
      ...prev,
      basics: {
        ...prev.basics,
        classId: singleClass.id,
        subject: prev.basics.subject || singleClass.subject || '',
        level: prev.basics.level || inferredLevel,
      },
    }));
  }, [wizardState.basics.classId, classes]);

  useEffect(() => {
    onBasicsPreviewChange?.(wizardState.basics);
  }, [wizardState.basics, onBasicsPreviewChange]);

  useEffect(() => {
    if (currentStep !== 2 || wizardState.objectives.length > 0) return;

    const seededObjectives = [createObjective('', 0, 'manual'), createObjective('', 1, 'manual')];

    setWizardState((prev) => ({ ...prev, objectives: seededObjectives }));
  }, [currentStep, wizardState.objectives.length]);

  const validObjectives = useMemo(
    () => normalizeObjectiveOrder(wizardState.objectives.filter((objective) => objective.text.trim().length > 0)),
    [wizardState.objectives],
  );

  useEffect(() => {
    if (currentStep !== 3 || wizardState.tasks.length > 0 || validObjectives.length === 0) return;

    const seedCount = Math.min(3, Math.max(2, validObjectives.length));
    const seededTasks = Array.from({ length: seedCount }).map((_, index) => {
      const objective = validObjectives[index % validObjectives.length];
      const shortObjective = objective.text.replace(/\.$/, '').slice(0, 54);
      return createTask(
        index,
        [objective.id],
        'ai_suggested',
        shortObjective ? `Task ${index + 1}: ${shortObjective}` : `Task ${index + 1}`,
        'Describe what students should do and how they should submit their work.',
      );
    });

    setWizardState((prev) => ({ ...prev, tasks: seededTasks }));
  }, [currentStep, wizardState.tasks.length, validObjectives]);

  const objectiveCoverage = useMemo(() => {
    const coverageMap: Record<string, number> = {};
    validObjectives.forEach((objective) => {
      coverageMap[objective.id] = 0;
    });

    const validObjectiveIds = new Set(validObjectives.map((objective) => objective.id));

    wizardState.tasks.forEach((task) => {
      task.objectiveIds.forEach((objectiveId) => {
        if (validObjectiveIds.has(objectiveId)) {
          coverageMap[objectiveId] = (coverageMap[objectiveId] ?? 0) + 1;
        }
      });
    });

    return coverageMap;
  }, [validObjectives, wizardState.tasks]);

  const totalEstimatedTaskMinutes = useMemo(
    () => wizardState.tasks.reduce((sum, task) => sum + (typeof task.estimatedMinutes === 'number' ? task.estimatedMinutes : 0), 0),
    [wizardState.tasks],
  );

  const unlinkedObjectivesCount = useMemo(
    () => validObjectives.filter((objective) => (objectiveCoverage[objective.id] ?? 0) === 0).length,
    [validObjectives, objectiveCoverage],
  );

  const canSuggestObjectives = wizardState.basics.topic.trim().length > 0 && wizardState.basics.level.trim().length > 0;
  const objectiveSuggestionsHint = !wizardState.basics.topic.trim().length
    ? 'Add a topic in Basics to enable suggestions.'
    : !wizardState.basics.level.trim().length
      ? 'Add a level/grade in Basics to enable suggestions.'
      : null;

  const handleSuggestObjectives = async () => {
    if (!canSuggestObjectives || objectiveSuggestionsState === 'loading' || suggestObjectivesInFlightRef.current) return;

    const isDemoTeacher = isDemo && currentUser?.role === 'teacher';
    const isGatedUser = shouldGateCopilotAccess({ isVerified, isGuest });
    if (isDemoTeacher || isGatedUser) {
      openGate('use AI objective suggestions');
      return;
    }

  suggestObjectivesInFlightRef.current = true;
    setObjectiveSuggestionsState('loading');
    setObjectiveSuggestionsError(null);

    try {
      const response = await dataService.suggestAssignmentObjectives({
        topic: wizardState.basics.topic,
        subject: wizardState.basics.subject || null,
        level: wizardState.basics.level || null,
      });

      const existingTexts = new Set(wizardState.objectives.map((objective) => objective.text.trim().toLowerCase()));
      const nextSuggestions = (response.objectives ?? [])
        .map((objective) => objective.text.trim())
        .filter((text) => text.length > 0 && text.length <= 220)
        .filter((text) => !existingTexts.has(text.toLowerCase()))
        .slice(0, 5);

      setObjectiveSuggestions(nextSuggestions);
      setObjectiveSuggestionsState('success');
    } catch {
      setObjectiveSuggestions([]);
      setObjectiveSuggestionsState('error');
      setObjectiveSuggestionsError('We couldn\'t fetch suggestions right now. Try again, or continue writing your own objectives.');
    } finally {
      suggestObjectivesInFlightRef.current = false;
    }
  };

  // Map agent task type to wizard AssignmentTaskType
  const mapAgentTaskType = (agentType: 'warmup' | 'main' | 'reflection'): AssignmentTask['type'] => {
    if (agentType === 'reflection') return 'Reflection';
    return 'Practice';
  };

  const handleSuggestTasksPlan = async () => {
    if (isSuggestTasksLoading || suggestTasksInFlightRef.current) return;

    // Demo / auth gate check — same pattern as handleSuggestObjectives
    const isDemoTeacher = isDemo && currentUser?.role === 'teacher';
    const isGatedUser = shouldGateCopilotAccess({ isVerified, isGuest });
    if (isDemoTeacher || isGatedUser) {
      openGate('generate a task plan');
      return;
    }

  suggestTasksInFlightRef.current = true;
    setIsSuggestTasksLoading(true);
    setSuggestTasksError(null);

    try {
      const objectiveTexts = wizardState.objectives
        .map((o) => o.text.trim())
        .filter((t) => t.length > 0);

      const response = await dataService.suggestAssignmentTasks({
        topic: wizardState.basics.topic,
        subject: wizardState.basics.subject || null,
        level: wizardState.basics.level || null,
        objectives: objectiveTexts.length > 0 ? objectiveTexts : undefined,
      });

      const suggestedTasks = (response.tasks ?? []).map((suggestedTask, index) => {
        const base = createTask(
          index,
          [],
          'ai_suggested',
          suggestedTask.title,
          suggestedTask.instructions,
        );
        return {
          ...base,
          type: mapAgentTaskType(suggestedTask.type),
          ...(suggestedTask.minutes != null ? { estimatedMinutes: suggestedTask.minutes } : {}),
        } as AssignmentTask;
      });

      if (suggestedTasks.length === 0) {
        setSuggestTasksError('We couldn\'t generate a task plan right now. You can still add tasks manually.');
        return;
      }

      setWizardState((prev) => {
        // If tasks list is empty, replace; otherwise append to end
        const existing = prev.tasks.length > 0 ? normalizeTaskOrder(prev.tasks) : [];
        const merged = [
          ...existing,
          ...suggestedTasks.map((t, i) => ({ ...t, order: existing.length + i })),
        ];
        return { ...prev, tasks: normalizeTaskOrder(merged) };
      });
    } catch {
      setSuggestTasksError('We couldn\'t generate a task plan right now. You can still add tasks manually.');
    } finally {
      suggestTasksInFlightRef.current = false;
      setIsSuggestTasksLoading(false);
    }
  };

  const handleGetReviewFeedback = async () => {
    if (isReviewFeedbackLoading || reviewFeedbackInFlightRef.current) return;

    // Demo / auth gate check — same pattern as other AI handlers
    const isDemoTeacher = isDemo && currentUser?.role === 'teacher';
    const isGatedUser = shouldGateCopilotAccess({ isVerified, isGuest });
    if (isDemoTeacher || isGatedUser) {
      openGate('improve this assignment');
      return;
    }

    const objectiveTexts = wizardState.objectives
      .map((o) => o.text.trim())
      .filter((t) => t.length > 0);

    const taskItems = normalizeTaskOrder(wizardState.tasks).map((t) => ({
      title: t.title,
      type: t.type ?? null,
      minutes: t.estimatedMinutes ?? null,
      instructions: t.description ?? null,
    }));

    if (objectiveTexts.length === 0 && taskItems.length === 0) {
      setReviewFeedbackError('Add at least one objective or task first, then ask Elora for improvement feedback.');
      return;
    }

    reviewFeedbackInFlightRef.current = true;
    setIsReviewFeedbackLoading(true);
    setReviewFeedbackError(null);

    try {
      const response = await dataService.getAssignmentReviewFeedback({
        topic: wizardState.basics.topic,
        subject: wizardState.basics.subject || null,
        level: wizardState.basics.level || null,
        objectives: objectiveTexts,
        tasks: taskItems,
      });

      setReviewFeedback(response.feedback);
    } catch {
      setReviewFeedbackError(
        "We couldn't fetch suggestions right now. You can still review your assignment manually.",
      );
    } finally {
      reviewFeedbackInFlightRef.current = false;
      setIsReviewFeedbackLoading(false);
    }
  };

  const wizardReport = useMemo(() => analyzeAssignmentWizard(wizardState), [wizardState]);

  const reviewSummary = useMemo(() => {
    const objectiveCount = wizardReport.objectives.validCount;
    const taskCount = wizardReport.tasks.validCount;
    const covered = wizardReport.tasks.objectivesCoverage.covered;
    const total = wizardReport.tasks.objectivesCoverage.total;

    if (total > 0 && covered === total) {
      return `This assignment covers all ${total} objectives with ${taskCount} tasks. It looks ready to go.`;
    }

    if (total - covered === 1) {
      return `1 objective isn't linked to any task. You can update your tasks or publish anyway.`;
    }

    return `This assignment has ${objectiveCount} objectives, ${taskCount} tasks, and ${covered} of ${total} objectives linked.`;
  }, [wizardReport]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.info('[AssignmentWizardReport][mount]', JSON.stringify(wizardReport, null, 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV || currentStep !== 4) return;
    console.info('[AssignmentWizardReport][review]', JSON.stringify(wizardReport, null, 2));
  }, [currentStep, wizardReport]);

  const validateBasics = (
    state: AssignmentWizardState,
    options: { requireClass?: boolean; touchedState?: Record<'topic' | 'dueDate', boolean>; forceAll?: boolean } = {},
  ): ValidationResult => {
    const { requireClass = false, touchedState = touched, forceAll = false } = options;
    const result: ValidationResult = {
      isValid: true,
      stepErrors: {},
      fieldErrors: {
        basics: {},
        objectives: {},
        tasks: {},
      },
    };

    const shouldValidateTopic = forceAll || touchedState.topic || attemptedNext;
    const shouldValidateDueDate = forceAll || touchedState.dueDate || attemptedNext;

    if (shouldValidateTopic && !state.basics.topic.trim()) {
      result.fieldErrors.basics.topic = 'Please enter a topic or unit.';
      result.stepErrors.basics = 'Complete required basics before continuing.';
      result.firstInvalidStep = result.firstInvalidStep ?? 1;
    }

    if (shouldValidateDueDate && !state.basics.dueDate.trim()) {
      result.fieldErrors.basics.dueDate = 'Please select a due date.';
      result.stepErrors.basics = 'Complete required basics before continuing.';
      result.firstInvalidStep = result.firstInvalidStep ?? 1;
    }

    if (requireClass && !state.basics.classId) {
      result.fieldErrors.basics.classId = 'Please select a class before creating this assignment.';
      result.stepErrors.basics = 'Select a class before creating this assignment.';
      result.firstInvalidStep = result.firstInvalidStep ?? 1;
    }

    result.isValid = Object.keys(result.fieldErrors.basics).length === 0;
    return result;
  };

  const validateObjectives = (state: AssignmentWizardState): ValidationResult => {
    const result: ValidationResult = {
      isValid: true,
      stepErrors: {},
      fieldErrors: {
        basics: {},
        objectives: {},
        tasks: {},
      },
    };

    let validObjectiveCount = 0;
    const orderedObjectives = normalizeObjectiveOrder(state.objectives);
    const firstEmptyObjective = orderedObjectives.find((objective) => !objective.text.trim());

    orderedObjectives.forEach((objective) => {
      if (objective.text.trim()) {
        validObjectiveCount += 1;
      }
    });

    if (firstEmptyObjective) {
      result.fieldErrors.objectives[firstEmptyObjective.id] = { text: 'Add a learning objective or remove this row.' };
      result.stepErrors.objectives = 'Please complete or remove blank objectives before continuing.';
      result.firstInvalidStep = result.firstInvalidStep ?? 2;
      result.firstInvalidObjectiveId = firstEmptyObjective.id;
    }

    if (validObjectiveCount < 2) {
      result.stepErrors.objectives = result.stepErrors.objectives ?? 'Please add at least 2 learning objectives.';
      result.firstInvalidStep = result.firstInvalidStep ?? 2;
      result.firstInvalidObjectiveId = result.firstInvalidObjectiveId ?? orderedObjectives[0]?.id;
    }

    result.isValid = !result.stepErrors.objectives;
    return result;
  };

  const validateTasks = (state: AssignmentWizardState): ValidationResult => {
    const result: ValidationResult = {
      isValid: true,
      stepErrors: {},
      fieldErrors: {
        basics: {},
        objectives: {},
        tasks: {},
      },
    };

    const orderedTasks = normalizeTaskOrder(state.tasks);
    const validObjectiveIds = new Set(
      state.objectives
        .filter((objective) => objective.text.trim().length > 0)
        .map((objective) => objective.id),
    );

    if (orderedTasks.length < 2) {
      result.stepErrors.tasks = 'Please add at least 2 tasks before continuing.';
      result.firstInvalidStep = result.firstInvalidStep ?? 3;
      result.firstInvalidTaskId = result.firstInvalidTaskId ?? orderedTasks[0]?.id;
    }

    orderedTasks.forEach((task) => {
      const nextError: TaskFieldError = {};
      if (!task.title.trim()) nextError.title = 'Add a task title.';
      if (!task.description.trim()) nextError.description = 'Add student instructions.';
      const linkedValidObjectiveCount = task.objectiveIds.filter((objectiveId) => validObjectiveIds.has(objectiveId)).length;
      if (linkedValidObjectiveCount === 0) nextError.objectiveIds = 'Link this task to at least one objective.';

      if (Object.keys(nextError).length > 0) {
        result.fieldErrors.tasks[task.id] = nextError;
        result.firstInvalidTaskId = result.firstInvalidTaskId ?? task.id;
      }
    });

    if (Object.keys(result.fieldErrors.tasks).length > 0) {
      result.stepErrors.tasks = result.stepErrors.tasks ?? 'Please fix the highlighted task fields before continuing.';
      result.firstInvalidStep = result.firstInvalidStep ?? 3;
    }

    result.isValid = !result.stepErrors.tasks && Object.keys(result.fieldErrors.tasks).length === 0;
    return result;
  };

  const validateAllSteps = (state: AssignmentWizardState): ValidationResult => {
    const basicsResult = validateBasics(state, {
      requireClass: true,
      forceAll: true,
      touchedState: { topic: true, dueDate: true },
    });
    const objectivesResult = validateObjectives(state);
    const tasksResult = validateTasks(state);

    const combined: ValidationResult = {
      isValid: basicsResult.isValid && objectivesResult.isValid && tasksResult.isValid,
      stepErrors: {
        basics: basicsResult.stepErrors.basics,
        objectives: objectivesResult.stepErrors.objectives,
        tasks: tasksResult.stepErrors.tasks,
      },
      fieldErrors: {
        basics: basicsResult.fieldErrors.basics,
        objectives: objectivesResult.fieldErrors.objectives,
        tasks: tasksResult.fieldErrors.tasks,
      },
      firstInvalidStep: basicsResult.firstInvalidStep ?? objectivesResult.firstInvalidStep ?? tasksResult.firstInvalidStep,
      firstInvalidObjectiveId: objectivesResult.firstInvalidObjectiveId,
      firstInvalidTaskId: tasksResult.firstInvalidTaskId,
    };

    return combined;
  };

  const handleBasicsChange = (updates: Partial<AssignmentBasicsState>) => {
    setWizardState((prev) => {
      const nextBasics = { ...prev.basics, ...updates };

      if (Object.prototype.hasOwnProperty.call(updates, 'classId')) {
        const nextClassId = updates.classId ?? null;
        const selectedClass = nextClassId ? classMap.get(nextClassId) : null;
        const inferredLevel = inferClassLevel(selectedClass ?? null);

        if (selectedClass) {
          nextBasics.subject = selectedClass.subject ?? '';
          nextBasics.level = inferredLevel;
        } else {
          nextBasics.subject = '';
          nextBasics.level = '';
        }
      }

      const nextState = { ...prev, basics: nextBasics };
      setErrors(validateBasics(nextState).fieldErrors.basics);
      return nextState;
    });
  };

  const handleRequiredFieldBlur = (field: 'topic' | 'dueDate') => {
    if (field === 'topic') {
      setFocusedField(null);
    }

    setTouched((prev) => {
      const nextTouched = { ...prev, [field]: true };
      setErrors(validateBasics(wizardState, { touchedState: nextTouched }).fieldErrors.basics);
      return nextTouched;
    });
  };

  const handleNextFromBasics = () => {
    const touchedAll = { topic: true, dueDate: true };
    setTouched(touchedAll);
    setAttemptedNext(true);

    const nextValidation = validateBasics(wizardState, { forceAll: true, touchedState: touchedAll });
    setErrors(nextValidation.fieldErrors.basics);

    if (!nextValidation.isValid) return;

    setCurrentStep(2);
  };

  const handleAttachFiles = (incomingFiles: FileList | File[]) => {
    const nextFiles = Array.from(incomingFiles);

    setWizardState((prev) => {
      const existingKeys = new Set(prev.attachments.map((item) => `${item.filename}:${item.sizeBytes}:${item.lastModified}`));
      const dedupedNewFiles = nextFiles.filter((file) => {
        const key = `${file.name}:${file.size}:${file.lastModified}`;
        if (existingKeys.has(key)) return false;
        existingKeys.add(key);
        return true;
      });

      const newAttachments: AssignmentAttachment[] = dedupedNewFiles.map((file) => ({
        id: generateClientId(),
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        lastModified: file.lastModified,
        localFileRef: file,
      }));

      return {
        ...prev,
        attachments: [...prev.attachments, ...newAttachments],
      };
    });
  };

  const handleRemoveAttachedFile = (id: string) => {
    setWizardState((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((item) => item.id !== id),
    }));
  };

  const handleAddObjective = (source: AssignmentObjective['source'] = 'manual', prefilledText = '') => {
    setWizardState((prev) => ({
      ...prev,
      objectives: [...normalizeObjectiveOrder(prev.objectives), createObjective(prefilledText, prev.objectives.length, source)],
    }));
  };

  const handleObjectiveBlur = (id: string) => {
    setObjectiveTouched((prev) => ({ ...prev, [id]: true }));

    setObjectiveErrors((prev) => {
      const objective = wizardState.objectives.find((item) => item.id === id);
      if (objective && !objective.text.trim()) {
        return { ...prev, [id]: { text: 'Add a learning objective or remove this row.' } };
      }
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleUpdateObjective = (id: string, updates: Partial<AssignmentObjective>) => {
    setWizardState((prev) => {
      const nextObjectives = normalizeObjectiveOrder(
        prev.objectives.map((objective) => (objective.id === id ? { ...objective, ...updates } : objective)),
      );
      return { ...prev, objectives: nextObjectives };
    });

    if (objectiveTouched[id] && Object.prototype.hasOwnProperty.call(updates, 'text')) {
      const nextText = updates.text ?? '';
      setObjectiveErrors((prev) => {
        if (nextText.trim()) {
          const next = { ...prev };
          delete next[id];
          return next;
        }
        return { ...prev, [id]: { text: 'Add a learning objective or remove this row.' } };
      });
    }
  };

  const handleMoveObjective = (id: string, direction: 'up' | 'down') => {
    setWizardState((prev) => {
      const orderedObjectives = normalizeObjectiveOrder(prev.objectives);
      const index = orderedObjectives.findIndex((objective) => objective.id === id);
      if (index < 0) return prev;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= orderedObjectives.length) return prev;

      const nextObjectives = [...orderedObjectives];
      [nextObjectives[index], nextObjectives[targetIndex]] = [nextObjectives[targetIndex], nextObjectives[index]];

      return {
        ...prev,
        objectives: nextObjectives.map((objective, nextIndex) => ({ ...objective, order: nextIndex })),
      };
    });
  };

  const handleRemoveObjective = (id: string) => {
    setWizardState((prev) => ({
      ...prev,
      objectives: normalizeObjectiveOrder(prev.objectives.filter((objective) => objective.id !== id)),
      tasks: normalizeTaskOrder(
        prev.tasks.map((task) => ({
          ...task,
          objectiveIds: task.objectiveIds.filter((objectiveId) => objectiveId !== id),
        })),
      ),
    }));

    setObjectiveErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleNextFromObjectives = () => {
    const touchedAll: Record<string, boolean> = {};
    wizardState.objectives.forEach((objective) => {
      touchedAll[objective.id] = true;
    });
    setObjectiveTouched((prev) => ({ ...prev, ...touchedAll }));

    const validation = validateObjectives(wizardState);
    setObjectiveErrors(validation.fieldErrors.objectives);
    setObjectivesStepError(validation.stepErrors.objectives ?? null);

    if (!validation.isValid) {
      setFocusObjectiveId(validation.firstInvalidObjectiveId ?? wizardState.objectives[0]?.id ?? null);
      return;
    }

    setFocusObjectiveId(null);
    setCurrentStep(3);
  };

  const handleAddTask = (
    source: AssignmentTask['source'] = 'manual',
    prefilled?: Partial<Pick<AssignmentTask, 'title' | 'description' | 'type'>>,
  ) => {
    setWizardState((prev) => ({
      ...prev,
      tasks: [
        ...normalizeTaskOrder(prev.tasks),
        createTask(
          prev.tasks.length,
          [],
          source,
          prefilled?.title ?? '',
          prefilled?.description ?? '',
        ),
      ].map((task, index) =>
        index === prev.tasks.length && prefilled?.type
          ? { ...task, type: prefilled.type }
          : task,
      ),
    }));
  };

  const handleAddQuickTask = (preset: 'warmup' | 'main' | 'reflection') => {
    if (preset === 'warmup') {
      handleAddTask('manual', {
        title: 'Warm-up activity',
        description: 'Start with a short warm-up to activate prior knowledge.',
        type: 'Practice',
      });
      return;
    }

    if (preset === 'main') {
      handleAddTask('manual', {
        title: 'Main task',
        description: 'Describe the core activity students need to complete.',
        type: 'Practice',
      });
      return;
    }

    handleAddTask('manual', {
      title: 'Reflection task',
      description: 'Ask students to reflect on their strategy, learning, or next steps.',
      type: 'Reflection',
    });
  };

  const handleUpdateTask = (id: string, updates: Partial<AssignmentTask>) => {
    setWizardState((prev) => ({
      ...prev,
      tasks: normalizeTaskOrder(prev.tasks.map((task) => (task.id === id ? { ...task, ...updates } : task))),
    }));

    const touchedFields = taskTouched[id];
    if (!touchedFields) return;

    setTaskErrors((prev) => {
      const nextErrors = { ...(prev[id] ?? {}) };
      const nextTask = wizardState.tasks.find((task) => task.id === id);
      const mergedTask = { ...nextTask, ...updates } as AssignmentTask | undefined;

      if (mergedTask) {
        if (touchedFields.title) {
          if (mergedTask.title.trim()) delete nextErrors.title;
          else nextErrors.title = 'Add a task title.';
        }
        if (touchedFields.description) {
          if (mergedTask.description.trim()) delete nextErrors.description;
          else nextErrors.description = 'Add student instructions.';
        }
        if (touchedFields.objectiveIds) {
          if (mergedTask.objectiveIds.length > 0) delete nextErrors.objectiveIds;
          else nextErrors.objectiveIds = 'Link this task to at least one objective.';
        }
      }

      const next = { ...prev };
      if (Object.keys(nextErrors).length === 0) {
        delete next[id];
      } else {
        next[id] = nextErrors;
      }
      return next;
    });
  };

  const handleMoveTask = (id: string, direction: 'up' | 'down') => {
    setWizardState((prev) => {
      const orderedTasks = normalizeTaskOrder(prev.tasks);
      const index = orderedTasks.findIndex((task) => task.id === id);
      if (index < 0) return prev;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= orderedTasks.length) return prev;

      const nextTasks = [...orderedTasks];
      [nextTasks[index], nextTasks[targetIndex]] = [nextTasks[targetIndex], nextTasks[index]];

      return {
        ...prev,
        tasks: nextTasks.map((task, nextIndex) => ({ ...task, order: nextIndex })),
      };
    });
  };

  const handleRemoveTask = (id: string) => {
    setWizardState((prev) => ({
      ...prev,
      tasks: normalizeTaskOrder(prev.tasks.filter((task) => task.id !== id)),
    }));

    setTaskErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleBlurTaskField = (id: string, field: keyof TaskFieldError) => {
    const normalizedField = field === 'objectiveIds' ? 'objectiveIds' : field;
    setTaskTouched((prev) => ({
      ...prev,
      [id]: {
        title: prev[id]?.title ?? false,
        description: prev[id]?.description ?? false,
        objectiveIds: prev[id]?.objectiveIds ?? false,
        [normalizedField]: true,
      },
    }));

    const task = wizardState.tasks.find((item) => item.id === id);
    if (!task) return;

    setTaskErrors((prev) => {
      const next = { ...prev };
      const nextTaskError = { ...(next[id] ?? {}) };

      if (field === 'title') {
        if (!task.title.trim()) nextTaskError.title = 'Add a task title.';
        else delete nextTaskError.title;
      }
      if (field === 'description') {
        if (!task.description.trim()) nextTaskError.description = 'Add student instructions.';
        else delete nextTaskError.description;
      }
      if (field === 'objectiveIds') {
        const validObjectiveIds = new Set(
          wizardState.objectives
            .filter((objective) => objective.text.trim().length > 0)
            .map((objective) => objective.id),
        );
        const linkedValidObjectiveCount = task.objectiveIds.filter((objectiveId) => validObjectiveIds.has(objectiveId)).length;
        if (linkedValidObjectiveCount === 0) nextTaskError.objectiveIds = 'Link this task to at least one objective.';
        else delete nextTaskError.objectiveIds;
      }

      if (Object.keys(nextTaskError).length === 0) delete next[id];
      else next[id] = nextTaskError;
      return next;
    });
  };

  const handleNextFromTasks = () => {
    const touchedAll: Record<string, Record<'title' | 'description' | 'objectiveIds', boolean>> = {};
    wizardState.tasks.forEach((task) => {
      touchedAll[task.id] = { title: true, description: true, objectiveIds: true };
    });
    setTaskTouched((prev) => ({ ...prev, ...touchedAll }));

    const validation = validateTasks(wizardState);
    setTaskErrors(validation.fieldErrors.tasks);
    setTasksStepError(validation.stepErrors.tasks ?? null);

    if (!validation.isValid) {
      setFocusTaskId(validation.firstInvalidTaskId ?? wizardState.tasks[0]?.id ?? null);
      return;
    }

    setFocusTaskId(null);
    setCurrentStep(4);
  };

  const buildCreatePayload = (publish: boolean): dataService.CreateTeacherAssignmentPayload | null => {
    if (!wizardState.basics.classId) return null;

    const validObjectives = normalizeObjectiveOrder(wizardState.objectives.filter((objective) => objective.text.trim().length > 0))
      .map((objective, index) => ({
        ...objective,
        order: index,
      }));

    const validObjectiveIdSet = new Set(validObjectives.map((objective) => objective.id));

    const taskObjectives = wizardState.tasks.flatMap((task) =>
      task.objectiveIds.map((objectiveId) => ({ taskId: task.id, objectiveId })),
    ).filter((relation) => validObjectiveIdSet.has(relation.objectiveId));

    return {
      classroomId: wizardState.basics.classId,
      title: wizardState.basics.topic,
      dueDate: wizardState.basics.dueDate,
      description: wizardState.basics.sourceMaterial || undefined,
      publish,
      subject: wizardState.basics.subject || undefined,
      level: wizardState.basics.level || undefined,
      estimatedDurationMinutes:
        wizardState.basics.estimatedDuration ?? (totalEstimatedTaskMinutes > 0 ? totalEstimatedTaskMinutes : undefined),
      sourceMaterial: wizardState.basics.sourceMaterial || undefined,
      objectives: validObjectives.map((objective) => ({
        id: objective.id,
        text: objective.text,
        bloomLevel: objective.bloomLevel,
        category: objective.category,
        order: objective.order,
      })),
      tasks: normalizeTaskOrder(wizardState.tasks).map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type,
        estimatedMinutes: task.estimatedMinutes,
        order: task.order,
      })),
      taskObjectives,
      attachments: wizardState.attachments.map((attachment) => ({
        id: attachment.id,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
      })),
    };
  };

  const handleCreateAssignment = async (mode: 'draft' | 'publish') => {
    setReviewError(null);
    setReviewNotice(null);
    setPendingUploadState(null);

    const fullValidation = validateAllSteps(wizardState);
    setErrors(fullValidation.fieldErrors.basics);
    setObjectiveErrors(fullValidation.fieldErrors.objectives);
    setTaskErrors(fullValidation.fieldErrors.tasks);

    if (!fullValidation.isValid) {
      const invalidStepLabel =
        fullValidation.firstInvalidStep === 1
          ? 'Basics'
          : fullValidation.firstInvalidStep === 2
            ? 'Objectives'
            : fullValidation.firstInvalidStep === 3
              ? 'Tasks'
              : null;

      setReviewError(
        invalidStepLabel
          ? `Please fix the ${invalidStepLabel} step before creating this assignment.`
          : 'Please fix the highlighted fields before creating this assignment.',
      );

      if (fullValidation.firstInvalidObjectiveId) {
        setFocusObjectiveId(fullValidation.firstInvalidObjectiveId);
      }
      if (fullValidation.firstInvalidTaskId) {
        setFocusTaskId(fullValidation.firstInvalidTaskId);
      }
      return;
    }

    const payload = buildCreatePayload(mode === 'publish');
    if (!payload) {
      setCurrentStep(1);
      setErrors((prev) => ({ ...prev, classId: 'Please select a class before creating this assignment.' }));
      setReviewError('Please select a class before creating this assignment.');
      return;
    }

    setSubmitMode(mode);

    try {
      const createdAssignment = await dataService.createTeacherAssignment(payload);
      const assignmentId = createdAssignment?.id as string | undefined;

      if (!assignmentId) {
        throw new Error('Assignment was created but no assignment id was returned.');
      }

      const failedUploads: AssignmentAttachment[] = [];
      const uploadableAttachments = wizardState.attachments.filter((attachment) => attachment.localFileRef);

      for (const attachment of uploadableAttachments) {
        if (!attachment.localFileRef) continue;

        try {
          await dataService.uploadAssignmentAttachment(assignmentId, attachment.id, attachment.localFileRef);
        } catch {
          failedUploads.push(attachment);
        }
      }

      if (failedUploads.length > 0) {
        setPendingUploadState({
          assignmentId,
          failedAttachments: failedUploads,
          mode,
        });
        setReviewNotice(
          `${failedUploads.length} attachment${failedUploads.length > 1 ? 's' : ''} failed to upload. Retry or finish anyway.`,
        );
        return;
      }

      setReviewNotice(mode === 'publish' ? 'Assignment published.' : 'Draft saved.');
      (onComplete ?? onCancel)();
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Failed to create assignment. Please try again.');
    } finally {
      setSubmitMode('idle');
    }
  };

  const handleRetryUploads = async () => {
    if (!pendingUploadState) return;

    setSubmitMode(pendingUploadState.mode);
    setReviewError(null);
    setReviewNotice(null);

    const stillFailed: AssignmentAttachment[] = [];

    for (const attachment of pendingUploadState.failedAttachments) {
      if (!attachment.localFileRef) {
        stillFailed.push(attachment);
        continue;
      }

      try {
        await dataService.uploadAssignmentAttachment(pendingUploadState.assignmentId, attachment.id, attachment.localFileRef);
      } catch {
        stillFailed.push(attachment);
      }
    }

    if (stillFailed.length > 0) {
      setPendingUploadState((prev) =>
        prev
          ? {
              ...prev,
              failedAttachments: stillFailed,
            }
          : null,
      );
      setReviewNotice(`${stillFailed.length} attachment${stillFailed.length > 1 ? 's still need' : ' still needs'} upload retry.`);
      setSubmitMode('idle');
      return;
    }

    setPendingUploadState(null);
    setReviewNotice('Attachments uploaded successfully.');
    setSubmitMode('idle');
    (onComplete ?? onCancel)();
  };

  const handleFinishWithPendingUploads = () => {
    (onComplete ?? onCancel)();
  };

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02),_0_8px_24px_rgba(149,157,165,0.05)]">
      <div className="w-full border-b border-[#E2E8F0] bg-white">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stepLabels.map((stepItem) => {
            const isActive = stepItem.step === currentStep;
            const isCompleted = currentStep > stepItem.step;
            const isUpcoming = !isActive && !isCompleted;
            const StepIcon = stepItem.icon;

            return (
              <div
                key={stepItem.step}
                className="relative px-4 py-3"
                style={{ backgroundColor: isActive ? stepItem.activeBackground : 'white' }}
              >
                {isActive && <span className="absolute left-0 right-0 top-0 h-[2px]" style={{ backgroundColor: stepItem.accent }} />}
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
                      <Check size={12} strokeWidth={2} style={{ color: 'var(--elora-success-text)' }} />
                    </span>
                  ) : (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white">
                      {isUpcoming ? (
                        <span className="text-[10px] font-bold tracking-[0.12em] text-slate-400">{stepItem.step}</span>
                      ) : (
                        <StepIcon size={12} style={{ color: stepItem.accent }} />
                      )}
                    </span>
                  )}
                  <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${isActive ? 'text-slate-900' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                    {stepItem.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div key={currentStep} className="animate-in fade-in slide-in-from-bottom-1 p-6 duration-200 ease-out md:p-8">
        {currentStep === 1 && (
          <AssignmentBasicsStep
            basics={wizardState.basics}
            errors={errors}
            classes={classes}
            isLoadingClasses={isLoadingClasses}
            attachedFiles={wizardState.attachments}
            focusedField={focusedField}
            onChange={handleBasicsChange}
            onAttachFiles={handleAttachFiles}
            onRemoveAttachedFile={handleRemoveAttachedFile}
            onFocusField={setFocusedField}
            onBlurFocusedField={() => setFocusedField(null)}
            onBlurRequiredField={handleRequiredFieldBlur}
            onNext={handleNextFromBasics}
            onCancel={onCancel}
          />
        )}

        {currentStep === 2 && (
          <AssignmentObjectivesStep
            objectives={normalizeObjectiveOrder(wizardState.objectives)}
            objectiveErrors={objectiveErrors}
            stepError={objectivesStepError}
            suggestions={objectiveSuggestions}
            suggestionsState={objectiveSuggestionsState}
            suggestionsError={objectiveSuggestionsError}
            canSuggestObjectives={canSuggestObjectives}
            suggestObjectivesHint={objectiveSuggestionsHint}
            validObjectivesCount={wizardReport.objectives.validCount}
            hasBloomLevels={wizardReport.objectives.hasBloomLevels}
            hasCategories={wizardReport.objectives.hasCategories}
            objectiveCoverage={objectiveCoverage}
            focusObjectiveId={focusObjectiveId}
            onBack={() => setCurrentStep(1)}
            onNext={handleNextFromObjectives}
            onAddObjective={() => handleAddObjective('manual')}
            onAddSuggestedObjective={(text) => handleAddObjective('ai_suggested', text)}
            onSuggestObjectives={() => void handleSuggestObjectives()}
            onUpdateObjective={handleUpdateObjective}
            onRemoveObjective={handleRemoveObjective}
            onMoveObjective={handleMoveObjective}
            onBlurObjective={handleObjectiveBlur}
          />
        )}

        {currentStep === 3 && (
          <AssignmentTasksStep
            tasks={normalizeTaskOrder(wizardState.tasks)}
            objectives={validObjectives}
            taskErrors={taskErrors}
            stepError={tasksStepError}
            focusTaskId={focusTaskId}
            validTasksCount={wizardReport.tasks.validCount}
            coveredObjectivesCount={wizardReport.tasks.objectivesCoverage.covered}
            totalObjectivesCount={wizardReport.tasks.objectivesCoverage.total}
            unlinkedObjectivesCount={unlinkedObjectivesCount}
            totalEstimatedMinutes={totalEstimatedTaskMinutes}
            fallbackEstimatedMinutes={wizardState.basics.estimatedDuration}
            onBack={() => setCurrentStep(2)}
            onNext={handleNextFromTasks}
            onAddTask={() => handleAddTask('manual')}
            onAddQuickTask={handleAddQuickTask}
            onUpdateTask={handleUpdateTask}
            onRemoveTask={handleRemoveTask}
            onMoveTask={handleMoveTask}
            onBlurTaskField={handleBlurTaskField}
            onSuggestTasksPlan={() => void handleSuggestTasksPlan()}
            isSuggestTasksLoading={isSuggestTasksLoading}
            suggestTasksError={suggestTasksError}
          />
        )}

        {currentStep === 4 && (
          <AssignmentReviewStep
            basics={wizardState.basics}
            objectives={validObjectives}
            tasks={normalizeTaskOrder(wizardState.tasks)}
            attachments={wizardState.attachments}
            classes={classes}
            reviewSummary={reviewSummary}
            wizardReport={wizardReport}
            objectiveCoverage={objectiveCoverage}
            totalEstimatedMinutes={totalEstimatedTaskMinutes}
            reviewError={reviewError}
            reviewNotice={reviewNotice}
            isSubmittingMode={submitMode}
            hasRetryableUploads={Boolean(pendingUploadState)}
            onBack={() => setCurrentStep(3)}
            onEditStep={(step) => setCurrentStep(step)}
            onSaveDraft={() => void handleCreateAssignment('draft')}
            onPublish={() => void handleCreateAssignment('publish')}
            onRetryUploads={() => void handleRetryUploads()}
            onFinishWithPendingUploads={handleFinishWithPendingUploads}
            reviewFeedback={reviewFeedback}
            isReviewFeedbackLoading={isReviewFeedbackLoading}
            reviewFeedbackError={reviewFeedbackError}
            onGetReviewFeedback={() => void handleGetReviewFeedback()}
          />
        )}
      </div>
      </div>

      <AuthGateModal
        isOpen={isGateOpen}
        onClose={closeGate}
        actionName={gateActionName}
      />
    </>
  );
}
