import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Video, Loader2 } from 'lucide-react';
import { getCommonTimezones } from '@/utils/timezoneHelpers';
import { useCalendarCalls } from '@/hooks/useCalendarCalls';
import { useTiers } from '@/hooks/useTiers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CallCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CallCreateModal = ({ open, onOpenChange }: CallCreateModalProps) => {
  const { createCall } = useCalendarCalls();
  const { data: tiers = [] } = useTiers();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [time, setTime] = useState('12:00');
  const [timezone, setTimezone] = useState('America/New_York');
  const [callLink, setCallLink] = useState('');
  const [recurrencePattern, setRecurrencePattern] = useState<'none' | 'daily' | 'weekly' | 'biweekly'>('none');
  const [recurrenceEndType, setRecurrenceEndType] = useState<'never' | 'on' | 'after'>('never');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date>();
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);
  const [occurrenceCount, setOccurrenceCount] = useState(1);
  const [selectedTierIds, setSelectedTierIds] = useState<string[]>([]);
  const [allTiers, setAllTiers] = useState(true);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !title || !callLink) return;

    const isRecurring = recurrencePattern !== 'none';
    
    if (isRecurring && recurrenceEndType === 'on' && !recurrenceEndDate) {
      return;
    }

    // Get display names for selected tiers
    const selectedTierNames = allTiers 
      ? null 
      : tiers
          .filter(t => selectedTierIds.includes(t.id))
          .map(t => t.display_name);

    createCall({
      title,
      description: description || null,
      call_date: format(date, 'yyyy-MM-dd'),
      call_time: time,
      timezone,
      call_link: callLink,
      is_recurring: isRecurring,
      recurrence_pattern: isRecurring ? { type: recurrencePattern as 'daily' | 'weekly' | 'biweekly' } : null,
      recurrence_end_type: isRecurring ? recurrenceEndType : undefined,
      recurrence_end_date: isRecurring && recurrenceEndType === 'on' && recurrenceEndDate ? format(recurrenceEndDate, 'yyyy-MM-dd') : undefined,
      occurrence_count: isRecurring && recurrenceEndType === 'after' ? occurrenceCount : undefined,
      is_active: true,
      visible_tiers: selectedTierNames,
      visible_tier_ids: allTiers ? null : selectedTierIds,
    });

    handleClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setDate(undefined);
    setDatePickerOpen(false);
    setTime('12:00');
    setTimezone('America/New_York');
    setCallLink('');
    setRecurrencePattern('none');
    setRecurrenceEndType('never');
    setRecurrenceEndDate(undefined);
    setEndDatePickerOpen(false);
    setOccurrenceCount(1);
    setSelectedTierIds([]);
    setAllTiers(true);
    onOpenChange(false);
  };

  const toggleTier = (tierId: string) => {
    setSelectedTierIds(prev =>
      prev.includes(tierId) ? prev.filter(t => t !== tierId) : [...prev, tierId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Call</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Weekly Coaching Call"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Topics to cover in this session..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Date *</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar 
                    mode="single" 
                    selected={date} 
                    onSelect={(newDate) => {
                      setDate(newDate);
                      setDatePickerOpen(false);
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
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
                placeholder="https://zoom.us/j/..."
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
            <Label>Repeats</Label>
            <Select value={recurrencePattern} onValueChange={(value: any) => setRecurrencePattern(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Does not repeat</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Biweekly</SelectItem>
              </SelectContent>
            </Select>

            {recurrencePattern !== 'none' && (
              <div className="space-y-3">
                <Label>Ends</Label>
                <RadioGroup value={recurrenceEndType} onValueChange={(value: any) => setRecurrenceEndType(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="never" id="never" />
                    <Label htmlFor="never" className="cursor-pointer font-normal">Never</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="on" id="on" />
                      <Label htmlFor="on" className="cursor-pointer font-normal">On</Label>
                    </div>
                    {recurrenceEndType === 'on' && (
                      <div className="ml-6">
                        <Popover open={endDatePickerOpen} onOpenChange={setEndDatePickerOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {recurrenceEndDate ? format(recurrenceEndDate, 'PPP') : 'Pick end date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar 
                              mode="single" 
                              selected={recurrenceEndDate} 
                              onSelect={(newDate) => {
                                setRecurrenceEndDate(newDate);
                                setEndDatePickerOpen(false);
                              }}
                              disabled={(endDate) => !date || endDate < date}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="after" id="after" />
                      <Label htmlFor="after" className="cursor-pointer font-normal">After</Label>
                    </div>
                    {recurrenceEndType === 'after' && (
                      <div className="ml-6 flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={occurrenceCount}
                          onChange={(e) => setOccurrenceCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">occurrences</span>
                      </div>
                    )}
                  </div>
                </RadioGroup>
              </div>
            )}
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

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Create Call</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
