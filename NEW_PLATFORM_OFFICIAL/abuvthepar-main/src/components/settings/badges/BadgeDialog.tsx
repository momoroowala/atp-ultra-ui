import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BADGE_CATEGORIES, type AdminBadge, type BadgeCategory } from '@/hooks/useAdminBadges';

interface BadgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Omit<AdminBadge, 'id' | 'created_at'>) => void;
  initialValues?: AdminBadge | null;
}

const defaults: Omit<AdminBadge, 'id' | 'created_at'> = {
  badge_key: '',
  badge_name: '',
  description: '',
  category: 'onboarding',
  tier: 'bronze',
  icon_emoji: '🏆',
  points_value: 0,
  requirement_type: '',
  requirement_value: {},
  auto_award: true,
  is_active: true,
};

export const BadgeDialog = ({ open, onOpenChange, onSubmit, initialValues }: BadgeDialogProps) => {
  const [form, setForm] = useState(defaults);
  const [reqValueStr, setReqValueStr] = useState('{}');

  useEffect(() => {
    if (initialValues) {
      setForm({
        badge_key: initialValues.badge_key,
        badge_name: initialValues.badge_name,
        description: initialValues.description ?? '',
        category: initialValues.category,
        tier: initialValues.tier,
        icon_emoji: initialValues.icon_emoji ?? '🏆',
        points_value: initialValues.points_value ?? 0,
        requirement_type: initialValues.requirement_type ?? '',
        requirement_value: initialValues.requirement_value ?? {},
        auto_award: initialValues.auto_award ?? true,
        is_active: initialValues.is_active ?? true,
      });
      setReqValueStr(JSON.stringify(initialValues.requirement_value ?? {}, null, 2));
    } else {
      setForm(defaults);
      setReqValueStr('{}');
    }
  }, [initialValues, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let parsedReqValue = {};
    try { parsedReqValue = JSON.parse(reqValueStr); } catch {}
    onSubmit({ ...form, requirement_value: parsedReqValue });
  };

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialValues ? 'Edit Badge' : 'Create Badge'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Badge Key</Label>
              <Input value={form.badge_key} onChange={(e) => set('badge_key', e.target.value)} required placeholder="e.g. first_login" />
            </div>
            <div className="space-y-1.5">
              <Label>Badge Name</Label>
              <Input value={form.badge_name} onChange={(e) => set('badge_name', e.target.value)} required placeholder="e.g. Welcome Aboard" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} rows={2} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => set('category', v as BadgeCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BADGE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tier</Label>
              <Select value={form.tier} onValueChange={(v) => set('tier', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Icon Emoji</Label>
              <Input value={form.icon_emoji ?? ''} onChange={(e) => set('icon_emoji', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Points Value</Label>
              <Input type="number" value={form.points_value ?? 0} onChange={(e) => set('points_value', parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label>Requirement Type</Label>
              <Input value={form.requirement_type ?? ''} onChange={(e) => set('requirement_type', e.target.value)} placeholder="e.g. login_streak" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Requirement Value (JSON)</Label>
            <Textarea value={reqValueStr} onChange={(e) => setReqValueStr(e.target.value)} rows={2} className="font-mono text-xs" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={form.auto_award ?? true} onCheckedChange={(v) => set('auto_award', v)} />
              <Label>Auto Award</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active ?? true} onCheckedChange={(v) => set('is_active', v)} />
              <Label>Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{initialValues ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
