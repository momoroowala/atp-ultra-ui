import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TaskStatus } from '@/utils/taskStatusHelper';

interface TaskFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusFilter: TaskStatus[];
  onStatusFilterChange: (status: TaskStatus[]) => void;
  phaseFilter: string | null;
  onPhaseFilterChange: (phaseId: string | null) => void;
  typeFilter: string | null;
  onTypeFilterChange: (type: string | null) => void;
  sortBy: string;
  onSortByChange: (sortBy: string) => void;
  phases: any[];
  onResetFilters: () => void;
}

export const TaskFilters = ({
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  phaseFilter,
  onPhaseFilterChange,
  typeFilter,
  onTypeFilterChange,
  sortBy,
  onSortByChange,
  phases,
  onResetFilters,
}: TaskFiltersProps) => {
  const statusOptions: { value: TaskStatus; label: string }[] = [
    { value: 'completed', label: 'Completed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'pending', label: 'Not Started' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'locked', label: 'Locked' },
  ];

  const typeOptions = [
    { value: 'video', label: 'Video' },
    { value: 'reading', label: 'Reading' },
    { value: 'assignment', label: 'Assignment' },
    { value: 'goal', label: 'Goal' },
  ];

  const hasActiveFilters = statusFilter.length > 0 || phaseFilter || typeFilter || searchValue;

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={phaseFilter || 'all'} onValueChange={(v) => onPhaseFilterChange(v === 'all' ? null : v)}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="All Phases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Phases</SelectItem>
            {phases.map((phase) => (
              <SelectItem key={phase.id} value={phase.id}>
                {phase.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter || 'all'} onValueChange={(v) => onTypeFilterChange(v === 'all' ? null : v)}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {typeOptions.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="order">Default Order</SelectItem>
            <SelectItem value="due_date">Due Date</SelectItem>
            <SelectItem value="points">Points</SelectItem>
            <SelectItem value="updated">Recently Updated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-muted-foreground">Status:</span>
        {statusOptions.map((option) => (
          <Badge
            key={option.value}
            variant={statusFilter.includes(option.value) ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => {
              if (statusFilter.includes(option.value)) {
                onStatusFilterChange(statusFilter.filter((s) => s !== option.value));
              } else {
                onStatusFilterChange([...statusFilter, option.value]);
              }
            }}
          >
            {option.label}
          </Badge>
        ))}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onResetFilters}>
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
};
