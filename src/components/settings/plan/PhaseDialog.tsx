import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PhaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phase: any;
  onSave: (data: any) => void;
  children?: React.ReactNode;
}

export const PhaseDialog = ({ open, onOpenChange, phase, onSave, children }: PhaseDialogProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    unlock_type: 'previous_task' as 'previous_task' | 'time' | 'completion',
    points: 0,
    unlock_condition: null as any,
    task_unlock_strategy: 'all_at_once' as 'all_at_once' | 'sequential',
  });

  // Fetch previous phases for completion-based unlock
  const { data: previousPhases } = useQuery({
    queryKey: ['previous-phases', phase?.phase_order],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phases')
        .select('id, title, phase_order')
        .eq('is_active', true)
        .lt('phase_order', phase?.phase_order || 999)
        .order('phase_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: open && formData.unlock_type === 'completion',
  });

  // Fetch tasks for selected phase
  const { data: phaseTasks } = useQuery({
    queryKey: ['phase-tasks', formData.unlock_condition?.required_phase_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, task_order')
        .eq('phase_id', formData.unlock_condition?.required_phase_id)
        .eq('is_active', true)
        .order('task_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!formData.unlock_condition?.required_phase_id,
  });

  useEffect(() => {
    if (phase) {
      setFormData({
        title: phase.title || '',
        description: phase.description || '',
        unlock_type: phase.unlock_type || 'previous_task',
        points: phase.points || 0,
        unlock_condition: phase.unlock_condition || null,
        task_unlock_strategy: phase.unlock_condition?.task_unlock_strategy || 'all_at_once',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        unlock_type: 'previous_task',
        points: 0,
        unlock_condition: null,
        task_unlock_strategy: 'all_at_once',
      });
    }
  }, [phase, open]);

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (formData.unlock_type === 'time') {
      const delayDays = formData.unlock_condition?.delay_days;
      if (typeof delayDays !== 'number' || delayDays < 0 || isNaN(delayDays)) {
        toast.error('Please enter a valid number of days (0 or greater)');
        return;
      }
    }

    if (formData.unlock_type === 'completion') {
      if (!formData.unlock_condition?.required_phase_id) {
        toast.error('Please select a required phase');
        return;
      }
    }

    // Build unlock_condition with task_unlock_strategy
    const unlockCondition = {
      ...formData.unlock_condition,
      task_unlock_strategy: formData.task_unlock_strategy,
    };

    // Build data object with both JSONB and separate columns
    const phaseData: any = {
      title: formData.title,
      description: formData.description,
      unlock_type: formData.unlock_type,
      unlock_condition: unlockCondition,
      points: formData.points,
    };

    // Add separate columns based on unlock type
    if (formData.unlock_type === 'time') {
      phaseData.unlock_delay_days = formData.unlock_condition?.delay_days || 0;
      phaseData.required_phase_id = null;
    } else if (formData.unlock_type === 'completion') {
      phaseData.required_phase_id = formData.unlock_condition?.required_phase_id || null;
      phaseData.unlock_delay_days = 0;
    } else {
      phaseData.unlock_delay_days = 0;
      phaseData.required_phase_id = null;
    }

    onSave(phaseData);
  };


  return (
    <>
      {children}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{phase ? 'Edit Phase' : 'Create Phase'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Unlock Type</Label>
              <Select
                value={formData.unlock_type}
                onValueChange={(value: any) => {
                  setFormData({ 
                    ...formData, 
                    unlock_type: value,
                    unlock_condition: value === 'time' 
                      ? { delay_days: 0, task_unlock_strategy: formData.task_unlock_strategy }
                      : value === 'completion'
                      ? { task_unlock_strategy: formData.task_unlock_strategy }
                      : null
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="previous_task">Previous Task</SelectItem>
                  <SelectItem value="time">Time-based</SelectItem>
                  <SelectItem value="completion">Completion-based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.unlock_type === 'time' && (
              <div className="space-y-2">
                <Label>Unlock Delay (days)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.unlock_condition?.delay_days ?? 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    unlock_condition: { delay_days: parseInt(e.target.value) || 0 }
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Days after user joins to unlock this phase (0 = immediate access)
                </p>
              </div>
            )}

            {formData.unlock_type === 'completion' && (
              <>
                <div className="space-y-2">
                  <Label>Required Phase</Label>
                  <Select
                    value={formData.unlock_condition?.required_phase_id || ''}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      unlock_condition: {
                        ...formData.unlock_condition,
                        required_phase_id: value,
                        required_task_id: undefined
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select previous phase..." />
                    </SelectTrigger>
                    <SelectContent>
                      {previousPhases?.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.unlock_condition?.required_phase_id && (
                  <div className="space-y-2">
                    <Label>Required Task (optional)</Label>
                    <Select
                      value={formData.unlock_condition?.required_task_id || 'none'}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        unlock_condition: {
                          ...formData.unlock_condition,
                          required_task_id: value === 'none' ? undefined : value
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select task (optional)..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {phaseTasks?.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label>Task Unlock Strategy</Label>
              <Select
                value={formData.task_unlock_strategy}
                onValueChange={(value: any) => setFormData({ ...formData, task_unlock_strategy: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_at_once">All at Once (All tasks unlock when phase unlocks)</SelectItem>
                  <SelectItem value="sequential">Sequential (Tasks unlock one-by-one as completed)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.task_unlock_strategy === 'all_at_once' 
                  ? 'All tasks in this phase will be available immediately when the phase unlocks.'
                  : 'Tasks will unlock one at a time, in order, as the previous task is completed.'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Points</Label>
              <Input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
              />
            </div>
            <Button onClick={handleSubmit} className="w-full">
              {phase ? 'Update' : 'Create'} Phase
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
