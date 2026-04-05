import { ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyTaskStateProps {
  hasFilters: boolean;
  onResetFilters: () => void;
}

export const EmptyTaskState = ({ hasFilters, onResetFilters }: EmptyTaskStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">
        {hasFilters ? 'No modules match your filters' : 'No modules available'}
      </h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        {hasFilters
          ? 'Try adjusting your filters to see more modules.'
          : 'Modules will appear here as they become available to you.'}
      </p>
      {hasFilters && (
        <Button onClick={onResetFilters} variant="outline">
          Clear Filters
        </Button>
      )}
    </div>
  );
};
