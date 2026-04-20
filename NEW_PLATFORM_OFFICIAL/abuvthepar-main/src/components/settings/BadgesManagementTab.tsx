import { useState } from 'react';
import { useAdminBadges, type AdminBadge } from '@/hooks/useAdminBadges';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { BadgeDialog } from './badges/BadgeDialog';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const tierColors: Record<string, string> = {
  bronze: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  silver: 'bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300',
  gold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
};

export const BadgesManagementTab = () => {
  const { badgesByCategory, isLoading, createBadge, updateBadge, deleteBadge } = useAdminBadges();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBadge | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = (values: Omit<AdminBadge, 'id' | 'created_at'>) => {
    createBadge.mutate(values, {
      onSuccess: () => { toast.success('Badge created'); setDialogOpen(false); },
      onError: () => toast.error('Failed to create badge'),
    });
  };

  const handleUpdate = (values: Omit<AdminBadge, 'id' | 'created_at'>) => {
    if (!editing) return;
    updateBadge.mutate({ id: editing.id, ...values }, {
      onSuccess: () => { toast.success('Badge updated'); setEditing(null); },
      onError: () => toast.error('Failed to update badge'),
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteBadge.mutate(deleteId, {
      onSuccess: () => { toast.success('Badge deleted'); setDeleteId(null); },
      onError: () => toast.error('Failed to delete badge'),
    });
  };

  const handleToggleActive = (badge: AdminBadge) => {
    updateBadge.mutate({ id: badge.id, is_active: !badge.is_active }, {
      onSuccess: () => toast.success(`Badge ${badge.is_active ? 'hidden' : 'shown'}`),
      onError: () => toast.error('Failed to update badge'),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Achievement Badges</h2>
          <p className="text-sm text-muted-foreground">Manage badges that users can earn through activity</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Badge
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        badgesByCategory.map((group) => (
          <Card key={group.value}>
            <CardHeader className="py-3">
              <CardTitle className="text-base capitalize">{group.label} ({group.badges.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {group.badges.length === 0 ? (
                <p className="text-sm text-muted-foreground">No badges in this category.</p>
              ) : (
                group.badges.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group">
                    <span className="text-xl w-8 text-center shrink-0">{b.icon_emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{b.badge_name}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${tierColors[b.tier] || ''}`}>
                          {b.tier}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{b.points_value}pts</span>
                      </div>
                      {b.description && (
                        <p className="text-xs text-muted-foreground truncate">{b.description}</p>
                      )}
                    </div>
                    <Switch
                      checked={b.is_active ?? true}
                      onCheckedChange={() => handleToggleActive(b)}
                      className="scale-75"
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100"
                      onClick={() => setEditing(b)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                      onClick={() => setDeleteId(b.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))
      )}

      <BadgeDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={handleCreate} />
      <BadgeDialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }} onSubmit={handleUpdate} initialValues={editing} />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete badge?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this badge.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
