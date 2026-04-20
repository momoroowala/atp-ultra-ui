import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { useTasksWithSections } from '@/hooks/useTasksWithSections';
import { useTaskDueDates } from '@/hooks/useTaskDueDates';
import { useUserTier } from '@/hooks/useUserTier';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePhaseUnlockStatus } from '@/hooks/usePhaseUnlockStatus';
import { usePhaseQuizRequirements } from '@/hooks/usePhaseQuizRequirements';
import { useQuizQuestions } from '@/hooks/useQuizQuestions';
import { useQuizSubmissions } from '@/hooks/useQuizSubmissions';
import { useUpcomingQuizzes } from '@/hooks/useUpcomingQuizzes';

import { PhasesSidebar } from '@/components/my-tasks/PhasesSidebar';
import { TasksPanel } from '@/components/my-tasks/TasksPanel';
import { OverallProgressCard } from '@/components/my-tasks/OverallProgressCard';
import { MobilePhaseCard } from '@/components/my-tasks/MobilePhaseCard';
import { PageSkeleton } from '@/components/my-tasks/PageSkeleton';
import { QuizNotificationModal } from '@/components/quiz/QuizNotificationModal';
import { QuizTakingView } from '@/components/quiz/QuizTakingView';
import { getTaskStatus } from '@/utils/taskStatusHelper';
import { evaluateVisibility } from '@/utils/taskVisibilityEvaluator';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LAYOUT } from '@/constants/myTasksLayout';
import { useToast } from '@/hooks/use-toast';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

export default function MyTasks() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { tier } = useUserTier();
  const { data, isLoading } = useTasksWithSections();
  const { calculateTaskDueDate } = useTaskDueDates();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  // Get phase unlock status using the proper RPC function
  const allPhaseIds = useMemo(() => {
    if (!data?.tasks) return [];
    const phaseIds = new Set(data.tasks.map(t => t.phases?.id).filter(Boolean));
    return Array.from(phaseIds) as string[];
  }, [data?.tasks]);
  
  const { data: phaseUnlockStatus } = usePhaseUnlockStatus(allPhaseIds);
  
  // Fetch quiz requirements for all phases
  const { requirements: allQuizRequirements } = usePhaseQuizRequirements();
  
  // Fetch upcoming quizzes (correctly filtered with dependencies)
  const { data: upcomingQuizzes } = useUpcomingQuizzes();
  
  // Create a map of phase_id -> quiz requirement
  const phaseQuizMap = useMemo(() => {
    const map = new Map();
    allQuizRequirements?.forEach(req => {
      if (req.is_required && req.quizzes) {
        map.set(req.phase_id, req);
      }
    });
    return map;
  }, [allQuizRequirements]);
  
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedQuizReq, setSelectedQuizReq] = useState<any | null>(null);
  const [showQuizIntro, setShowQuizIntro] = useState(false);
  const [takingQuiz, setTakingQuiz] = useState(false);
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const tasksPanelScrollRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolled = useRef(false);

  // Quiz hooks
  const selectedQuizId = selectedQuizReq?.quiz_id ?? null;
  const { questions: quizQuestions } = useQuizQuestions(selectedQuizId);
  const { submitQuiz } = useQuizSubmissions(selectedQuizId);


  // Process tasks with status and due dates
  const processedTasks = useMemo(() => {
    if (!data?.tasks) return [];

    return data.tasks.map((task) => {
      // Check tier visibility
      const tierVisible = !task.visible_tiers?.length || 
        task.visible_tiers.includes('all') || 
        (tier && task.visible_tiers.includes(tier));

      // Check visibility conditions
      const conditionVisible = evaluateVisibility(
        task.visibility_conditions as any,
        (data.allSubmissions || []) as any,
        (data.allFormFields || []) as any
      );

      // Calculate due date
      const dueInfo = calculateTaskDueDate(task);

      // Determine if task is locked (phase not unlocked or not visible)
      const isLocked = !tierVisible || !conditionVisible;

      // Get task status
      const status = getTaskStatus(task.response, dueInfo, isLocked);

      return {
        ...task,
        dueInfo,
        status,
        isVisible: tierVisible && conditionVisible,
      };
    }).filter((task) => task.isVisible);
  }, [data, tier, calculateTaskDueDate]);

  // Calculate phase unlock dates and status using proper unlock logic
  const phasesWithProgress = useMemo(() => {
    const phaseMap = new Map();
    processedTasks.forEach((task) => {
      if (task.phases) {
        const phaseId = task.phases.id;
        if (!phaseMap.has(phaseId)) {
          // Use the unlock status from the RPC function
          const isUnlocked = phaseUnlockStatus?.[phaseId] ?? false;
          const isLocked = !isUnlocked;
          
          let unlockDate: Date | undefined;
          // Calculate unlock date for display purposes (time-based only)
          if (task.phases.unlock_type === 'time' && task.phases.unlock_condition) {
            const condition = task.phases.unlock_condition as any;
            if (condition.delay_days) {
              const userCreatedAt = new Date(user?.created_at || new Date());
              unlockDate = new Date(userCreatedAt);
              unlockDate.setDate(unlockDate.getDate() + condition.delay_days);
            }
          }

          phaseMap.set(phaseId, {
            ...task.phases,
            completedTasks: 0,
            totalTasks: 0,
            isLocked,
            unlockDate,
          });
        }
        const phase = phaseMap.get(phaseId);
        phase.totalTasks++;
        if (task.status === 'completed') {
          phase.completedTasks++;
        }
      }
    });
    return Array.from(phaseMap.values()).sort((a, b) => a.phase_order - b.phase_order);
  }, [processedTasks, user, phaseUnlockStatus]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const completed = processedTasks.filter(t => t.status === 'completed').length;
    const total = processedTasks.length;
    return { completed, total };
  }, [processedTasks]);

  // Calculate the current phase (first phase with incomplete tasks)
  const currentPhaseId = useMemo(() => {
    if (phasesWithProgress.length === 0) return null;
    
    // Find first phase with incomplete tasks
    const phaseWithIncompleteTasks = phasesWithProgress.find(
      phase => phase.completedTasks < phase.totalTasks
    );
    
    // Default to the first phase if all are complete or none found
    return phaseWithIncompleteTasks?.id || phasesWithProgress[phasesWithProgress.length - 1]?.id;
  }, [phasesWithProgress]);

  // Calculate the first incomplete task in the current phase
  const firstIncompleteTaskId = useMemo(() => {
    if (!currentPhaseId) return null;
    
    const phaseTasks = processedTasks.filter(t => t.phases?.id === currentPhaseId);
    const incompleteTask = phaseTasks.find(t => t.status !== 'completed');
    
    return incompleteTask?.id || null;
  }, [currentPhaseId, processedTasks]);

  // Set initial selected phase and expanded phase to current phase
  useEffect(() => {
    if (!selectedPhaseId && currentPhaseId) {
      setSelectedPhaseId(currentPhaseId);
      if (isMobile) {
        setExpandedPhaseId(currentPhaseId);
      }
    }
  }, [currentPhaseId, selectedPhaseId, isMobile]);

  // Auto-scroll to task if scrollTo parameter exists
  useEffect(() => {
    const scrollToTaskId = searchParams.get('scrollTo');
    if (scrollToTaskId) {
      setTimeout(() => {
        const taskElement = document.getElementById(`task-${scrollToTaskId}`);
        if (taskElement) {
          taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          taskElement.classList.add('task-highlight');
          setTimeout(() => {
            taskElement.classList.remove('task-highlight');
          }, 3000);
        }
      }, 500);
    }
  }, [searchParams]);

  // Auto-scroll to first incomplete task on initial load
  useEffect(() => {
    if (hasAutoScrolled.current || !firstIncompleteTaskId || !selectedPhaseId) return;
    
    // Only auto-scroll if there's no scrollTo parameter (to avoid conflicts)
    const scrollToTaskId = searchParams.get('scrollTo');
    if (scrollToTaskId) return;

    hasAutoScrolled.current = true;
    
    setTimeout(() => {
      if (isMobile) {
        // Mobile: scroll to the phase containing the incomplete task
        const phaseElement = document.getElementById(`phase-${selectedPhaseId}`);
        if (phaseElement) {
          phaseElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Expand the phase to show tasks
          setExpandedPhaseId(selectedPhaseId);
        }
      } else {
        // Desktop: scroll within the tasks panel
        const taskElement = document.getElementById(`task-${firstIncompleteTaskId}`);
        const scrollContainer = tasksPanelScrollRef.current;
        
        if (taskElement && scrollContainer) {
          const scrollViewport = scrollContainer.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
          if (scrollViewport) {
            const containerRect = scrollViewport.getBoundingClientRect();
            const elementRect = taskElement.getBoundingClientRect();
            const scrollTop = scrollViewport.scrollTop;
            const targetScroll = scrollTop + elementRect.top - containerRect.top - 20;
            
            scrollViewport.scrollTo({ top: targetScroll, behavior: 'smooth' });
          }
        }
      }
    }, 800);
  }, [firstIncompleteTaskId, selectedPhaseId, searchParams, isMobile]);

  // Get tasks for selected phase
  const selectedPhaseTasks = useMemo(() => {
    if (!selectedPhaseId) return [];
    return processedTasks.filter((task) => task.phases?.id === selectedPhaseId);
  }, [processedTasks, selectedPhaseId]);

  // Get selected phase info
  const selectedPhase = useMemo(() => {
    return phasesWithProgress.find((p) => p.id === selectedPhaseId);
  }, [phasesWithProgress, selectedPhaseId]);

  const handleStartTask = (taskId: string) => {
    navigate(`/courses/${taskId}`);
  };

  const handleTaskClick = (taskId: string) => {
    navigate(`/courses/${taskId}`);
  };

  const handleRestartTask = (taskId: string) => {
    navigate(`/courses/${taskId}?action=restart`);
  };

  const handleWatchVideos = () => {
    const firstVideoTask = selectedPhaseTasks.find(
      (t: any) => t.sections?.some((s: any) => s.section_type === 'video') || t.task_type === 'video'
    );
    if (firstVideoTask) {
      navigate(`/courses/${firstVideoTask.id}`);
    }
  };

  const handleTogglePhase = (phaseId: string) => {
    setExpandedPhaseId(prevId => prevId === phaseId ? null : phaseId);
  };

  // Check if a quiz for a given phase is accessible
  const isQuizAccessible = (phaseId: string): boolean => {
    const quizReq = phaseQuizMap.get(phaseId);
    if (!quizReq) return false;
    
    // Check if this quiz is in the upcoming quizzes list (which enforces dependencies)
    const isUpcoming = upcomingQuizzes?.some(q => q.id === quizReq.quiz_id) ?? false;
    return isUpcoming;
  };

  const handleStartQuizDirectly = (req: any) => {
    if (!req) return;
    
    // Find which phase this quiz belongs to
    const phaseId = Array.from(phaseQuizMap.entries())
      .find(([_, value]) => value.quiz_id === req.quiz_id)?.[0];
    
    if (!phaseId || !isQuizAccessible(phaseId)) {
      toast({
        title: "Quiz Locked",
        description: "You must complete the previous phase exam first.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedQuizReq(req);
    setTakingQuiz(true);
  };

  const handleSubmitQuiz = async (answers: Record<string, string>) => {
    if (!selectedQuizId || !quizQuestions) return;
    
    await submitQuiz.mutateAsync({
      quizId: selectedQuizId,
      answers,
      questions: quizQuestions,
    });
    
    setTakingQuiz(false);
    setSelectedQuizReq(null);
  };

  const handleCancelQuiz = () => {
    setTakingQuiz(false);
    setShowQuizIntro(true);
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-content overflow-hidden">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Fixed Header */}
          <header className="shrink-0 bg-card/50 backdrop-blur-sm border-b border-border/40 z-40">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/home')}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Courses</h1>
                    <p className="text-sm text-muted-foreground">Your learning journey</p>
                  </div>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  {overallProgress.completed}/{overallProgress.total} Complete
                </Badge>
              </div>
            </div>
          </header>

          {/* Main Content Area - No scrolling here */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div ref={contentAreaRef} className="container mx-auto px-6 py-6 flex-1 flex flex-col gap-6 overflow-hidden">
              {/* Fixed Progress Card */}
              <div className="shrink-0">
                <OverallProgressCard
                  completedCount={overallProgress.completed}
                  totalTasks={overallProgress.total}
                />
              </div>

              {/* Tasks Layout - This takes remaining space */}
              {isMobile ? (
                <div className="flex-1 overflow-y-auto">
                  <div className="space-y-6">
                    {phasesWithProgress.map((phase) => {
                      const phaseTasks = processedTasks.filter(t => t.phases?.id === phase.id);
                      return (
                        <MobilePhaseCard
                          key={phase.id}
                          phase={phase}
                          tasks={phaseTasks}
                          isLocked={phase.isLocked || false}
                          unlockDate={phase.unlockDate}
                          isExpanded={expandedPhaseId === phase.id}
                          onToggle={() => handleTogglePhase(phase.id)}
                          onTaskClick={handleTaskClick}
                          onStartTask={handleStartTask}
                          onRestartTask={handleRestartTask}
                          quizRequirement={phaseQuizMap.get(phase.id)}
                          quizAccessible={isQuizAccessible(phase.id)}
                          onStartQuiz={() => handleStartQuizDirectly(phaseQuizMap.get(phase.id))}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <ResizablePanelGroup 
                  direction="horizontal" 
                  className="flex-1 rounded-lg border bg-card"
                >
                  <ResizablePanel 
                    defaultSize={LAYOUT.LEFT_PANEL_DEFAULT} 
                    minSize={LAYOUT.LEFT_PANEL_MIN} 
                    maxSize={LAYOUT.LEFT_PANEL_MAX} 
                    className="min-w-[260px]"
                  >
                    <PhasesSidebar
                      phases={phasesWithProgress}
                      selectedPhaseId={selectedPhaseId}
                      onSelectPhase={setSelectedPhaseId}
                      quizRequirements={phaseQuizMap}
                    />
                  </ResizablePanel>

                  <ResizableHandle withHandle />

                  <ResizablePanel 
                    defaultSize={LAYOUT.RIGHT_PANEL_DEFAULT} 
                    minSize={LAYOUT.RIGHT_PANEL_MIN} 
                    className="min-w-0"
                  >
                    {selectedPhase ? (
                      <TasksPanel
                        ref={tasksPanelScrollRef}
                        phaseTitle={selectedPhase.title}
                        phaseDescription={selectedPhase.description}
                        phaseOrder={selectedPhase.phase_order}
                        tasks={selectedPhaseTasks}
                        completedCount={selectedPhase.completedTasks}
                        onTaskClick={handleTaskClick}
                        onStartTask={handleStartTask}
                        onRestartTask={handleRestartTask}
                        onWatchVideos={handleWatchVideos}
                        hasVideos={selectedPhaseTasks.some(t => t.task_type === 'video')}
                        isLocked={selectedPhase.isLocked}
                        unlockDate={selectedPhase.unlockDate}
                        quizRequirement={phaseQuizMap.get(selectedPhase.id)}
                        quizAccessible={isQuizAccessible(selectedPhase.id)}
                        onStartQuiz={() => handleStartQuizDirectly(phaseQuizMap.get(selectedPhase.id))}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        Select a phase to view tasks
                      </div>
                    )}
                  </ResizablePanel>
                </ResizablePanelGroup>
              )}
            </div>
          </div>

          {/* AI Profit Assistant Chat Drawer - HIDDEN FOR NOW */}
          {/* Backdrop */}
          {/* <div 
            className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-500 ${
              drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            style={{ marginLeft: isMobile ? '0px' : 'var(--sidebar-width, 0px)' }}
            onClick={() => setDrawerOpen(false)}
          /> */}

          {/* Drawer Container - HIDDEN FOR NOW */}
          {/* <div 
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col transition-transform duration-500 ease-out"
            style={{ 
              marginLeft: isMobile ? '0px' : 'var(--sidebar-width, 0px)',
              height: '85vh',
              transform: drawerOpen ? 'translateY(0)' : 'translateY(calc(85vh - 52px))'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="bg-primary hover:bg-primary/90 text-primary-foreground border-t border-border cursor-pointer transition-colors duration-300 rounded-t-xl shrink-0"
              onClick={() => setDrawerOpen(!drawerOpen)}
              style={{ height: '52px' }}
            >
              <div className="container mx-auto px-6 py-3 flex items-center justify-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <span className="font-semibold">Chat with AI Profit Assistant</span>
                {drawerOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </div>
            </div>

            <div className="flex-1 overflow-hidden bg-background">
              <iframe
                src="https://delphi.ai/embeddable/config/14286f2b-ed61-4f2f-969c-ad0589c6de1e"
                allow="camera *; microphone *"
                className="w-full h-full border-none"
                title="AI Profit Assistant Chat"
              />
            </div>
          </div> */}
        </div>

        {/* Quiz Modals */}
        {selectedQuizReq && selectedQuizReq.quizzes && (
          <>
            <QuizNotificationModal
              open={showQuizIntro}
              onClose={() => setShowQuizIntro(false)}
              onStartQuiz={() => setTakingQuiz(true)}
              quiz={selectedQuizReq.quizzes}
              questionCount={quizQuestions?.length || 0}
            />
            
            {takingQuiz && quizQuestions && quizQuestions.length > 0 && (
              <div className="fixed inset-0 bg-background z-50 overflow-auto">
                <QuizTakingView
                  quiz={selectedQuizReq.quizzes}
                  questions={quizQuestions}
                  onSubmit={handleSubmitQuiz}
                  onCancel={handleCancelQuiz}
                />
              </div>
            )}
          </>
        )}
      </div>
    </SidebarProvider>
  );
}
