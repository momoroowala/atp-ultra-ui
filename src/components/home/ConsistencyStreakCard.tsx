import { Flame, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLoginStreak } from '@/hooks/useLoginStreak';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export const ConsistencyStreakCard = () => {
  const navigate = useNavigate();
  const { currentStreak, loading } = useLoginStreak();

  if (loading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <div className="px-3 py-2.5 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent">
          <Skeleton className="h-5 w-36" />
        </div>
        <div className="p-4 space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-3 py-2.5 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-amber-500/15">
            <Flame className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Consistency Streak
          </h3>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Streak message */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-amber-500/12 border border-amber-500/25">
            <Flame className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">
              {currentStreak} day streak!
            </p>
            <p className="text-xs text-muted-foreground">
              Maintain your streak by completing today's task.
            </p>
          </div>
        </div>

        {/* CTA */}
        <Button
          className="w-full"
          onClick={() => navigate('/my-plan')}
        >
          Complete Today's Task
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
