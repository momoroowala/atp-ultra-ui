import { TaskCard } from './TaskCard';
import { EmptyTaskState } from './EmptyTaskState';

interface TaskListViewProps {
  tasks: any[];
  hasFilters: boolean;
  onResetFilters: () => void;
  onTaskClick: (taskId: string) => void;
  onStartTask: (taskId: string) => void;
}

export const TaskListView = ({
  tasks,
  hasFilters,
  onResetFilters,
  onTaskClick,
  onStartTask,
}: TaskListViewProps) => {
  if (tasks.length === 0) {
    return <EmptyTaskState hasFilters={hasFilters} onResetFilters={onResetFilters} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          status={task.status}
          dueInfo={task.dueInfo}
          onStartTask={() => onStartTask(task.id)}
          onClick={() => onTaskClick(task.id)}
        />
      ))}
    </div>
  );
};
