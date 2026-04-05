import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  nextSortOrder: number;
  onSave: (data: { task_id: string; module_name: string; sort_order: number }) => void;
}

export function SprintModuleDialog({ open, onOpenChange, taskId, nextSortOrder, onSave }: Props) {
  const [moduleName, setModuleName] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [useCustom, setUseCustom] = useState(false);

  const { data: phases } = useQuery({
    queryKey: ['all-phases-for-module-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phases')
        .select('id, title, course_id, courses!inner(title)')
        .eq('is_active', true)
        .order('phase_order');
      if (error) throw error;
      return data as Array<{ id: string; title: string; course_id: string; courses: { title: string } }>;
    },
    enabled: open,
  });

  // Group phases by course
  const grouped = (phases ?? []).reduce<Record<string, { courseTitle: string; items: typeof phases }>>((acc, p) => {
    const key = p.course_id;
    if (!acc[key]) acc[key] = { courseTitle: (p.courses as any).title, items: [] };
    acc[key].items!.push(p);
    return acc;
  }, {});

  useEffect(() => {
    setModuleName('');
    setSortOrder(nextSortOrder);
    setUseCustom(false);
  }, [nextSortOrder, open]);

  const handleSubmit = () => {
    onSave({ task_id: taskId, module_name: moduleName, sort_order: sortOrder });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Module Link</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Custom name</Label>
            <Switch checked={useCustom} onCheckedChange={setUseCustom} />
          </div>
          <div>
            <Label>Module Name</Label>
            {useCustom ? (
              <Input value={moduleName} onChange={e => setModuleName(e.target.value)} placeholder="e.g. Module 1, Welcome" />
            ) : (
              <Select value={moduleName} onValueChange={setModuleName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a module…" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {Object.entries(grouped).map(([courseId, group]) => (
                    <SelectGroup key={courseId}>
                      <SelectLabel className="text-xs text-muted-foreground">{group.courseTitle}</SelectLabel>
                      {group.items!.map(phase => (
                        <SelectItem key={phase.id} value={phase.title}>
                          {phase.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <Label>Sort Order</Label>
            <Input type="number" value={sortOrder} onChange={e => setSortOrder(+e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!moduleName}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
