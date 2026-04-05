import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { title: string; sort_order: number }) => void;
  initialValues?: { title: string; sort_order: number };
  defaultSortOrder?: number;
}

export const MilestoneDialog = ({
  open,
  onOpenChange,
  onSubmit,
  initialValues,
  defaultSortOrder = 1,
}: MilestoneDialogProps) => {
  const [title, setTitle] = useState('');
  const [sortOrder, setSortOrder] = useState(defaultSortOrder);

  useEffect(() => {
    if (open) {
      setTitle(initialValues?.title ?? '');
      setSortOrder(initialValues?.sort_order ?? defaultSortOrder);
    }
  }, [open, initialValues, defaultSortOrder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), sort_order: sortOrder });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialValues ? 'Edit' : 'Add'} Milestone</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="milestone-title">Title</Label>
            <Input
              id="milestone-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. First Sale Successful"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="milestone-order">Sort Order</Label>
            <Input
              id="milestone-order"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              min={0}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {initialValues ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
