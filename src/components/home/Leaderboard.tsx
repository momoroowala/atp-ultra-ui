import { useAuth } from "@/hooks/useAuth";
import { useUserTier } from "@/hooks/useUserTier";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  rank: number;
  user_profiles?: {
    first_name?: string;
    last_name?: string;
    user_email?: string;
  };
}
export const Leaderboard = () => {
  const {
    user
  } = useAuth();
  const {
    tierId
  } = useUserTier();
  const {
    data: leaderboardData,
    isLoading: loading
  } = useQuery({
    queryKey: ['tier-leaderboard', tierId],
    queryFn: async () => {
      if (!user || !tierId) return {
        topUsers: [],
        userRank: null
      };
      const {
        data,
        error
      } = await supabase.rpc("get_tier_leaderboard", {
        p_tier_id: tierId
      });
      if (error) {
        console.error("Leaderboard error:", error);
        return {
          topUsers: [],
          userRank: null
        };
      }
      if (!data) return {
        topUsers: [],
        userRank: null
      };

      // Top 5 for main display
      const topUsers = data.slice(0, 5).map((entry: any) => ({
        user_id: entry.user_id,
        total_points: entry.total_points,
        rank: entry.rank,
        user_profiles: {
          first_name: entry.first_name,
          last_name: entry.last_name,
          user_email: entry.user_email
        }
      }));

      // Find current user's rank
      const currentUserEntry = data.find((entry: any) => entry.user_id === user.id);
      const userRank = currentUserEntry ? {
        user_id: currentUserEntry.user_id,
        total_points: currentUserEntry.total_points,
        rank: currentUserEntry.rank,
        user_profiles: {
          first_name: currentUserEntry.first_name,
          last_name: currentUserEntry.last_name,
          user_email: currentUserEntry.user_email
        }
      } : null;
      return {
        topUsers,
        userRank
      };
    },
    enabled: !!user && !!tierId
    // Inherit global cache settings from App.tsx
  });
  const topUsers = leaderboardData?.topUsers || [];
  const userRank = leaderboardData?.userRank || null;
  const formatPoints = (points: number): string => {
    if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}k`;
    }
    return points.toString();
  };
  const getInitials = (firstName?: string, lastName?: string): string => {
    const first = firstName?.charAt(0)?.toUpperCase() || "";
    const last = lastName?.charAt(0)?.toUpperCase() || "";
    return `${first}${last}` || "U";
  };
  const getDisplayName = (entry: LeaderboardEntry): string => {
    const firstName = entry.user_profiles?.first_name || "";
    const lastName = entry.user_profiles?.last_name || "";
    return `${firstName} ${lastName}`.trim() || entry.user_profiles?.user_email || "User";
  };
  const getRankBadge = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return rank.toString();
  };
  if (loading) {
    return <Card>
        <CardContent className="p-3">
          <div className="animate-pulse space-y-2">
            <div className="h-3 bg-muted rounded w-1/3"></div>
            <div className="space-y-1.5">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-muted rounded"></div>)}
            </div>
          </div>
        </CardContent>
      </Card>;
  }
  return;
};