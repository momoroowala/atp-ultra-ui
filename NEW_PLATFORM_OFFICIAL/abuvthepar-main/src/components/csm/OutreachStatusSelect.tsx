import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface OutreachStatusSelectProps {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}

export function OutreachStatusSelect({ value, onChange, compact }: OutreachStatusSelectProps) {
  if (compact) {
    return (
      <button
        onClick={() => onChange(value === 'contacted' ? 'follow_up_required' : 'contacted')}
        className="shrink-0"
      >
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 cursor-pointer transition-colors ${
            value === 'contacted'
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20'
          }`}
        >
          {value === 'contacted' ? '✓ Contacted' : '⏳ Follow-up'}
        </Badge>
      </button>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-7 w-[130px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="follow_up_required">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Follow-up
          </span>
        </SelectItem>
        <SelectItem value="contacted">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Contacted
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
