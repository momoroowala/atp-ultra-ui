import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lock } from "lucide-react";
import type { AchievementBadge, UserAchievementBadge } from "@/hooks/useAchievementBadges";

interface BadgesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  earnedBadges: UserAchievementBadge[];
  allBadges: AchievementBadge[];
  totalPoints: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  onboarding: "🚀 Onboarding",
  learning: "📚 Learning",
  community: "💬 Community",
  consistency: "🔥 Consistency",
  special: "⭐ Special",
};

const CATEGORY_ORDER = ["onboarding", "learning", "community", "consistency", "special"];

export function BadgesModal({ open, onOpenChange, earnedBadges, allBadges, totalPoints }: BadgesModalProps) {
  const earnedKeys = new Set(earnedBadges.map((b) => b.badge_key));
  const earnedMap = new Map(earnedBadges.map((b) => [b.badge_key, b]));

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat] || cat,
    badges: allBadges.filter((b) => b.category === cat),
  })).filter((g) => g.badges.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-lg font-bold">Your Badges</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {earnedBadges.length}/{allBadges.length} earned · {totalPoints} points
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="px-5 pb-5" style={{ maxHeight: "calc(85vh - 100px)" }}>
          <div className="space-y-5">
            {grouped.map((group) => (
              <div key={group.category}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  {group.label}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {group.badges.map((badge) => {
                    const earned = earnedKeys.has(badge.badge_key);
                    const earnedData = earnedMap.get(badge.badge_key);
                    return (
                      <div
                        key={badge.id}
                        className={`flex items-start gap-2.5 rounded-lg border p-2.5 transition-colors ${
                          earned
                            ? "border-primary/30 bg-primary/5"
                            : "border-border bg-muted/30 opacity-60"
                        }`}
                      >
                        <span className="text-2xl relative shrink-0">
                          {badge.icon_emoji || "🏆"}
                          {!earned && (
                            <Lock className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-muted-foreground" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold leading-tight truncate">
                            {badge.badge_name}
                          </p>
                          {earned && earnedData ? (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Earned {new Date(earnedData.earned_at).toLocaleDateString()}
                            </p>
                          ) : (
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                              {badge.description || "Keep going!"}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
