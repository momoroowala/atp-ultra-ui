import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
interface LessonNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  className?: string;
}
export function LessonNavigation({
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  className
}: LessonNavigationProps) {
  return <div className={cn("flex items-center justify-between border border-primary/30 rounded-xl p-3", className)}>
      <Button variant="outline" onClick={onPrevious} disabled={!hasPrevious} className="h-9 gap-2 bg-card border-border hover:bg-muted/50 text-sm">
        <ChevronLeft className="h-4 w-4" />
        Previous Lesson
      </Button>
      
      <Button onClick={onNext} disabled={!hasNext} className="h-9 gap-2 text-white text-sm" style={{
      background: 'radial-gradient(160.59% 161.46% at 50% 0%, #2D8F64 0%, #6EDAA6 100%), #55BD8A'
    }}>
        Next Lesson
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>;
}