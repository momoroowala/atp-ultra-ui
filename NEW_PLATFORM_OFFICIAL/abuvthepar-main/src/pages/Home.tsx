import { useAuth } from "@/hooks/useAuth";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { Skeleton } from "@/components/ui/skeleton";
import { FirstTimeDashboard } from "@/components/home/FirstTimeDashboard";
import { DashboardHeroCard } from "@/components/home/DashboardHeroCard";
import { CourseProgressComboCard } from "@/components/home/CourseProgressComboCard";
import { DailyActionsCard } from "@/components/home/DailyActionsCard";
import { LeaderboardSidePanel } from "@/components/home/LeaderboardSidePanel";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const Home = () => {
  const { user } = useAuth();
  const onboarding = useOnboardingStatus();
  const { isClient } = useRoleCheck();

  if (onboarding.isLoading) {
    return (
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-content p-6">
        <div className="max-w-6xl mx-auto w-full space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
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

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-content">
      <motion.div
        className="max-w-[95%] mx-auto w-full px-2 md:px-3 py-4 space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Card */}
        <motion.div variants={itemVariants}>
          <DashboardHeroCard />
        </motion.div>

        {isClient ? (
          /* Clients: full-width course progress */
          <motion.div variants={itemVariants}>
            <CourseProgressComboCard />
          </motion.div>
        ) : (
          /* Staff: 2-column grid with daily actions */
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
            <motion.div variants={itemVariants}>
              <CourseProgressComboCard />
            </motion.div>
            <motion.div variants={itemVariants}>
              <DailyActionsCard />
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* Fixed leaderboard side panel */}
      <LeaderboardSidePanel />
    </div>
  );
};

export default Home;
