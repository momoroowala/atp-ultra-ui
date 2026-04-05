import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, X, Plus } from 'lucide-react';
import { parseDateAsLocal } from '@/utils/dateHelpers';
import { useCallRecordings, CallRecording } from '@/hooks/useCallRecordings';
import { useTiers } from '@/hooks/useTiers';
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

interface RecordingEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recording: CallRecording | null;
}


export const RecordingEditModal = ({ open, onOpenChange, recording }: RecordingEditModalProps) => {
  const { updateRecording, deleteRecording } = useCallRecordings();
  const { data: tiers = [] } = useTiers();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [duration, setDuration] = useState('');
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [additionalLinks, setAdditionalLinks] = useState<{ title: string; url: string }[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [allTiers, setAllTiers] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (recording) {
      setTitle(recording.title);
      setDescription(recording.description || '');
      setRecordingUrl(recording.recording_url);
      setThumbnailUrl(recording.thumbnail_url || '');
      setDuration(recording.duration_minutes?.toString() || '');
      setDate(parseDateAsLocal(recording.recorded_date));
      setTime(recording.recorded_time || '');
      setTags(recording.tags || []);
      setAdditionalLinks((recording.additional_links as any) || []);
      setAllTiers(!recording.visible_tiers || recording.visible_tiers.length === 0);
      setSelectedTiers(recording.visible_tiers || []);
    }
  }, [recording]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !title || !recordingUrl || !recording) return;

    updateRecording({
      id: recording.id,
      updates: {
        title,
        description: description || null,
        recording_url: recordingUrl,
        thumbnail_url: thumbnailUrl || null,
        duration_minutes: duration ? parseInt(duration) : null,
        recorded_date: format(date, 'yyyy-MM-dd'),
        recorded_time: time || null,
        tags,
        additional_links: additionalLinks.length > 0 ? additionalLinks : null,
        visible_tiers: allTiers ? null : selectedTiers,
      },
    });

    onOpenChange(false);
  };

  const handleDelete = () => {
    if (recording) {
      deleteRecording(recording.id);
      setShowDeleteDialog(false);
      onOpenChange(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addLink = () => {
    setAdditionalLinks([...additionalLinks, { title: '', url: '' }]);
  };

  const updateLink = (index: number, field: 'title' | 'url', value: string) => {
    const newLinks = [...additionalLinks];
    newLinks[index][field] = value;
    setAdditionalLinks(newLinks);
  };

  const removeLink = (index: number) => {
    setAdditionalLinks(additionalLinks.filter((_, i) => i !== index));
  };

  const toggleTier = (tier: string) => {
    setSelectedTiers(prev =>
      prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]
    );
  };

  if (!recording) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Recording</DialogTitle>
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

            <div>
              <Label htmlFor="recordingUrl">Recording URL *</Label>
              <Input
                id="recordingUrl"
                type="url"
                value={recordingUrl}
                onChange={(e) => setRecordingUrl(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
              <Input
                id="thumbnailUrl"
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Recorded Date *</Label>
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
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="duration">Duration (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tagInput">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tagInput"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add a tag..."
                />
                <Button type="button" onClick={addTag}>Add</Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Additional Links</Label>
                <Button type="button" size="sm" variant="outline" onClick={addLink}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Link
                </Button>
              </div>
              <div className="space-y-2">
                {additionalLinks.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Link title"
                      value={link.title}
                      onChange={(e) => updateLink(index, 'title', e.target.value)}
                    />
                    <Input
                      placeholder="URL"
                      type="url"
                      value={link.url}
                      onChange={(e) => updateLink(index, 'url', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLink(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Tier Visibility</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allTiers"
                  checked={allTiers}
                  onCheckedChange={(checked) => setAllTiers(checked as boolean)}
                />
                <Label htmlFor="allTiers" className="cursor-pointer">
                  Visible to all tiers
                </Label>
              </div>

              {!allTiers && (
                <div className="grid grid-cols-2 gap-2 pl-6">
                  {tiers.map((tier) => (
                    <div key={tier.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={tier.tier_key}
                        checked={selectedTiers.includes(tier.tier_key)}
                        onCheckedChange={() => toggleTier(tier.tier_key)}
                      />
                      <Label htmlFor={tier.tier_key} className="cursor-pointer capitalize">
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
                onClick={() => setShowDeleteDialog(true)}
              >
                Delete Recording
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
            <AlertDialogTitle>Delete Recording</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this recording? This action cannot be undone.
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
    </>
  );
};
