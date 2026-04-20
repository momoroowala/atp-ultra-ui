import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Trophy, Flame, CheckCircle, Info } from 'lucide-react';
import { useStatistics } from './StatisticsContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  tooltip: string;
}

const StatCard = ({ icon, label, value, subtext, tooltip }: StatCardProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Card className="cursor-help relative">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                  {label}
                  <Info className="h-3 w-3 opacity-50" />
                </p>
                <p className="text-2xl font-bold">{value}</p>
                {subtext && (
                  <p className="text-xs text-muted-foreground">{subtext}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs text-sm">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const QuickOverviewCards = () => {
  const { users, courseStructure, taskResponses, quizPassedCount } = useStatistics();

  const stats = useMemo(() => {
    const totalUsers = users.length;

    const totalTasks = courseStructure.reduce((acc, course) => 
      acc + course.phases.reduce((phaseAcc, phase) => 
        phaseAcc + phase.tasks.length, 0), 0);

    const userCompletions = new Map<string, number>();
    taskResponses
      .filter(tr => tr.status === 'completed')
      .forEach(tr => {
        userCompletions.set(tr.user_id, (userCompletions.get(tr.user_id) || 0) + 1);
      });
    
    const fullyCompletedUsers = Array.from(userCompletions.entries())
      .filter(([_, count]) => count >= totalTasks && totalTasks > 0)
      .length;

    const usersWithStreak = users.filter(u => u.current_streak && u.current_streak > 0);
    const avgStreak = usersWithStreak.length > 0
      ? (usersWithStreak.reduce((acc, u) => acc + (u.current_streak || 0), 0) / usersWithStreak.length).toFixed(1)
      : '0';

    const usersWhoTookQuiz = new Set(taskResponses.map(tr => tr.user_id)).size;
    const quizPassRate = usersWhoTookQuiz > 0 
      ? Math.round((quizPassedCount / totalUsers) * 100) 
      : 0;

    return {
      totalUsers,
      fullyCompletedUsers,
      avgStreak,
      quizPassRate,
    };
  }, [users, courseStructure, taskResponses, quizPassedCount]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<Users className="h-5 w-5" />}
        label="Total Users"
        value={stats.totalUsers}
        subtext="Active non-admin"
        tooltip="Count of all active users excluding admins and mega-admins. Only users with is_active = true are included."
      />
      <StatCard
        icon={<Trophy className="h-5 w-5" />}
        label="100% Complete"
        value={stats.fullyCompletedUsers}
        subtext="All tasks done"
        tooltip="Number of non-admin users who have completed ALL tasks across ALL active courses."
      />
      <StatCard
        icon={<Flame className="h-5 w-5" />}
        label="Avg Login Streak"
        value={stats.avgStreak}
        subtext="Days"
        tooltip="Average current login streak across all non-admin users who have at least 1 day streak."
      />
      <StatCard
        icon={<CheckCircle className="h-5 w-5" />}
        label="Quiz Pass Rate"
        value={`${stats.quizPassRate}%`}
        subtext="Users passed ≥1 quiz"
        tooltip="Percentage of total non-admin users who have passed at least one quiz."
      />
    </div>
  );
};
