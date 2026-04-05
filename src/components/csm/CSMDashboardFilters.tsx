import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTiers } from '@/hooks/useTiers';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export interface CSMDashboardFilterValues {
  userScope: string;
  tierFilter: string;
  csmFilter: string;
}

interface Props {
  values: CSMDashboardFilterValues;
  onChange: (values: CSMDashboardFilterValues) => void;
  currentUserId?: string;
}

const TIER_EMOJI: Record<string, string> = {
  diamond: '💎',
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
};

export function CSMDashboardFilters({ values, onChange, currentUserId }: Props) {
  const { data: tiers } = useTiers();

  const { data: csmList } = useQuery({
    queryKey: ['csm-staff-list'],
    queryFn: async () => {
      // Get CSM role ids only
      const { data: roles } = await supabase
        .from('roles')
        .select('id')
        .in('role_key', ['csm']);
      if (!roles || roles.length === 0) return [];

      const roleIds = roles.map((r) => r.id);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name')
        .in('role_id', roleIds)
        .eq('is_active', true)
        .order('first_name');
      if (error) throw error;
      return (data || []) as Array<{ id: string; first_name: string | null; last_name: string | null }>;
    },
  });

  const set = (patch: Partial<CSMDashboardFilterValues>) =>
    onChange({ ...values, ...patch });

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-end gap-2">
      {/* Dropdowns row */}
      <div className="flex items-center gap-2">
        <Select value={values.userScope} onValueChange={(v) => set({ userScope: v })}>
          <SelectTrigger className="h-7 w-[120px] text-xs bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={values.csmFilter} onValueChange={(v) => set({ csmFilter: v })}>
          <SelectTrigger className="h-7 w-[140px] text-xs bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All CSMs</SelectItem>
            {(csmList || []).map((csm) => (
              <SelectItem key={csm.id} value={csm.id}>
                {csm.first_name} {csm.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Tier pills — scrollable */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 -mb-1">
        <button
          onClick={() => set({ tierFilter: 'all' })}
          className={cn(
            'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0',
            values.tierFilter === 'all'
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'bg-card text-muted-foreground border-border hover:border-primary/20'
          )}
        >
          All Tiers
        </button>
        {(tiers || []).map((tier) => (
          <button
            key={tier.id}
            onClick={() => set({ tierFilter: tier.id })}
            className={cn(
              'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0',
              values.tierFilter === tier.id
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-card text-muted-foreground border-border hover:border-primary/20'
            )}
          >
            {TIER_EMOJI[tier.tier_key.toLowerCase()] || '🏷️'} {tier.display_name}
          </button>
        ))}
      </div>
    </div>
  );
}
