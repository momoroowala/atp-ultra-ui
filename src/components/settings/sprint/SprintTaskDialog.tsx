import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import type { SprintPhase } from '@/hooks/useSprintData';

interface TaskData {
  id?: string;
  phase_id: string;
  day_number: number;
  title: string;
  sort_order: number;
  is_checkpoint: boolean;
  is_final: boolean;
  success_metrics?: string | null;
  common_mistakes?: string | null;
  templates?: Array<{ label: string; url: string }> | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskData | null;
  phases: SprintPhase[];
  defaultPhaseId: string;
  nextSortOrder: number;
  onSave: (data: TaskData) => void;
}

export function SprintTaskDialog({ open, onOpenChange, task, phases, defaultPhaseId, nextSortOrder, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [dayNumber, setDayNumber] = useState(1);
  const [phaseId, setPhaseId] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isCheckpoint, setIsCheckpoint] = useState(false);
  const [isFinal, setIsFinal] = useState(false);
  const [successMetrics, setSuccessMetrics] = useState('');
  const [commonMistakes, setCommonMistakes] = useState('');
  const [templates, setTemplates] = useState<Array<{ label: string; url: string }>>([]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDayNumber(task.day_number);
      setPhaseId(task.phase_id);
      setSortOrder(task.sort_order);
      setIsCheckpoint(task.is_checkpoint);
      setIsFinal(task.is_final);
      setSuccessMetrics(task.success_metrics ?? '');
      setCommonMistakes(task.common_mistakes ?? '');
      setTemplates(task.templates ?? []);
    } else {
      setTitle('');
      setDayNumber(1);
      setPhaseId(defaultPhaseId);
      setSortOrder(nextSortOrder);
      setIsCheckpoint(false);
      setIsFinal(false);
      setSuccessMetrics('');
      setCommonMistakes('');
      setTemplates([]);
    }
  }, [task, defaultPhaseId, nextSortOrder, open]);

  const handleSubmit = () => {
    onSave({
      ...(task?.id ? { id: task.id } : {}),
      phase_id: phaseId,
      day_number: dayNumber,
      title,
      sort_order: sortOrder,
      is_checkpoint: isCheckpoint,
      is_final: isFinal,
      success_metrics: successMetrics || null,
      common_mistakes: commonMistakes || null,
      templates: templates.length > 0 ? templates : null,
    });
    onOpenChange(false);
  };

  const addTemplate = () => setTemplates([...templates, { label: '', url: '' }]);
  const removeTemplate = (idx: number) => setTemplates(templates.filter((_, i) => i !== idx));
  const updateTemplate = (idx: number, field: 'label' | 'url', value: string) => {
    setTemplates(templates.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Add Task'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Day Number</Label>
              <Input type="number" value={dayNumber} onChange={e => setDayNumber(+e.target.value)} />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input type="number" value={sortOrder} onChange={e => setSortOrder(+e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Phase</Label>
            <Select value={phaseId} onValueChange={setPhaseId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {phases.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox id="checkpoint" checked={isCheckpoint} onCheckedChange={v => setIsCheckpoint(!!v)} />
              <Label htmlFor="checkpoint">Checkpoint</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="final" checked={isFinal} onCheckedChange={v => setIsFinal(!!v)} />
              <Label htmlFor="final">Final</Label>
            </div>
          </div>

          {/* Success Metrics */}
          <div>
            <Label>Success Metrics</Label>
            <p className="text-xs text-muted-foreground mb-1">One per line. Start each with ✓</p>
            <Textarea
              value={successMetrics}
              onChange={e => setSuccessMetrics(e.target.value)}
              placeholder="✓ First metric&#10;✓ Second metric"
              rows={4}
            />
          </div>

          {/* Common Mistakes */}
          <div>
            <Label>Common Mistakes</Label>
            <Textarea
              value={commonMistakes}
              onChange={e => setCommonMistakes(e.target.value)}
              placeholder="Don't skip this step..."
              rows={2}
            />
          </div>

          {/* Templates */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Templates & Resources</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addTemplate} className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            {templates.map((tmpl, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <Input
                  placeholder="Label"
                  value={tmpl.label}
                  onChange={e => updateTemplate(idx, 'label', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="URL"
                  value={tmpl.url}
                  onChange={e => updateTemplate(idx, 'url', e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeTemplate(idx)} className="shrink-0 h-9 w-9 text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title || !phaseId}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
