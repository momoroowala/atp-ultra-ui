import { LEAD_STATUSES } from '@/hooks/useBrandLeads';
import type { BrandLead } from '@/hooks/useBrandLeads';

interface LeadStatusSummaryProps {
  leads: BrandLead[];
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
}

export const LeadStatusSummary = ({ leads, statusFilter, onStatusFilterChange }: LeadStatusSummaryProps) => {
  const counts = LEAD_STATUSES.reduce((acc, s) => {
    acc[s.value] = leads.filter(l => l.status === s.value).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-wrap gap-2">
      {LEAD_STATUSES.map(s => {
        const isActive = statusFilter === s.value;
        return (
          <button
            key={s.value}
            onClick={() => onStatusFilterChange(isActive ? 'all' : s.value)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${s.color} ${isActive ? 'ring-2 ring-offset-2 ring-primary' : 'opacity-80 hover:opacity-100'}`}
          >
            {s.value}
            <span className="font-bold">({counts[s.value] || 0})</span>
          </button>
        );
      })}
    </div>
  );
};
