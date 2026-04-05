import { useState } from 'react';
import { useMilestones } from '@/hooks/useMilestones';
import { Flag, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const MAX_VISIBLE = 10;

export const MilestonesChecklist = ({ className }: { className?: string }) => {
  const { milestones, completedIds, toggleMilestone, isLoading } = useMilestones();
  const [expanded, setExpanded] = useState(false);

  if (isLoading || milestones.length === 0) return null;

  const done = completedIds.length;
  const total = milestones.length;
  const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;
  const firstIncompleteId = milestones.find((m) => !completedIds.includes(m.id))?.id;
  const visibleMilestones = expanded ? milestones : milestones.slice(0, MAX_VISIBLE);
  const hasMore = milestones.length > MAX_VISIBLE;

  return (
    <div data-tour="milestones-checklist" className={cn("rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm", className)}>
      {/* Header */}
      <div className="px-3 py-2.5 bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-500/15">
              <Flag className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Milestones
            </h3>
          </div>
          <span className="text-xs font-bold text-primary">
            {done} / {total}
          </span>
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 relative overflow-hidden"
              style={{
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, rgb(5 150 105) 0%, rgb(16 185 129) 100%)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Milestone list */}
      <div className="p-3 relative">
        {/* No vertical line for grid layout */}

        <div className="grid grid-cols-2 gap-1.5">
          {visibleMilestones.map((milestone, i) => {
            const isCompleted = completedIds.includes(milestone.id);
            const isNext = milestone.id === firstIncompleteId;

            return (
              <motion.button
                key={milestone.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04, ease: 'easeOut' }}
                onClick={() => toggleMilestone(milestone.id)}
                className={cn(
                  'flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-all duration-200 relative group',
                  isCompleted && 'bg-primary/5',
                  isNext && 'bg-primary/10 border border-primary/30',
                  !isCompleted && !isNext && 'hover:bg-muted/50'
                )}
              >
                {/* Step circle */}
                <div
                  className={cn(
                    'relative z-10 flex items-center justify-center h-5 w-5 rounded-full border-2 shrink-0 transition-all duration-300',
                    isCompleted &&
                      'bg-primary border-primary text-primary-foreground shadow-[0_0_8px_rgba(85,189,138,0.4)]',
                    isNext && 'border-primary bg-background',
                    !isCompleted && !isNext && 'border-muted-foreground/30 bg-background'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3" />
                  ) : isNext ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  ) : (
                    <span className="text-[9px] font-bold text-muted-foreground">
                      {milestone.sort_order}
                    </span>
                  )}
                </div>

                {/* Title */}
                <span
                  className={cn(
                    'text-xs font-medium transition-colors duration-200 truncate',
                    isCompleted && 'text-muted-foreground line-through',
                    isNext && 'text-foreground font-semibold',
                    !isCompleted && !isNext && 'text-muted-foreground/70'
                  )}
                >
                  {milestone.title}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Show more / less */}
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1 text-xs text-primary hover:underline py-2 mt-1"
          >
            {expanded ? (
              <>
                Show less <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                Show {milestones.length - MAX_VISIBLE} more <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        )}
      </div>

      {/* All complete celebration */}
      {done === total && total > 0 && (
        <div className="px-3 pb-3">
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-2 text-center">
            <p className="text-xs font-semibold text-primary">
              🎉 All milestones completed! Amazing progress!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
