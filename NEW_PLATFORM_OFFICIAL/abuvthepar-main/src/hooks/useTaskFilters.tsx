import { useState, useMemo } from 'react';
import { TaskStatus } from '@/utils/taskStatusHelper';

export interface TaskFiltersState {
  status: TaskStatus[];
  phaseId: string | null;
  taskType: string | null;
  search: string;
  sortBy: 'order' | 'due_date' | 'points' | 'updated';
}

export const useTaskFilters = () => {
  const [filters, setFilters] = useState<TaskFiltersState>({
    status: [],
    phaseId: null,
    taskType: null,
    search: '',
    sortBy: 'order',
  });

  const updateFilter = <K extends keyof TaskFiltersState>(
    key: K,
    value: TaskFiltersState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      status: [],
      phaseId: null,
      taskType: null,
      search: '',
      sortBy: 'order',
    });
  };

  const filterTasks = useMemo(() => {
    return (tasks: any[]) => {
      return tasks.filter((task) => {
        // Status filter
        if (filters.status.length > 0 && !filters.status.includes(task.status)) {
          return false;
        }

        // Phase filter
        if (filters.phaseId && task.phase_id !== filters.phaseId) {
          return false;
        }

        // Task type filter
        if (filters.taskType && task.task_type !== filters.taskType) {
          return false;
        }

        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const titleMatch = task.title?.toLowerCase().includes(searchLower);
          const descMatch = task.description?.toLowerCase().includes(searchLower);
          if (!titleMatch && !descMatch) {
            return false;
          }
        }

        return true;
      });
    };
  }, [filters]);

  const sortTasks = useMemo(() => {
    return (tasks: any[]) => {
      return [...tasks].sort((a, b) => {
        switch (filters.sortBy) {
          case 'due_date':
            if (!a.dueInfo?.dueDate) return 1;
            if (!b.dueInfo?.dueDate) return -1;
            return a.dueInfo.dueDate.getTime() - b.dueInfo.dueDate.getTime();
          case 'points':
            return (b.points || 0) - (a.points || 0);
          case 'updated':
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          case 'order':
          default:
            return (
              (a.phases?.phase_order || 0) * 1000 + (a.task_order || 0) -
              ((b.phases?.phase_order || 0) * 1000 + (b.task_order || 0))
            );
        }
      });
    };
  }, [filters.sortBy]);

  return {
    filters,
    updateFilter,
    resetFilters,
    filterTasks,
    sortTasks,
  };
};
