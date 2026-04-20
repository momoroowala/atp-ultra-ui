import { Globe, Clock } from 'lucide-react';
import { getUserTimezone } from '@/utils/timezoneHelpers';
import { format } from 'date-fns-tz';

export type TzMode = 'local' | 'est';

interface TimezoneToggleProps {
  value: TzMode;
  onChange: (mode: TzMode) => void;
}

const getTimezoneAbbr = (tz: string): string => {
  try {
    return format(new Date(), 'zzz', { timeZone: tz });
  } catch {
    return tz;
  }
};

export const TimezoneToggle = ({ value, onChange }: TimezoneToggleProps) => {
  const userTz = getUserTimezone();
  
  // Don't render if user is already in EST/EDT
  if (userTz === 'America/New_York') return null;

  const localAbbr = getTimezoneAbbr(userTz);
  const estAbbr = 'EST';

  return (
    <div className="inline-flex items-center rounded-full border border-border bg-muted/50 p-0.5 text-xs">
      <button
        onClick={() => onChange('local')}
        className={`
          flex items-center gap-1 px-3 py-1.5 rounded-full transition-all font-medium
          ${value === 'local'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'}
        `}
      >
        <Globe className="h-3 w-3" />
        My Time ({localAbbr})
      </button>
      <button
        onClick={() => onChange('est')}
        className={`
          flex items-center gap-1 px-3 py-1.5 rounded-full transition-all font-medium
          ${value === 'est'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'}
        `}
      >
        <Clock className="h-3 w-3" />
        {estAbbr}
      </button>
    </div>
  );
};
