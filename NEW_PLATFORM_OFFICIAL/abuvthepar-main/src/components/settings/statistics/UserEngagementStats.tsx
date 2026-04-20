import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserX, Clock, AlertTriangle, UserMinus } from 'lucide-react';
import { useStatistics } from './StatisticsContext';
import { UserListModal, UserListItem } from './UserListModal';
import { differenceInDays } from 'date-fns';

type ModalType = 'idle' | 'dropout' | 'failureLaunch' | 'neverLogged' | null;

interface EngagementCardProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  description: string;
  onClick: () => void;
  variant?: 'warning' | 'danger' | 'info';
}

const EngagementCard = ({ icon, label, count, description, onClick, variant = 'info' }: EngagementCardProps) => {
  const variantStyles = {
    warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    danger: 'bg-red-500/10 text-red-600 dark:text-red-400',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${variantStyles[variant]}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const UserEngagementStats = () => {
  const { users, courseStructure, taskResponses } = useStatistics();
  const [modalType, setModalType] = useState<ModalType>(null);

  const now = new Date();

  const engagementData = useMemo(() => {
    // Calculate total tasks for progress percentage
    const totalTasks = courseStructure.reduce((acc, course) => 
      acc + course.phases.reduce((phaseAcc, phase) => 
        phaseAcc + phase.tasks.length, 0), 0);

    // Count completed tasks per user
    const userCompletedTasks = new Map<string, number>();
    const userLastCompletion = new Map<string, Date>();
    
    taskResponses
      .filter(tr => tr.status === 'completed')
      .forEach(tr => {
        userCompletedTasks.set(tr.user_id, (userCompletedTasks.get(tr.user_id) || 0) + 1);
        if (tr.completed_at) {
          const completedAt = new Date(tr.completed_at);
          const existing = userLastCompletion.get(tr.user_id);
          if (!existing || completedAt > existing) {
            userLastCompletion.set(tr.user_id, completedAt);
          }
        }
      });

    const idle: UserListItem[] = [];
    const dropout: UserListItem[] = [];
    const failureLaunch: UserListItem[] = [];
    const neverLogged: UserListItem[] = [];

    users.forEach(user => {
      const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.user_email || 'Unknown';
      const completedCount = userCompletedTasks.get(user.id) || 0;
      const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
      const daysSinceSignup = differenceInDays(now, new Date(user.created_at));
      
      const baseItem: UserListItem = {
        id: user.id,
        email: user.user_email,
        name,
        created_at: user.created_at,
        last_login: user.last_login_date,
        progress,
      };

      // Never logged in
      if (!user.total_logins || user.total_logins === 0) {
        neverLogged.push(baseItem);
        return;
      }

      // Idle users: no login for 5+ days (but has logged in before)
      if (user.last_login_date) {
        const daysSinceLogin = differenceInDays(now, new Date(user.last_login_date));
        if (daysSinceLogin >= 5) {
          idle.push(baseItem);
        }
      }

      // Failure to launch: 0% progress, 5+ days since signup, has logged in
      if (completedCount === 0 && daysSinceSignup >= 5 && user.total_logins && user.total_logins > 0) {
        failureLaunch.push(baseItem);
      }

      // Course dropouts: has some progress (>0%), not 100%, 5+ days since last task
      if (completedCount > 0 && progress < 100) {
        const lastCompletion = userLastCompletion.get(user.id);
        if (lastCompletion) {
          const daysSinceLastTask = differenceInDays(now, lastCompletion);
          if (daysSinceLastTask >= 5) {
            dropout.push(baseItem);
          }
        }
      }
    });

    return { idle, dropout, failureLaunch, neverLogged };
  }, [users, courseStructure, taskResponses, now]);

  const getModalData = (): { title: string; users: UserListItem[] } => {
    switch (modalType) {
      case 'idle':
        return { title: 'Idle Users (5+ days since last login)', users: engagementData.idle };
      case 'dropout':
        return { title: 'Course Dropouts (5+ days since last task)', users: engagementData.dropout };
      case 'failureLaunch':
        return { title: 'Failure to Launch (0% progress, 5+ days old)', users: engagementData.failureLaunch };
      case 'neverLogged':
        return { title: 'Never Logged In', users: engagementData.neverLogged };
      default:
        return { title: '', users: [] };
    }
  };

  const modalData = getModalData();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>User Engagement Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <EngagementCard
              icon={<Clock className="h-5 w-5" />}
              label="Idle Users"
              count={engagementData.idle.length}
              description="No login for 5+ days"
              onClick={() => setModalType('idle')}
              variant="warning"
            />
            <EngagementCard
              icon={<UserMinus className="h-5 w-5" />}
              label="Course Dropouts"
              count={engagementData.dropout.length}
              description="5+ days since last task"
              onClick={() => setModalType('dropout')}
              variant="danger"
            />
            <EngagementCard
              icon={<AlertTriangle className="h-5 w-5" />}
              label="Failure to Launch"
              count={engagementData.failureLaunch.length}
              description="0% progress after 5 days"
              onClick={() => setModalType('failureLaunch')}
              variant="danger"
            />
            <EngagementCard
              icon={<UserX className="h-5 w-5" />}
              label="Never Logged In"
              count={engagementData.neverLogged.length}
              description="No login record"
              onClick={() => setModalType('neverLogged')}
              variant="info"
            />
          </div>
        </CardContent>
      </Card>

      <UserListModal
        open={modalType !== null}
        onClose={() => setModalType(null)}
        title={modalData.title}
        users={modalData.users}
      />
    </>
  );
};
