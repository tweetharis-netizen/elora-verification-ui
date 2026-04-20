export interface ClassSummary {
  id: string;
  name: string;
  subject?: string;
  level?: string;
  teacherName?: string;
}

export interface ParentChildSummary {
  id: string;
  name: string;
  classes?: ClassSummary[];
}
