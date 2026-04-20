import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Calendar, Check, ChevronDown, Clock, FileText, GraduationCap, Paperclip, X } from 'lucide-react';
import { Button } from '../ui/Button';

export type AssignmentWizardStep = 1 | 2 | 3 | 4;

export interface AssignmentBasicsState {
  classId: string | null;
  subject: string;
  level: string;
  topic: string;
  dueDate: string;
  estimatedDuration: number | null;
  sourceMaterial: string;
}

export interface AssignmentClassOption {
  id: string;
  name: string;
  subject?: string;
  level?: string;
}

interface AssignmentAttachedFile {
  id: string;
  file: File;
}

type BasicsErrors = Partial<Record<'topic' | 'dueDate', string>>;
type FocusedField = 'subject' | 'level' | 'topic' | 'dueDate' | 'estimatedDuration' | null;

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
  attachedFiles: AssignmentAttachedFile[];
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

interface PlaceholderStepProps {
  step: AssignmentWizardStep;
  title: string;
  description: string;
  onBack: () => void;
  onNext?: () => void;
  nextLabel?: string;
}

const stepLabels: Array<{ step: AssignmentWizardStep; title: string }> = [
  { step: 1, title: 'Basics' },
  { step: 2, title: 'Objectives' },
  { step: 3, title: 'Tasks' },
  { step: 4, title: 'Review' },
];

const initialBasics: AssignmentBasicsState = {
  classId: null,
  subject: '',
  level: '',
  topic: '',
  dueDate: '',
  estimatedDuration: null,
  sourceMaterial: '',
};

const labelClassName = 'mb-[6px] block text-xs font-medium text-slate-600';
const inputBaseClassName = "h-11 w-full rounded-lg border border-[#E2E8F0] bg-white pl-10 pr-3 text-[14px] text-slate-800 outline-none transition-colors focus:border-[#14b8a6]/60 focus:ring-0 shadow-[inset_0_2px_0_rgba(15,23,42,0.04)]";

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
        <h2 className="text-[24px] font-semibold tracking-tight text-slate-900">Assignment basics</h2>
        <p className="text-sm leading-6 text-slate-600">Set class context and schedule before drafting objectives and tasks.</p>
      </div>

      <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-12">
        <div className="md:col-span-4">
          <label className={labelClassName}>Class</label>
          <div className="relative">
            <select
              value={basics.classId ?? ''}
              onChange={(event) => onChange({ classId: event.target.value || null })}
              className="h-11 w-full appearance-none rounded-lg border border-[#E2E8F0] bg-white px-3 pr-9 text-[14px] text-slate-800 outline-none transition-colors focus:border-[#14b8a6]/60 focus:ring-0 shadow-[inset_0_2px_0_rgba(15,23,42,0.04)] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
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
          <p className="mt-1 text-xs text-slate-500">Optional. Usually defined by the class.</p>
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
          <p className="mt-1 text-xs text-slate-500">Optional. Usually defined by the class.</p>
        </div>

        <div className="md:col-span-8">
          <label className={labelClassName}>Topic / unit</label>
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

        <div className="md:col-span-4">
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

        <div className="md:col-span-4">
          <label className={labelClassName}>Estimated duration (minutes)</label>
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
              className="w-full rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2.5 pr-24 text-[14px] text-slate-800 outline-none transition-colors focus:border-[#14b8a6]/60 focus:ring-0 shadow-[inset_0_2px_0_rgba(15,23,42,0.04)]"
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

          <div className="mt-3 rounded-lg border border-slate-200/80 bg-slate-50/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">Optional. Add files like PDFs, slides, or docs relevant to this assignment.</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={triggerFilePicker}
                leftIcon={<Paperclip size={14} />}
                className="h-9 shrink-0 rounded-lg border-slate-200 bg-white text-slate-700"
              >
                Attach file
              </Button>
            </div>

            {attachedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachedFiles.map((attachedFile) => (
                  <div
                    key={attachedFile.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-slate-700">{attachedFile.file.name}</p>
                      <p className="text-[11px] text-slate-500">{formatBytes(attachedFile.file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveAttachedFile(attachedFile.id)}
                      className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                      aria-label={`Remove ${attachedFile.file.name}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500">You can still create an assignment without linking it to a class.</p>

      <div className="border-t border-[#E2E8F0] pt-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
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

const AssignmentStepPlaceholder = ({
  step,
  title,
  description,
  onBack,
  onNext,
  nextLabel = 'Next',
}: PlaceholderStepProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Step {step}</p>
        <h2 className="text-[24px] font-semibold tracking-tight text-slate-900">{title}</h2>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-slate-50 p-6 text-sm text-slate-600">
        Coming next: this step will be implemented in the next slice.
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-[#E2E8F0] pt-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <ArrowLeft size={15} />
          Back
        </button>
        <Button type="button" variant="primary" onClick={onNext} disabled={!onNext} className="h-10 px-4">
          {nextLabel}
        </Button>
      </div>
    </div>
  );
};

const AssignmentObjectivesStep = ({ onBack, onNext }: { onBack: () => void; onNext: () => void }) => (
  <AssignmentStepPlaceholder
    step={2}
    title="Learning objectives"
    description="Objectives step coming soon."
    onBack={onBack}
    onNext={onNext}
  />
);

const AssignmentTasksStep = ({ onBack, onNext }: { onBack: () => void; onNext: () => void }) => (
  <AssignmentStepPlaceholder
    step={3}
    title="Task generation"
    description="Task generation step coming soon."
    onBack={onBack}
    onNext={onNext}
  />
);

const AssignmentReviewStep = ({
  basics,
  sourceFiles,
  onBack,
  onNext,
}: {
  basics: AssignmentBasicsState;
  sourceFiles: AssignmentAttachedFile[];
  onBack: () => void;
  onNext: () => void;
}) => (
  <div className="space-y-6">
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Step 4</p>
      <h2 className="text-[24px] font-semibold tracking-tight text-slate-900">Review and assign</h2>
      <p className="text-sm leading-6 text-slate-600">Confirm your basics before publishing this assignment.</p>
    </div>

    <div className="rounded-xl border border-[#E2E8F0] bg-slate-50 p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Topic</p>
          <p className="mt-1 text-sm text-slate-800">{basics.topic || 'Not set'}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Due date</p>
          <p className="mt-1 text-sm text-slate-800">{basics.dueDate || 'Not set'}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Attached files</p>
          {sourceFiles.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {sourceFiles.map((attachedFile) => (
                <li key={attachedFile.id} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                  {attachedFile.file.name} ({formatBytes(attachedFile.file.size)})
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-slate-500">No files attached.</p>
          )}
        </div>
      </div>
    </div>

    <div className="flex items-center justify-end gap-2 border-t border-[#E2E8F0] pt-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft size={15} />
        Back
      </button>
      <Button type="button" variant="primary" onClick={onNext} className="h-10 px-4">
        Save & assign
      </Button>
    </div>
  </div>
);

export default function AssignmentCreateWizard({
  classes,
  isLoadingClasses = false,
  onCancel,
  onComplete,
  onBasicsPreviewChange,
}: AssignmentCreateWizardProps) {
  const [currentStep, setCurrentStep] = useState<AssignmentWizardStep>(1);
  const [basics, setBasics] = useState<AssignmentBasicsState>(initialBasics);
  const [errors, setErrors] = useState<BasicsErrors>({});
  const [focusedField, setFocusedField] = useState<FocusedField>(null);
  const [touched, setTouched] = useState<Record<'topic' | 'dueDate', boolean>>({ topic: false, dueDate: false });
  const [attemptedNext, setAttemptedNext] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AssignmentAttachedFile[]>([]);

  const classMap = useMemo(() => {
    return new Map(classes.map((classOption) => [classOption.id, classOption]));
  }, [classes]);

  useEffect(() => {
    if (classes.length !== 1 || basics.classId) return;

    const singleClass = classes[0];
    const inferredLevel = inferClassLevel(singleClass);

    setBasics((prev) => ({
      ...prev,
      classId: singleClass.id,
      subject: prev.subject || singleClass.subject || '',
      level: prev.level || inferredLevel,
    }));
  }, [basics.classId, classes]);

  useEffect(() => {
    onBasicsPreviewChange?.(basics);
  }, [basics, onBasicsPreviewChange]);

  const validateBasics = (
    values: AssignmentBasicsState,
    options: { forceAll?: boolean; touchedState?: Record<'topic' | 'dueDate', boolean> } = {},
  ): BasicsErrors => {
    const { forceAll = false, touchedState = touched } = options;
    const nextErrors: BasicsErrors = {};

    const shouldValidateTopic = forceAll || touchedState.topic || attemptedNext;
    const shouldValidateDueDate = forceAll || touchedState.dueDate || attemptedNext;

    if (shouldValidateTopic && !values.topic.trim()) nextErrors.topic = 'Please enter a topic or unit.';
    if (shouldValidateDueDate && !values.dueDate.trim()) nextErrors.dueDate = 'Please select a due date.';

    return nextErrors;
  };

  const handleBasicsChange = (updates: Partial<AssignmentBasicsState>) => {
    setBasics((prev) => {
      const next = { ...prev, ...updates };

      if (Object.prototype.hasOwnProperty.call(updates, 'classId')) {
        const nextClassId = updates.classId ?? null;
        const selectedClass = nextClassId ? classMap.get(nextClassId) : null;
        const inferredLevel = inferClassLevel(selectedClass ?? null);

        if (selectedClass) {
          next.subject = selectedClass.subject ?? '';
          next.level = inferredLevel;
        } else {
          next.subject = '';
          next.level = '';
        }
      }

      setErrors(validateBasics(next));
      return next;
    });
  };

  const handleRequiredFieldBlur = (field: 'topic' | 'dueDate') => {
    if (field === 'topic') {
      setFocusedField(null);
    }

    setTouched((prev) => {
      const nextTouched = { ...prev, [field]: true };
      setErrors(validateBasics(basics, { touchedState: nextTouched }));
      return nextTouched;
    });
  };

  const handleNextFromBasics = () => {
    const touchedAll = { topic: true, dueDate: true };
    setTouched(touchedAll);
    setAttemptedNext(true);

    const nextErrors = validateBasics(basics, { forceAll: true, touchedState: touchedAll });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setCurrentStep(2);
  };

  const handleAttachFiles = (incomingFiles: FileList | File[]) => {
    const nextFiles = Array.from(incomingFiles);

    setAttachedFiles((prev) => {
      const existingKeys = new Set(prev.map((item) => `${item.file.name}:${item.file.size}:${item.file.lastModified}`));
      const dedupedNewFiles = nextFiles.filter((file) => {
        const key = `${file.name}:${file.size}:${file.lastModified}`;
        if (existingKeys.has(key)) return false;
        existingKeys.add(key);
        return true;
      });

      return [
        ...prev,
        ...dedupedNewFiles.map((file) => ({
          id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
          file,
        })),
      ];
    });
  };

  const handleRemoveAttachedFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02),_0_8px_24px_rgba(149,157,165,0.05)]">
      <div className="w-full border-b border-[#E2E8F0] bg-white">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stepLabels.map((stepItem) => {
            const isActive = stepItem.step === currentStep;
            const isCompleted = currentStep > stepItem.step;
            const isUpcoming = !isActive && !isCompleted;

            return (
              <div
                key={stepItem.step}
                className={`relative px-4 py-3 ${isActive ? 'bg-[#14b8a6]/[0.08]' : 'bg-white'}`}
              >
                {isActive && <span className="absolute left-0 right-0 top-0 h-[2px] bg-[#14b8a6]" />}
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <Check size={14} strokeWidth={1.8} className="text-[#14b8a6]" />
                  ) : (
                    <span className={`text-[10px] font-bold tracking-[0.12em] ${isActive ? 'text-[#0f766e]' : isUpcoming ? 'text-slate-400' : 'text-slate-700'}`}>
                      {stepItem.step}
                    </span>
                  )}
                  <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${isActive || isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
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
            basics={basics}
            errors={errors}
            classes={classes}
            isLoadingClasses={isLoadingClasses}
            attachedFiles={attachedFiles}
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

        {currentStep === 2 && <AssignmentObjectivesStep onBack={() => setCurrentStep(1)} onNext={() => setCurrentStep(3)} />}
        {currentStep === 3 && <AssignmentTasksStep onBack={() => setCurrentStep(2)} onNext={() => setCurrentStep(4)} />}
        {currentStep === 4 && <AssignmentReviewStep basics={basics} sourceFiles={attachedFiles} onBack={() => setCurrentStep(3)} onNext={onComplete ?? onCancel} />}
      </div>
    </div>
  );
}
