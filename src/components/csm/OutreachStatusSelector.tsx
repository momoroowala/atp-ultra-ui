import { useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface OutreachStatusSelectorProps {
  userId: string;
  metricType: string;
  currentStatus: string;
  onStatusChange: (userId: string, metricType: string, status: string) => Promise<void>;
}

const STATUS_OPTIONS = [
  {
    value: 'no_action',
    label: 'No Action',
    dotClass: 'bg-gray-400',
    bgClass: 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800',
    triggerBg: 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-300',
  },
  {
    value: 'follow_up_required',
    label: 'Follow-Up Required',
    dotClass: 'bg-amber-500',
    bgClass: 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50',
    triggerBg: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300',
  },
  {
    value: 'message_sent',
    label: 'Message Sent',
    dotClass: 'bg-blue-500',
    bgClass: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50',
    triggerBg: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300',
  },
  {
    value: 'call_scheduled',
    label: 'Call Scheduled',
    dotClass: 'bg-purple-500',
    bgClass: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-900/50',
    triggerBg: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300',
  },
  {
    value: 'resolved',
    label: 'Resolved',
    dotClass: 'bg-emerald-500',
    bgClass: 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50',
    triggerBg: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300',
  },
];

export function OutreachStatusSelector({ userId, metricType, currentStatus, onStatusChange, onSaveFlash, disabled }: OutreachStatusSelectorProps & { onSaveFlash?: () => void; disabled?: boolean }) {
  const [saving, setSaving] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [pulseScale, setPulseScale] = useState(false);
  const [open, setOpen] = useState(false);

  // Backwards compatibility: map legacy "contacted" to "resolved"
  const effectiveStatus = currentStatus === 'contacted' ? 'resolved' : currentStatus;
  const current = STATUS_OPTIONS.find(o => o.value === effectiveStatus) || STATUS_OPTIONS[1];

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
      toast.error('Failed to update');
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
      <PopoverContent className="w-48 p-1" align="end" sideOffset={4}>
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
