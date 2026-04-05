import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { LeaderboardModal } from "@/components/home/LeaderboardModal";
import { BadgesModal } from "@/components/home/BadgesModal";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { FirstTimeDashboard } from "@/components/home/FirstTimeDashboard";
import { motion, AnimatePresence } from "framer-motion";
import { useLoginStreak } from "@/hooks/useLoginStreak";
import { useAchievementBadges } from "@/hooks/useAchievementBadges";
import { useSprintData } from "@/hooks/useSprintData";
import { useBrandLeads } from "@/hooks/useBrandLeads";
import { useUpsertRsvp, getDemoRsvpStatus } from "@/hooks/useCallRsvp";
import { useCalendarCalls } from "@/hooks/useCalendarCalls";
import { useCourses } from "@/hooks/useCourses";
import { useCourseTaskProgress } from "@/hooks/useCourseTaskProgress";
import { cn } from "@/lib/utils";
import {
  Crown,
  Trophy,
  Lock,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Mail,
  CheckCheck,
  ThumbsUp,
  ChevronRight,
  Flame,
  Target,
  Video,
  Zap,
  Play,
  Plus,
  X,
  ClipboardList,
  Shield,
} from "lucide-react";
import { useUserTier } from "@/hooks/useUserTier";
import { CalendarCallModal } from "@/components/calendar/CalendarCallModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format, isToday, isTomorrow, parseISO, nextMonday, nextWednesday } from "date-fns";

/* ------------------------------------------------------------------ */
/*  Keyframe animations                                               */
/* ------------------------------------------------------------------ */
const animationStyles = `
@keyframes fireGlow {
  0%, 100% { box-shadow: 0 0 8px rgba(251,146,60,0.4), 0 0 16px rgba(251,146,60,0.2); }
  50% { box-shadow: 0 0 16px rgba(251,146,60,0.6), 0 0 32px rgba(251,146,60,0.3); }
}
@keyframes shelfShine {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes celebrationPulse {
  0% { transform: scale(0.2); opacity: 0; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes celebrationGlow {
  0%, 100% { box-shadow: 0 0 15px rgba(234,179,8,0.4); }
  50% { box-shadow: 0 0 30px rgba(234,179,8,0.7); }
}
@keyframes celebrationShrink {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.2) translateY(60px); opacity: 0; }
}
@keyframes confettiFall {
  0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(80vh) rotate(360deg); opacity: 0; }
}
@keyframes trophyShake {
  0% { transform: scale(0.3); opacity: 0; }
  20% { transform: scale(1.2); opacity: 1; }
  30% { transform: scale(1.15) rotate(-15deg); }
  40% { transform: scale(1.15) rotate(15deg); }
  50% { transform: scale(1.1) rotate(-10deg); }
  60% { transform: scale(1.1) rotate(10deg); }
  70% { transform: scale(1.05) rotate(-5deg); }
  80% { transform: scale(1.05) rotate(5deg); }
  90% { transform: scale(1) rotate(-2deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes trophyShine {
  0% { transform: scale(0.3); opacity: 0; filter: brightness(1) drop-shadow(0 0 0px gold); }
  25% { transform: scale(1.15); opacity: 1; filter: brightness(2.5) drop-shadow(0 0 30px gold); }
  40% { transform: scale(1.05); filter: brightness(1.8) drop-shadow(0 0 20px gold); }
  55% { transform: scale(1.1); filter: brightness(2.2) drop-shadow(0 0 25px gold); }
  70% { transform: scale(1); filter: brightness(1.4) drop-shadow(0 0 10px gold); }
  100% { transform: scale(1); opacity: 1; filter: brightness(1) drop-shadow(0 0 0px gold); }
}
@keyframes trophySpin {
  0% { transform: scale(0.3) rotate3d(0,1,0,0deg); opacity: 0; }
  30% { transform: scale(1.1) rotate3d(0,1,0,180deg); opacity: 1; }
  50% { transform: scale(1.15) rotate3d(0,1,0,360deg); }
  70% { transform: scale(1) rotate3d(0,1,0,540deg); }
  100% { transform: scale(1) rotate3d(0,1,0,720deg); opacity: 1; }
}
@keyframes trophyBounce {
  0% { transform: scale(0) translateY(80px); opacity: 0; }
  20% { transform: scale(1.3) translateY(-30px); opacity: 1; }
  35% { transform: scale(0.9) translateY(10px); }
  50% { transform: scale(1.15) translateY(-15px); }
  65% { transform: scale(0.95) translateY(5px); }
  80% { transform: scale(1.05) translateY(-5px); }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
@keyframes trophySteam {
  0% { transform: scale(0.2); opacity: 0; filter: blur(8px) hue-rotate(0deg); }
  20% { transform: scale(0.8); opacity: 0.5; filter: blur(4px) hue-rotate(30deg); }
  40% { transform: scale(1.2); opacity: 1; filter: blur(0px) hue-rotate(0deg); }
  50% { transform: scale(1.1); filter: blur(0px) hue-rotate(-15deg); }
  60% { transform: scale(1.05); filter: blur(0px) hue-rotate(15deg); }
  80% { transform: scale(1); filter: blur(0px) hue-rotate(0deg); }
  100% { transform: scale(1); opacity: 1; filter: blur(0px); }
}
`;

/* ------------------------------------------------------------------ */
/*  Framer motion variants                                            */
/* ------------------------------------------------------------------ */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

/* ------------------------------------------------------------------ */
/*  Mock data                                                         */
/* ------------------------------------------------------------------ */
const MOCK_LEADERBOARD = [
  { rank: 1, first_name: "Sarah", last_name: "Chen", points: 2450, user_id: "mock-1" },
  { rank: 2, first_name: "Marcus", last_name: "Rivera", points: 2280, user_id: "mock-2" },
  { rank: 3, first_name: "Jordan", last_name: "Williams", points: 2150, user_id: "mock-3" },
  { rank: 4, first_name: "Priya", last_name: "Patel", points: 1980, user_id: "mock-4" },
  { rank: 5, first_name: "Tyler", last_name: "Brooks", points: 1820, user_id: "mock-5" },
  { rank: 6, first_name: "Aisha", last_name: "Johnson", points: 1650, user_id: "mock-6" },
  { rank: 7, first_name: "David", last_name: "Kim", points: 1520, user_id: "mock-7" },
  { rank: 8, first_name: "Emma", last_name: "Thompson", points: 1380, user_id: "mock-8" },
  { rank: 9, first_name: "Alex", last_name: "Morgan", points: 1250, user_id: "mock-9" },
  { rank: 10, first_name: "Nina", last_name: "Sato", points: 1100, user_id: "mock-10" },
  { rank: 11, first_name: "You", last_name: "", points: 980, user_id: "current-user" },
];

const MOCK_ACTIVITY = [
  { name: "Sarah C.", action: "completed Phase 3 of Wholesale Mastery", icon: "\uD83C\uDF93", time: "2m ago" },
  { name: "Marcus R.", action: "earned the Brand Hunter badge", icon: "\uD83C\uDFC6", time: "5m ago" },
  { name: "Jordan W.", action: "contacted 15 brands this week", icon: "\uD83D\uDCE7", time: "12m ago" },
  { name: "Priya P.", action: "is on a 14-day streak!", icon: "\uD83D\uDD25", time: "18m ago" },
  { name: "Tyler B.", action: "opened an account with a brand in the Pet category", icon: "\u2705", time: "25m ago" },
  { name: "Aisha J.", action: "submitted their first purchase order", icon: "\uD83D\uDCE6", time: "30m ago" },
  { name: "David K.", action: "reached #3 on the leaderboard", icon: "\uD83E\uDD49", time: "45m ago" },
  { name: "Emma T.", action: "posted in the Brand Outreach community", icon: "\uD83D\uDCAC", time: "1h ago" },
  { name: "Nina S.", action: "got approved by a brand in the Health category", icon: "\uD83C\uDFAF", time: "1.5h ago" },
  { name: "Alex M.", action: "completed 8 outreach emails today", icon: "\uD83D\uDE80", time: "2h ago" },
  { name: "Jordan W.", action: "opened an account with a brand in the Beauty category", icon: "\u2705", time: "2.5h ago" },
  { name: "Sarah C.", action: "hit 50 total brands contacted", icon: "\uD83C\uDFAF", time: "3h ago" },
];

const RANK_MEDALS: Record<number, string> = { 1: "\uD83E\uDD47", 2: "\uD83E\uDD48", 3: "\uD83E\uDD49" };

/* ------------------------------------------------------------------ */
/*  Demo event helpers                                                */
/* ------------------------------------------------------------------ */
function getTodayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

function getNextMondayStr() {
  const today = new Date();
  const day = today.getDay();
  // If today is Monday, use today; otherwise next Monday
  if (day === 1) return format(today, "yyyy-MM-dd");
  return format(nextMonday(today), "yyyy-MM-dd");
}

function getNextWednesdayStr() {
  const today = new Date();
  const day = today.getDay();
  if (day === 3) return format(today, "yyyy-MM-dd");
  return format(nextWednesday(today), "yyyy-MM-dd");
}

const DEMO_EVENTS = [
  { id: "demo-event-1", title: "Brand Outreach Call", call_date: getTodayStr(), call_time: "14:00", timezone: "America/New_York" },
  { id: "demo-event-2", title: "Mindset Monday", call_date: getNextMondayStr(), call_time: "09:00", timezone: "America/New_York" },
  { id: "demo-event-3", title: "Training Session", call_date: getNextWednesdayStr(), call_time: "11:00", timezone: "America/New_York" },
];

/* ------------------------------------------------------------------ */
/*  Celebration overlay for badge award                               */
/* ------------------------------------------------------------------ */
const TROPHY_ANIMATIONS = ['trophyShake', 'trophyShine', 'trophySpin', 'trophyBounce', 'trophySteam'];

function CelebrationOverlay({ emoji, badgeName, onComplete }: { emoji: string; badgeName?: string; onComplete: () => void }) {
  const [phase, setPhase] = useState<"grow" | "shrink">("grow");
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Pick animation based on emoji character code
  const animName = useMemo(() => TROPHY_ANIMATIONS[emoji.charCodeAt(0) % TROPHY_ANIMATIONS.length], [emoji]);

  useEffect(() => {
    const timer = setTimeout(() => setPhase("shrink"), 1800);
    const done = setTimeout(() => onCompleteRef.current(), 2200);
    return () => {
      clearTimeout(timer);
      clearTimeout(done);
    };
  }, []); // stable -- uses ref instead of callback directly

  // Generate confetti pieces (reduced from 24 to 12 for performance)
  const confetti = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        left: `${10 + Math.random() * 80}%`,
        delay: `${Math.random() * 0.2}s`,
        duration: `${0.8 + Math.random() * 0.5}s`,
        color: ["#eab308", "#22c55e", "#8b5cf6", "#ef4444", "#3b82f6", "#f97316"][i % 6],
      })),
    []
  );

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 pointer-events-none"
      style={{ willChange: "opacity" }}
    >
      {/* Confetti */}
      {confetti.map((c) => (
        <div
          key={c.id}
          className="absolute top-0 w-2.5 h-2.5 rounded-full"
          style={{
            left: c.left,
            backgroundColor: c.color,
            animation: `confettiFall ${c.duration} ${c.delay} ease-in forwards`,
            willChange: "transform, opacity",
          }}
        />
      ))}

      {/* Emoji badge + label */}
      <div className="flex flex-col items-center gap-4" style={{ perspective: '800px' }}>
        {/* Glow ring behind the emoji -- color varies by animation */}
        {phase === "grow" && (
          <div
            className="absolute rounded-full"
            style={{
              width: '180px',
              height: '180px',
              background: {
                trophyShake: 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)',
                trophyShine: 'radial-gradient(circle, rgba(234,179,8,0.4) 0%, transparent 70%)',
                trophySpin: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)',
                trophyBounce: 'radial-gradient(circle, rgba(34,197,94,0.3) 0%, transparent 70%)',
                trophySteam: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)',
              }[animName] || 'radial-gradient(circle, rgba(234,179,8,0.3) 0%, transparent 70%)',
              animation: 'celebrationGlow 0.8s ease-in-out 2',
            }}
          />
        )}
        <div
          className="relative flex items-center justify-center h-36 w-36 rounded-full"
          style={{
            animation:
              phase === "grow"
                ? `${animName} 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards`
                : "celebrationShrink 0.4s ease-in forwards",
            willChange: "transform, opacity, filter",
          }}
        >
          <span className="text-8xl drop-shadow-[0_0_25px_rgba(234,179,8,0.6)]">{emoji}</span>
        </div>
        {phase === "grow" && (
          <div className="text-center" style={{ animation: "celebrationPulse 0.4s ease-out forwards" }}>
            <p className="text-xl font-bold text-white drop-shadow-lg tracking-wide">{badgeName || "Badge Earned!"}</p>
            <p className="text-sm text-white/60 mt-1 font-medium">You just earned a new achievement</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LeaderboardSlideOut                                               */
/* ------------------------------------------------------------------ */
interface LeaderboardEntry {
  rank: number;
  first_name: string;
  last_name: string;
  points: number;
  user_id: string;
}

function LeaderboardSlideOut({
  entries,
  currentUserId,
  onViewFull,
}: {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  onViewFull: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const top3 = entries.slice(0, 3);

  return (
    <div ref={panelRef} className="fixed right-0 top-0 bottom-0 z-50 pointer-events-none">
      {/* Backdrop when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/15 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Tab handle + Panel container */}
      <div className="absolute right-0 top-[40%] -translate-y-1/2 flex items-start pointer-events-auto">
        {/* Full slide-out panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
              className="w-[300px] h-[480px] rounded-l-2xl overflow-hidden shadow-2xl border border-purple-500/30 border-r-0"
              style={{
                background: "linear-gradient(135deg, #1e1040 0%, #2d1b69 40%, #1a0e3a 100%)",
              }}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/20 bg-purple-500/5">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-purple-500/20">
                    <Crown className="h-4 w-4 text-yellow-400" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-purple-200">
                    Leaderboard
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center h-6 w-6 rounded-md hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4 text-purple-300" />
                </button>
              </div>

              {/* Entries */}
              <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5" style={{ maxHeight: "calc(480px - 96px)" }}>
                {entries.slice(0, 10).map((entry) => {
                  const isMe = entry.user_id === currentUserId || entry.user_id === "current-user";
                  const name = [entry.first_name, entry.last_name].filter(Boolean).join(" ") || "Anonymous";
                  const medal = RANK_MEDALS[entry.rank];

                  return (
                    <div
                      key={entry.user_id}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2.5 py-1.5 transition-colors",
                        isMe
                          ? "bg-primary/15 border border-primary/30"
                          : "hover:bg-white/5"
                      )}
                    >
                      <span className="w-7 shrink-0 text-center">
                        {medal ? (
                          <span className="text-base">{medal}</span>
                        ) : (
                          <span className="text-xs font-mono text-slate-400">#{entry.rank}</span>
                        )}
                      </span>
                      <span
                        className={cn(
                          "text-xs tracking-tight truncate flex-1",
                          isMe ? "font-bold text-white" : "text-slate-300"
                        )}
                      >
                        {name}
                      </span>
                      <span
                        className={cn(
                          "text-[11px] font-mono shrink-0 tabular-nums",
                          isMe ? "font-bold text-primary" : "text-slate-400"
                        )}
                      >
                        {entry.points.toLocaleString()}
                      </span>
                    </div>
                  );
                })}

                {/* Current user if not in top 10 */}
                {entries.length > 10 && (
                  <>
                    <div className="flex items-center justify-center py-1">
                      <div className="flex gap-0.5">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="w-1 h-1 rounded-full bg-slate-500" />
                        ))}
                      </div>
                    </div>
                    {entries
                      .filter((e) => e.user_id === "current-user" || e.user_id === currentUserId)
                      .filter((e) => e.rank > 10)
                      .map((entry) => (
                        <div
                          key={entry.user_id}
                          className="flex items-center gap-2 rounded-md px-2.5 py-1.5 bg-primary/15 border border-primary/30"
                        >
                          <span className="w-7 shrink-0 text-center">
                            <span className="text-[10px] font-mono text-primary font-bold">#{entry.rank}</span>
                          </span>
                          <span className="text-xs tracking-tight truncate flex-1 font-bold text-white flex items-center gap-1">
                            {entry.first_name || "You"}
                            <span className="text-[9px] font-bold text-primary bg-primary/20 px-1 py-0.5 rounded-full">
                              You
                            </span>
                          </span>
                          <span className="text-[11px] font-mono font-bold text-primary shrink-0 tabular-nums">
                            {entry.points.toLocaleString()}
                          </span>
                        </div>
                      ))}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-3 py-2 border-t border-purple-500/20 bg-purple-500/5">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onViewFull();
                  }}
                  className="w-full flex items-center justify-center gap-1 hover:opacity-80 transition-opacity"
                >
                  <span className="text-xs text-purple-300 font-medium">View Full Leaderboard</span>
                  <ChevronRight className="h-3 w-3 text-purple-300" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab handle (always visible on right edge) */}
        <div
          className="relative cursor-pointer select-none"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <div
            className={cn(
              "flex flex-col items-center gap-1.5 px-1.5 py-4 rounded-l-xl border border-r-0 transition-all duration-200 shadow-lg",
              isOpen
                ? "border-purple-500/40 bg-purple-900/90"
                : "border-purple-500/30 bg-gradient-to-b from-[#2d1b69] to-[#1a0e3a] hover:from-[#3a2480] hover:to-[#231054]"
            )}
            style={{ writingMode: "vertical-rl" }}
          >
            <Crown className="h-4 w-4 text-yellow-400 rotate-90" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-200">
              Leaderboard
            </span>
          </div>

          {/* Hover preview: top 3 */}
          <AnimatePresence>
            {isHovering && !isOpen && (
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-full top-1/2 -translate-y-1/2 mr-2 w-[180px] rounded-xl border border-purple-500/30 shadow-xl overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #1e1040 0%, #2d1b69 40%, #1a0e3a 100%)",
                }}
              >
                <div className="px-3 py-2 border-b border-purple-500/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">Top 3</span>
                </div>
                <div className="px-2 py-1.5 space-y-0.5">
                  {top3.map((entry) => {
                    const medal = RANK_MEDALS[entry.rank];
                    const name = [entry.first_name, entry.last_name?.[0]].filter(Boolean).join(" ");
                    return (
                      <div key={entry.user_id} className="flex items-center gap-1.5 py-0.5">
                        <span className="text-sm shrink-0">{medal || `#${entry.rank}`}</span>
                        <span className="text-[11px] text-slate-300 truncate flex-1">
                          {name || "Anonymous"}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 tabular-nums shrink-0">
                          {entry.points.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="px-3 py-1.5 border-t border-purple-500/20 text-center">
                  <span className="text-[9px] text-purple-400">Click to expand</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  HOME PAGE                                                         */
/* ================================================================== */
const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isCSM, isExecutive } = useRoleCheck();
  const isStaff = isAdmin || isCSM || isExecutive;

  const onboarding = useOnboardingStatus();
  const { currentStreak } = useLoginStreak();
  const { tierKey, tierName } = useUserTier();
  const {
    allBadges,
    earnedBadges,
    lockedBadges,
    totalPoints,
    loading: badgesLoading,
  } = useAchievementBadges();
  const {
    phases,
    tasks: sprintTasks,
    completions,
    isLoading: sprintLoading,
    cycleStatus,
    getPhaseCompletedCount,
    getPhaseTaskCount,
    getTasksForPhase,
    totalCompleted: sprintCompleted,
    totalTasks: sprintTotal,
  } = useSprintData();
  const { leads, isLoading: leadsLoading } = useBrandLeads();
  const { calls, isLoading: callsLoading } = useCalendarCalls();
  const rsvpMutation = useUpsertRsvp();
  const { data: courses, isLoading: coursesLoading } = useCourses();

  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [badgesModalOpen, setBadgesModalOpen] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [selectedCallForModal, setSelectedCallForModal] = useState<any>(null);
  const [activityIndex, setActivityIndex] = useState(0);
  const [awardDialogOpen, setAwardDialogOpen] = useState(false);
  const [celebrationEmoji, setCelebrationEmoji] = useState<string | null>(null);
  const [celebrationBadgeName, setCelebrationBadgeName] = useState<string | null>(null);

  // Demo awarded badges from localStorage
  const [demoAwardedBadges, setDemoAwardedBadges] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("demo_awarded_badges") || "[]");
    } catch {
      return [];
    }
  });

  // Event format preference (A = ticker, B = cards, C = mini calendar)
  const [eventFormat, setEventFormat] = useState<"A" | "B" | "C">(() => {
    return (localStorage.getItem("dashboard_event_format") as "A" | "B" | "C") || "C";
  });

  const handleEventFormatChange = useCallback((fmt: "A" | "B" | "C") => {
    setEventFormat(fmt);
    localStorage.setItem("dashboard_event_format", fmt);
  }, []);

  // Daily actions tracker
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const [dailyActions, setDailyActions] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(`daily_actions_${todayKey}`) || "{}");
    } catch {
      return {};
    }
  });

  const toggleDailyAction = useCallback((actionId: string) => {
    setDailyActions((prev) => {
      const updated = { ...prev, [actionId]: !prev[actionId] };
      localStorage.setItem(`daily_actions_${todayKey}`, JSON.stringify(updated));
      return updated;
    });
  }, [todayKey]);

  // Activity ticker auto-cycle (shifts the 4-item window by 1 every 4s)
  useEffect(() => {
    const interval = setInterval(() => {
      setActivityIndex((prev) => (prev + 1) % MOCK_ACTIVITY.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Visible activity items (4-item sliding window)
  const visibleActivities = useMemo(() => {
    const items = [];
    for (let i = 0; i < 4; i++) {
      items.push(MOCK_ACTIVITY[(activityIndex + i) % MOCK_ACTIVITY.length]);
    }
    return items;
  }, [activityIndex]);

  // Profile query
  const { data: profile } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("first_name")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Leaderboard rank
  const { data: leaderboardEntry } = useQuery({
    queryKey: ["home-leaderboard-rank", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("leaderboard_cache")
        .select("rank")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Leaderboard preview (top entries)
  const { data: leaderboardPreview } = useQuery({
    queryKey: ["leaderboard-preview-home", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("leaderboard_cache")
        .select("user_id, rank, total_points")
        .order("rank", { ascending: true })
        .limit(50);
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = data.map((e) => e.user_id);
      const { data: profiles, error: pErr } = await supabase
        .from("user_profiles")
        .select("id, first_name, last_name, roles!inner(role_key)")
        .in("id", userIds);
      if (pErr) throw pErr;

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      return data
        .map((e) => {
          const p = profileMap.get(e.user_id);
          const roleKey = p?.roles ? (p.roles as any).role_key : null;
          return {
            ...e,
            first_name: p?.first_name ?? null,
            last_name: p?.last_name ?? null,
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
        }))
        .slice(0, 10);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Determine leaderboard entries (real or mock)
  const leaderboardEntries = useMemo(() => {
    if (leaderboardPreview && leaderboardPreview.length > 0) {
      return leaderboardPreview.map((e) => ({
        rank: e.rank,
        first_name: e.first_name ?? "",
        last_name: e.last_name ?? "",
        points: e.total_points,
        user_id: e.user_id,
      }));
    }
    return MOCK_LEADERBOARD;
  }, [leaderboardPreview]);

  // Course progress for bottom banner
  const firstCourse = courses?.filter((c) => c.hasAccess)?.[0];
  const { data: courseProgress } = useCourseTaskProgress(firstCourse?.id);
  const coursePercent = useMemo(() => {
    if (!courseProgress) return 0;
    const total = courseProgress.totalTasks || 0;
    const completed = courseProgress.completedTasks || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [courseProgress]);

  // Current sprint phase (first incomplete phase)
  const currentPhase = useMemo(() => {
    if (!phases.length) return null;
    for (const phase of phases) {
      const total = getPhaseTaskCount(phase.id);
      const done = getPhaseCompletedCount(phase.id);
      if (done < total) return phase;
    }
    return phases[phases.length - 1];
  }, [phases, completions, sprintTasks]);

  const currentPhaseTasks = currentPhase ? getTasksForPhase(currentPhase.id) : [];
  const sprintPercent = sprintTotal > 0 ? Math.round((sprintCompleted / sprintTotal) * 100) : 0;

  // Brand leads stats (this week)
  const brandStats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeek = leads.filter((l) => new Date(l.created_at) >= weekAgo);
    const contacted = thisWeek.filter(
      (l) => l.status === "Email Sent" || l.status === "2 Email Sent" || l.status === "Phone Call"
    ).length;
    const followUps = leads.filter((l) => l.status === "Email Sent").length;
    const approved = leads.filter((l) => l.status === "Approved").length;
    return { contacted, followUps, approved, total: leads.length };
  }, [leads]);

  // Upcoming events (real or demo)
  const upcomingCalls = useMemo(() => {
    const now = new Date();
    const realCalls = calls
      .filter((c) => {
        const callDate = parseISO(c.call_date);
        return callDate >= new Date(now.toDateString());
      })
      .slice(0, 3);
    if (realCalls.length > 0) return realCalls;
    // Use demo events as fallback
    return DEMO_EVENTS as any[];
  }, [calls]);

  // Badge award handler
  const handleAwardBadge = useCallback(
    (badge: { id: string; badge_key: string; icon_emoji: string; badge_name?: string }) => {
      setCelebrationEmoji(badge.icon_emoji || "\uD83C\uDFC6");
      setCelebrationBadgeName(badge.badge_name || null);
      const updated = [...demoAwardedBadges, badge.badge_key];
      setDemoAwardedBadges(updated);
      localStorage.setItem("demo_awarded_badges", JSON.stringify(updated));
      setAwardDialogOpen(false);
    },
    [demoAwardedBadges]
  );

  // Remove a demo-awarded badge
  const handleRemoveDemoBadge = useCallback(
    (badgeKey: string) => {
      const updated = demoAwardedBadges.filter((bk) => bk !== badgeKey);
      setDemoAwardedBadges(updated);
      localStorage.setItem("demo_awarded_badges", JSON.stringify(updated));
    },
    [demoAwardedBadges]
  );

  /* ---------------------------------------------------------------- */
  /*  LOADING & ONBOARDING STATES                                     */
  /* ---------------------------------------------------------------- */
  if (onboarding.isLoading) {
    return (
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-content p-6">
        <div className="max-w-6xl mx-auto w-full space-y-4">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (onboarding.isOnboarding) {
    return (
      <FirstTimeDashboard
        firstCourse={onboarding.firstCourse}
        firstPhase={onboarding.firstPhase}
        firstTaskId={onboarding.firstTaskId}
        completedTasks={onboarding.completedTasks}
        totalTasks={onboarding.totalTasks}
        progressPercent={onboarding.progressPercent}
      />
    );
  }


  /* ================================================================ */
  /*  MAIN DASHBOARD RENDER                                           */
  /* ================================================================ */
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-content">
      <style>{animationStyles}</style>

      {/* Celebration overlay */}
      {celebrationEmoji && (
        <CelebrationOverlay
          emoji={celebrationEmoji}
          badgeName={celebrationBadgeName || undefined}
          onComplete={() => {
            setCelebrationEmoji(null);
            setCelebrationBadgeName(null);
          }}
        />
      )}

      <motion.div
        className="max-w-[95%] mx-auto w-full px-2 md:px-3 py-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ============================================================ */}
        {/*  MAIN CONTENT (full width)                                  */}
        {/* ============================================================ */}
        <div className="space-y-4">
            {/* -------------------------------------------------------- */}
            {/*  1. TOP BAR: Badges + Streak + Greeting + Activity       */}
            {/* -------------------------------------------------------- */}
            <motion.div variants={itemVariants}>
              {(() => {
                const tierStyles: Record<string, { bg: string; border: string; text: string; label: string }> = {
                  platinum: { bg: 'bg-gradient-to-r from-slate-300/30 via-gray-200/25 to-slate-400/30 dark:from-slate-500/30 dark:via-slate-400/20 dark:to-slate-500/30', border: 'border-slate-400/50 dark:border-slate-400/40', text: 'text-slate-700 dark:text-slate-200', label: 'Platinum' },
                  diamond: { bg: 'bg-gradient-to-r from-cyan-200/30 via-sky-100/25 to-blue-200/30 dark:from-cyan-700/30 dark:via-blue-700/25 dark:to-cyan-700/30', border: 'border-cyan-400/50 dark:border-cyan-500/40', text: 'text-cyan-700 dark:text-cyan-200', label: 'Diamond' },
                  ultimate: { bg: 'bg-gradient-to-r from-amber-200/30 via-yellow-100/25 to-amber-300/30 dark:from-amber-700/30 dark:via-yellow-700/25 dark:to-amber-700/30', border: 'border-amber-500/50 dark:border-amber-500/40', text: 'text-amber-700 dark:text-amber-200', label: 'Ultimate' },
                  elite: { bg: 'bg-gradient-to-r from-violet-200/30 via-purple-100/25 to-violet-300/30 dark:from-violet-700/30 dark:via-purple-700/25 dark:to-violet-700/30', border: 'border-violet-500/50 dark:border-violet-500/40', text: 'text-violet-700 dark:text-violet-200', label: 'Elite' },
                  stb: { bg: 'bg-gradient-to-r from-emerald-200/30 via-green-100/25 to-emerald-300/30 dark:from-emerald-700/30 dark:via-green-700/25 dark:to-emerald-700/30', border: 'border-emerald-500/50 dark:border-emerald-500/40', text: 'text-emerald-700 dark:text-emerald-200', label: 'STB' },
                };
                const ts = tierStyles[tierKey || ''] || tierStyles.platinum;
                const displayTierName = tierName || ts.label;

                return (
              <div className={cn("rounded-xl border overflow-hidden", ts.bg, ts.border)}>
                {/* Badges row inside banner, at the top */}
                <TooltipProvider delayDuration={200}>
                  <div className="flex items-center gap-1 px-4 pt-2.5 pb-1 overflow-x-auto overflow-y-visible scrollbar-hide">
                    {earnedBadges.slice(0, 10).map((badge) => (
                      <Tooltip key={badge.user_badge_id}>
                        <TooltipTrigger asChild>
                          <motion.div whileHover={{ scale: 1.15, y: -2 }} className="relative flex items-center justify-center h-8 w-8 shrink-0 cursor-pointer" onClick={() => setBadgesModalOpen(true)}>
                            <div className="absolute inset-0 rounded-md bg-gradient-to-b from-yellow-300/30 via-amber-400/20 to-yellow-600/30 border border-yellow-500/40" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                            <span className="relative text-base drop-shadow-sm">{badge.icon_emoji || "\uD83C\uDFC6"}</span>
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="z-[9999] bg-popover border shadow-lg" sideOffset={4}><p className="text-[10px] font-semibold">{badge.badge_name}</p></TooltipContent>
                      </Tooltip>
                    ))}
                    {demoAwardedBadges.filter((bk) => !earnedBadges.some((eb) => eb.badge_key === bk)).map((bk) => {
                      const badge = allBadges.find((b) => b.badge_key === bk);
                      if (!badge) return null;
                      return (
                        <Tooltip key={`demo-${bk}`}>
                          <TooltipTrigger asChild>
                            <motion.div whileHover={{ scale: 1.15, y: -2 }} className="relative group flex items-center justify-center h-8 w-8 shrink-0 cursor-pointer" onClick={() => setBadgesModalOpen(true)}>
                              <div className="absolute inset-0 rounded-md bg-gradient-to-b from-emerald-300/30 via-green-400/20 to-emerald-600/30 border border-emerald-500/40" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                              <span className="relative text-base drop-shadow-sm">{badge.icon_emoji || "\uD83C\uDFC6"}</span>
                              <button onClick={(e) => { e.stopPropagation(); handleRemoveDemoBadge(bk); }} className="absolute -top-0.5 -right-0.5 hidden group-hover:flex items-center justify-center h-3 w-3 rounded-full bg-red-500 text-white z-10"><X className="h-2 w-2" /></button>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="z-[9999] bg-popover border shadow-lg" sideOffset={4}><p className="text-[10px] font-semibold">{badge.badge_name}</p></TooltipContent>
                        </Tooltip>
                      );
                    })}
                    {lockedBadges.filter((b) => !demoAwardedBadges.includes(b.badge_key)).slice(0, Math.max(0, 5 - earnedBadges.length - demoAwardedBadges.length)).map((badge) => (
                      <Tooltip key={badge.id}>
                        <TooltipTrigger asChild>
                          <div className="relative flex items-center justify-center h-8 w-8 shrink-0 opacity-25">
                            <div className="absolute inset-0 rounded-md bg-muted/60 border border-border/40" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                            <Lock className="relative h-2 w-2 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="z-[9999] bg-popover border shadow-lg" sideOffset={4}><p className="text-[10px] text-muted-foreground">{badge.badge_name}</p></TooltipContent>
                      </Tooltip>
                    ))}
                    {isStaff && (
                      <button onClick={() => setAwardDialogOpen(true)} className="flex items-center justify-center h-5 w-5 rounded-full border border-dashed border-primary/30 hover:border-primary hover:bg-primary/10 transition-all shrink-0 ml-0.5">
                        <Plus className="h-2.5 w-2.5 text-primary" />
                      </button>
                    )}
                  </div>
                </TooltipProvider>

                {/* Main bar: three balanced columns */}
                <div className="flex items-center justify-evenly gap-4 px-5 pb-5 pt-3">

                {/* LEFT: Fire streak + Greeting */}
                <div className="flex items-center gap-4">
                  {currentStreak > 0 ? (
                    <div
                      className="relative inline-flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-orange-400/20 to-amber-500/10 border-2 border-orange-400/30 shrink-0"
                      style={{ animation: "fireGlow 2s ease-in-out infinite" }}
                    >
                      <span className="text-3xl leading-none">{"\uD83D\uDD25"}</span>
                      <span className="absolute -bottom-1 text-xs font-extrabold text-orange-500 dark:text-orange-400 bg-background/80 rounded-full px-2 py-0.5">
                        {currentStreak}
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-muted/50 border border-border/40 shrink-0">
                      <Flame className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-bold text-foreground leading-tight">
                      Welcome back, {profile?.first_name || "there"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentStreak > 0
                        ? `${currentStreak}-day streak! Keep it going.`
                        : "Start a streak by logging in daily."}
                    </p>
                  </div>
                </div>

                {/* CENTER: Date + nudge in calendar card */}
                <div className="hidden md:flex flex-col items-center shrink-0">
                  <div className="rounded-xl border border-border/40 bg-card/60 shadow-sm overflow-hidden min-w-[220px]">
                    {/* Red top strip like a real calendar */}
                    <div className="h-2 bg-gradient-to-r from-red-500 to-red-400" />
                    <div className="px-5 py-3 flex flex-col items-center gap-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {format(new Date(), "EEEE")}
                      </p>
                      <p className="text-3xl font-extrabold text-foreground leading-none">
                        {format(new Date(), "d")}
                      </p>
                      <p className="text-sm font-semibold text-foreground/80">
                        {format(new Date(), "MMMM yyyy")}
                      </p>
                    </div>
                    <div className="px-4 pb-3 pt-0">
                      <p className="text-xs text-muted-foreground italic text-center">
                    {(() => {
                      const dow = new Date().getDay();
                      const nudges: Record<number, string[]> = {
                        0: ["Prep your brand list for tomorrow.", "Sunday planning = Monday results.", "Get your week mapped out tonight."],
                        1: ["Monday -- take action, set the pace.", "Start of the week. Send those emails.", "5 brands today. That's the goal."],
                        2: ["Follow up on yesterday's outreach.", "Did they open your email? Check and resend.", "Momentum builds on Tuesdays."],
                        3: ["Have you called any brands this week?", "Midweek -- check your pipeline.", "Pick up the phone. Emails aren't enough."],
                        4: ["Remember those follow-ups from Monday.", "Thursday -- close what you started.", "One more PO before the weekend."],
                        5: ["Wrap the week. What landed?", "Log your wins before you sign off.", "Friday review: what's pending?"],
                        6: ["Get ahead while others rest.", "Nice job working on the weekend.", "Saturday prep = Monday advantage."],
                      };
                      const options = nudges[dow] || nudges[1];
                      return options[new Date().getDate() % options.length];
                    })()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Activity feed -- fills remaining space */}
                <div className="hidden md:flex flex-col gap-1.5 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm px-4 py-3 overflow-hidden max-w-[380px]">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Live Activity</span>
                  </div>
                  <AnimatePresence mode="popLayout">
                    {visibleActivities.map((activity, i) => (
                      <motion.div
                        key={activity.name + activity.action}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        className="flex items-center gap-2.5 min-w-0 py-1"
                      >
                        <div className="flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-[10px] font-bold shrink-0">
                          {activity.name.split(" ").map((n: string) => n[0]).join("")}
                        </div>
                        <p className="text-xs text-foreground truncate flex-1">
                          <span className="font-semibold">{activity.name}</span>{" "}
                          <span className="text-muted-foreground">{activity.action}</span>
                        </p>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {activity.time}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
              </div>
                );
              })()}
            </motion.div>

            {/* -------------------------------------------------------- */}
            {/*  2. Calendar week strip                                  */}
            {/* -------------------------------------------------------- */}
            {/* Thin calendar week strip + upcoming events */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center gap-3">
                {/* Day letter headers + day cells -- inline thin strip */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-0">
                    {Array.from({ length: 7 }, (_, i) => {
                      const today = new Date();
                      const monday = new Date(today);
                      monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
                      const day = new Date(monday);
                      day.setDate(monday.getDate() + i);
                      const dayLetter = ["M","T","W","T","F","S","S"][i];
                      const dayNum = format(day, "d");
                      const dayStr = format(day, "yyyy-MM-dd");
                      const hasEvent = upcomingCalls.some((c: any) => c.call_date === dayStr);
                      const isCurrent = isToday(day);
                      const isPast = day < new Date(new Date().toDateString());
                      return (
                        <div
                          key={i}
                          className={cn(
                            "flex flex-col items-center flex-1 py-1 border-r border-border/15 last:border-r-0",
                            isCurrent ? "bg-primary/8" : isPast ? "opacity-40" : ""
                          )}
                        >
                          <span className="text-[8px] font-semibold text-muted-foreground/50 uppercase">{dayLetter}</span>
                          <span className={cn(
                            "text-[11px] font-bold leading-none mt-0.5",
                            isCurrent ? "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px]" : "text-foreground"
                          )}>{dayNum}</span>
                          {hasEvent && (
                            <div className={cn("h-1 w-1 rounded-full mt-0.5", isCurrent ? "bg-primary" : "bg-cyan-500")} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Upcoming events with RSVP */}
                <div className="flex items-center gap-2 shrink-0">
                  {upcomingCalls.slice(0, 3).map((call: any) => {
                    const callDate = parseISO(call.call_date);
                    const dateLabel = isToday(callDate) ? "Today" : isTomorrow(callDate) ? "Tomorrow" : format(callDate, "EEE, MMM d");
                    const timeLabel = call.call_time?.slice(0, 5) || "";
                    const rsvpStatus = user?.id ? getDemoRsvpStatus(call.id, user.id) : null;
                    const isLive = isToday(callDate) && (() => {
                      if (!call.call_time) return false;
                      const [h, m] = call.call_time.split(":").map(Number);
                      const start = new Date(callDate); start.setHours(h, m, 0, 0);
                      return Date.now() >= start.getTime() - 1800000 && Date.now() <= start.getTime() + 7200000;
                    })();

                    return (
                      <div
                        key={call.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/30 bg-card/60 hover:border-primary/30 transition-colors cursor-pointer shrink-0"
                        onClick={() => {
                          setSelectedCallForModal(call);
                          setShowCallModal(true);
                        }}
                      >
                        <div className={cn(
                          "flex items-center justify-center h-7 w-7 rounded-md shrink-0",
                          isLive ? "bg-emerald-500/15" : "bg-cyan-500/10"
                        )}>
                          {isLive ? <Play className="h-3.5 w-3.5 text-emerald-500" /> : <Video className="h-3.5 w-3.5 text-cyan-500" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate max-w-[120px]">{call.title}</p>
                          <p className="text-[10px] text-muted-foreground">{dateLabel} {timeLabel}</p>
                        </div>
                        {isLive ? (
                          <Button size="sm" className="shrink-0 h-6 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-md" onClick={(e) => { e.stopPropagation(); window.open(call.call_link || '#', '_blank'); }}>
                            Join
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant={rsvpStatus === "yes" ? "default" : "outline"}
                            className={cn("shrink-0 h-6 px-2 text-[10px] rounded-md", rsvpStatus !== "yes" && "border-cyan-500/30 text-cyan-600 dark:text-cyan-400")}
                            onClick={(e) => { e.stopPropagation(); rsvpMutation.mutate({ callId: call.id, status: rsvpStatus === "yes" ? "no" : "yes" }); }}
                            disabled={rsvpMutation.isPending}
                          >
                            {rsvpStatus === "yes" ? "RSVP'd" : "RSVP"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* -------------------------------------------------------- */}
            {/*  AMAZON REVENUE SNAPSHOT                                 */}
            {/* -------------------------------------------------------- */}
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* LEFT: Live Inventory */}
                <div className="rounded-xl border border-border/50 bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live Inventory</h3>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { name: 'NaturePaws Calming Chews', qty: 142, price: 24.99, trend: 'up' },
                      { name: 'FreshHome Bamboo Set', qty: 87, price: 34.99, trend: 'up' },
                      { name: 'PureVita Vitamin D3', qty: 203, price: 18.99, trend: 'down' },
                      { name: 'KidsBright STEM Kit', qty: 56, price: 29.99, trend: 'up' },
                      { name: 'GreenLeaf Protein Bars', qty: 318, price: 21.99, trend: 'flat' },
                    ].map((item) => (
                      <div key={item.name} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-bold text-foreground">${item.price}</span>
                          <span className={cn(
                            "text-[10px] font-semibold tabular-nums w-10 text-right",
                            item.qty < 100 ? "text-amber-600" : "text-muted-foreground"
                          )}>
                            {item.qty} u
                          </span>
                          <span className="text-[10px]">
                            {item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RIGHT: Sales Last 30 Days */}
                <div className="rounded-xl border border-border/50 bg-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sales - Last 30 Days</h3>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-bold text-foreground">$12,847</span>
                      <span className="text-[10px] font-semibold text-emerald-600">+18%</span>
                    </div>
                  </div>
                  <div className="h-[130px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { day: '6', sales: 320 }, { day: '7', sales: 410 }, { day: '8', sales: 380 },
                        { day: '9', sales: 290 }, { day: '10', sales: 450 }, { day: '11', sales: 520 },
                        { day: '12', sales: 390 }, { day: '13', sales: 480 }, { day: '14', sales: 350 },
                        { day: '15', sales: 410 }, { day: '16', sales: 530 }, { day: '17', sales: 470 },
                        { day: '18', sales: 310 }, { day: '19', sales: 420 }, { day: '20', sales: 560 },
                        { day: '21', sales: 490 }, { day: '22', sales: 380 }, { day: '23', sales: 440 },
                        { day: '24', sales: 510 }, { day: '25', sales: 470 }, { day: '26', sales: 390 },
                        { day: '27', sales: 580 }, { day: '28', sales: 520 }, { day: '29', sales: 460 },
                        { day: '30', sales: 430 }, { day: '31', sales: 550 }, { day: '1', sales: 490 },
                        { day: '2', sales: 610 }, { day: '3', sales: 540 }, { day: '4', sales: 470 },
                      ]} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                        <XAxis
                          dataKey="day"
                          tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                          tickLine={false}
                          axisLine={false}
                          interval={4}
                        />
                        <YAxis
                          tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `$${v}`}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '11px',
                            padding: '6px 10px',
                          }}
                          formatter={(value: number) => [`$${value}`, 'Sales']}
                          labelFormatter={(label) => `Day ${label}`}
                        />
                        <Bar dataKey="sales" fill="#f97316" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* -------------------------------------------------------- */}
            {/*  4. TWO-COLUMN GRID: Progress (L) + Daily Actions (R)    */}
            {/* -------------------------------------------------------- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* LEFT: Your Progress (merged Action Plan + Continue Course) */}
              <motion.div variants={itemVariants}>
                <div className="relative rounded-2xl border-2 border-primary/30 bg-card overflow-hidden shadow-lg h-full flex flex-col">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-emerald-400 to-primary" />

                  <div className="p-5 space-y-4 flex-1 flex flex-col">
                    {/* Course progress (top of merged panel) */}
                    {firstCourse && (
                      <div className="rounded-xl border border-border/50 bg-muted/20 p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/15 shrink-0">
                            <BookOpen className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{firstCourse.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[180px]">
                                <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${coursePercent}%` }} />
                              </div>
                              <span className="text-[10px] font-bold text-muted-foreground">{coursePercent}%</span>
                            </div>
                          </div>
                          <Button size="sm" className="shrink-0" onClick={() => navigate(`/courses/${firstCourse.id}`)}>
                            Continue
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Sprint action plan header */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/15">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-foreground">Your Progress</h2>
                          {currentPhase && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {currentPhase.title} &mdash; Days {currentPhase.day_start}-{currentPhase.day_end}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Progress ring */}
                      <div className="relative flex items-center justify-center h-14 w-14 shrink-0">
                        <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                          <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/30" />
                          <circle
                            cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 24}
                            strokeDashoffset={2 * Math.PI * 24 * (1 - sprintPercent / 100)}
                            className="text-primary transition-all duration-700"
                          />
                        </svg>
                        <span className="absolute text-xs font-bold text-foreground">{sprintPercent}%</span>
                      </div>
                    </div>

                    {/* Task checklist */}
                    <div className="flex-1 min-h-0">
                      {sprintLoading ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-10 w-full rounded-lg" />
                          ))}
                        </div>
                      ) : currentPhaseTasks.length > 0 ? (
                        <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                          {currentPhaseTasks.map((task) => {
                            const status = completions.get(task.id);
                            const isCompleted = status === "completed";
                            const isPending = status === "pending";

                            return (
                              <div
                                key={task.id}
                                className={cn(
                                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors group",
                                  isCompleted
                                    ? "bg-primary/5 opacity-70"
                                    : isPending
                                    ? "bg-amber-500/5 border border-amber-500/20"
                                    : "bg-muted/30 hover:bg-muted/50"
                                )}
                              >
                                <button onClick={() => cycleStatus(task.id)} className="shrink-0 transition-transform hover:scale-110">
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                  ) : isPending ? (
                                    <Clock className="h-5 w-5 text-amber-500" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <span
                                    className={cn(
                                      "text-sm font-medium block truncate",
                                      isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                                    )}
                                  >
                                    <span className="text-xs text-muted-foreground mr-1.5">Day {task.day_number}</span>
                                    {task.title}
                                  </span>
                                </div>
                                {task.modules.length > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate("/my-plan");
                                    }}
                                    className="shrink-0 text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Module
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-sm text-muted-foreground">
                            No sprint tasks configured yet. Visit{" "}
                            <button onClick={() => navigate("/my-plan")} className="text-primary hover:underline font-medium">
                              My Plan
                            </button>{" "}
                            to get started.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Phase progress bar */}
                    {currentPhase && currentPhaseTasks.length > 0 && (
                      <div className="flex items-center gap-3 pt-1">
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${
                                getPhaseTaskCount(currentPhase.id) > 0
                                  ? Math.round(
                                      (getPhaseCompletedCount(currentPhase.id) / getPhaseTaskCount(currentPhase.id)) * 100
                                    )
                                  : 0
                              }%`,
                            }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                        <span className="text-xs font-bold text-muted-foreground shrink-0">
                          {getPhaseCompletedCount(currentPhase.id)}/{getPhaseTaskCount(currentPhase.id)} tasks
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* RIGHT: Daily Actions */}
              <motion.div variants={itemVariants}>
                <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-lg h-full flex flex-col">
                  <div className="px-5 py-4 border-b border-border/40 bg-gradient-to-r from-violet-500/10 via-violet-500/5 to-transparent">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-violet-500/15">
                          <ClipboardList className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-foreground">Daily Actions</h2>
                          <p className="text-[10px] text-muted-foreground">
                            {Object.values(dailyActions).filter(Boolean).length}/5 done today
                          </p>
                        </div>
                      </div>
                      {Object.values(dailyActions).filter(Boolean).length === 5 && (
                        <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                          Great work today!
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-4 flex-1">
                    {/* Daily checklist */}
                    <div className="space-y-1.5">
                      {[
                        { id: "outreach_emails", label: "Send 5 brand outreach emails", icon: Mail },
                        { id: "review_listings", label: "Review 3 product listings on SmartScout", icon: Target },
                        { id: "check_shipping", label: "Check shipping status", icon: CheckCheck },
                        { id: "course_module", label: "Complete today's course module", icon: BookOpen },
                        { id: "post_community", label: "Post in community", icon: Zap },
                      ].map((action) => {
                        const isDone = !!dailyActions[action.id];
                        return (
                          <div
                            key={action.id}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors cursor-pointer group",
                              isDone ? "bg-emerald-500/5 opacity-70" : "bg-muted/30 hover:bg-muted/50"
                            )}
                            onClick={() => toggleDailyAction(action.id)}
                          >
                            <div className="shrink-0 transition-transform hover:scale-110">
                              {isDone ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                              )}
                            </div>
                            <action.icon className={cn("h-3.5 w-3.5 shrink-0", isDone ? "text-emerald-500/60" : "text-muted-foreground")} />
                            <span className={cn(
                              "text-sm font-medium",
                              isDone ? "line-through text-muted-foreground" : "text-foreground"
                            )}>
                              {action.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Brand outreach stats (compact row) */}
                    <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="h-3 w-3 text-blue-500" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Brand Outreach This Week</span>
                      </div>
                      {leadsLoading ? (
                        <Skeleton className="h-10 w-full rounded-lg" />
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-2 py-1.5 text-center">
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400 block">{brandStats.contacted}</span>
                            <span className="text-[9px] text-muted-foreground font-medium uppercase">Contacted</span>
                          </div>
                          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 text-center">
                            <span className="text-lg font-bold text-amber-600 dark:text-amber-400 block">{brandStats.followUps}</span>
                            <span className="text-[9px] text-muted-foreground font-medium uppercase">Follow-ups</span>
                          </div>
                          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1.5 text-center">
                            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 block">{brandStats.approved}</span>
                            <span className="text-[9px] text-muted-foreground font-medium uppercase">Approved</span>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] text-muted-foreground">{brandStats.total} total brands tracked</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                          onClick={() => navigate("/brand-leads")}
                        >
                          View All <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

      {/* ============================================================ */}
      {/*  SLIDE-OUT LEADERBOARD (fixed right edge)                    */}
      {/* ============================================================ */}
      <LeaderboardSlideOut
        entries={leaderboardEntries}
        currentUserId={user?.id}
        onViewFull={() => setLeaderboardOpen(true)}
      />

      {/* Modals */}
      <LeaderboardModal open={leaderboardOpen} onOpenChange={setLeaderboardOpen} />

      {/* Call detail modal from dashboard events */}
      {showCallModal && selectedCallForModal && (
        <CalendarCallModal
          open={showCallModal}
          onOpenChange={setShowCallModal}
          call={selectedCallForModal}
          isAdmin={isStaff}
          userTierId={tierKey}
          upsellUrl={null}
          onEdit={() => { setShowCallModal(false); navigate('/calendar'); }}
        />
      )}
      <BadgesModal
        open={badgesModalOpen}
        onOpenChange={setBadgesModalOpen}
        earnedBadges={earnedBadges}
        allBadges={allBadges}
        totalPoints={totalPoints}
      />

      {/* Admin Badge Award Dialog */}
      <Dialog open={awardDialogOpen} onOpenChange={setAwardDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Award a Badge
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 pt-2">
            {allBadges.map((badge) => {
              const isAlreadyAwarded = demoAwardedBadges.includes(badge.badge_key) || earnedBadges.some((eb) => eb.badge_key === badge.badge_key);
              return (
                <button
                  key={badge.id}
                  disabled={isAlreadyAwarded}
                  onClick={() => handleAwardBadge(badge)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-3 text-left transition-all",
                    isAlreadyAwarded
                      ? "border-border/30 bg-muted/30 opacity-50 cursor-not-allowed"
                      : "border-border/50 bg-card hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                  )}
                >
                  <span className="text-2xl shrink-0">{badge.icon_emoji || "\uD83C\uDFC6"}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{badge.badge_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{badge.description || badge.category}</p>
                    {isAlreadyAwarded && (
                      <p className="text-[9px] text-primary font-medium">Already awarded</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;
