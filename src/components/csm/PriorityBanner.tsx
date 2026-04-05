import { AlertCircle, MessageSquare, UserX, Clock, Ghost, CalendarX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriorityBannerProps {
  atRisk: number;
  neverLoggedIn: number;
  missedOnboarding: number;
  deadOnArrival: number;
  unreadDMs?: number;
  onCategoryClick: (key: string) => void;
  onDMClick?: () => void;
}

export function PriorityBanner({ atRisk, neverLoggedIn, missedOnboarding, deadOnArrival, unreadDMs = 0, onCategoryClick, onDMClick }: PriorityBannerProps) {
  const total = atRisk + neverLoggedIn + missedOnboarding + deadOnArrival;

  if (total === 0 && unreadDMs === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <div className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">All clear -- no students need follow-up right now.</span>
      </div>
    );
  }

  const categories = [
    { key: 'at_risk', count: atRisk, label: 'At Risk', icon: AlertCircle, color: 'red' },
    { key: 'never_logged_in', count: neverLoggedIn, label: 'Never Logged In', icon: UserX, color: 'slate' },
    { key: 'dead_on_arrival', count: deadOnArrival, label: '0 Progress', icon: Ghost, color: 'orange' },
    { key: 'missed_onboarding', count: missedOnboarding, label: 'Missed Onboarding', icon: CalendarX, color: 'violet' },
  ].filter(c => c.count > 0);

  const colorMap: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    red: { bg: 'bg-red-500/10 hover:bg-red-500/15', border: 'border-red-500/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
    slate: { bg: 'bg-slate-500/10 hover:bg-slate-500/15', border: 'border-slate-500/20', text: 'text-slate-700 dark:text-slate-400', dot: 'bg-slate-500' },
    orange: { bg: 'bg-orange-500/10 hover:bg-orange-500/15', border: 'border-orange-500/20', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
    violet: { bg: 'bg-violet-500/10 hover:bg-violet-500/15', border: 'border-violet-500/20', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-500' },
    blue: { bg: 'bg-blue-500/10 hover:bg-blue-500/15', border: 'border-blue-500/20', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Total count pill */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 border border-border/40">
        <span className="text-xs font-bold text-foreground">{total}</span>
        <span className="text-[10px] text-muted-foreground">need attention</span>
      </div>

      {/* Category pills -- clickable, compact */}
      {categories.map(({ key, count, label, icon: Icon, color }) => {
        const c = colorMap[color] || colorMap.red;
        return (
          <button
            key={key}
            onClick={() => onCategoryClick(key)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors cursor-pointer",
              c.bg, c.border
            )}
          >
            <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", c.dot)} />
            <span className={cn("text-[11px] font-semibold", c.text)}>{count}</span>
            <span className={cn("text-[10px]", c.text)}>{label}</span>
          </button>
        );
      })}

      {/* Unread DMs pill */}
      {unreadDMs > 0 && (
        <button
          onClick={onDMClick}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors cursor-pointer",
            colorMap.blue.bg, colorMap.blue.border
          )}
        >
          <MessageSquare className={cn("h-3 w-3", colorMap.blue.text)} />
          <span className={cn("text-[11px] font-semibold", colorMap.blue.text)}>{unreadDMs}</span>
          <span className={cn("text-[10px]", colorMap.blue.text)}>unread</span>
        </button>
      )}
    </div>
  );
}
