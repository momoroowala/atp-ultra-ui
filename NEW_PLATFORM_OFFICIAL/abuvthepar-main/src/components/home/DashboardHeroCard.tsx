import { useState, useMemo } from "react";
import { format } from "date-fns";
import { CalendarDays, Check, Lock, Award } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAchievementBadges } from "@/hooks/useAchievementBadges";
import { useLoginStreak } from "@/hooks/useLoginStreak";
import { useCalendarCalls } from "@/hooks/useCalendarCalls";
import { useUserTier } from "@/hooks/useUserTier";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import { useCallRsvps, useUpsertRsvp } from "@/hooks/useCallRsvp";
import {
  formatTimeInUserTZ,
  convertToUserTimezone,
  isCallUpcomingInUserTZ,
} from "@/utils/timezoneHelpers";
import { BadgesModal } from "./BadgesModal";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

/* ── day taglines ─────────────────────────────────────── */
const dayTaglines: Record<string, string> = {
  Monday: "take action, set the pace.",
  Tuesday: "build momentum, stay sharp.",
  Wednesday: "push through, keep climbing.",
  Thursday: "stay focused, finish strong.",
  Friday: "close the week with impact.",
  Saturday: "rest smart, recharge fully.",
  Sunday: "reflect, plan, prepare.",
};

/* ── day colors ────────────────────────────────────────── */
const dayColors: Record<string, { text: string; bg: string; solidBg: string }> = {
  Monday:    { text: "text-blue-500",    bg: "bg-blue-500/10",    solidBg: "bg-blue-500" },
  Tuesday:   { text: "text-emerald-500", bg: "bg-emerald-500/10", solidBg: "bg-emerald-500" },
  Wednesday: { text: "text-violet-500",  bg: "bg-violet-500/10",  solidBg: "bg-violet-500" },
  Thursday:  { text: "text-amber-500",   bg: "bg-amber-500/10",   solidBg: "bg-amber-500" },
  Friday:    { text: "text-rose-500",    bg: "bg-rose-500/10",    solidBg: "bg-rose-500" },
  Saturday:  { text: "text-cyan-500",    bg: "bg-cyan-500/10",    solidBg: "bg-cyan-500" },
  Sunday:    { text: "text-orange-500",  bg: "bg-orange-500/10",  solidBg: "bg-orange-500" },
};

/* ── small RSVP button per call ────────────────────────── */
function CallRsvpButton({ callId }: { callId: string }) {
  const { currentUserRsvp } = useCallRsvps(callId);
  const upsert = useUpsertRsvp();
  const isYes = currentUserRsvp === "yes";

  return (
    <Button
      size="sm"
      variant={isYes ? "default" : "outline"}
      className={`h-7 px-3 text-[11px] font-semibold shrink-0 rounded-full transition-all ${
        isYes
          ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 shadow-sm"
          : "border-primary/30 text-primary hover:bg-primary/10"
      }`}
      disabled={upsert.isPending}
      onClick={(e) => {
        e.stopPropagation();
        upsert.mutate({ callId, status: isYes ? "no" : "yes" });
      }}
    >
      {isYes ? (
        <>
          <Check className="h-3 w-3 mr-1" /> Going
        </>
      ) : (
        "RSVP"
      )}
    </Button>
  );
}

/* ── main hero card ───────────────────────────────────── */
export function DashboardHeroCard() {
  const { user, isAdmin } = useAuth();
  const { tierId } = useUserTier();
  const { profile } = useCurrentUserProfile();
  const { earnedBadges, allBadges, loading: badgesLoading } = useAchievementBadges();
  const { currentStreak } = useLoginStreak();
  const { calls, isLoading: callsLoading } = useCalendarCalls();
  const [badgesModalOpen, setBadgesModalOpen] = useState(false);

  const now = new Date();
  const dayName = format(now, "EEEE");
  const dayNumber = format(now, "d");
  const monthYear = format(now, "MMMM yyyy");

  const upcomingCalls = useMemo(() => {
    return calls
      .filter((c) => isCallUpcomingInUserTZ(c.call_date, c.call_time, c.timezone))
      .slice(0, 3);
  }, [calls]);

  const recentBadges = earnedBadges.slice(0, 4);
  const extraBadges = earnedBadges.length - 4;

  return (
    <>
      <div className="relative rounded-2xl border border-primary/20 overflow-hidden shadow-sm bg-gradient-to-br from-primary/[0.06] via-card to-primary/[0.08]">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-primary/[0.07] blur-3xl" />
          <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-primary/[0.05] blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 rounded-full bg-primary/[0.04] blur-2xl" />
        </div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[2fr_1fr_2fr] items-stretch">
          {/* ── LEFT: Welcome + Badges ── */}
          <div className="p-4 md:p-5 flex flex-col justify-center gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
                Welcome back,{" "}
                <span className="italic text-primary">{profile?.first_name || ""}</span>!{" "}
                <span className="inline-block animate-[wave_1.8s_ease-in-out_infinite]">
                  👋
                </span>
              </h1>
            </div>

            {/* Badges row */}
            {badgesLoading ? (
              <Skeleton className="h-8 w-44" />
            ) : recentBadges.length > 0 ? (
              <TooltipProvider>
                <div
                  className="flex items-center gap-2 cursor-pointer flex-wrap"
                  onClick={() => setBadgesModalOpen(true)}
                >
                  {recentBadges.map((b) => (
                    <Tooltip key={b.id}>
                      <TooltipTrigger asChild>
                        <span className="text-2xl bg-primary/10 rounded-full px-2 py-1 hover:scale-110 hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center justify-center">
                          {b.icon_emoji}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        {b.badge_name}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                  {extraBadges > 0 && (
                    <span className="text-xs text-primary/70 font-semibold bg-primary/10 rounded-full px-2.5 py-1">
                      +{extraBadges} more
                    </span>
                  )}
                </div>
              </TooltipProvider>
            ) : (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4 text-primary/50" /> Complete tasks to earn badges
              </p>
            )}

            {/* Streak subtitle */}
            {currentStreak > 0 ? (
              <p className="text-base text-muted-foreground font-medium">
                <span className="text-lg">🔥</span> {currentStreak}-day login streak — keep it going!
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Start a streak by logging in daily
              </p>
            )}
          </div>

          {/* ── CENTER: Big Calendar Day (floating card) ── */}
          <div className="flex items-center justify-center px-3 py-2 lg:py-2">
            <div className="flex flex-col lg:min-w-[170px] rounded-xl shadow-md overflow-hidden border border-border/50">
              {/* Colored header strip */}
              <div className={`px-4 py-2 text-center ${dayColors[dayName]?.solidBg || "bg-primary"}`}>
                <p className="text-xs font-bold uppercase tracking-widest text-white">
                  {dayName}
                </p>
              </div>
              {/* Calendar body */}
              <div className="bg-card px-6 py-3 flex flex-col items-center">
                <p className="text-5xl font-extrabold text-foreground leading-none">
                  {dayNumber}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{monthYear}</p>
                <p className="text-[11px] text-muted-foreground/70 mt-2 italic text-center max-w-[180px]">
                  {dayName} — {dayTaglines[dayName] || "make it count."}
                </p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Upcoming Calls (floating card) ── */}
          <div className="p-3 md:p-4 flex flex-col justify-center">
            <div className="rounded-xl border bg-gradient-to-br from-emerald-700/5 to-emerald-700/15 p-3 flex flex-col">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-1.5 rounded-full bg-emerald-700/15">
                  <CalendarDays className="h-4 w-4 text-emerald-700" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Upcoming Calls
                </h3>
              </div>

              {callsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : upcomingCalls.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No upcoming calls
                </p>
              ) : (
                <div className="space-y-2 flex-1">
                  {upcomingCalls.map((call) => {
                  const userDate = convertToUserTimezone(
                    call.call_date,
                    call.call_time,
                    call.timezone
                  );
                  const formattedTime = formatTimeInUserTZ(
                    call.call_date,
                    call.call_time,
                    call.timezone
                  );

                  const normalizedTierIds = (call as any).visible_tier_ids
                    ? Array.isArray((call as any).visible_tier_ids)
                      ? (call as any).visible_tier_ids
                      : [(call as any).visible_tier_ids]
                    : [];
                  const hasAccess =
                    isAdmin ||
                    normalizedTierIds.length === 0 ||
                    (tierId &&
                      normalizedTierIds.some(
                        (id: string) => String(id) === String(tierId)
                      ));

                  return (
                    <div
                      key={call.id}
                      className="flex items-center gap-3 rounded-xl bg-card/80 border border-border/50 shadow-sm p-3 transition-all hover:shadow-md"
                    >
                      <div
                        className={`flex items-center justify-center h-9 w-9 rounded-full shrink-0 ${
                          hasAccess
                            ? "bg-primary/15 text-primary"
                            : "bg-amber-400/15 text-amber-500"
                        }`}
                      >
                        {hasAccess ? (
                          <CalendarDays className="h-4 w-4" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {call.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {format(userDate, "EEE, MMM d")} <span className="text-primary/40 mx-0.5">·</span> {formattedTime}
                        </p>
                      </div>
                      {hasAccess && <CallRsvpButton callId={call.id} />}
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <BadgesModal
        open={badgesModalOpen}
        onOpenChange={setBadgesModalOpen}
        earnedBadges={earnedBadges}
        allBadges={allBadges}
        totalPoints={earnedBadges.reduce((sum, b) => sum + (b.points_value || 0), 0)}
      />
    </>
  );
}
