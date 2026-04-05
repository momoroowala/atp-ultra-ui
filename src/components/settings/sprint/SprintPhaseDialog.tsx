import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { SprintPhase } from '@/hooks/useSprintData';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phase?: SprintPhase | null;
  nextSortOrder: number;
  onSave: (data: Omit<SprintPhase, 'id'> & { id?: string }) => void;
}

export function SprintPhaseDialog({ open, onOpenChange, phase, nextSortOrder, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [dayStart, setDayStart] = useState(1);
  const [dayEnd, setDayEnd] = useState(1);
  const [goalText, setGoalText] = useState('');
  const [bannerText, setBannerText] = useState('');
  const [sortOrder, setSortOrder] = useState(0);

  useEffect(() => {
    if (phase) {
      setTitle(phase.title);
      setDayStart(phase.day_start);
      setDayEnd(phase.day_end);
      setGoalText(phase.goal_text ?? '');
      setBannerText(phase.completion_banner_text ?? '');
      setSortOrder(phase.sort_order);
    } else {
      setTitle('');
      setDayStart(1);
      setDayEnd(1);
      setGoalText('');
      setBannerText('');
      setSortOrder(nextSortOrder);
    }
  }, [phase, nextSortOrder, open]);

  const handleSubmit = () => {
    onSave({
      ...(phase ? { id: phase.id } : {}),
      title,
      day_start: dayStart,
      day_end: dayEnd,
      goal_text: goalText || null,
      completion_banner_text: bannerText || null,
      sort_order: sortOrder,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{phase ? 'Edit Phase' : 'Add Phase'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Phase title" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Day Start</Label>
              <Input type="number" value={dayStart} onChange={e => setDayStart(+e.target.value)} />
            </div>
            <div>
              <Label>Day End</Label>
              <Input type="number" value={dayEnd} onChange={e => setDayEnd(+e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Goal Text</Label>
            <Textarea value={goalText} onChange={e => setGoalText(e.target.value)} placeholder="Optional goal description" />
          </div>
          <div>
            <Label>Completion Banner Text</Label>
            <Textarea value={bannerText} onChange={e => setBannerText(e.target.value)} placeholder="Optional completion message" />
          </div>
          <div>
            <Label>Sort Order</Label>
            <Input type="number" value={sortOrder} onChange={e => setSortOrder(+e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
