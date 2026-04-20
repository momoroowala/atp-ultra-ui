import { useState, useMemo } from 'react';
import { useAllActionItems, type ActionItemWithStudent } from '@/hooks/useAllActionItems';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, Calendar, User, AlertCircle, List, Columns } from 'lucide-react';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { ToDoKanbanView } from './ToDoKanbanView';
import { Button } from '@/components/ui/button';

type StatusFilter = 'all' | 'pending' | 'completed';
type SortBy = 'due_date' | 'created_at';
type ViewMode = 'list' | 'pipeline';

export function CSMToDoTab() {
  const { data: items = [], isLoading } = useAllActionItems();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [studentFilter, setStudentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('due_date');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const students = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach(i => map.set(i.client_user_id, i.student_name));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [items]);

  const filtered = useMemo(() => {
    let result = [...items];
    if (statusFilter === 'pending') result = result.filter(i => !i.is_completed);
    else if (statusFilter === 'completed') result = result.filter(i => i.is_completed);
    if (studentFilter !== 'all') result = result.filter(i => i.client_user_id === studentFilter);

    result.sort((a, b) => {
      if (sortBy === 'due_date') {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return result;
  }, [items, statusFilter, studentFilter, sortBy]);

  const handleToggle = async (item: ActionItemWithStudent) => {
    await supabase
      .from('client_action_items')
      .update({ is_completed: !item.is_completed } as any)
      .eq('id', item.id);
    queryClient.invalidateQueries({ queryKey: ['all-action-items'] });
    queryClient.invalidateQueries({ queryKey: ['client-action-items', item.client_user_id] });
  };

  const getDueDateBadge = (dueDate: string | null, isCompleted: boolean) => {
    if (!dueDate || isCompleted) return null;
    const date = parseISO(dueDate);
    if (isToday(date)) return <Badge className="bg-amber-500 text-white text-[10px]">Due today</Badge>;
    if (isTomorrow(date)) return <Badge className="bg-amber-400 text-white text-[10px]">Due tomorrow</Badge>;
    if (isPast(date)) return <Badge variant="destructive" className="text-[10px]">Overdue</Badge>;
    return <Badge variant="outline" className="text-[10px]">{format(date, 'MMM d')}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-3 mt-3">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    );
  }

  const pendingCount = items.filter(i => !i.is_completed).length;

  return (
    <div className="space-y-3 mt-2">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({items.length})</SelectItem>
            <SelectItem value="pending">Pending ({pendingCount})</SelectItem>
            <SelectItem value="completed">Completed ({items.length - pendingCount})</SelectItem>
          </SelectContent>
        </Select>

        <Select value={studentFilter} onValueChange={setStudentFilter}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue placeholder="All Students" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            {students.map(([id, name]) => (
              <SelectItem key={id} value={id}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="due_date">Sort by Due Date</SelectItem>
            <SelectItem value="created_at">Sort by Created</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'pipeline' ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setViewMode('pipeline')}
          >
            <Columns className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === 'pipeline' ? (
        <ToDoKanbanView items={filtered} onToggle={handleToggle} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <ClipboardList className="h-10 w-10 mb-3 opacity-40" />
          <p className="font-medium">No action items found</p>
          <p className="text-sm">Action items added to students will appear here.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map(item => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={item.is_completed}
                onCheckedChange={() => handleToggle(item)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm ${item.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {item.text}
                  </span>
                  {getDueDateBadge(item.due_date, item.is_completed)}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {item.student_name}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(item.created_at), 'MMM d')}
                  </span>
                  <span>by {item.created_by_name}</span>
                  {item.is_completed && item.completed_at && (
                    <span className="text-emerald-600">
                      ✓ {format(new Date(item.completed_at), 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
