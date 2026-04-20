import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, X, Crown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';

interface LeaderboardEntry {
  user_id: string;
  rank: number;
  total_points: number;
  first_name: string | null;
  last_name: string | null;
}

const dayColors: Record<string, { solid: string; gradient: string; headerGradient: string; hover: string }> = {
  Monday:    { solid: 'bg-blue-500',    gradient: 'from-blue-900 to-blue-950',       headerGradient: 'from-blue-700/40 via-blue-800/20 to-transparent',    hover: 'hover:bg-blue-400' },
  Tuesday:   { solid: 'bg-emerald-500', gradient: 'from-emerald-900 to-emerald-950', headerGradient: 'from-emerald-700/40 via-emerald-800/20 to-transparent', hover: 'hover:bg-emerald-400' },
  Wednesday: { solid: 'bg-violet-500',  gradient: 'from-violet-900 to-violet-950',   headerGradient: 'from-violet-700/40 via-violet-800/20 to-transparent',  hover: 'hover:bg-violet-400' },
  Thursday:  { solid: 'bg-amber-500',   gradient: 'from-amber-900 to-amber-950',     headerGradient: 'from-amber-700/40 via-amber-800/20 to-transparent',   hover: 'hover:bg-amber-400' },
  Friday:    { solid: 'bg-rose-500',    gradient: 'from-rose-900 to-rose-950',       headerGradient: 'from-rose-700/40 via-rose-800/20 to-transparent',    hover: 'hover:bg-rose-400' },
  Saturday:  { solid: 'bg-cyan-500',    gradient: 'from-cyan-900 to-cyan-950',       headerGradient: 'from-cyan-700/40 via-cyan-800/20 to-transparent',    hover: 'hover:bg-cyan-400' },
  Sunday:    { solid: 'bg-orange-500',  gradient: 'from-orange-900 to-orange-950',   headerGradient: 'from-orange-700/40 via-orange-800/20 to-transparent',  hover: 'hover:bg-orange-400' },
};

export function LeaderboardSidePanel() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const today = format(new Date(), 'EEEE');
  const colors = dayColors[today] || dayColors.Monday;

  useQuery({
    queryKey: ['leaderboard-refresh'],
    queryFn: async () => {
      await supabase.rpc('refresh_leaderboard_cache');
      return true;
    },
    enabled: !!user,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard-full', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: raw, error } = await supabase
        .from('leaderboard_cache')
        .select('user_id, rank, total_points')
        .order('rank', { ascending: true })
        .limit(200);
      if (error) throw error;
      if (!raw?.length) return [];

      const userIds = raw.map((e) => e.user_id);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, roles!inner(role_key)')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      return raw
        .map((e) => {
          const profile = profileMap.get(e.user_id);
          const roleKey = profile?.roles ? (profile.roles as any).role_key : null;
          return {
            ...e,
            roleKey,
            first_name: profile?.first_name ?? null,
            last_name: profile?.last_name ?? null,
          };
        })
        .filter((e) => e.roleKey === 'client' && (e.first_name || e.last_name))
        .map((e, idx) => ({
          user_id: e.user_id,
          rank: idx + 1,
          total_points: e.total_points ?? 0,
          first_name: e.first_name,
          last_name: e.last_name,
        }));
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const entries: LeaderboardEntry[] = data ?? [];
  const displayName = (e: LeaderboardEntry) =>
    [e.first_name, e.last_name].filter(Boolean).join(' ') || 'Anonymous';

  const medalColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]';
    if (rank === 2) return 'text-gray-300 drop-shadow-[0_0_4px_rgba(209,213,219,0.4)]';
    if (rank === 3) return 'text-amber-600 drop-shadow-[0_0_4px_rgba(217,119,6,0.4)]';
    return '';
  };

  return (
    <>
      {/* Fixed side tab */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'fixed right-0 top-1/2 -translate-y-1/2 z-40 text-white px-1.5 py-4 rounded-l-lg shadow-lg transition-colors hidden lg:flex flex-col items-center gap-1',
          colors.solid,
          colors.hover
        )}
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        <Trophy className="h-4 w-4 rotate-90 mb-1" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Leaderboard</span>
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-50"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: '110%', y: '-50%', opacity: 0.5 }}
              animate={{ x: 0, y: '-50%', opacity: 1 }}
              exit={{ x: '110%', y: '-50%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className={cn(
                'fixed right-4 top-1/2 w-96 max-h-[75vh] z-50 rounded-2xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden',
                `bg-gradient-to-br ${colors.gradient}`
              )}
            >
              {/* Header */}
              <div className={cn('p-5 bg-gradient-to-br border-b border-white/10', colors.headerGradient)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Leaderboard</h2>
                      <p className="text-[11px] text-white/60">{entries.length} competitors</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="h-8 w-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1 relative">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl bg-white/10" />
                  ))
                ) : entries.length === 0 ? (
                  <p className="text-sm text-white/60 text-center py-12">
                    No entries yet. Complete tasks to earn points!
                  </p>
                ) : (
                  entries.map((entry, idx) => {
                    const isMe = entry.user_id === user?.id;
                    return (
                      <div
                        key={entry.user_id}
                        className={cn(
                          'flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all',
                          isMe
                            ? 'bg-white/10 border border-white/20 shadow-[0_0_12px_-3px_rgba(255,255,255,0.15)]'
                            : idx % 2 === 0
                              ? 'bg-white/5'
                              : 'bg-transparent'
                        )}
                      >
                        {/* Rank */}
                        <span className="w-8 shrink-0 flex items-center justify-center">
                          {entry.rank <= 3 ? (
                            entry.rank === 1 ? (
                              <Crown className={cn('h-5 w-5', medalColor(entry.rank))} />
                            ) : (
                              <Trophy className={cn('h-5 w-5', medalColor(entry.rank))} />
                            )
                          ) : (
                            <span className={cn('text-sm font-semibold', isMe ? 'text-white' : 'text-white/60')}>
                              #{entry.rank}
                            </span>
                          )}
                        </span>

                        {/* Name */}
                        <span className={cn('text-sm truncate flex-1', isMe ? 'font-bold text-white' : 'text-white')}>
                          {displayName(entry)}
                          {isMe && (
                            <span className="ml-2 text-[10px] font-bold text-white bg-white/20 px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </span>

                        {/* Points */}
                        <span className={cn('text-xs shrink-0 tabular-nums font-medium', isMe ? 'text-white font-bold' : 'text-white/80')}>
                          {entry.total_points.toLocaleString()} pts
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
