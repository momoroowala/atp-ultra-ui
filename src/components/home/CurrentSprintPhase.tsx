import { useState } from 'react';
import { useSprintData } from '@/hooks/useSprintData';
import { useSprintModuleLookup } from '@/hooks/useSprintModuleLookup';
import { ChecklistTask } from '@/components/sprint/ChecklistTask';
import { SprintTaskDetailDrawer } from '@/components/sprint/SprintTaskDetailDrawer';
import { Rocket, ArrowRight, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { SprintTask } from '@/hooks/useSprintData';

const MAX_VISIBLE_TASKS = 5;

export const CurrentSprintPhase = () => {
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState<SprintTask | null>(null);
  const [showAll, setShowAll] = useState(false);
  const {
    phases, completions, isLoading, toggleCompletion,
    getPhaseTaskCount, getPhaseCompletedCount, getTasksForPhase,
  } = useSprintData();
  const { getModuleLink } = useSprintModuleLookup();

  if (isLoading || phases.length === 0) return null;

  const activePhase = phases.find((phase) => {
    return getPhaseCompletedCount(phase.id) < getPhaseTaskCount(phase.id);
  });

  if (!activePhase) {
    return (
      <div className="p-4 rounded-lg border bg-card text-center space-y-1">
        <PartyPopper className="h-6 w-6 text-primary mx-auto" />
        <p className="font-semibold text-sm">Sprint Complete! 🎉</p>
        <p className="text-xs text-muted-foreground">You've finished all 30 days.</p>
      </div>
    );
  }

  const phaseTasks = getTasksForPhase(activePhase.id);
  const total = getPhaseTaskCount(activePhase.id);
  const done = getPhaseCompletedCount(activePhase.id);
  const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;
  const visibleTasks = showAll ? phaseTasks : phaseTasks.slice(0, MAX_VISIBLE_TASKS);
  const hasMore = phaseTasks.length > MAX_VISIBLE_TASKS;

  return (
    <>
      <div className="rounded-xl border border-primary/30 bg-card overflow-hidden shadow-[0_0_16px_rgba(85,189,138,0.1)]">
        {/* Gradient header */}
        <div className="px-3 py-2.5 bg-gradient-to-r from-primary/35 via-primary/15 to-transparent">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/30">
                <Rocket className="h-3.5 w-3.5 text-primary" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {activePhase.title}
              </h3>
            </div>
            <button
              onClick={() => navigate('/my-plan')}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Full Sprint <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500 relative overflow-hidden"
                style={{ 
                  width: `${progressPercent}%`,
                  background: 'radial-gradient(160.59% 161.46% at 50% 0%, hsl(var(--primary)) 0%, #6EDAA6 100%)',
                }}
              >
              </div>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground">{done}/{total}</span>
          </div>
        </div>
        <div className="p-2 space-y-0.5">
          {visibleTasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04, ease: "easeOut" }}
            >
              <ChecklistTask
                task={task}
                status={completions.get(task.id)}
                onToggle={toggleCompletion}
                getModuleLink={getModuleLink}
                onTaskClick={setSelectedTask}
              />
            </motion.div>
          ))}
          {hasMore && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full text-xs text-primary hover:underline py-1"
            >
              Show {phaseTasks.length - MAX_VISIBLE_TASKS} more…
            </button>
          )}
        </div>
      </div>

      <SprintTaskDetailDrawer
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => { if (!open) setSelectedTask(null); }}
        status={selectedTask ? completions.get(selectedTask.id) : undefined}
        onToggle={toggleCompletion}
        getModuleLink={getModuleLink}
      />
    </>
  );
};
