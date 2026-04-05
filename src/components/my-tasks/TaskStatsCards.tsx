import { ClipboardList, CheckCircle2, AlertCircle, Calendar, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface TaskStatsCardsProps {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  dueTodayTasks: number;
  totalPoints: number;
}

export const TaskStatsCards = ({
  totalTasks,
  completedTasks,
  overdueTasks,
  dueTodayTasks,
  totalPoints,
}: TaskStatsCardsProps) => {
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats = [
    {
      label: 'Total Tasks',
      value: totalTasks,
      icon: ClipboardList,
      color: 'text-primary',
    },
    {
      label: 'Completed',
      value: `${completedTasks} (${completionPercentage}%)`,
      icon: CheckCircle2,
      color: 'text-green-600',
    },
    {
      label: 'Overdue',
      value: overdueTasks,
      icon: AlertCircle,
      color: 'text-red-600',
    },
    {
      label: 'Due Today',
      value: dueTodayTasks,
      icon: Calendar,
      color: 'text-yellow-600',
    },
    {
      label: 'Points Earned',
      value: totalPoints,
      icon: Trophy,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
