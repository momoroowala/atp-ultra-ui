import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useSprintData, type SprintPhase, type SprintTask } from '@/hooks/useSprintData';
import { useSprintAdmin } from '@/hooks/useSprintAdmin';
import { SprintPhaseCard } from './sprint/SprintPhaseCard';
import { SprintPhaseDialog } from './sprint/SprintPhaseDialog';
import { SprintTaskDialog } from './sprint/SprintTaskDialog';
import { SprintModuleDialog } from './sprint/SprintModuleDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export function SprintManagementTab() {
  const { phases, tasks, isLoading } = useSprintData();
  const admin = useSprintAdmin();

  // Phase dialog
  const [phaseDialogOpen, setPhaseDialogOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<SprintPhase | null>(null);

  // Task dialog
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<SprintTask | null>(null);
  const [taskPhaseId, setTaskPhaseId] = useState('');

  // Module dialog
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [moduleTaskId, setModuleTaskId] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'phase' | 'task'; id: string; name: string } | null>(null);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const handleSavePhase = (data: Omit<SprintPhase, 'id'> & { id?: string }) => {
    if (data.id) {
      admin.updatePhase.mutate({ id: data.id, title: data.title, day_start: data.day_start, day_end: data.day_end, goal_text: data.goal_text, completion_banner_text: data.completion_banner_text, sort_order: data.sort_order });
    } else {
      admin.createPhase.mutate({ title: data.title, day_start: data.day_start, day_end: data.day_end, goal_text: data.goal_text, completion_banner_text: data.completion_banner_text, sort_order: data.sort_order });
    }
  };

  const handleSaveTask = (data: any) => {
    if (data.id) {
      admin.updateTask.mutate(data);
    } else {
      admin.createTask.mutate(data);
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'phase') admin.deletePhase.mutate(deleteTarget.id);
    else admin.deleteTask.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  const sortedPhases = [...phases].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">My Roadmap Management</h2>
          <p className="text-sm text-muted-foreground">Manage phases, tasks, and module links for the sprint roadmap.</p>
        </div>
        <Button onClick={() => { setEditingPhase(null); setPhaseDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Phase
        </Button>
      </div>

      <div className="space-y-3">
        {sortedPhases.map(phase => (
          <SprintPhaseCard
            key={phase.id}
            phase={phase}
            tasks={tasks.filter(t => t.phase_id === phase.id)}
            onEditPhase={() => { setEditingPhase(phase); setPhaseDialogOpen(true); }}
            onDeletePhase={() => setDeleteTarget({ type: 'phase', id: phase.id, name: phase.title })}
            onAddTask={() => { setEditingTask(null); setTaskPhaseId(phase.id); setTaskDialogOpen(true); }}
            onEditTask={(t) => { setEditingTask(t); setTaskPhaseId(t.phase_id); setTaskDialogOpen(true); }}
            onDeleteTask={(id) => { const t = tasks.find(x => x.id === id); setDeleteTarget({ type: 'task', id, name: t?.title ?? 'Task' }); }}
            onAddModule={(taskId) => { setModuleTaskId(taskId); setModuleDialogOpen(true); }}
            onRemoveModule={(moduleId) => admin.removeModule.mutate(moduleId)}
          />
        ))}
      </div>

      {/* Dialogs */}
      <SprintPhaseDialog
        open={phaseDialogOpen}
        onOpenChange={setPhaseDialogOpen}
        phase={editingPhase}
        nextSortOrder={phases.length > 0 ? Math.max(...phases.map(p => p.sort_order)) + 1 : 0}
        onSave={handleSavePhase}
      />

      <SprintTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={editingTask}
        phases={phases}
        defaultPhaseId={taskPhaseId}
        nextSortOrder={tasks.filter(t => t.phase_id === taskPhaseId).length > 0 ? Math.max(...tasks.filter(t => t.phase_id === taskPhaseId).map(t => t.sort_order)) + 1 : 0}
        onSave={handleSaveTask}
      />

      <SprintModuleDialog
        open={moduleDialogOpen}
        onOpenChange={setModuleDialogOpen}
        taskId={moduleTaskId}
        nextSortOrder={(() => { const t = tasks.find(x => x.id === moduleTaskId); return t ? t.modules.length : 0; })()}
        onSave={(data) => admin.addModule.mutate(data)}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type === 'phase' ? 'Phase' : 'Task'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
