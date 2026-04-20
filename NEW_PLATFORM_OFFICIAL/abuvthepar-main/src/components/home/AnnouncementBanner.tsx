import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Megaphone, Pin, Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { ConfirmationDialog } from '@/components/settings/customer-success/ConfirmationDialog';
import { format } from 'date-fns';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useTiers } from '@/hooks/useTiers';
import { useUserTier } from '@/hooks/useUserTier';
import { toast } from '@/hooks/use-toast';

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  visible_tier_ids: string[] | null;
}

export const AnnouncementBanner = () => {
  const { isAdmin } = useAdminCheck();
  const { tierId: userTierId } = useUserTier();
  const { data: tiers } = useTiers();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_pinned: false,
    visible_tier_ids: [] as string[]
  });

  useEffect(() => {
    loadAnnouncements();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('announcements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements'
        },
        () => {
          loadAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadAnnouncements = async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (data) {
      // Filter announcements based on user's tier (admins see all)
      const filteredData = isAdmin ? data : data.filter(announcement => {
        // If no tier restrictions, show to everyone
        if (!announcement.visible_tier_ids || announcement.visible_tier_ids.length === 0) {
          return true;
        }
        // Check if user's tier is in the allowed list
        return userTierId && announcement.visible_tier_ids.includes(userTierId);
      });
      setAnnouncements(filteredData);
    }
    setLoading(false);
  };

  const handleOpenDialog = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setFormData({
        title: announcement.title,
        content: announcement.content,
        is_pinned: announcement.is_pinned,
        visible_tier_ids: announcement.visible_tier_ids || []
      });
    } else {
      setEditingAnnouncement(null);
      setFormData({
        title: '',
        content: '',
        is_pinned: false,
        visible_tier_ids: []
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      is_pinned: false,
      visible_tier_ids: []
    });
  };

  const handleTierToggle = (tierId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      visible_tier_ids: checked
        ? [...prev.visible_tier_ids, tierId]
        : prev.visible_tier_ids.filter(id => id !== tierId)
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      toast({
        title: 'Error',
        description: 'Title and content are required',
        variant: 'destructive'
      });
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        visible_tier_ids: formData.visible_tier_ids.length > 0 ? formData.visible_tier_ids : null
      };

      if (editingAnnouncement) {
        const { error } = await supabase
          .from('announcements')
          .update(dataToSave)
          .eq('id', editingAnnouncement.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Announcement updated successfully'
        });
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert([dataToSave]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Announcement created successfully'
        });
      }

      handleCloseDialog();
      loadAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to save announcement',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    setPendingDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    setDeleteConfirmOpen(false);

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', pendingDeleteId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Announcement deleted successfully'
      });

      loadAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete announcement',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="animate-pulse">
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (announcements.length === 0 && !isAdmin) {
    return (
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-muted-foreground text-center py-4">
            No announcements
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="hover-lift-subtle hover-border-glow transition-all duration-500">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Announcements
              {announcements.length > 0 && (
                <Badge variant="secondary" className="text-xs h-5 px-2">
                  {announcements.length}
                </Badge>
              )}
            </CardTitle>
            {isAdmin && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => handleOpenDialog()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No announcements
            </p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`p-3 rounded-lg border transition-all ${
                    announcement.is_pinned
                      ? 'bg-primary/5 border-primary/20'
                      : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{announcement.title}</h4>
                      {announcement.is_pinned && (
                        <Pin className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isAdmin && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleOpenDialog(announcement)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(announcement.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => setExpandedId(expandedId === announcement.id ? null : announcement.id)}
                      >
                        {expandedId === announcement.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className={`text-sm text-muted-foreground whitespace-pre-wrap ${
                    expandedId === announcement.id ? '' : 'line-clamp-2'
                  }`}>
                    {announcement.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(announcement.created_at), 'MMM dd, yyyy')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
            </DialogTitle>
            <DialogDescription>
              {editingAnnouncement ? 'Update the announcement details below.' : 'Create a new announcement for all users.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter announcement title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter announcement content"
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="pinned"
                checked={formData.is_pinned}
                onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked })}
              />
              <Label htmlFor="pinned" className="cursor-pointer">
                Pin this announcement
              </Label>
            </div>
            <div className="space-y-2">
              <Label>Visible to Tiers</Label>
              <p className="text-sm text-muted-foreground">
                Select which tiers can see this announcement. Leave unchecked for all tiers.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {tiers?.map((tier) => (
                  <div key={tier.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tier-${tier.id}`}
                      checked={formData.visible_tier_ids.includes(tier.id)}
                      onCheckedChange={(checked) => handleTierToggle(tier.id, checked as boolean)}
                    />
                    <Label htmlFor={`tier-${tier.id}`} className="text-base cursor-pointer">
                      {tier.display_name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingAnnouncement ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Announcement"
        description="Are you sure you want to delete this announcement?"
        confirmText="Delete"
        isDestructive
      />
    </>
  );
};