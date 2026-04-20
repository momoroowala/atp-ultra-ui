import { useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface OutreachStatusSelectorProps {
  userId: string;
  metricType: string;
  currentStatus: string;
  onStatusChange: (userId: string, metricType: string, status: string) => Promise<void>;
}

const STATUS_OPTIONS = [
  {
    value: 'follow_up_required',
    label: 'Follow-up',
    dotClass: 'bg-amber-500',
    bgClass: 'bg-amber-50 hover:bg-amber-100',
    triggerBg: 'bg-amber-50 border-amber-200 text-amber-800',
  },
  {
    value: 'contacted',
    label: 'Contacted',
    dotClass: 'bg-emerald-500',
    bgClass: 'bg-emerald-50 hover:bg-emerald-100',
    triggerBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  },
];

export function OutreachStatusSelector({ userId, metricType, currentStatus, onStatusChange, onSaveFlash, disabled }: OutreachStatusSelectorProps & { onSaveFlash?: () => void; disabled?: boolean }) {
  const [saving, setSaving] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [pulseScale, setPulseScale] = useState(false);
  const [open, setOpen] = useState(false);

  const current = STATUS_OPTIONS.find(o => o.value === currentStatus) || STATUS_OPTIONS[0];

  const handleSelect = async (newStatus: string) => {
    if (newStatus === currentStatus) {
      setOpen(false);
      return;
    }
    setOpen(false);
    setSaving(true);
    try {
      await onStatusChange(userId, metricType, newStatus);
      setSaving(false);
      setShowCheck(true);
      setPulseScale(true);
      onSaveFlash?.();
      setTimeout(() => setShowCheck(false), 1000);
      setTimeout(() => setPulseScale(false), 200);
    } catch {
      setSaving(false);
      toast({ title: 'Failed to update', variant: 'destructive', duration: 2000 });
    }
  };

  if (disabled) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border whitespace-nowrap w-fit opacity-70 ${current.triggerBg}`}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${current.dotClass}`} />
        {current.label}
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={saving}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer whitespace-nowrap w-fit ${current.triggerBg} ${pulseScale ? 'scale-110' : 'scale-100'}`}
          style={{ transitionDuration: '200ms' }}
        >
          {saving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : showCheck ? (
            <Check className="h-3 w-3 text-emerald-600 animate-in fade-in zoom-in duration-200" />
          ) : (
            <span className={`w-2 h-2 rounded-full shrink-0 ${current.dotClass}`} />
          )}
          {current.label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="end" sideOffset={4}>
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              opt.value === currentStatus ? opt.bgClass + ' font-semibold' : 'hover:bg-muted'
            }`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dotClass}`} />
            {opt.label}
            {opt.value === currentStatus && <Check className="h-3 w-3 ml-auto text-muted-foreground" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
