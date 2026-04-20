import { useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LeaderboardEntry {
  user_id: string;
  rank: number;
  total_points: number;
  first_name: string | null;
  last_name: string | null;
}

const RANK_MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
const PODIUM_GRADIENTS: Record<number, string> = {
  1: "from-yellow-400/20 to-amber-500/10 border-yellow-400/40",
  2: "from-slate-300/20 to-gray-400/10 border-slate-300/40",
  3: "from-orange-400/20 to-amber-600/10 border-orange-400/40",
};
const PODIUM_AVATAR_BG: Record<number, string> = {
  1: "bg-gradient-to-br from-yellow-400 to-amber-500 text-white",
  2: "bg-gradient-to-br from-slate-300 to-gray-400 text-white",
  3: "bg-gradient-to-br from-orange-400 to-amber-600 text-white",
};

export function LeaderboardModal({ open, onOpenChange }: LeaderboardModalProps) {
  const { user } = useAuth();
  const myRowRef = useRef<HTMLDivElement>(null);

  const { data: entries, isLoading } = useQuery({
    queryKey: ["leaderboard-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard_cache")
        .select("user_id, rank, total_points")
        .order("rank", { ascending: true })
        .limit(200);
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = data.map((e) => e.user_id);

      // Fetch profiles with role info via join
      const { data: profiles, error: pErr } = await supabase
        .from("user_profiles")
        .select("id, first_name, last_name, role_id, roles!inner(role_key)")
        .in("id", userIds);
      if (pErr) throw pErr;

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      // Filter to clients only and re-rank
      const clientEntries = data
        .map((e) => {
          const profile = profileMap.get(e.user_id);
          const roleKey = profile?.roles ? (profile.roles as any).role_key : null;
          return {
            ...e,
            first_name: profile?.first_name ?? null,
            last_name: profile?.last_name ?? null,
            role_key: roleKey,
          };
        })
        .filter((e) => e.role_key === "client" && (e.first_name || e.last_name))
        .map((e, idx) => ({
          user_id: e.user_id,
          rank: idx + 1,
          total_points: e.total_points ?? 0,
          first_name: e.first_name,
          last_name: e.last_name,
        })) as LeaderboardEntry[];

      return clientEntries;
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  // Scroll to current user
  useEffect(() => {
    if (open && myRowRef.current) {
      setTimeout(() => {
        myRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [open, entries]);

  const displayName = (e: LeaderboardEntry) => {
    const parts = [e.first_name, e.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Anonymous";
  };

  const initials = (e: LeaderboardEntry) => {
    const f = e.first_name?.[0] ?? "";
    const l = e.last_name?.[0] ?? "";
    return (f + l).toUpperCase() || "?";
  };

  const maxPoints = entries?.[0]?.total_points ?? 1;
  const top3 = entries?.slice(0, 3) ?? [];
  const rest = entries?.slice(3) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] p-0 gap-0 overflow-hidden">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-primary/35 via-primary/15 to-transparent px-5 pt-5 pb-4">
          <DialogHeader className="p-0">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/30">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              Leaderboard
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              {entries?.length ?? 0} members ranked by points
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="px-5 pb-5" style={{ maxHeight: "calc(85vh - 100px)" }}>
          {isLoading ? (
            <div className="space-y-2 pt-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : !entries || entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No rankings yet. Complete tasks to earn points!
            </p>
          ) : (
            <div className="space-y-4 pt-3">
              {/* Top 3 Podium */}
              {top3.length > 0 && (
                <div className="flex items-end justify-center gap-2 pb-3">
                  {/* Render in order: 2nd, 1st, 3rd for podium effect */}
                  {[top3[1], top3[0], top3[2]].filter(Boolean).map((entry) => {
                    if (!entry) return null;
                    const isMe = entry.user_id === user?.id;
                    const isFirst = entry.rank === 1;
                    return (
                      <div
                        key={entry.user_id}
                        ref={isMe ? myRowRef : undefined}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 bg-gradient-to-b transition-all ${
                          PODIUM_GRADIENTS[entry.rank] ?? ""
                        } ${isFirst ? "scale-105 -mt-2" : ""} ${
                          isMe ? "ring-2 ring-primary/50 shadow-[0_0_16px_rgba(85,189,138,0.3)]" : ""
                        }`}
                        style={{ minWidth: isFirst ? "110px" : "95px" }}
                      >
                        {isFirst && (
                          <Crown className="h-4 w-4 text-yellow-500 -mb-1" />
                        )}
                        <div
                          className={`flex items-center justify-center rounded-full font-bold shrink-0 ${
                            PODIUM_AVATAR_BG[entry.rank] ?? "bg-muted"
                          } ${isFirst ? "h-12 w-12 text-base" : "h-10 w-10 text-sm"}`}
                        >
                          {initials(entry)}
                        </div>
                        <span className="text-lg">{RANK_MEDALS[entry.rank]}</span>
                        <span className="text-xs font-semibold text-foreground text-center truncate max-w-[90px]">
                          {displayName(entry)}
                        </span>
                        <span className="text-xs font-bold text-primary">
                          {entry.total_points} pts
                        </span>
                        {isMe && (
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Rest of the list */}
              <div className="space-y-0.5">
                {rest.map((entry, idx) => {
                  const isMe = entry.user_id === user?.id;
                  const pointsPercent = maxPoints > 0 ? (entry.total_points / maxPoints) * 100 : 0;
                  return (
                    <div
                      key={entry.user_id}
                      ref={isMe ? myRowRef : undefined}
                      className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all overflow-hidden ${
                        isMe
                          ? "border-2 border-primary/50 bg-primary/10 shadow-[0_0_12px_rgba(85,189,138,0.25)]"
                          : idx % 2 === 0
                          ? "hover:bg-muted/40"
                          : "bg-muted/15 hover:bg-muted/40"
                      }`}
                    >
                      {/* Points bar background */}
                      <div
                        className="absolute inset-y-0 left-0 bg-primary/[0.06] transition-all duration-500"
                        style={{ width: `${pointsPercent}%` }}
                      />

                      <span className="relative w-7 text-center text-sm font-bold shrink-0 text-muted-foreground">
                        #{entry.rank}
                      </span>
                      <div className="relative flex items-center justify-center h-8 w-8 rounded-full bg-muted text-xs font-bold shrink-0">
                        {initials(entry)}
                      </div>
                      <span className="relative text-sm font-medium truncate flex-1">
                        {displayName(entry)}
                        {isMe && (
                          <span className="ml-1.5 text-xs font-bold text-primary bg-primary/15 px-1.5 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </span>
                      <span className="relative text-sm font-semibold text-muted-foreground shrink-0">
                        {entry.total_points} pts
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
