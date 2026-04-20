import { addDays, formatDistanceToNow, isToday, isPast } from 'date-fns';

export interface DueDateInfo {
  dueDate: Date | null;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueSoon: boolean;
  timeRemaining: string | null;
}

export interface Task {
  due_date_enabled: boolean;
  due_date_start_type: string;
  due_date_days: number;
  due_date_start_phase_id?: string;
}

export function calculateDueDate(
  task: Task,
  userCreatedAt: string,
  phaseCompletions: Record<string, Date>
): DueDateInfo {
  if (!task.due_date_enabled) {
    return {
      dueDate: null,
      isOverdue: false,
      isDueToday: false,
      isDueSoon: false,
      timeRemaining: null,
    };
  }

  let startDate: Date;

  if (task.due_date_start_type === 'join_date') {
    startDate = new Date(userCreatedAt);
  } else if (task.due_date_start_type === 'phase_completion') {
    const phaseCompletion = task.due_date_start_phase_id
      ? phaseCompletions[task.due_date_start_phase_id]
      : null;
    if (!phaseCompletion) {
      return {
        dueDate: null,
        isOverdue: false,
        isDueToday: false,
        isDueSoon: false,
        timeRemaining: null,
      };
    }
    startDate = phaseCompletion;
  } else {
    return {
      dueDate: null,
      isOverdue: false,
      isDueToday: false,
      isDueSoon: false,
      timeRemaining: null,
    };
  }

  const dueDate = addDays(startDate, task.due_date_days || 0);
  const now = new Date();
  const isOverdue = isPast(dueDate) && !isToday(dueDate);
  const isDueTodayValue = isToday(dueDate);
  
  // Calculate if due soon (within 20% of total window)
  const totalWindowMs = (task.due_date_days || 0) * 24 * 60 * 60 * 1000;
  const timeRemainingMs = dueDate.getTime() - now.getTime();
  const isDueSoon = timeRemainingMs > 0 && timeRemainingMs < totalWindowMs * 0.2;

  const timeRemaining = !isOverdue ? formatDistanceToNow(dueDate, { addSuffix: true }) : null;

  return {
    dueDate,
    isOverdue,
    isDueToday: isDueTodayValue,
    isDueSoon,
    timeRemaining,
  };
}
