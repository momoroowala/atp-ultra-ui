import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserTier } from '@/hooks/useUserTier';
import { usePhasesWithTasks } from '@/hooks/usePhasesWithTasks';
import { usePhaseUnlockDetails } from '@/hooks/usePhaseUnlockDetails';
import { useTaskProgress } from '@/hooks/useTaskProgress';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { OverallProgressCard } from '@/components/learning/OverallProgressCard';
import { PhaseListPanel } from '@/components/learning/PhaseListPanel';
import { PhaseDetailPanel } from '@/components/learning/PhaseDetailPanel';
import { MobilePhaseAccordion } from '@/components/learning/MobilePhaseAccordion';
import { TaskDetailView } from '@/components/learning/TaskDetailView';
import { GraduationCap, Bell, User } from 'lucide-react';

const LearningJourney = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { tier } = useUserTier();
  const { data: phases, isLoading: phasesLoading } = usePhasesWithTasks();
  const { data: phaseUnlockDetails } = usePhaseUnlockDetails(
    phases?.map(p => p.id) || []
  );
  const { data: taskProgress } = useTaskProgress();

  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(
    phases?.[0]?.id || null
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Extract unlock statuses
  const unlockedPhaseIds = Object.keys(phaseUnlockDetails || {}).filter(
    id => phaseUnlockDetails?.[id]?.isFullyUnlocked
  );

  const pendingUnlockPhaseIds = Object.keys(phaseUnlockDetails || {}).filter(
    id =>
      !phaseUnlockDetails?.[id]?.isFullyUnlocked &&
      phaseUnlockDetails?.[id]?.quizRequired
  );

  const selectedPhaseDetails = selectedPhaseId ? phaseUnlockDetails?.[selectedPhaseId] : null;

  // Calculate phase progress (completed tasks per phase)
  const phaseProgress: Record<string, number> = {};
  phases?.forEach(phase => {
    const completedInPhase = phase.tasks.filter(task =>
      taskProgress?.responses.find(
        r => r.task_id === task.id && r.status === 'completed'
      )
    ).length;
    phaseProgress[phase.id] = completedInPhase;
  });

  // Calculate task statuses
  const taskStatuses: Record<string, string> = {};
  taskProgress?.responses.forEach(response => {
    taskStatuses[response.task_id] = response.status;
  });

  // Calculate total points earned
  const totalPoints = taskProgress?.responses
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => {
      const task = phases?.flatMap(p => p.tasks).find(t => t.id === r.task_id);
      return sum + (task?.points || 0);
    }, 0) || 0;

  // Total tasks in unlocked phases
  const totalUnlockedTasks = phases
    ?.filter(p => unlockedPhaseIds.includes(p.id))
    .flatMap(p => p.tasks).length || 0;

  const selectedPhase = phases?.find(p => p.id === selectedPhaseId) || null;
  const selectedTask = phases
    ?.flatMap(p => p.tasks)
    .find(t => t.id === selectedTaskId) || null;
  const selectedTaskStatus = selectedTaskId ? taskStatuses[selectedTaskId] || 'pending' : 'pending';

  // Get user created date for unlock info
  const userCreatedAt = user?.created_at || new Date().toISOString();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (phasesLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-content">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between px-4 md:px-6 py-5 shrink-0">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-48" />
              </div>
            </div>
            <div className="flex-1 p-6">
              <div className="max-w-7xl mx-auto space-y-6">
                <Skeleton className="h-32 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Skeleton className="h-96 w-full" />
                  <Skeleton className="h-96 w-full md:col-span-2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!phases || phases.length === 0) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-content">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between px-4 md:px-6 py-5 shrink-0">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Learning Journey</h1>
                  <p className="text-sm text-muted-foreground">Your personalized path to mastery</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" title="Notifications">
                  <Bell className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center space-y-4">
                <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">No Learning Content Yet</h2>
                  <p className="text-muted-foreground">
                    Learning phases will appear here once they're added by your administrator.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-content">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 md:px-6 py-5 shrink-0">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Learning Journey</h1>
                <p className="text-sm text-muted-foreground">Your personalized path to mastery</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" title="Notifications" className="relative">
                <Bell className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Fixed Progress Card */}
            <div className="p-6 pb-0 max-w-7xl mx-auto w-full shrink-0">
              <OverallProgressCard
                phases={phases}
                unlockedPhaseIds={unlockedPhaseIds}
                completedTasks={taskProgress?.completedCount || 0}
                totalTasks={totalUnlockedTasks}
                totalPoints={totalPoints}
              />
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-hidden">
              <div className="p-6 max-w-7xl mx-auto h-full">
                {isMobile ? (
                  <div className="h-full overflow-y-auto">
                    <MobilePhaseAccordion
                      phases={phases}
                      unlockedPhaseIds={unlockedPhaseIds}
                      phaseProgress={phaseProgress}
                      taskStatuses={taskStatuses}
                      userCreatedAt={userCreatedAt}
                      onTaskClick={setSelectedTaskId}
                    />
                  </div>
                ) : (
                  <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border">
                    <ResizablePanel defaultSize={35} minSize={25}>
                      <PhaseListPanel
                        phases={phases}
                        unlockedPhaseIds={unlockedPhaseIds}
                        pendingUnlockPhaseIds={pendingUnlockPhaseIds}
                        phaseProgress={phaseProgress}
                        selectedPhaseId={selectedPhaseId}
                        onSelectPhase={setSelectedPhaseId}
                      />
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={65}>
                      <PhaseDetailPanel
                        phase={selectedPhase}
                        isUnlocked={selectedPhaseId ? unlockedPhaseIds.includes(selectedPhaseId) : false}
                        isPendingUnlock={selectedPhaseId ? pendingUnlockPhaseIds.includes(selectedPhaseId) : false}
                        quizTitle={selectedPhaseDetails?.requiredQuizTitle}
                        taskStatuses={taskStatuses}
                        userCreatedAt={userCreatedAt}
                        onTaskClick={setSelectedTaskId}
                      />
                    </ResizablePanel>
                  </ResizablePanelGroup>
                )}
              </div>
            </div>
          </div>

          <TaskDetailView
            task={selectedTask}
            currentStatus={selectedTaskStatus}
            isOpen={!!selectedTaskId}
            onClose={() => setSelectedTaskId(null)}
          />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default LearningJourney;
