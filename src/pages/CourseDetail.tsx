import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCourseDetail } from "@/hooks/useCourseDetail";
import { useCourseQuizRequirements } from "@/hooks/useCourseQuizRequirements";
import { useCourseTaskProgress } from "@/hooks/useCourseTaskProgress";
import { usePhaseUnlockStatus } from "@/hooks/usePhaseUnlockStatus";
import { useQuizStatus } from "@/hooks/useQuizStatus";
import { useInlineTaskDetail } from "@/hooks/useInlineTaskDetail";
import { useAuth } from "@/hooks/useAuth";
import { useUserCourseAccess } from "@/hooks/useUserCourseAccess";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Lock, Check, Play, BookOpen, FileText, Send, Heart, StickyNote } from "lucide-react";
import { useFavoriteModules } from "@/hooks/useFavoriteModules";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { tryGraduateOnboarding } from "@/utils/onboardingGraduation";
import { PhaseAccordionSidebar } from "@/components/course/PhaseAccordionSidebar";
import { InlineLessonContent } from "@/components/course/InlineLessonContent";
import { LessonNavigation } from "@/components/course/LessonNavigation";
import { VideoRenderer } from "@/components/course/VideoRenderer";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import eecLogo from "@/assets/eec-logo.png";

/* ================================================================== */
/*  DEMO DATA: phases, tasks, and content for placeholder courses      */
/* ================================================================== */

type DemoTaskType = 'video' | 'reading' | 'form';

interface DemoTask {
  id: string;
  title: string;
  type: DemoTaskType;
  description: string;
  duration_minutes: number | null;
  points: number;
  /** Placeholder content shown in the main panel */
  content: string;
}

interface DemoPhase {
  id: string;
  title: string;
  phase_order: number;
  tasks: DemoTask[];
}

const DEMO_COURSE_DATA: Record<string, { title: string; phases: DemoPhase[] }> = {
  'demo-course-1': {
    title: 'Amazon FBA Wholesale Mastery',
    phases: [
      {
        id: 'demo-phase-1',
        title: 'Getting Started',
        phase_order: 1,
        tasks: [
          {
            id: 'demo-task-1-1',
            title: 'Welcome & Program Overview',
            type: 'video',
            description: 'Get an overview of the entire program, what you will learn, and how to get the most out of each module.',
            duration_minutes: 12,
            points: 10,
            content: 'In this introductory lesson, you will learn about the program structure, meet your instructors, and understand the roadmap ahead. We cover the key milestones you will hit and what success looks like in the wholesale FBA space.',
          },
          {
            id: 'demo-task-1-2',
            title: 'Setting Up Your Amazon Seller Account',
            type: 'video',
            description: 'Step-by-step walkthrough of creating your Professional Seller account and configuring essential settings.',
            duration_minutes: 18,
            points: 10,
            content: 'Follow along as we walk through the Amazon Seller Central registration process. We cover: choosing between Individual and Professional plans, tax interview setup, bank account linking, and initial settings you should configure on day one.',
          },
          {
            id: 'demo-task-1-3',
            title: 'Understanding Wholesale vs Other Models',
            type: 'reading',
            description: 'A deep dive into the wholesale model and how it compares to private label, arbitrage, and dropshipping.',
            duration_minutes: 8,
            points: 5,
            content: `<h3>Wholesale vs. Other Amazon Selling Models</h3>
<p>The wholesale model is distinct from other Amazon selling strategies. Here is how they compare:</p>
<ul>
  <li><strong>Wholesale:</strong> Buy directly from brands at distributor pricing, resell existing listings. Lower risk, established demand.</li>
  <li><strong>Private Label:</strong> Create your own brand and listings. Higher risk, higher potential margins, longer timeline.</li>
  <li><strong>Retail Arbitrage:</strong> Buy discounted retail products and resell. Low barrier to entry, hard to scale.</li>
  <li><strong>Online Arbitrage:</strong> Similar to retail arbitrage but sourced online. More scalable but still limited.</li>
  <li><strong>Dropshipping:</strong> List products you do not hold inventory for. Low upfront cost but thin margins and policy risks.</li>
</ul>
<p>Wholesale offers the best balance of <strong>scalability</strong>, <strong>reliability</strong>, and <strong>risk management</strong> for building a long-term Amazon business.</p>`,
          },
        ],
      },
      {
        id: 'demo-phase-2',
        title: 'Product Research',
        phase_order: 2,
        tasks: [
          {
            id: 'demo-task-2-1',
            title: 'Introduction to SmartScout',
            type: 'video',
            description: 'Learn the fundamentals of SmartScout and how to use it for product and brand research.',
            duration_minutes: 22,
            points: 10,
            content: 'SmartScout is one of the most powerful tools in a wholesale seller\'s toolkit. In this lesson, we cover the dashboard overview, brand search functionality, subcategory analysis, and how to interpret the data SmartScout gives you.',
          },
          {
            id: 'demo-task-2-2',
            title: 'Finding Profitable Brands',
            type: 'video',
            description: 'Advanced techniques for identifying brands with the right revenue, competition level, and margin potential.',
            duration_minutes: 25,
            points: 15,
            content: 'Not all brands are created equal. Learn our proprietary filtering criteria: revenue thresholds, seller count sweet spots, category analysis, and how to spot brands that are likely to approve new wholesale partners.',
          },
          {
            id: 'demo-task-2-3',
            title: 'Analyzing Competition & Buy Box',
            type: 'video',
            description: 'How to evaluate the competitive landscape and Buy Box dynamics for any product.',
            duration_minutes: 20,
            points: 15,
            content: 'The Buy Box is everything in wholesale. Learn how to analyze: number of FBA sellers, Buy Box rotation patterns, pricing history via Keepa, and how to determine if there is room for one more seller on a listing.',
          },
          {
            id: 'demo-task-2-4',
            title: 'Research Assignment',
            type: 'form',
            description: 'Put your research skills to the test. Find 5 brands that meet our criteria and submit your analysis.',
            duration_minutes: null,
            points: 25,
            content: 'Submit your first brand research analysis. Find 5 brands using the criteria from the previous lessons and explain why each one is a good wholesale opportunity.',
          },
        ],
      },
      {
        id: 'demo-phase-3',
        title: 'Brand Outreach',
        phase_order: 3,
        tasks: [
          {
            id: 'demo-task-3-1',
            title: 'Crafting Your Outreach Email',
            type: 'video',
            description: 'Learn the exact email templates and strategies that get responses from brand decision-makers.',
            duration_minutes: 15,
            points: 10,
            content: 'Your outreach email is your first impression. We break down the anatomy of a high-converting brand outreach email: subject line formulas, opening hooks, value proposition framing, and professional closings that get responses.',
          },
          {
            id: 'demo-task-3-2',
            title: 'Building Your Brand List',
            type: 'video',
            description: 'How to build a systematic pipeline of brands to contact, track, and follow up with.',
            duration_minutes: 18,
            points: 10,
            content: 'Outreach is a numbers game, but a smart numbers game. Learn how to build and organize your brand outreach pipeline using spreadsheets, CRM tools, and our follow-up cadence that maximizes response rates.',
          },
          {
            id: 'demo-task-3-3',
            title: 'First 10 Brands Challenge',
            type: 'form',
            description: 'Take action! Reach out to your first 10 brands and document your results.',
            duration_minutes: null,
            points: 30,
            content: 'It is time to take action. Reach out to at least 10 brands using the templates and strategies from this phase. Document who you contacted, their responses, and any follow-up actions.',
          },
        ],
      },
      {
        id: 'demo-phase-4',
        title: 'Purchasing & Shipping',
        phase_order: 4,
        tasks: [
          {
            id: 'demo-task-4-1',
            title: 'Creating Your First PO',
            type: 'video',
            description: 'Walk through creating your first purchase order, from product selection to order placement.',
            duration_minutes: 20,
            points: 15,
            content: 'Your first purchase order is a big milestone. We cover: evaluating MOQs (minimum order quantities), negotiating terms, understanding payment options (Net 30, credit card, wire), and how to fill out a PO correctly.',
          },
          {
            id: 'demo-task-4-2',
            title: 'Shipping & Prep Basics',
            type: 'video',
            description: 'Everything you need to know about prep centers, shipping plans, and getting inventory to Amazon.',
            duration_minutes: 22,
            points: 15,
            content: 'Getting your inventory to Amazon FBA warehouses involves several steps. Learn about: prep center selection, labeling requirements (FNSKU vs manufacturer barcode), creating shipping plans in Seller Central, and cost optimization.',
          },
          {
            id: 'demo-task-4-3',
            title: 'Launch Checklist',
            type: 'form',
            description: 'Complete your launch checklist to ensure everything is in order before your first shipment.',
            duration_minutes: null,
            points: 20,
            content: 'Before you ship your first order, make sure everything is ready. Complete this checklist covering: account setup verification, brand approval documentation, PO details, prep center coordination, and shipping plan creation.',
          },
        ],
      },
    ],
  },
  'demo-course-2': {
    title: 'Brand Outreach & Negotiation',
    phases: [
      {
        id: 'demo-c2-phase-1',
        title: 'Outreach Fundamentals',
        phase_order: 1,
        tasks: [
          {
            id: 'demo-c2-task-1-1',
            title: 'The Mindset of Outreach',
            type: 'video',
            description: 'Develop the right mindset for cold outreach to brands.',
            duration_minutes: 10,
            points: 10,
            content: 'Outreach is about building relationships, not just sending emails. Learn the mindset shift that separates successful wholesale sellers from the rest.',
          },
          {
            id: 'demo-c2-task-1-2',
            title: 'Finding Decision Makers',
            type: 'video',
            description: 'How to find the right person to contact at any brand.',
            duration_minutes: 14,
            points: 10,
            content: 'Sending your pitch to the wrong person wastes time. Learn how to use LinkedIn, company websites, and tools like Apollo to find the decision-maker at each brand.',
          },
        ],
      },
      {
        id: 'demo-c2-phase-2',
        title: 'Negotiation Tactics',
        phase_order: 2,
        tasks: [
          {
            id: 'demo-c2-task-2-1',
            title: 'Negotiation Frameworks',
            type: 'video',
            description: 'Learn the frameworks that top wholesale negotiators use.',
            duration_minutes: 20,
            points: 15,
            content: 'Great negotiations create win-win outcomes. Learn the BATNA framework, anchoring techniques, and how to structure deals that brands want to say yes to.',
          },
          {
            id: 'demo-c2-task-2-2',
            title: 'Practice Negotiation',
            type: 'form',
            description: 'Role-play a brand negotiation scenario and submit your approach.',
            duration_minutes: null,
            points: 20,
            content: 'Put your negotiation skills to the test with a realistic brand negotiation scenario.',
          },
        ],
      },
    ],
  },
};

/* Fallback for unknown demo courses */
const DEFAULT_DEMO_COURSE = {
  title: 'Demo Course',
  phases: [
    {
      id: 'demo-default-phase-1',
      title: 'Introduction',
      phase_order: 1,
      tasks: [
        {
          id: 'demo-default-task-1',
          title: 'Welcome',
          type: 'video' as DemoTaskType,
          description: 'Welcome to the course.',
          duration_minutes: 5,
          points: 10,
          content: 'This is a placeholder lesson. Real content will appear here once the course is configured.',
        },
      ],
    },
  ],
};

/* ================================================================== */
/*  Demo Inline Content Renderer                                       */
/* ================================================================== */

function LessonNotesAndFavorite({ taskId, taskTitle, courseId, courseTitle, phaseId, phaseTitle }: {
  taskId: string; taskTitle: string; courseId: string; courseTitle: string; phaseId: string; phaseTitle: string;
}) {
  const NOTES_KEY = 'lesson_notes';
  const { isFavorited, toggleFavorite } = useFavoriteModules();
  const favorited = isFavorited(taskId);
  const [note, setNote] = useState(() => {
    try { const all = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}'); return all[taskId] || ''; } catch { return ''; }
  });
  const [saved, setSaved] = useState(false);

  const saveNote = (val: string) => {
    setNote(val);
    setSaved(false);
    try {
      const all = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
      if (val.trim()) all[taskId] = val; else delete all[taskId];
      localStorage.setItem(NOTES_KEY, JSON.stringify(all));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  return (
    <div className="mt-8 space-y-4">
      {/* Heart / Favorite button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => toggleFavorite({ taskId, taskTitle, courseId, courseTitle, phaseId, phaseTitle })}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all",
            favorited
              ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
              : "border-border text-muted-foreground hover:text-red-500 hover:border-red-200"
          )}
        >
          <Heart className={cn("h-4 w-4", favorited && "fill-current")} />
          {favorited ? "Saved" : "Save Module"}
        </button>
      </div>

      {/* Notes section */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <StickyNote className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">My Notes</span>
          {saved && <Check className="h-3.5 w-3.5 text-green-500 ml-auto" />}
        </div>
        <Textarea
          value={note}
          onChange={(e) => saveNote(e.target.value)}
          placeholder="Write your notes about this lesson..."
          className="min-h-[80px] resize-y text-sm"
        />
      </div>
    </div>
  );
}

function DemoInlineContent({
  task,
  onMarkComplete,
  isCompleted,
  courseId,
  courseTitle,
}: {
  task: DemoTask | null;
  onMarkComplete: () => void;
  isCompleted: boolean;
  courseId?: string;
  courseTitle?: string;
}) {
  const [submissionText, setSubmissionText] = useState('');

  if (!task) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 min-h-[50vh]">
        <BookOpen className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm">Select a lesson to get started</p>
        <p className="text-xs text-muted-foreground/60">Choose a module on the left to begin</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 p-6 pb-12">
        {/* Video placeholder */}
        {task.type === 'video' && (
          <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 mb-6 flex flex-col items-center justify-center relative">
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 hover:bg-white/30 transition-colors cursor-pointer">
                <Play className="h-7 w-7 text-white ml-1" />
              </div>
              <span className="text-white/80 text-sm font-medium">Video: {task.title}</span>
              {task.duration_minutes && (
                <span className="text-white/50 text-xs">{task.duration_minutes} minutes</span>
              )}
            </div>
            {/* Fake progress bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
              <div className="h-full bg-primary/60 w-0" />
            </div>
          </div>
        )}

        {/* Reading icon header */}
        {task.type === 'reading' && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <span className="text-sm font-medium text-primary">Reading Material</span>
            {task.duration_minutes && (
              <span className="text-xs text-muted-foreground ml-auto">{task.duration_minutes} min read</span>
            )}
          </div>
        )}

        {/* Lesson Title */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground">{task.title}</h1>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-6">
          {task.duration_minutes && (
            <span className="inline-flex items-center gap-1 text-xs border border-border rounded-full px-2.5 py-1 text-muted-foreground">
              {task.duration_minutes} min
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs border border-border rounded-full px-2.5 py-1 text-muted-foreground">
            {task.points} pts
          </span>
        </div>

        <div className="border-t border-dashed border-border my-6" />

        {/* Description */}
        <p className="text-foreground leading-relaxed mb-6">{task.description}</p>

        {/* Content */}
        {task.type === 'reading' ? (
          <div
            className="prose prose-sm max-w-none text-foreground [&_*]:text-foreground [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-2 [&_p]:mb-3 [&_strong]:font-semibold"
            dangerouslySetInnerHTML={{ __html: task.content }}
          />
        ) : task.type === 'form' ? (
          <div className="mt-4 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Your Submission</h3>
            <textarea
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Type your response here..."
              className="w-full min-h-[200px] rounded-xl border border-border bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
            />
            <Button
              onClick={() => {
                toast.success('Submission saved (demo mode)');
                onMarkComplete();
              }}
              disabled={!submissionText.trim()}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Submit
            </Button>
          </div>
        ) : (
          <div className="bg-muted/30 rounded-xl p-5 border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3">What You'll Learn:</h3>
            <p className="text-sm text-foreground leading-relaxed">{task.content}</p>
          </div>
        )}

        {/* Notes + Favorite */}
        <LessonNotesAndFavorite
          taskId={task.id}
          taskTitle={task.title}
          courseId={courseId || ''}
          courseTitle={courseTitle || ''}
          phaseId={task.id.split('-').slice(0, 3).join('-')}
          phaseTitle=""
        />

        {/* Mark Complete */}
        {task.type !== 'form' && (
          <div className="mt-6 flex justify-center">
            {isCompleted ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/20">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Completed</span>
              </div>
            ) : (
              <Button onClick={onMarkComplete} className="gap-2">
                <Check className="h-4 w-4" />
                Mark as Complete
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Main CourseDetail Component                                        */
/* ================================================================== */

const CourseDetail = () => {
  const queryClient = useQueryClient();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, roles } = useAuth();
  const isMobile = useIsMobile();

  const isDemo = courseId?.startsWith('demo-') ?? false;

  // Staff bypass for sequential locking
  const isStaff = roles.some(r => ['admin', 'mega_admin', 'csm', 'executive'].includes(r));

  // Check how many courses user has access to
  const { userAccess: courseAccessList } = useUserCourseAccess(user?.id);
  const hasMultipleCourses = (courseAccessList?.length || 0) > 1;

  // State
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [expandedPhaseIds, setExpandedPhaseIds] = useState<Set<string>>(new Set());
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const autoCompleteRef = useRef(false);

  // Demo state: track completed tasks locally
  const [demoCompletedTasks, setDemoCompletedTasks] = useState<Set<string>>(new Set());

  /* ---- Demo data resolution ---- */
  const demoData = useMemo(() => {
    if (!isDemo || !courseId) return null;
    return DEMO_COURSE_DATA[courseId] || DEFAULT_DEMO_COURSE;
  }, [isDemo, courseId]);

  const demoAllTasks = useMemo(() => {
    if (!demoData) return [];
    const tasks: Array<{ id: string; phaseId: string; phaseOrder: number; taskOrder: number }> = [];
    demoData.phases.forEach(phase => {
      phase.tasks.forEach((task, idx) => {
        tasks.push({ id: task.id, phaseId: phase.id, phaseOrder: phase.phase_order, taskOrder: idx + 1 });
      });
    });
    return tasks.sort((a, b) => a.phaseOrder !== b.phaseOrder ? a.phaseOrder - b.phaseOrder : a.taskOrder - b.taskOrder);
  }, [demoData]);

  const demoPhases = useMemo(() => {
    if (!demoData) return [];
    return demoData.phases.map(phase => ({
      id: phase.id,
      title: phase.title,
      phase_order: phase.phase_order,
      tasks: phase.tasks.map((task, idx) => ({
        id: task.id,
        title: task.title,
        task_order: idx + 1,
        plan_group: null as string | null,
        status: demoCompletedTasks.has(task.id) ? 'completed' as const : 'not_started' as const,
        isLocked: false,
      })),
      isLocked: false,
      completedCount: phase.tasks.filter(t => demoCompletedTasks.has(t.id)).length,
      totalCount: phase.tasks.length,
    }));
  }, [demoData, demoCompletedTasks]);

  const selectedDemoTask = useMemo(() => {
    if (!demoData || !selectedTaskId) return null;
    for (const phase of demoData.phases) {
      const t = phase.tasks.find(task => task.id === selectedTaskId);
      if (t) return t;
    }
    return null;
  }, [demoData, selectedTaskId]);

  /* ---- Real data fetching (disabled for demo) ---- */
  const { data, isLoading } = useCourseDetail(isDemo ? undefined : courseId);
  const { data: quizRequirementsByPhase } = useCourseQuizRequirements(isDemo ? undefined : courseId);
  const { data: resumeProgress } = useCourseTaskProgress(isDemo ? undefined : courseId);
  const { data: inlineTaskData, isLoading: isLoadingTask } = useInlineTaskDetail(isDemo ? null : selectedTaskId);

  // Phase unlock status
  const phaseIds = useMemo(() => {
    if (isDemo) return [];
    return data?.tasksByPhase?.map((p: any) => p.phase.id) || [];
  }, [data, isDemo]);
  const { data: unlockStatusMap } = usePhaseUnlockStatus(phaseIds);

  // Fetch all tasks for all phases upfront
  const { data: allPhaseTasks } = useQuery({
    queryKey: ['all-phase-tasks', courseId, user?.id],
    queryFn: async () => {
      if (!phaseIds.length || !user) return [];
      const { data: tasksData } = await supabase.from('tasks').select('id, title, task_order, phase_id, show_in_course, plan_group').in('phase_id', phaseIds).eq('is_active', true).order('task_order');
      const visibleTasks = (tasksData || []).filter((t: any) => t.show_in_course !== false);
      const taskIds = visibleTasks.map(t => t.id);
      if (!taskIds.length) return [];
      const { data: responsesData } = await supabase.from('task_responses').select('task_id, status').in('task_id', taskIds).eq('user_id', user.id);
      return visibleTasks.map(task => ({
        ...task,
        status: responsesData?.find(r => r.task_id === task.id)?.status || 'not_started'
      }));
    },
    enabled: !isDemo && !!phaseIds.length && !!user
  });

  // Quiz status
  const allQuizIds = useMemo(() => {
    if (isDemo || !quizRequirementsByPhase) return [];
    return Object.values(quizRequirementsByPhase).flat().map((req: any) => req.quizzes?.id).filter(Boolean);
  }, [quizRequirementsByPhase, isDemo]);
  const { data: quizStatusMap } = useQuizStatus(allQuizIds);

  // Computed values
  const totalTasksCount = isDemo
    ? demoPhases.reduce((sum, p) => sum + p.totalCount, 0)
    : (data?.totalTasks || 0);
  const completedTasksCount = isDemo
    ? demoCompletedTasks.size
    : (data?.completedTasks || 0);

  // Extract video section from current task
  const videoSection = useMemo(() => {
    if (isDemo || !inlineTaskData?.sections) return null;
    return inlineTaskData.sections.find((s: any) => s.section_type === 'video') || null;
  }, [inlineTaskData, isDemo]);

  // Current task completion status
  const isCurrentTaskCompleted = isDemo
    ? (selectedTaskId ? demoCompletedTasks.has(selectedTaskId) : false)
    : inlineTaskData?.response?.status === 'completed';

  // Mark as Complete handler
  const handleMarkComplete = useCallback(async () => {
    if (!selectedTaskId || isMarkingComplete) return;

    if (isDemo) {
      setDemoCompletedTasks(prev => {
        const next = new Set(prev);
        next.add(selectedTaskId);
        return next;
      });
      toast.success('Lesson marked as complete!');
      return;
    }

    if (!user) return;
    setIsMarkingComplete(true);
    try {
      await supabase.from('task_responses').upsert(
        {
          task_id: selectedTaskId,
          user_id: user.id,
          status: 'completed',
          completed_at: new Date().toISOString(),
        } as any,
        { onConflict: 'task_id,user_id' }
      );
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      if (user) tryGraduateOnboarding(user.id, selectedTaskId, queryClient);
      queryClient.invalidateQueries({ queryKey: ['course-detail'] });
      queryClient.invalidateQueries({ queryKey: ['all-phase-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['course-task-progress'] });
      queryClient.invalidateQueries({ queryKey: ['inline-task-detail'] });
      toast.success('Lesson marked as complete!');
    } catch {
      toast.error('Failed to mark as complete');
    } finally {
      setIsMarkingComplete(false);
    }
  }, [selectedTaskId, user, isMarkingComplete, queryClient, isDemo]);

  // Auto-complete when 80% of video is watched
  const handleAutoComplete = useCallback(() => {
    if (isCurrentTaskCompleted || autoCompleteRef.current || isMarkingComplete) return;
    autoCompleteRef.current = true;
    handleMarkComplete();
  }, [isCurrentTaskCompleted, isMarkingComplete, handleMarkComplete]);

  // Reset auto-complete guard when task changes
  useEffect(() => {
    autoCompleteRef.current = false;
  }, [selectedTaskId]);

  // Build phases data for sidebar with sequential locking
  // Fall back to demo data when real course has no configured content
  const usesDemoFallback = !isDemo && data && (!data.tasksByPhase || data.tasksByPhase.length === 0);
  const effectiveIsDemo = isDemo || usesDemoFallback;

  const phases = useMemo(() => {
    if (effectiveIsDemo) return demoPhases;

    if (!data?.tasksByPhase || !unlockStatusMap || !allPhaseTasks) return [];
    const sortedPhases = data.tasksByPhase.map((phaseData: any) => {
      const phase = phaseData.phase;
      const tasks = allPhaseTasks.filter((t: any) => t.phase_id === phase.id).sort((a: any, b: any) => a.task_order - b.task_order).map((task: any) => ({
        id: task.id,
        title: task.title,
        task_order: task.task_order,
        plan_group: task.plan_group || null,
        status: task.status === 'completed' ? 'completed' as const : task.status === 'in_progress' ? 'in_progress' as const : 'not_started' as const,
        isLocked: false,
      }));
      return {
        id: phase.id,
        title: phase.title,
        phase_order: phase.phase_order,
        tasks,
        isLocked: !unlockStatusMap[phase.id],
        completedCount: tasks.filter((t: any) => t.status === 'completed').length,
        totalCount: tasks.length
      };
    }).sort((a: any, b: any) => a.phase_order - b.phase_order);

    // Apply sequential locking across all phases (clients only)
    if (!isStaff) {
      sortedPhases.forEach((phase, phaseIdx) => {
        phase.tasks.forEach((task, taskIdx) => {
          if (taskIdx > 0) {
            task.isLocked = phase.tasks[taskIdx - 1].status !== 'completed';
          } else if (phaseIdx > 0) {
            const prevPhase = sortedPhases[phaseIdx - 1];
            const lastTaskOfPrev = prevPhase.tasks[prevPhase.tasks.length - 1];
            task.isLocked = !lastTaskOfPrev || lastTaskOfPrev.status !== 'completed';
          } else {
            task.isLocked = false;
          }
        });
        // Phase is locked if its first task is locked
        if (phase.tasks.length > 0 && phase.tasks[0].isLocked) {
          phase.isLocked = true;
        }
      });
    }

    return sortedPhases;
  }, [data, unlockStatusMap, allPhaseTasks, isStaff, effectiveIsDemo, demoPhases]);

  // Get all tasks in a flat array for navigation
  const allTasks = useMemo(() => {
    if (effectiveIsDemo) return demoAllTasks;

    if (!data?.tasksByPhase || !allPhaseTasks) return [];
    const tasks: Array<{ id: string; phaseId: string; phaseOrder: number; taskOrder: number; }> = [];
    data.tasksByPhase.forEach((phaseData: any) => {
      const phaseTasks = allPhaseTasks.filter((t: any) => t.phase_id === phaseData.phase.id).map((task: any) => ({
        id: task.id,
        phaseId: phaseData.phase.id,
        phaseOrder: phaseData.phase.phase_order,
        taskOrder: task.task_order
      }));
      tasks.push(...phaseTasks);
    });
    return tasks.sort((a, b) => {
      if (a.phaseOrder !== b.phaseOrder) return a.phaseOrder - b.phaseOrder;
      return a.taskOrder - b.taskOrder;
    });
  }, [data, allPhaseTasks, isDemo, demoAllTasks]);

  // Current task index for navigation
  const currentTaskIndex = useMemo(() => {
    if (!selectedTaskId) return -1;
    return allTasks.findIndex(t => t.id === selectedTaskId);
  }, [allTasks, selectedTaskId]);
  const hasPrevious = currentTaskIndex > 0;
  const hasNext = currentTaskIndex < allTasks.length - 1 && currentTaskIndex >= 0;

  const noop = () => {};

  // Navigation handlers
  const handleTaskSelect = useCallback((taskId: string, phaseId: string) => {
    setSelectedTaskId(taskId);
    setExpandedPhaseIds(new Set([phaseId]));
  }, []);
  const handlePhaseToggle = useCallback((phaseId: string) => {
    setExpandedPhaseIds(prev =>
      prev.has(phaseId) ? new Set() : new Set([phaseId])
    );
  }, []);
  const navigateToTask = useCallback((direction: 'previous' | 'next') => {
    if (direction === 'previous' && hasPrevious) {
      const prevTask = allTasks[currentTaskIndex - 1];
      handleTaskSelect(prevTask.id, prevTask.phaseId);
    } else if (direction === 'next' && hasNext) {
      const nextTask = allTasks[currentTaskIndex + 1];
      handleTaskSelect(nextTask.id, nextTask.phaseId);
    }
  }, [allTasks, currentTaskIndex, hasPrevious, hasNext, handleTaskSelect]);

  // Auto-select first task on load (demo)
  useEffect(() => {
    if (effectiveIsDemo && demoAllTasks.length > 0 && !selectedTaskId) {
      const first = demoAllTasks.find(t => !demoCompletedTasks.has(t.id)) || demoAllTasks[0];
      setSelectedTaskId(first.id);
      setExpandedPhaseIds(new Set([first.phaseId]));
    }
  }, [effectiveIsDemo, demoAllTasks, selectedTaskId, demoCompletedTasks]);

  // Auto-select first incomplete task on load (real data)
  useEffect(() => {
    if (effectiveIsDemo) return;
    if (!data?.tasksByPhase || !allPhaseTasks?.length || selectedTaskId) return;
    const tasksWithStatus = allPhaseTasks.map((task: any) => {
      const phase = data.tasksByPhase.find((p: any) => p.phase.id === task.phase_id);
      return {
        id: task.id,
        phaseId: task.phase_id,
        phaseOrder: phase?.phase.phase_order || 0,
        taskOrder: task.task_order,
        isCompleted: task.status === 'completed'
      };
    }).sort((a: any, b: any) => {
      if (a.phaseOrder !== b.phaseOrder) return a.phaseOrder - b.phaseOrder;
      return a.taskOrder - b.taskOrder;
    });
    const firstIncomplete = tasksWithStatus.find((t: any) => !t.isCompleted);
    const targetTask = firstIncomplete || tasksWithStatus[0];
    if (targetTask) {
      setSelectedTaskId(targetTask.id);
      setExpandedPhaseIds(new Set([targetTask.phaseId]));
    }
  }, [data, allPhaseTasks, selectedTaskId, isDemo]);

  // Handle taskId deep-link
  useEffect(() => {
    if (isDemo) return;
    const deepLinkTaskId = searchParams.get('taskId');
    if (deepLinkTaskId && allPhaseTasks?.length) {
      const task = allPhaseTasks.find((t: any) => t.id === deepLinkTaskId);
      if (task) {
        setSelectedTaskId(task.id);
        setExpandedPhaseIds(new Set([task.phase_id]));
        navigate(`/courses/${courseId}`, { replace: true });
      }
    }
  }, [searchParams, allPhaseTasks, courseId, navigate, isDemo]);

  // Handle phaseId deep-link
  useEffect(() => {
    if (isDemo) return;
    const deepLinkPhaseId = searchParams.get('phaseId');
    if (deepLinkPhaseId && allPhaseTasks?.length) {
      const firstTaskInPhase = allPhaseTasks
        .filter((t: any) => t.phase_id === deepLinkPhaseId)
        .sort((a: any, b: any) => a.task_order - b.task_order)[0];
      if (firstTaskInPhase) {
        setSelectedTaskId(firstTaskInPhase.id);
        setExpandedPhaseIds(new Set([deepLinkPhaseId]));
        navigate(`/courses/${courseId}`, { replace: true });
      }
    }
  }, [searchParams, allPhaseTasks, courseId, navigate, isDemo]);

  // Handle resume query param
  useEffect(() => {
    if (isDemo) return;
    const shouldResume = searchParams.get('resume');
    if (shouldResume === '1' && resumeProgress?.phases && resumeProgress?.tasks && resumeProgress?.responses) {
      const allTasksList: Array<{
        id: string; phaseId: string; phaseOrder: number; taskOrder: number; isCompleted: boolean;
      }> = [];
      resumeProgress.phases.forEach(phase => {
        const phaseTasks = resumeProgress.tasks.filter(t => t.phase_id === phase.id);
        phaseTasks.forEach(task => {
          const response = resumeProgress.responses.find(r => r.task_id === task.id);
          allTasksList.push({
            id: task.id, phaseId: phase.id, phaseOrder: phase.phase_order,
            taskOrder: task.task_order, isCompleted: response?.status === 'completed'
          });
        });
      });
      allTasksList.sort((a, b) => {
        if (a.phaseOrder !== b.phaseOrder) return a.phaseOrder - b.phaseOrder;
        return a.taskOrder - b.taskOrder;
      });
      const firstIncomplete = allTasksList.find(t => !t.isCompleted);
      if (firstIncomplete) {
        setSelectedTaskId(firstIncomplete.id);
        setExpandedPhaseIds(new Set([firstIncomplete.phaseId]));
        navigate(`/courses/${courseId}`, { replace: true });
      }
    }
  }, [searchParams, resumeProgress, courseId, navigate, isDemo]);

  // Mark as Complete button component
  const MarkCompleteButton = () => {
    if (!selectedTaskId) return null;

    if (isCurrentTaskCompleted) {
      return (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/20">
          <Check className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Completed</span>
        </div>
      );
    }

    return (
      <Button
        onClick={handleMarkComplete}
        disabled={isMarkingComplete}
        size="sm"
        className="gap-2"
      >
        {isMarkingComplete ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Completing...
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            Mark as Complete
          </>
        )}
      </Button>
    );
  };

  // Get current demo task phase info for header
  const demoTaskPhaseInfo = useMemo(() => {
    if (!isDemo || !selectedTaskId || !demoData) return null;
    for (const phase of demoData.phases) {
      const taskIdx = phase.tasks.findIndex(t => t.id === selectedTaskId);
      if (taskIdx >= 0) {
        return {
          phaseTitle: phase.title,
          phaseOrder: phase.phase_order,
          taskOrder: taskIdx + 1,
          totalTasks: phase.tasks.length,
          taskTitle: phase.tasks[taskIdx].title,
        };
      }
    }
    return null;
  }, [isDemo, selectedTaskId, demoData]);

  /* ---- Loading state (real courses only) ---- */
  if (!isDemo && isLoading) {
    return <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <Skeleton className="h-12 w-96 mb-6" />
          <Skeleton className="h-64 w-full mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </main>;
  }

  /* ---- Access check (real courses only, staff bypass) ---- */
  if (!isDemo && !isStaff && !data?.hasAccess) {
    return <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <Button variant="ghost" onClick={() => navigate('/courses')} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Button>
          <div className="flex flex-col items-center justify-center py-12">
            <h2 className="text-2xl font-bold mb-2">Course Locked</h2>
            <p className="text-muted-foreground text-center max-w-md">
              You don't have access to this course. Please contact support to
              purchase this course or upgrade your tier.
            </p>
            <Button className="mt-6" onClick={() => navigate('/courses')}>
              Browse Available Courses
            </Button>
          </div>
        </div>
      </main>;
  }

  /* Shared title for header */
  const courseTitle = effectiveIsDemo ? (demoData?.title || data?.title || 'Course') : data?.title;
  const headerTaskTitle = isDemo
    ? (demoTaskPhaseInfo?.taskTitle || courseTitle)
    : (inlineTaskData ? inlineTaskData.title : data?.title);
  const headerSubline = isDemo
    ? (demoTaskPhaseInfo
        ? `Phase ${demoTaskPhaseInfo.phaseOrder} -- ${demoTaskPhaseInfo.phaseTitle} -- Lesson ${demoTaskPhaseInfo.taskOrder} of ${demoTaskPhaseInfo.totalTasks}`
        : null)
    : (inlineTaskData
        ? `Phase ${inlineTaskData.phase_order} -- ${inlineTaskData.phase_title} -- Lesson ${inlineTaskData.task_order} of ${inlineTaskData.total_tasks}`
        : null);

  // Mobile Layout
  if (isMobile) {
    return <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-content">
        {/* Hero Header */}
        <div className="shrink-0 px-4 pt-4 pb-2">
          <div className="flex flex-col items-center text-center space-y-3">
            <img src={eecLogo} alt="Course" className="h-14 w-14" />
            <h1 className="text-2xl font-bold text-foreground">{courseTitle}</h1>
            <div className="w-full max-w-xs space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Overall Progress</span>
                <span>{completedTasksCount}/{totalTasksCount} Complete</span>
              </div>
              <Progress value={totalTasksCount ? (completedTasksCount / totalTasksCount) * 100 : 0} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-44 px-4 pt-3">
          {/* Demo content */}
          {effectiveIsDemo && selectedTaskId && (
            <div className="bg-card rounded-xl shadow-sm overflow-hidden mb-4">
              <DemoInlineContent
                task={selectedDemoTask}
                onMarkComplete={handleMarkComplete}
                isCompleted={selectedTaskId ? demoCompletedTasks.has(selectedTaskId) : false}
                courseId={courseId || ''}
                courseTitle={courseTitle || ''}
              />
            </div>
          )}

          {/* Real video */}
          {!effectiveIsDemo && selectedTaskId && videoSection && (
            <div className="w-full max-w-3xl mx-auto bg-black rounded-xl overflow-hidden mb-4 aspect-video">
              <VideoRenderer videoSection={videoSection} className="w-full h-full" durationMinutes={inlineTaskData?.duration_minutes} onNextLesson={() => navigateToTask('next')} hasNextLesson={hasNext} onProgress80={handleAutoComplete} />
            </div>
          )}

          {/* Real inline content */}
          {!effectiveIsDemo && selectedTaskId && <div className="mt-4 bg-card rounded-xl shadow-sm overflow-hidden">
              <InlineLessonContent task={inlineTaskData || null} isLoading={isLoadingTask} isEditMode={false} onEditModeChange={noop} onStartTask={noop} onCompleteTask={noop} onRestartTask={noop} onSubmissionSuccess={noop} isStarting={false} isCompleting={false} isRestarting={false} hideVideo hideHeader contentOnly />
            </div>}

          {/* Mark as Complete button - mobile (real only) */}
          {!effectiveIsDemo && selectedTaskId && (
            <div className="flex justify-center mt-4 mb-4">
              <MarkCompleteButton />
            </div>
          )}

          <PhaseAccordionSidebar phases={phases} selectedTaskId={selectedTaskId} expandedPhaseIds={expandedPhaseIds} onTaskSelect={handleTaskSelect} onPhaseToggle={handlePhaseToggle} />
        </div>

        {/* Bottom Navigation */}
        {selectedTaskId && <div className="fixed bottom-[68px] left-0 right-0 px-4 pb-4 z-10 bg-background">
            <LessonNavigation onPrevious={() => navigateToTask('previous')} onNext={() => navigateToTask('next')} hasPrevious={hasPrevious} hasNext={hasNext} className="bg-card shadow-sm" />
          </div>}
      </main>;
  }

  // Desktop Layout
  return <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-content">
      {/* Compact Hero Header */}
      <div className="shrink-0 px-4 py-3 bg-card/30 border-b border-border">
        <div className="flex items-center gap-4">
          <img src={eecLogo} alt="Course" className="h-10 w-10 shrink-0" />

          <div className="flex flex-col min-w-0 mr-2">
            <h1 className="text-lg font-bold text-foreground truncate">
              {headerTaskTitle}
            </h1>
            {headerSubline && (
              <p className="text-xs text-muted-foreground truncate">
                {headerSubline}
              </p>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2 shrink-0 w-56">
            <Progress value={totalTasksCount ? (completedTasksCount / totalTasksCount) * 100 : 0} className="h-2" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">{completedTasksCount}/{totalTasksCount}</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex-1 flex gap-4 px-4 pb-4 pt-4 min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        <div className="shrink-0 w-72 overflow-y-auto bg-card border border-primary/30 rounded-xl p-3">
          <PhaseAccordionSidebar phases={phases} selectedTaskId={selectedTaskId} expandedPhaseIds={expandedPhaseIds} onTaskSelect={handleTaskSelect} onPhaseToggle={handlePhaseToggle} />
        </div>

        {/* Right Panel - Lesson Content with Bottom Navigation */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-card border border-primary/30 rounded-xl p-4">
            {/* Demo content */}
            {effectiveIsDemo && (
              <DemoInlineContent
                task={selectedDemoTask}
                onMarkComplete={handleMarkComplete}
                isCompleted={selectedTaskId ? demoCompletedTasks.has(selectedTaskId) : false}
                courseId={courseId || ''}
                courseTitle={courseTitle || ''}
              />
            )}

            {/* Real content */}
            {!effectiveIsDemo && (
              <>
                {selectedTaskId && videoSection && (
                  <div className="w-full max-w-3xl mx-auto bg-black rounded-xl overflow-hidden mb-4 aspect-video">
                    <VideoRenderer videoSection={videoSection} className="w-full h-full" durationMinutes={inlineTaskData?.duration_minutes} onNextLesson={() => navigateToTask('next')} hasNextLesson={hasNext} onProgress80={handleAutoComplete} />
                  </div>
                )}
                <InlineLessonContent task={inlineTaskData || null} isLoading={isLoadingTask} isEditMode={false} onEditModeChange={noop} onStartTask={noop} onCompleteTask={noop} onRestartTask={noop} onSubmissionSuccess={noop} isStarting={false} isCompleting={false} isRestarting={false} hideVideo hideHeader contentOnly />

                {/* Mark as Complete button - desktop */}
                {selectedTaskId && (
                  <div className="w-full max-w-3xl mx-auto mt-4 mb-4 flex justify-center">
                    <MarkCompleteButton />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="shrink-0 pt-4">
            <div className="bg-card rounded-xl shadow-sm p-4 border border-primary/30">
              <LessonNavigation onPrevious={() => navigateToTask('previous')} onNext={() => navigateToTask('next')} hasPrevious={hasPrevious} hasNext={hasNext} />
            </div>
          </div>
        </div>
      </div>
    </main>;
};
export default CourseDetail;
