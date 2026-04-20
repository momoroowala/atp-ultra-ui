import { useState } from 'react';
import { useMilestonesAdmin } from '@/hooks/useMilestonesAdmin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { MilestoneDialog } from './milestones/MilestoneDialog';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const MilestonesManagementTab = () => {
  const { milestones, isLoading, createMilestone, updateMilestone, deleteMilestone } = useMilestonesAdmin();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<{ id: string; title: string; sort_order: number } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = (values: { title: string; sort_order: number }) => {
    createMilestone.mutate(values, {
      onSuccess: () => {
        toast.success('Milestone created');
        setDialogOpen(false);
      },
      onError: () => toast.error('Failed to create milestone'),
    });
  };

  const handleUpdate = (values: { title: string; sort_order: number }) => {
    if (!editingMilestone) return;
    updateMilestone.mutate({ id: editingMilestone.id, ...values }, {
      onSuccess: () => {
        toast.success('Milestone updated');
        setEditingMilestone(null);
      },
      onError: () => toast.error('Failed to update milestone'),
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMilestone.mutate(deleteId, {
      onSuccess: () => {
        toast.success('Milestone deleted');
        setDeleteId(null);
      },
      onError: () => toast.error('Failed to delete milestone'),
    });
  };

  const handleToggleActive = (id: string, currentActive: boolean) => {
    updateMilestone.mutate({ id, is_active: !currentActive }, {
      onSuccess: () => toast.success(`Milestone ${currentActive ? 'hidden' : 'shown'}`),
      onError: () => toast.error('Failed to update milestone'),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Milestones</h2>
          <p className="text-sm text-muted-foreground">Manage the journey milestones shown on the client dashboard</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Milestone
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Milestones ({milestones.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : milestones.length === 0 ? (
            <p className="text-sm text-muted-foreground">No milestones yet.</p>
          ) : (
            milestones.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                <span className="text-xs font-mono text-muted-foreground w-6 text-right">
                  {m.sort_order}
                </span>
                <span className="flex-1 text-sm font-medium">{m.title}</span>
                <Switch
                  checked={m.is_active}
                  onCheckedChange={() => handleToggleActive(m.id, m.is_active)}
                  className="scale-75"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100"
                  onClick={() => setEditingMilestone({ id: m.id, title: m.title, sort_order: m.sort_order })}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                  onClick={() => setDeleteId(m.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <MilestoneDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
        defaultSortOrder={(milestones.at(-1)?.sort_order ?? 0) + 1}
      />

      {/* Edit dialog */}
      <MilestoneDialog
        open={!!editingMilestone}
        onOpenChange={(open) => { if (!open) setEditingMilestone(null); }}
        onSubmit={handleUpdate}
        initialValues={editingMilestone ?? undefined}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete milestone?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this milestone and remove all user completions for it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
