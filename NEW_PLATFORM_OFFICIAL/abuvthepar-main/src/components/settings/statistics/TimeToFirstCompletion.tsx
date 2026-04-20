import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { useStatistics } from './StatisticsContext';
import { differenceInHours, differenceInDays } from 'date-fns';

export const TimeToFirstCompletion = () => {
  const { users, taskResponses } = useStatistics();

  const stats = useMemo(() => {
    // Find first completion per user
    const userFirstCompletion = new Map<string, Date>();
    
    taskResponses
      .filter(tr => tr.status === 'completed' && tr.completed_at)
      .forEach(tr => {
        const completedAt = new Date(tr.completed_at!);
        const existing = userFirstCompletion.get(tr.user_id);
        if (!existing || completedAt < existing) {
          userFirstCompletion.set(tr.user_id, completedAt);
        }
      });

    // Calculate time from signup to first completion
    const timesToFirst: number[] = [];
    
    users.forEach(user => {
      const firstCompletion = userFirstCompletion.get(user.id);
      if (firstCompletion) {
        const signupDate = new Date(user.created_at);
        const hours = differenceInHours(firstCompletion, signupDate);
        if (hours >= 0) {
          timesToFirst.push(hours);
        }
      }
    });

    if (timesToFirst.length === 0) {
      return {
        avgHours: 0,
        avgDays: 0,
        medianHours: 0,
        medianDays: 0,
        usersWithCompletion: 0,
        totalUsers: users.length,
      };
    }

    // Sort for median
    timesToFirst.sort((a, b) => a - b);
    
    const avgHours = Math.round(
      timesToFirst.reduce((a, b) => a + b, 0) / timesToFirst.length
    );
    
    const medianHours = timesToFirst.length % 2 === 0
      ? Math.round((timesToFirst[timesToFirst.length / 2 - 1] + timesToFirst[timesToFirst.length / 2]) / 2)
      : timesToFirst[Math.floor(timesToFirst.length / 2)];

    return {
      avgHours,
      avgDays: Math.round(avgHours / 24 * 10) / 10,
      medianHours,
      medianDays: Math.round(medianHours / 24 * 10) / 10,
      usersWithCompletion: timesToFirst.length,
      totalUsers: users.length,
    };
  }, [users, taskResponses]);

  const formatTime = (hours: number) => {
    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    const days = Math.round(hours / 24 * 10) / 10;
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time to First Task Completion
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Average Time</p>
            <p className="text-2xl font-bold">{formatTime(stats.avgHours)}</p>
            <p className="text-xs text-muted-foreground">
              From signup to first task
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Median Time</p>
            <p className="text-2xl font-bold">{formatTime(stats.medianHours)}</p>
            <p className="text-xs text-muted-foreground">
              50th percentile
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Based on {stats.usersWithCompletion} of {stats.totalUsers} users who completed at least one task
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
