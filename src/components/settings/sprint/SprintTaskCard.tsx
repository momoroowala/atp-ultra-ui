import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Plus, X } from 'lucide-react';
import type { SprintTask } from '@/hooks/useSprintData';

interface Props {
  task: SprintTask;
  onEdit: () => void;
  onDelete: () => void;
  onAddModule: () => void;
  onRemoveModule: (moduleId: string) => void;
}

export function SprintTaskCard({ task, onEdit, onDelete, onAddModule, onRemoveModule }: Props) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors">
      <Badge variant="outline" className="shrink-0 text-xs font-mono">
        Day {task.day_number}
      </Badge>
      <span className="font-medium text-sm flex-1 truncate">{task.title}</span>

      {task.is_checkpoint && (
        <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-xs">Checkpoint</Badge>
      )}
      {task.is_final && (
        <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs">Final</Badge>
      )}

      {/* Module chips */}
      <div className="flex items-center gap-1 flex-wrap">
        {task.modules.map(m => (
          <Badge key={m.id} variant="secondary" className="text-xs gap-1 pr-1">
            {m.module_name}
            <button onClick={() => onRemoveModule(m.id)} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAddModule}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
