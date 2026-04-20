import { useState } from 'react';
import { RefreshCw, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useTiers } from '@/hooks/useTiers';
import { useCSMList } from '@/hooks/useCSMStudents';
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
  const [csmOpen, setCsmOpen] = useState(false);
  const { data: tiers } = useTiers();

  const { data: csmListRaw } = useCSMList();
  const csmList = (csmListRaw || []).map(c => ({
    id: c.id,
    first_name: c.firstName,
    last_name: c.lastName,
  }));

  const set = (patch: Partial<CSMDashboardFilterValues>) =>
    onChange({ ...values, ...patch });

  return (
    <div className="flex items-center justify-end gap-2">
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

      <Select value={values.tierFilter} onValueChange={(v) => set({ tierFilter: v })}>
        <SelectTrigger className="h-7 w-[140px] text-xs bg-card border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Tiers</SelectItem>
          {(tiers || []).filter(t => t.tier_key !== 'staff').map((tier) => (
            <SelectItem key={tier.id} value={tier.id}>
              {TIER_EMOJI[tier.tier_key.toLowerCase()] || '🏷️'} {tier.display_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={csmOpen} onOpenChange={setCsmOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={csmOpen} className="h-7 w-[140px] justify-between text-xs bg-card border-border font-normal">
            {values.csmFilter === 'all'
              ? 'All CSMs'
              : (csmList || []).find(c => c.id === values.csmFilter)
                ? `${(csmList || []).find(c => c.id === values.csmFilter)!.first_name} ${(csmList || []).find(c => c.id === values.csmFilter)!.last_name}`
                : 'All CSMs'}
            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search CSMs..." className="h-8 text-xs" />
            <CommandList>
              <CommandEmpty className="py-3 text-xs">No CSM found</CommandEmpty>
              <CommandGroup>
                <CommandItem value="all" onSelect={() => { set({ csmFilter: 'all' }); setCsmOpen(false); }} className="text-xs">
                  <Check className={cn("mr-2 h-3 w-3", values.csmFilter === 'all' ? "opacity-100" : "opacity-0")} />
                  All CSMs
                </CommandItem>
                {(csmList || []).map((csm) => (
                  <CommandItem key={csm.id} value={`${csm.first_name} ${csm.last_name}`} onSelect={() => { set({ csmFilter: csm.id }); setCsmOpen(false); }} className="text-xs">
                    <Check className={cn("mr-2 h-3 w-3", values.csmFilter === csm.id ? "opacity-100" : "opacity-0")} />
                    {csm.first_name} {csm.last_name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
        <RefreshCw className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
