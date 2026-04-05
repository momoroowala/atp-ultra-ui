import { useState, memo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaderboardModal } from "./LeaderboardModal";

interface PreviewEntry {
  user_id: string;
  rank: number;
  total_points: number;
  first_name: string | null;
  last_name: string | null;
}

const LeaderboardRankCard = memo(function LeaderboardRankCard() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  // Refresh leaderboard cache once per session
  useQuery({
    queryKey: ["leaderboard-refresh"],
    queryFn: async () => {
      await supabase.rpc("refresh_leaderboard_cache");
      return true;
    },
    enabled: !!user,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const { data: previewData, isLoading } = useQuery({
    queryKey: ["leaderboard-preview", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("leaderboard_cache")
        .select("user_id, rank, total_points")
        .order("rank", { ascending: true })
        .limit(200);
      if (error) throw error;
      if (!data || data.length === 0) return { entries: [], myEntry: null };

      const userIds = data.map((e) => e.user_id);
      const { data: profiles, error: pErr } = await supabase
        .from("user_profiles")
        .select("id, first_name, last_name, roles!inner(role_key)")
        .in("id", userIds);
      if (pErr) throw pErr;

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      const clientEntries: PreviewEntry[] = data
        .map((e) => {
          const profile = profileMap.get(e.user_id);
          const roleKey = profile?.roles ? (profile.roles as any).role_key : null;
          return { ...e, roleKey, first_name: profile?.first_name ?? null, last_name: profile?.last_name ?? null };
        })
        .filter((e) => e.roleKey === "client" && (e.first_name || e.last_name))
        .map((e, idx) => ({
          user_id: e.user_id,
          rank: idx + 1,
          total_points: e.total_points ?? 0,
          first_name: e.first_name,
          last_name: e.last_name,
        }));

      const myEntry = clientEntries.find((e) => e.user_id === user.id) ?? null;
      const top5 = clientEntries.slice(0, 5);
      const meInTop5 = top5.some((e) => e.user_id === user.id);

      let entries: PreviewEntry[];
      let showSeparator = false;
      if (meInTop5 || !myEntry) {
        entries = top5;
      } else {
        entries = clientEntries.slice(0, 4);
        showSeparator = true;
        entries.push(myEntry);
      }

      return { entries, myEntry, showSeparator };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const displayName = (e: PreviewEntry) => {
    const parts = [e.first_name, e.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Anonymous";
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <div className="px-3 py-2.5 bg-gradient-to-r from-purple-500/20 via-purple-500/10 to-transparent">
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="p-3 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const entries = previewData?.entries ?? [];
  const showSeparator = previewData?.showSeparator ?? false;

  return (
    <>
      <div
        className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm cursor-pointer hover:border-purple-500/30 transition-colors"
        onClick={() => setModalOpen(true)}
      >
        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gradient-to-r from-purple-500/20 via-purple-500/10 to-transparent">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-purple-500/15">
            <Trophy className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Leaderboard
          </h3>
        </div>

        <div className="px-3 py-2 space-y-0.5">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              Complete tasks to earn points and climb the ranks!
            </p>
          ) : (
            <>
              {entries.map((entry, idx) => {
                const isMe = entry.user_id === user?.id;
                const isAfterSeparator = showSeparator && idx === entries.length - 1;
                return (
                  <div key={entry.user_id}>
                    {isAfterSeparator && (
                      <div className="text-center text-xs text-muted-foreground py-0.5 select-none">···</div>
                    )}
                    <div
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${
                        isMe
                          ? "bg-primary/10 border-l-2 border-primary"
                          : ""
                      }`}
                    >
                      <span className="w-6 shrink-0 flex items-center justify-center">
                        {entry.rank === 1 ? (
                          <Trophy className="h-4 w-4 text-yellow-500" />
                        ) : entry.rank === 2 ? (
                          <Trophy className="h-4 w-4 text-gray-400" />
                        ) : entry.rank === 3 ? (
                          <Trophy className="h-4 w-4 text-amber-700" />
                        ) : (
                          <span className={`text-xs ${isMe ? "font-bold text-primary" : "text-muted-foreground font-medium"}`}>
                            #{entry.rank}
                          </span>
                        )}
                      </span>
                      <span className={`text-sm truncate flex-1 ${isMe ? "font-bold text-foreground" : "text-foreground"}`}>
                        {displayName(entry)}
                        {isMe && (
                          <span className="ml-1.5 text-[10px] font-bold text-primary bg-primary/15 px-1.5 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </span>
                      <span className={`text-xs shrink-0 ${isMe ? "font-bold text-primary" : "text-muted-foreground"}`}>
                        {entry.total_points} pts
                      </span>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-center gap-1 pt-1.5 pb-0.5">
                <span className="text-xs text-primary font-medium">View full list</span>
                <ChevronRight className="h-3 w-3 text-primary" />
              </div>
            </>
          )}
        </div>
      </div>

      <LeaderboardModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
});

export { LeaderboardRankCard };
