import { differenceInDays } from 'date-fns';

export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type StudentStatus = 'Active' | 'Never Logged In' | 'At Risk' | 'Refunded';

export interface RiskInput {
  isActive: boolean;
  lastSignInAt: string | null;
  overdueTasks?: number;
  totalTasks?: number;
}

export function getRiskScore(input: RiskInput): RiskLevel {
  if (!input.isActive) return 'Critical';

  const overdue = input.overdueTasks || 0;
  const total = input.totalTasks || 1;
  const overduePercent = (overdue / total) * 100;

  if (!input.lastSignInAt) return 'High';
  const daysSinceLogin = differenceInDays(new Date(), new Date(input.lastSignInAt));

  if (daysSinceLogin > 14 || overduePercent > 30) return 'High';
  if (daysSinceLogin > 7 || overduePercent > 10) return 'Medium';
  return 'Low';
}

export function getStudentStatus(user: { isActive: boolean; lastSignInAt: string | null }): StudentStatus {
  if (!user.isActive) return 'Refunded';
  if (!user.lastSignInAt) return 'Never Logged In';
  const daysSince = differenceInDays(new Date(), new Date(user.lastSignInAt));
  return daysSince > 14 ? 'At Risk' : 'Active';
}

export function getRiskReason(input: RiskInput): string {
  if (!input.isActive) return 'Refunded account';
  if (!input.lastSignInAt) return 'Never logged in';
  const daysSinceLogin = differenceInDays(new Date(), new Date(input.lastSignInAt));
  const overdue = input.overdueTasks || 0;
  const total = input.totalTasks || 1;
  const overduePercent = Math.round((overdue / total) * 100);

  if (daysSinceLogin > 14 && overduePercent > 30)
    return `Inactive ${daysSinceLogin}d, ${overduePercent}% overdue`;
  if (daysSinceLogin > 14) return `Inactive ${daysSinceLogin} days`;
  if (overduePercent > 30) return `${overduePercent}% tasks overdue`;
  if (daysSinceLogin > 7) return `Inactive ${daysSinceLogin} days`;
  if (overduePercent > 10) return `${overduePercent}% tasks overdue`;
  return 'On track';
}
