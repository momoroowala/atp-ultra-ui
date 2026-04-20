import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserTier } from "@/hooks/useUserTier";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MobileLogoHeader } from "@/components/MobileLogoHeader";
import { Play, CheckCircle2, Map, Sparkles, Compass, Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Timeline } from "@/components/ui/timeline";
import { WelcomeVideoModal, hasWatchedWelcomeVideo } from "./WelcomeVideoModal";
import { GuidedTour } from "@/components/onboarding/GuidedTour";
import { useGuidedTour, hasTourCompleted } from "@/hooks/useGuidedTour";
import { motion } from "framer-motion";
import SpotlightBackground from "@/components/ui/spotlight-background";

interface FirstTimeDashboardProps {
  firstCourse: { id: string; title: string } | null;
  firstPhase: { id: string; title: string } | null;
  firstTaskId: string | null;
  completedTasks: number;
  totalTasks: number;
  progressPercent: number;
}

export const FirstTimeDashboard = ({
  firstCourse,
  firstTaskId,
}: FirstTimeDashboardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { tierKey } = useUserTier();
  const [videoWatched, setVideoWatched] = useState(hasWatchedWelcomeVideo);
  const [tourCompleted, setTourCompleted] = useState(hasTourCompleted);
  const prevVideoWatched = useRef(videoWatched);
  const tourState = useGuidedTour(tierKey);

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

  const handleStartModule = () => {
    if (firstCourse) {
      navigate(`/courses/${firstCourse.id}`);
    }
  };

  const handleVideoDismiss = useCallback(() => {
    setVideoWatched(true);
  }, []);

  // Auto-scroll to next step when video is completed
  useEffect(() => {
    if (videoWatched && !prevVideoWatched.current) {
      prevVideoWatched.current = true;
      setTimeout(() => {
        const step2 = document.getElementById("onboarding-step-2");
        if (step2) {
          step2.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 400);
    }
  }, [videoWatched]);

  // Update tourCompleted when tour finishes
  useEffect(() => {
    if (!tourState.isActive && hasTourCompleted() && !tourCompleted) {
      setTourCompleted(true);
      setTimeout(() => {
        const step3 = document.getElementById("onboarding-step-3");
        if (step3) {
          step3.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 600);
    }
  }, [tourState.isActive, tourCompleted]);

  const timelineData = [
    {
      title: "Step 1",
      id: "onboarding-step-1",
      content: (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`rounded-2xl border bg-card p-8 md:p-12 flex flex-col gap-6 max-w-2xl transition-all duration-500 ${
            videoWatched
              ? "border-primary/40 shadow-[0_0_24px_hsl(var(--primary)/0.15)]"
              : "border-primary/30 shadow-[0_0_16px_hsl(var(--primary)/0.1)]"
          }`}
        >
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 text-lg font-bold transition-all duration-500 ${
              videoWatched
                ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
                : "bg-primary/15 text-primary"
            }`}
          >
            {videoWatched ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8" />
            )}
          </div>
          <div className="space-y-2">
            <span className="font-bold text-2xl md:text-3xl text-foreground">Watch Welcome Video</span>
            <p className="text-base md:text-lg text-muted-foreground">Get to know how this platform works and what to expect on your journey.</p>
          </div>
          {videoWatched && (
            <Badge className="text-sm w-fit px-4 py-1 bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Completed
            </Badge>
          )}
        </motion.div>
      ),
    },
    {
      title: "Step 2",
      id: "onboarding-step-2",
      content: (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`rounded-2xl border bg-card p-8 md:p-12 flex flex-col gap-6 max-w-2xl transition-all duration-500 ${
            tourCompleted
              ? "border-primary/40 shadow-[0_0_24px_hsl(var(--primary)/0.15)]"
              : videoWatched
                ? "border-primary/30 shadow-[0_0_16px_hsl(var(--primary)/0.1)]"
                : "border-border/50 bg-card/60 opacity-50"
          }`}
        >
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
              tourCompleted
                ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
                : videoWatched
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {tourCompleted ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : (
              <Compass className="w-8 h-8" />
            )}
          </div>
          <div className="space-y-2">
            <span className="font-bold text-2xl md:text-3xl text-foreground">Quick Platform Tour</span>
            <p className="text-base md:text-lg text-muted-foreground">We'll walk you through the key features and show you around.</p>
          </div>
          {tourCompleted ? (
            <Badge className="text-sm w-fit px-4 py-1 bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Completed
            </Badge>
          ) : videoWatched ? (
            <Button
              size="lg"
              variant="outline"
              className="w-fit text-base px-8 py-3 border-primary/40 text-primary hover:bg-primary/10 shadow-[0_0_16px_hsl(var(--primary)/0.2)] hover:shadow-[0_0_24px_hsl(var(--primary)/0.4)] transition-all duration-300"
              onClick={() => {
                tourState.startTour();
              }}
            >
              <Compass className="w-5 h-5 mr-2" /> Start Tour
            </Button>
          ) : null}
        </motion.div>
      ),
    },
    {
      title: "Step 3",
      id: "onboarding-step-3",
      content: (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          data-tour="onboarding-step-3"
          className="rounded-2xl border border-primary/40 bg-card p-8 md:p-12 flex flex-col gap-6 shadow-[0_0_24px_hsl(var(--primary)/0.12)] max-w-2xl"
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 bg-primary/15 text-primary font-bold">
            <Map className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="font-bold text-2xl md:text-3xl text-foreground">Start the First Module</span>
            <p className="text-base md:text-lg text-muted-foreground">Begin your first lesson and start building real skills.</p>
          </div>
          <Button
            size="lg"
            className="w-fit text-base px-8 py-3 shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] transition-shadow duration-300"
            onClick={handleStartModule}
          >
            <Play className="w-5 h-5 mr-2" /> Start Now
          </Button>
        </motion.div>
      ),
    },
  ];

  return (
    <SpotlightBackground className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-background">
      {!videoWatched && <WelcomeVideoModal onDismiss={handleVideoDismiss} />}

      <div className="px-4 md:px-8 pt-6 pb-10 relative z-10">
        <div className="max-w-4xl mx-auto w-full space-y-6">
          <MobileLogoHeader />

          {/* Header with green gradient strip */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-3 py-8 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent rounded-3xl -mx-4" />
            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary tracking-wide uppercase">Your Journey Starts Here</span>
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                Welcome, <span className="text-primary italic">{profile?.first_name || ""}!</span>
              </h1>
              <p className="text-muted-foreground text-base md:text-lg mt-2">
                Let's get you set up in 3 simple steps.
              </p>
            </div>
          </motion.div>

          <Timeline data={timelineData} />
        </div>
      </div>

      {/* Fallback CTA for users who completed the first task but are still seeing this */}
      <div className="px-4 md:px-8 pb-10 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-6 md:p-8 shadow-[0_0_30px_hsl(var(--primary)/0.3)] animate-pulse-border"
          >
            <button
              onClick={async () => {
                if (!user) return;
                const { data: resp } = await supabase
                  .from("task_responses")
                  .select("id")
                  .eq("user_id", user.id)
                  .eq("status", "completed")
                  .limit(1)
                  .maybeSingle();
                if (resp) {
                  const now = new Date();
                  const offboarding = new Date(now);
                  offboarding.setMonth(offboarding.getMonth() + 6);
                  await supabase
                    .from("user_profiles")
                    .update({
                      onboarding_completed: true,
                      onboarding_date: now.toISOString(),
                      offboarding_date: offboarding.toISOString().slice(0, 10),
                    } as any)
                    .eq("id", user.id);
                  queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
                }
              }}
              className="w-full flex flex-col md:flex-row items-center gap-4 md:gap-6 text-left"
            >
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Rocket className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="flex-1 text-center md:text-left space-y-1">
                <h3 className="text-lg md:text-xl font-bold text-primary-foreground">
                  Already finished your first lesson?
                </h3>
                <p className="text-sm md:text-base text-primary-foreground/80">
                  Unlock your full dashboard to access all features
                </p>
              </div>
              <div className="shrink-0">
                <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary font-semibold text-sm shadow-lg hover:bg-white/90 transition-colors">
                  Unlock Dashboard →
                </span>
              </div>
            </button>
          </motion.div>
        </div>
      </div>

      <GuidedTour tourState={tourState} />
    </SpotlightBackground>
  );
};
