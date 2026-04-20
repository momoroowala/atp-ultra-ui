import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, UserCheck, AlertTriangle } from 'lucide-react';
import { useMyDelegation, useCreateDelegation, useCancelDelegation } from '@/hooks/useCSMDelegations';
import { useCSMList } from '@/hooks/useCSMStudents';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function CSMDelegationPanel() {
  const { user } = useAuth();
  const { data: delegation, isLoading } = useMyDelegation();
  const { data: csmList = [] } = useCSMList();
  const createDelegation = useCreateDelegation();
  const cancelDelegation = useCancelDelegation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [delegateCsmId, setDelegateCsmId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  if (isLoading) return null;

  const myDelegation = delegation?.asOriginator;
  const coveringFor = delegation?.asDelegate;

  const otherCSMs = csmList.filter(c => c.id !== user?.id);

  const handleCreate = async () => {
    if (!delegateCsmId || !startDate || !endDate) {
      toast.error('Please fill all fields');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      toast.error('End date must be after start date');
      return;
    }
    try {
      await createDelegation.mutateAsync({ delegate_csm_id: delegateCsmId, start_date: startDate, end_date: endDate });
      toast.success('OOO delegation created');
      setDialogOpen(false);
      setDelegateCsmId('');
      setStartDate('');
      setEndDate('');
    } catch {
      toast.error('Failed to create delegation');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelDelegation.mutateAsync(id);
      toast.success('Delegation ended');
    } catch {
      toast.error('Failed to end delegation');
    }
  };

  const formatName = (p?: { first_name: string | null; last_name: string | null } | null) =>
    p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown' : 'Unknown';

  return (
    <div className="space-y-3">
      {/* Covering for another CSM banner */}
      {coveringFor && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <UserCheck className="h-5 w-5 text-primary shrink-0" />
            <span className="text-sm">
              You are covering for <strong>{formatName(coveringFor.original_csm)}</strong> until{' '}
              <strong>{format(new Date(coveringFor.end_date), 'MMM d, yyyy')}</strong>
            </span>
          </CardContent>
        </Card>
      )}

      {/* Active/pending delegation card */}
      {myDelegation ? (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-3 px-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="text-sm">
                <Badge variant="outline" className="mr-2 capitalize">{myDelegation.status}</Badge>
                Delegated to <strong>{formatName(myDelegation.delegate_csm)}</strong>
                {' · '}
                {format(new Date(myDelegation.start_date), 'MMM d')} – {format(new Date(myDelegation.end_date), 'MMM d, yyyy')}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCancel(myDelegation.id)}
              disabled={cancelDelegation.isPending}
            >
              {myDelegation.status === 'active' ? 'End Early' : 'Cancel'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)} className="gap-2">
          <Calendar className="h-4 w-4" />
          Set Up OOO Delegation
        </Button>
      )}

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Out-of-Office Delegation</DialogTitle>
            <DialogDescription>
              Your students, tickets, and chats will be temporarily assigned to the selected CSM.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Delegate CSM</Label>
              <Select value={delegateCsmId} onValueChange={setDelegateCsmId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a CSM" />
                </SelectTrigger>
                <SelectContent>
                  {otherCSMs.map(csm => (
                    <SelectItem key={csm.id} value={csm.id}>
                      {csm.firstName} {csm.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                The delegation will activate on the start date and automatically revert on the end date. You can also end it early at any time.
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createDelegation.isPending}>
              {createDelegation.isPending ? 'Creating…' : 'Confirm Delegation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
