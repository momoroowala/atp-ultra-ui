import { Badge } from '@/components/ui/badge';

interface TierBadgeProps {
  tier: string;
}

export const TierBadge = ({ tier }: TierBadgeProps) => {
  const getTierColor = (tier: string) => {
    const t = tier.toLowerCase();
    if (t.includes('diamond')) return 'bg-amber-500/10 text-amber-600';
    if (t.includes('platinum')) return 'bg-purple-500/10 text-purple-500';
    if (t.includes('gold')) return 'bg-yellow-500/10 text-yellow-600';
    if (t.includes('silver')) return 'bg-slate-400/10 text-slate-500';
    if (t.includes('free')) return 'bg-muted text-muted-foreground';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <Badge variant="outline" className={`${getTierColor(tier)} text-xs whitespace-nowrap`}>
      {tier}
    </Badge>
  );
};

interface TierBadgesProps {
  tiers: string[];
}

export const TierBadges = ({ tiers }: TierBadgesProps) => {
  if (!tiers || tiers.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {tiers.map((tier, index) => (
        <TierBadge key={`${tier}-${index}`} tier={tier} />
      ))}
    </div>
  );
};
