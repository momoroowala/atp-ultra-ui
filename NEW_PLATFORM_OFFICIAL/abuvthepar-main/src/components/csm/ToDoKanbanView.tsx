import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { User, Calendar } from 'lucide-react';
import { format, isToday, isTomorrow, isPast, parseISO, addDays, isBefore } from 'date-fns';
import type { ActionItemWithStudent } from '@/hooks/useAllActionItems';

interface ToDoKanbanViewProps {
  items: ActionItemWithStudent[];
  onToggle: (item: ActionItemWithStudent) => void;
}

interface ColumnDef {
  key: string;
  label: string;
  dotColor: string;
  bgColor: string;
}

const COLUMNS: ColumnDef[] = [
  { key: 'overdue', label: 'Overdue', dotColor: 'bg-red-500', bgColor: 'bg-red-50 dark:bg-red-950/20' },
  { key: 'dueSoon', label: 'Due Soon', dotColor: 'bg-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-950/20' },
  { key: 'noDate', label: 'No Due Date', dotColor: 'bg-muted-foreground', bgColor: 'bg-muted/30' },
  { key: 'completed', label: 'Completed', dotColor: 'bg-green-500', bgColor: 'bg-green-50 dark:bg-green-950/20' },
];

function categorize(item: ActionItemWithStudent): string {
  if (item.is_completed) return 'completed';
  if (!item.due_date) return 'noDate';
  const date = parseISO(item.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isBefore(date, today)) return 'overdue';
  if (isBefore(date, addDays(today, 4))) return 'dueSoon'; // today, tomorrow, +2, +3
  return 'noDate';
}

const ItemCard = ({ item, onToggle }: { item: ActionItemWithStudent; onToggle: () => void }) => {
  const dueBadge = () => {
    if (!item.due_date || item.is_completed) return null;
    const date = parseISO(item.due_date);
    if (isToday(date)) return <Badge className="bg-amber-500 text-white text-[10px]">Today</Badge>;
    if (isTomorrow(date)) return <Badge className="bg-amber-400 text-white text-[10px]">Tomorrow</Badge>;
    if (isPast(date)) return <Badge variant="destructive" className="text-[10px]">Overdue</Badge>;
    return <Badge variant="outline" className="text-[10px]">{format(date, 'MMM d')}</Badge>;
  };

  return (
    <Card className="p-3 bg-card hover:shadow-md transition-shadow">
      <div className="flex items-start gap-2">
        <Checkbox
          checked={item.is_completed}
          onCheckedChange={onToggle}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-sm leading-tight ${item.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {item.text}
            </span>
            {dueBadge()}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 truncate">
              <User className="h-3 w-3 shrink-0" />
              {item.student_name}
            </span>
            {item.due_date && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0" />
                {format(parseISO(item.due_date), 'MMM d')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export function ToDoKanbanView({ items, onToggle }: ToDoKanbanViewProps) {
  const columnData = useMemo(() => {
    const map: Record<string, ActionItemWithStudent[]> = { overdue: [], dueSoon: [], noDate: [], completed: [] };
    items.forEach(item => {
      const cat = categorize(item);
      map[cat].push(item);
    });
    return map;
  }, [items]);

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 400px)' }}>
      {COLUMNS.map(col => (
        <div key={col.key} className={`flex flex-col rounded-lg flex-1 min-w-[200px] ${col.bgColor}`}>
          <div className="px-3 py-2.5 flex items-center gap-2 border-b border-border/30">
            <div className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`} />
            <span className="text-xs font-semibold text-foreground">{col.label}</span>
            <span className="text-[10px] text-muted-foreground font-medium ml-auto">
              {columnData[col.key].length}
            </span>
          </div>
          <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[100px]">
            {columnData[col.key].map(item => (
              <ItemCard key={item.id} item={item} onToggle={() => onToggle(item)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
