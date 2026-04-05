import { differenceInDays } from 'date-fns';

export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type StudentStatus = 'Active' | 'Never Logged In' | 'At Risk' | 'Refunded';

export interface RiskInput {
  isActive: boolean;
  lastSignInAt: string | null;
  lastTaskCompletedAt?: string | null;
  overdueTasks?: number;
  totalTasks?: number;
}

/** Return the most recent activity date from login and task completion. */
function getLastActivityDate(input: RiskInput): string | null {
  const candidates = [input.lastSignInAt, input.lastTaskCompletedAt].filter(Boolean) as string[];
  if (candidates.length === 0) return null;
  return candidates.reduce((latest, d) => (new Date(d) > new Date(latest) ? d : latest));
}

export function getRiskScore(input: RiskInput): RiskLevel {
  if (!input.isActive) return 'Critical';

  const overdue = input.overdueTasks || 0;
  const total = input.totalTasks || 1;
  const overduePercent = (overdue / total) * 100;

  const lastActivity = getLastActivityDate(input);
  if (!lastActivity) return 'High';
  const daysSinceActivity = differenceInDays(new Date(), new Date(lastActivity));

  if (daysSinceActivity > 14 || overduePercent > 30) return 'High';
  if (daysSinceActivity > 7 || overduePercent > 10) return 'Medium';
  return 'Low';
}

export function getStudentStatus(user: { isActive: boolean; lastSignInAt: string | null; lastTaskCompletedAt?: string | null }): StudentStatus {
  if (!user.isActive) return 'Refunded';
  const lastActivity = getLastActivityDate({ isActive: user.isActive, lastSignInAt: user.lastSignInAt, lastTaskCompletedAt: user.lastTaskCompletedAt });
  if (!lastActivity) return 'Never Logged In';
  const daysSince = differenceInDays(new Date(), new Date(lastActivity));
  return daysSince > 14 ? 'At Risk' : 'Active';
}

export function getRiskReason(input: RiskInput): string {
  if (!input.isActive) return 'Refunded account';
  const lastActivity = getLastActivityDate(input);
  if (!lastActivity) return 'Never logged in';
  const daysSinceActivity = differenceInDays(new Date(), new Date(lastActivity));
  const overdue = input.overdueTasks || 0;
  const total = input.totalTasks || 1;
  const overduePercent = Math.round((overdue / total) * 100);

  if (daysSinceActivity > 14 && overduePercent > 30)
    return `Inactive ${daysSinceActivity}d, ${overduePercent}% overdue`;
  if (daysSinceActivity > 14) return `Inactive ${daysSinceActivity} days`;
  if (overduePercent > 30) return `${overduePercent}% tasks overdue`;
  if (daysSinceActivity > 7) return `Inactive ${daysSinceActivity} days`;
  if (overduePercent > 10) return `${overduePercent}% tasks overdue`;
  return 'On track';
}
