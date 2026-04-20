import { Calendar, Video, Lock, Clock, ArrowRight, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCalendarCalls } from '@/hooks/useCalendarCalls';
import { formatTimeInUserTZ, convertToUserTimezone, isCallUpcomingInUserTZ, formatTimeInEST, isUserInEST } from '@/utils/timezoneHelpers';
import { useUserTier } from '@/hooks/useUserTier';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export const CalendarWidget = () => {
  const { calls, isLoading } = useCalendarCalls();
  const { tierId } = useUserTier();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const { data: tierData } = useQuery({
    queryKey: ['tier-upsell-url', tierId],
    queryFn: async () => {
      if (!tierId) return null;
      const { data, error } = await supabase
        .from('tiers')
        .select('upsell_funnel_url')
        .eq('id', tierId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!tierId,
  });

  const upcomingCalls = useMemo(() => {
    return calls
      .filter(call => isCallUpcomingInUserTZ(call.call_date, call.call_time, call.timezone))
      .slice(0, 2);
  }, [calls]);

  return (
    <div className="rounded-xl border border-primary/30 bg-card overflow-hidden shadow-[0_0_16px_rgba(85,189,138,0.1)]">
      {/* Gradient header */}
      <div className="relative px-4 py-3 bg-gradient-to-r from-primary/35 via-primary/15 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/30">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Upcoming Events
            </h3>
          </div>
          {upcomingCalls.length > 0 && (
            <span className="text-[11px] font-semibold bg-primary/15 text-primary px-2 py-0.5 rounded-full">
              {upcomingCalls.length}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 pt-2">
        {isLoading ? (
          <div className="space-y-3 pt-1">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : upcomingCalls.length === 0 ? (
          <div className="flex flex-col items-center py-6 gap-2">
            <div className="relative">
              <Calendar className="h-10 w-10 text-muted-foreground/30 animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground">No upcoming events</p>
            <p className="text-xs text-muted-foreground/60">Check back later for new sessions</p>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            {upcomingCalls.map((call) => {
              const userDate = convertToUserTimezone(call.call_date, call.call_time, call.timezone);
              const formattedTime = formatTimeInUserTZ(call.call_date, call.call_time, call.timezone);

              const normalizedTierIds = (call as any).visible_tier_ids
                ? Array.isArray((call as any).visible_tier_ids) ? (call as any).visible_tier_ids : [(call as any).visible_tier_ids]
                : [];
              const normalizedVisibleTiers = (call as any).visible_tiers
                ? Array.isArray((call as any).visible_tiers) ? (call as any).visible_tiers : [(call as any).visible_tiers]
                : [];

              const hasAccess =
                isAdmin ||
                normalizedTierIds.length === 0 ||
                normalizedVisibleTiers.includes("all") ||
                (tierId && normalizedTierIds.some((id: string) => String(id) === String(tierId)));

              return (
                <div
                  key={call.id}
                  className="group rounded-lg p-3 transition-all duration-200 hover:bg-accent/50"
                >
                  {/* Event row */}
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`
                      flex items-center justify-center h-10 w-10 rounded-lg shrink-0
                      ${hasAccess
                        ? 'bg-primary/15 text-primary'
                        : 'bg-amber-400/15 text-amber-500'}
                    `}>
                      {hasAccess ? (
                        <CalendarDays className="h-5 w-5" />
                      ) : (
                        <Lock className="h-5 w-5" />
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-tight">
                        {format(userDate, 'EEEE, MMMM d,')} {formattedTime}
                      </p>
                      {!isUserInEST() && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          EST: {formatTimeInEST(call.call_date, call.call_time, call.timezone)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {call.title}
                      </p>
                    </div>
                  </div>

                  {/* Hover-reveal buttons */}
                  <div className="flex items-center gap-2 mt-2 opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-20 transition-all duration-300 overflow-hidden">
                    <Button
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => {
                        if (hasAccess) {
                          window.open(call.call_link, '_blank');
                        } else if (tierData?.upsell_funnel_url) {
                          window.open(tierData.upsell_funnel_url, '_blank');
                        }
                      }}
                    >
                      {hasAccess ? 'View Event Details' : 'Unlock Access'} <ArrowRight className="h-3 w-3 !size-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => navigate('/calendar')}
                    >
                      View All Events
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
