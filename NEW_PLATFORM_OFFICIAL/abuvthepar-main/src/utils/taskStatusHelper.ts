import { DueDateInfo } from './taskDueDateCalculator';

export type TaskStatus =
  | 'completed'
  | 'in_progress'
  | 'pending_review'
  | 'changes_required'
  | 'overdue'
  | 'pending'
  | 'locked';

export interface TaskResponse {
  status: string;
}

export function getTaskStatus(
  taskResponse: TaskResponse | null,
  dueInfo: DueDateInfo,
  isLocked: boolean
): TaskStatus {
  if (isLocked) return 'locked';

  if (taskResponse?.status) {
    if (taskResponse.status === 'completed') return 'completed';
    if (taskResponse.status === 'pending_review') return 'pending_review';
    if (taskResponse.status === 'changes_required') return 'changes_required';
    if (taskResponse.status === 'in_progress') return 'in_progress';
  }

  if (dueInfo?.isOverdue) return 'overdue';

  return 'pending';
}

export function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case 'completed':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'in_progress':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'pending_review':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'changes_required':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'overdue':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'locked':
      return 'text-muted-foreground bg-muted border-border';
    case 'pending':
    default:
      return 'text-muted-foreground bg-background border-border';
  }
}

export function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in_progress':
      return 'In Progress';
    case 'pending_review':
      return 'Pending Review';
    case 'changes_required':
      return 'Changes Required';
    case 'overdue':
      return 'Overdue';
    case 'locked':
      return 'Locked';
    case 'pending':
    default:
      return 'Not Started';
  }
}
