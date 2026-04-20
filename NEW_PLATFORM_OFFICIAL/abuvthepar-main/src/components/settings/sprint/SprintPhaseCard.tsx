import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronRight, MoreHorizontal, Pencil, Trash2, Plus } from 'lucide-react';
import { SprintTaskCard } from './SprintTaskCard';
import type { SprintPhase, SprintTask } from '@/hooks/useSprintData';

interface Props {
  phase: SprintPhase;
  tasks: SprintTask[];
  onEditPhase: () => void;
  onDeletePhase: () => void;
  onAddTask: () => void;
  onEditTask: (task: SprintTask) => void;
  onDeleteTask: (taskId: string) => void;
  onAddModule: (taskId: string) => void;
  onRemoveModule: (moduleId: string) => void;
}

export function SprintPhaseCard({ phase, tasks, onEditPhase, onDeletePhase, onAddTask, onEditTask, onDeleteTask, onAddModule, onRemoveModule }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center gap-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CardTitle className="text-base flex-1">{phase.title}</CardTitle>
            <Badge variant="outline" className="text-xs font-mono">
              Days {phase.day_start}–{phase.day_end}
            </Badge>
            <Badge variant="secondary" className="text-xs">{tasks.length} tasks</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEditPhase}><Pencil className="h-4 w-4 mr-2" />Edit Phase</DropdownMenuItem>
                <DropdownMenuItem onClick={onDeletePhase} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete Phase</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {phase.goal_text && <p className="text-sm text-muted-foreground ml-10">{phase.goal_text}</p>}
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0 px-4 pb-4 space-y-2">
            {tasks.sort((a, b) => a.sort_order - b.sort_order).map(task => (
              <SprintTaskCard
                key={task.id}
                task={task}
                onEdit={() => onEditTask(task)}
                onDelete={() => onDeleteTask(task.id)}
                onAddModule={() => onAddModule(task.id)}
                onRemoveModule={onRemoveModule}
              />
            ))}
            <Button variant="outline" size="sm" className="w-full gap-2 mt-2" onClick={onAddTask}>
              <Plus className="h-4 w-4" /> Add Task
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
