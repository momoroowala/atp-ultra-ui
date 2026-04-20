import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LessonNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  className?: string;
  onMarkComplete?: () => void;
  isCompleted?: boolean;
  isMarking?: boolean;
  showMarkComplete?: boolean;
}

export function LessonNavigation({
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  className,
  onMarkComplete,
  isCompleted,
  isMarking,
  showMarkComplete,
}: LessonNavigationProps) {
  return (
    <div className={cn("flex items-center justify-between border border-primary/30 rounded-xl p-3", className)}>
      <Button variant="outline" onClick={onPrevious} disabled={!hasPrevious} className="h-9 gap-2 bg-card border-border hover:bg-muted/50 text-sm">
        <ChevronLeft className="h-4 w-4" />
        Previous Lesson
      </Button>

      {showMarkComplete && (
        isCompleted ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <Check className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Completed</span>
          </div>
        ) : (
          <Button
            onClick={onMarkComplete}
            disabled={isMarking}
            size="sm"
            className="h-9 gap-2 text-sm"
          >
            {isMarking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Mark as Complete
              </>
            )}
          </Button>
        )
      )}

      <Button variant="outline" onClick={onNext} disabled={!hasNext} className="h-9 gap-2 bg-card border-border hover:bg-muted/50 text-sm">
        Next Lesson
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
