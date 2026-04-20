import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { PhaseCard } from './PhaseCard';
import { Phase } from '@/hooks/usePhasesWithTasks';

interface PhaseListPanelProps {
  phases: Phase[];
  unlockedPhaseIds: string[];
  pendingUnlockPhaseIds: string[];
  phaseProgress: Record<string, number>;
  selectedPhaseId: string | null;
  onSelectPhase: (phaseId: string) => void;
  isLoading?: boolean;
}

export const PhaseListPanel = ({
  phases,
  unlockedPhaseIds,
  pendingUnlockPhaseIds,
  phaseProgress,
  selectedPhaseId,
  onSelectPhase,
  isLoading,
}: PhaseListPanelProps) => {
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Header */}
      <div className="p-4 pb-2 border-b shrink-0 bg-card">
        <h2 className="text-lg font-semibold">Phases</h2>
        <p className="text-sm text-muted-foreground">Select a phase</p>
      </div>
      
      {/* Scrollable Phase List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {phases.map((phase) => {
            const isUnlocked = unlockedPhaseIds.includes(phase.id);
            const isPendingUnlock = pendingUnlockPhaseIds.includes(phase.id);
            
            return (
              <PhaseCard
                key={phase.id}
                phase={phase}
                isUnlocked={isUnlocked}
                isPendingUnlock={isPendingUnlock}
                completedTasks={phaseProgress[phase.id] || 0}
                isSelected={selectedPhaseId === phase.id}
                onClick={() => onSelectPhase(phase.id)}
              />
            );
          })}
          {/* Extra spacing equivalent to one phase card height */}
          <div className="h-48" />
        </div>
      </ScrollArea>
    </div>
  );
};
