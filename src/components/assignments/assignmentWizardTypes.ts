export type AssignmentWizardStep = 1 | 2 | 3 | 4;

export type BloomLevel = 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
export type AssignmentTaskType = 'Practice' | 'Discussion' | 'Project' | 'Quiz' | 'Reflection' | 'Other';

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

export interface AssignmentObjective {
  id: string;
  text: string;
  bloomLevel?: BloomLevel;
  category?: string;
  order: number;
  source: 'manual' | 'ai_suggested';
}

export interface AssignmentTask {
  id: string;
  title: string;
  description: string;
  objectiveIds: string[];
  estimatedMinutes?: number;
  type?: AssignmentTaskType;
  order: number;
  source: 'manual' | 'ai_suggested';
}

export interface AssignmentAttachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  lastModified: number;
  localFileRef?: File;
}

export interface AssignmentWizardState {
  basics: AssignmentBasicsState;
  objectives: AssignmentObjective[];
  tasks: AssignmentTask[];
  attachments: AssignmentAttachment[];
}

export interface AssignmentWizardReport {
  basics: {
    hasClass: boolean;
    hasSubject: boolean;
    hasLevel: boolean;
    hasDueDate: boolean;
    hasTopic: boolean;
  };
  objectives: {
    count: number;
    validCount: number;
    hasBloomLevels: boolean;
    hasCategories: boolean;
  };
  tasks: {
    count: number;
    validCount: number;
    averageEstimatedMinutes: number | null;
    objectivesCoverage: {
      covered: number;
      total: number;
    };
  };
  attachments: {
    count: number;
    files: Array<{
      filename: string;
      mimeType: string;
      sizeBytes: number;
    }>;
  };
  potentialGaps: string[];
  overallPersonalizationScore: number;
}

export interface BasicsErrors {
  topic?: string;
  dueDate?: string;
  classId?: string;
}

export interface ObjectiveFieldError {
  text?: string;
}

export interface TaskFieldError {
  title?: string;
  description?: string;
  objectiveIds?: string;
}

export interface ValidationResult {
  isValid: boolean;
  stepErrors: {
    basics?: string;
    objectives?: string;
    tasks?: string;
  };
  fieldErrors: {
    basics: BasicsErrors;
    objectives: Record<string, ObjectiveFieldError>;
    tasks: Record<string, TaskFieldError>;
  };
  firstInvalidStep?: AssignmentWizardStep;
  firstInvalidObjectiveId?: string;
  firstInvalidTaskId?: string;
}

export const BLOOM_LEVEL_OPTIONS: BloomLevel[] = [
  'Remember',
  'Understand',
  'Apply',
  'Analyze',
  'Evaluate',
  'Create',
];

export const TASK_TYPE_OPTIONS: AssignmentTaskType[] = [
  'Practice',
  'Discussion',
  'Project',
  'Quiz',
  'Reflection',
  'Other',
];
