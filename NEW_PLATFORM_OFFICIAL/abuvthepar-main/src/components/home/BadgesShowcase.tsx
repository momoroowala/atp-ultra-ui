import { useState } from "react";
import { useAchievementBadges } from "@/hooks/useAchievementBadges";
import { Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BadgesModal } from "./BadgesModal";

export function BadgesShowcase() {
  const { earnedBadges, allBadges, totalPoints, loading } = useAchievementBadges();
  const [modalOpen, setModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="rounded-xl border border-primary/30 bg-card overflow-hidden shadow-[0_0_16px_rgba(85,189,138,0.1)]">
        <div className="px-3 py-2.5 bg-gradient-to-r from-primary/35 via-primary/15 to-transparent">
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="p-3">
          <Skeleton className="h-6 w-36" />
        </div>
      </div>
    );
  }

  const recentFour = earnedBadges.slice(0, 4);

  return (
    <>
      <div
        className="rounded-xl border border-primary/30 bg-card overflow-hidden shadow-[0_0_16px_rgba(85,189,138,0.1)] cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => setModalOpen(true)}
      >
        <div className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-primary/35 via-primary/15 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/30">
              <Award className="h-3.5 w-3.5 text-primary" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Recent Achievement
            </h3>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {earnedBadges.length}/{allBadges.length}
          </span>
        </div>

        <div className="p-3">
          {recentFour.length > 0 ? (
            <TooltipProvider>
              <div className="flex items-center gap-2 mt-1">
                {recentFour.map((badge) => (
                  <Tooltip key={badge.user_badge_id}>
                    <TooltipTrigger asChild>
                      <span className="text-xl cursor-default hover:scale-125 hover:drop-shadow-[0_0_6px_rgba(85,189,138,0.5)] transition-all duration-200">
                        {badge.icon_emoji || "🏆"}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs font-medium">{badge.badge_name}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {earnedBadges.length > 4 && (
                  <span className="text-xs text-muted-foreground font-medium">
                    +{earnedBadges.length - 4} more
                  </span>
                )}
              </div>
            </TooltipProvider>
          ) : (
            <p className="text-sm text-muted-foreground">
              Start completing tasks to earn badges!
            </p>
          )}
        </div>
      </div>

      <BadgesModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        earnedBadges={earnedBadges}
        allBadges={allBadges}
        totalPoints={totalPoints}
      />
    </>
  );
}
