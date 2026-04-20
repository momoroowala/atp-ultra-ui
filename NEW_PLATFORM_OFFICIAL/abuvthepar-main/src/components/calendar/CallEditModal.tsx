import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Video, Loader2 } from 'lucide-react';
import { getCommonTimezones } from '@/utils/timezoneHelpers';
import { parseDateAsLocal } from '@/utils/dateHelpers';
import { useCalendarCalls, CalendarCall } from '@/hooks/useCalendarCalls';
import { useTiers } from '@/hooks/useTiers';
import { supabase } from '@/integrations/supabase/client';
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

interface CallEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  call: CalendarCall | null;
}

export const CallEditModal = ({ open, onOpenChange, call }: CallEditModalProps) => {
  const { updateCall, updateCallSeries, deleteCall, deleteCallSeries } = useCalendarCalls();
  const { data: tiers = [] } = useTiers();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('12:00');
  const [timezone, setTimezone] = useState('America/New_York');
  const [callLink, setCallLink] = useState('');
  const [selectedTierIds, setSelectedTierIds] = useState<string[]>([]);
  const [allTiers, setAllTiers] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteSeriesDialog, setShowDeleteSeriesDialog] = useState(false);
  const [showEditSeriesDialog, setShowEditSeriesDialog] = useState(false);
  const [generatingMeet, setGeneratingMeet] = useState(false);

  const handleGenerateMeetLink = async () => {
    setGeneratingMeet(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-google-calendar', {
        body: { action: 'generate-meet-link' },
      });
      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Failed to generate Meet link');
      }
      setCallLink(data.meetLink);
      toast.success('Google Meet link generated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate Google Meet link');
    } finally {
      setGeneratingMeet(false);
    }
  };

  useEffect(() => {
    if (call) {
      setTitle(call.title);
      setDescription(call.description || '');
      setDate(parseDateAsLocal(call.call_date));
      setTime(call.call_time);
      setTimezone(call.timezone);
      setCallLink(call.call_link);
      setAllTiers(!call.visible_tier_ids || call.visible_tier_ids.length === 0);
      setSelectedTierIds(call.visible_tier_ids || []);
    }
  }, [call]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !title || !callLink || !call) return;

    // If this call is part of a series, show the edit series dialog
    if (call.series_id) {
      setShowEditSeriesDialog(true);
    } else {
      // Get display names for selected tiers
      const selectedTierNames = allTiers 
        ? null 
        : tiers
            .filter(t => selectedTierIds.includes(t.id))
            .map(t => t.display_name);

      // Single call, update directly
      updateCall({
        id: call.id,
        updates: {
          title,
          description: description || null,
          call_date: format(date, 'yyyy-MM-dd'),
          call_time: time,
          timezone,
          call_link: callLink,
          visible_tiers: selectedTierNames,
          visible_tier_ids: allTiers ? null : selectedTierIds,
        },
      });
      onOpenChange(false);
    }
  };

  const handleEditThisOnly = () => {
    if (!date || !call) return;
    
    // Get display names for selected tiers
    const selectedTierNames = allTiers 
      ? null 
      : tiers
          .filter(t => selectedTierIds.includes(t.id))
          .map(t => t.display_name);

    updateCall({
      id: call.id,
      updates: {
        title,
        description: description || null,
        call_date: format(date, 'yyyy-MM-dd'),
        call_time: time,
        timezone,
        call_link: callLink,
        visible_tiers: selectedTierNames,
        visible_tier_ids: allTiers ? null : selectedTierIds,
      },
    });
    setShowEditSeriesDialog(false);
    onOpenChange(false);
  };

  const handleEditAllInSeries = () => {
    if (!call?.series_id) return;
    
    // Get display names for selected tiers
    const selectedTierNames = allTiers 
      ? null 
      : tiers
          .filter(t => selectedTierIds.includes(t.id))
          .map(t => t.display_name);

    updateCallSeries({
      seriesId: call.series_id,
      updates: {
        title,
        description: description || null,
        call_time: time,
        timezone,
        call_link: callLink,
        visible_tiers: selectedTierNames,
        visible_tier_ids: allTiers ? null : selectedTierIds,
      },
    });
    setShowEditSeriesDialog(false);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (call) {
      deleteCall(call.id);
      setShowDeleteDialog(false);
      onOpenChange(false);
    }
  };

  const toggleTier = (tierId: string) => {
    setSelectedTierIds(prev =>
      prev.includes(tierId) ? prev.filter(t => t !== tierId) : [...prev, tierId]
    );
  };

  if (!call) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Call</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getCommonTimezones().map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="callLink">Call Link *</Label>
              <div className="flex gap-2">
                <Input
                  id="callLink"
                  type="url"
                  value={callLink}
                  onChange={(e) => setCallLink(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleGenerateMeetLink}
                  disabled={generatingMeet || callLink.includes('meet.google.com')}
                  title="Generate Google Meet link"
                >
                  {generatingMeet ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Video className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Tier Access</Label>
              <p className="text-sm text-muted-foreground">
                All users can see this call, but only selected tiers can join
              </p>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allTiers"
                  checked={allTiers}
                  onCheckedChange={(checked) => setAllTiers(checked as boolean)}
                />
                <Label htmlFor="allTiers" className="cursor-pointer">
                  All tiers can join
                </Label>
              </div>

              {!allTiers && (
                <div className="grid grid-cols-2 gap-2 pl-6">
                  {tiers.map((tier) => (
                    <div key={tier.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={tier.id}
                        checked={selectedTierIds.includes(tier.id)}
                        onCheckedChange={() => toggleTier(tier.id)}
                      />
                      <Label htmlFor={tier.id} className="cursor-pointer">
                        {tier.display_name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => call.series_id ? setShowDeleteSeriesDialog(true) : setShowDeleteDialog(true)}
              >
                Delete Call
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Call</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this call? This action cannot be undone.
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

      <AlertDialog open={showEditSeriesDialog} onOpenChange={setShowEditSeriesDialog}>
        <AlertDialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Recurring Call</AlertDialogTitle>
            <AlertDialogDescription>
              "{title}" is part of a recurring series. What would you like to update?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <AlertDialogAction onClick={handleEditThisOnly}>
                Save only this event
              </AlertDialogAction>
              <AlertDialogAction onClick={handleEditAllInSeries}>
                Save all events in this series
              </AlertDialogAction>
            </div>
            <AlertDialogCancel onClick={() => setShowEditSeriesDialog(false)}>
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteSeriesDialog} onOpenChange={setShowDeleteSeriesDialog}>
        <AlertDialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Call</AlertDialogTitle>
            <AlertDialogDescription>
              This call is part of a recurring series. What would you like to delete?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
            <AlertDialogAction
              onClick={() => {
                if (call) {
                  deleteCall(call.id);
                  setShowDeleteSeriesDialog(false);
                  onOpenChange(false);
                }
              }}
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete only this event
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                if (call?.series_id) {
                  deleteCallSeries(call.series_id);
                  setShowDeleteSeriesDialog(false);
                  onOpenChange(false);
                }
              }}
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete all events in this series
            </AlertDialogAction>
            <AlertDialogCancel className="w-full mt-0">Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
