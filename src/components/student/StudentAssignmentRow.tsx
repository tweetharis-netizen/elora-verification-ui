import React from 'react';
import { AssignmentRow } from '../assignments/AssignmentRow';

interface StudentAssignmentRowProps {
  item: {
    id: string;
    title: string;
    subject?: string;
    className?: string;
    dueDate?: string;
    status: string; // 'danger' | 'warning' | 'info' | 'completed' | 'success'
    gamePackId?: string;
    attemptId?: string;
    kind?: string;
  };
  onAction: () => void;
}

function relativeDueDate(iso?: string): string {
  if (!iso) return 'No due date';
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days < -1) return `Overdue ${Math.abs(days)}d`;
  if (days <= 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 7) return `Due in ${days}d`;
  return `Due ${new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
}

export function StudentAssignmentRow({ item, onAction }: StudentAssignmentRowProps) {
  const isOverdue    = item.status === 'danger';
  const isCompleted  = item.status === 'completed' || item.status === 'success';
  const isInProgress = item.status === 'warning';
  const isSignatureAlertTitle = /algebra quiz 1|kinematics worksheet/i.test(item.title);

  const statusText = isSignatureAlertTitle
    ? 'At Risk'
    : isCompleted
    ? 'Completed'
    : isOverdue
    ? 'Overdue'
    : isInProgress
    ? 'In Progress'
    : 'Not Started';

  const progressValue = isCompleted
    ? 100
    : isOverdue
    ? 30
    : isInProgress
    ? 60
    : 5;

  const subject = item.subject || 'General';
  const className = item.className || 'Class';
  const dueLabel = relativeDueDate(item.dueDate);

  return (
    <AssignmentRow
      variant="student"
      title={item.title}
      statusLabel={statusText}
      metadata={`${subject} • ${className} • ${dueLabel}`}
      isAlert={isOverdue || isSignatureAlertTitle}
      onClick={onAction}
      studentProgress={{
        value: progressValue,
        goal: 70,
        ctaLabel: isCompleted ? 'Review' : 'Submit',
      }}
    />
  );
}
