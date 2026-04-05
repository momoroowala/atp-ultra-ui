import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

interface StudentHoverCardProps {
  firstName: string;
  lastName: string;
  email: string;
  lastSignInAt?: string | null;
  completedTasks?: number;
  totalTasks?: number;
  children: React.ReactNode;
}

function daysAgo(dateStr?: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return '1 day ago';
  return `${diff} days ago`;
}

export function StudentHoverCard({
  firstName,
  lastName,
  email,
  lastSignInAt,
  completedTasks = 0,
  totalTasks = 24,
  children,
}: StudentHoverCardProps) {
  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || email;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="start"
          className="w-56 p-3 bg-card border shadow-lg rounded-lg z-50"
        >
          <p className="text-xs font-bold text-foreground">{fullName}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{email}</p>
          <div className="flex items-center gap-2 mt-2 text-[10px]">
            <span className="text-muted-foreground">Last active:</span>
            <span className="font-medium text-foreground">{daysAgo(lastSignInAt)}</span>
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
