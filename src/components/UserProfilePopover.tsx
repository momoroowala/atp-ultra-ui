import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, AlertTriangle, Calendar, CheckCircle2, Clock, Flame, Users, TicketCheck, CalendarDays } from 'lucide-react';
import { useUserDetails } from '@/hooks/useUserDetails';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { format } from 'date-fns';
import { getRiskScore, getRiskReason, type RiskLevel } from '@/utils/riskScore';

interface UserProfilePopoverProps {
  userId: string;
  children: ReactNode;
}

export const UserProfilePopover = ({ userId, children }: UserProfilePopoverProps) => {
  const { isAdmin, isCSM, isExecutive } = useRoleCheck();
  const isStaff = isAdmin || isCSM || isExecutive;
  const [open, setOpen] = useState(false);

  if (!isStaff || !userId) {
    return <>{children}</>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="cursor-pointer text-left inline-flex items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-80 p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <PopoverCard userId={userId} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};

const riskColors: Record<RiskLevel, string> = {
  Critical: 'text-red-600 dark:text-red-400',
  High: 'text-orange-600 dark:text-orange-400',
  Medium: 'text-yellow-600 dark:text-yellow-400',
  Low: 'text-green-600 dark:text-green-400',
};

const riskBgColors: Record<RiskLevel, string> = {
  Critical: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  High: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  Low: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
};

function PopoverCard({ userId, onClose }: { userId: string; onClose: () => void }) {
  const navigate = useNavigate();
  const { data, isLoading } = useUserDetails(userId);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 text-sm text-muted-foreground">User not found</div>
    );
  }

  const profile = data.profile || {};
  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User';
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const email = data.email || profile.user_email || '';
  const tierName = profile.tier_display_name || profile.tier || '—';
  const roleName = data.role || '—';

  // Progress
  const completedTasks = data.completedTasks ?? 0;
  const totalTasks = data.totalTasks ?? 0;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Risk — compute from utility
  const riskInput = {
    isActive: data.isActive !== false,
    lastSignInAt: data.lastSignInAt || profile.last_sign_in_at || null,
    lastTaskCompletedAt: data.lastTaskCompletedAt || null,
    overdueTasks: data.summary?.overdueTasks ?? 0,
    totalTasks: totalTasks,
  };
  const riskLevel = getRiskScore(riskInput);
  const riskReason = getRiskReason(riskInput);

  // Overdue / Due Soon
  const overdueTasks = data.summary?.overdueTasks ?? 0;
  const dueSoonTasks = data.summary?.dueSoonTasks ?? 0;

  // Onboarding
  const onboardingStatus = profile.onboarding_booking_status || 'not_started';
  const onboardingLabel = onboardingStatus === 'completed' ? 'Completed' : onboardingStatus === 'missed' ? 'Missed' : onboardingStatus === 'rescheduled' ? 'Rescheduled' : 'Not Started';
  const onboardingColor = onboardingStatus === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : onboardingStatus === 'missed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : onboardingStatus === 'rescheduled' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-muted text-muted-foreground';

  // Last active
  const lastSignIn = data.lastSignInAt || profile.last_sign_in_at;

  // Login streak
  const loginStreak = data.loginStreak?.current_streak ?? 0;

  // CSM
  const csmName = data.csmName || null;

  // Joined
  const joinedDate = profile.created_at;

  // Tickets
  const tickets = data.tickets || [];
  const openTickets = tickets.filter((t: any) => t.status === 'open' || t.status === 'in_progress').length;

  const handleViewProfile = () => {
    onClose();
    navigate('/csm-panel', { state: { viewStudentId: userId, activeTab: 'students' } });
  };

  return (
    <div className="divide-y divide-border">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{fullName}</p>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{tierName}</Badge>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">{roleName}</Badge>
          </div>
        </div>
      </div>

      {/* Risk + Progress */}
      <div className="p-4 space-y-3">
        {/* Risk Level */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Risk Level
          </span>
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${riskBgColors[riskLevel]}`}>
              {riskLevel}
            </Badge>
          </div>
        </div>
        {riskReason && riskReason !== 'On track' && (
          <p className={`text-[10px] ${riskColors[riskLevel]} -mt-1.5 ml-4`}>{riskReason}</p>
        )}

        {/* Course Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Course Progress
            </span>
            <span className="font-medium text-foreground">{completedTasks}/{totalTasks} tasks</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>

        {/* Overdue + Due Soon */}
        {(overdueTasks > 0 || dueSoonTasks > 0) && (
          <div className="flex items-center gap-3 text-xs">
            {overdueTasks > 0 && (
              <span className="text-red-600 dark:text-red-400 flex items-center gap-1 font-medium">
                <Clock className="h-3 w-3" /> {overdueTasks} overdue
              </span>
            )}
            {dueSoonTasks > 0 && (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                <Clock className="h-3 w-3" /> {dueSoonTasks} due soon
              </span>
            )}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-4 space-y-2.5">
        {/* Login Streak */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <Flame className="h-3 w-3" /> Login Streak
          </span>
          <span className="font-medium text-foreground">{loginStreak} day{loginStreak !== 1 ? 's' : ''}</span>
        </div>

        {/* Onboarding */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Onboarding</span>
          <Badge variant="secondary" className={`text-[10px] ${onboardingColor}`}>{onboardingLabel}</Badge>
        </div>

        {/* Assigned CSM */}
        {csmName && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> Assigned CSM
            </span>
            <span className="font-medium text-foreground">{csmName}</span>
          </div>
        )}

        {/* Support Tickets */}
        {tickets.length > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <TicketCheck className="h-3 w-3" /> Tickets
            </span>
            <span className="font-medium text-foreground">
              {tickets.length} total{openTickets > 0 && <span className="text-amber-600 dark:text-amber-400"> · {openTickets} open</span>}
            </span>
          </div>
        )}

        {/* Last Active */}
        {lastSignIn && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Last Active
            </span>
            <span className="text-foreground">{format(new Date(lastSignIn), 'MMM d, yyyy')}</span>
          </div>
        )}

        {/* Joined Date */}
        {joinedDate && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <CalendarDays className="h-3 w-3" /> Joined
            </span>
            <span className="text-foreground">{format(new Date(joinedDate), 'MMM d, yyyy')}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3">
        <Button size="sm" className="w-full gap-2" onClick={handleViewProfile}>
          <ExternalLink className="h-3.5 w-3.5" />
          View Full Profile
        </Button>
      </div>
    </div>
  );
}
