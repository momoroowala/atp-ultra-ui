import { Badge } from '@/components/ui/badge';
import { Clock, Lock, ClipboardCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { usePhaseQuizRequirements } from '@/hooks/usePhaseQuizRequirements';

interface PhaseUnlockInfoProps {
  phaseId: string;
  unlockType: string;
  unlockCondition: any;
  userCreatedAt: string;
  requiredPhaseName?: string;
  requiredPhaseProgress?: number;
}

export const PhaseUnlockInfo = ({
  phaseId,
  unlockType,
  unlockCondition,
  userCreatedAt,
  requiredPhaseName,
  requiredPhaseProgress,
}: PhaseUnlockInfoProps) => {
  const { requirements } = usePhaseQuizRequirements(phaseId);
  const requiredQuiz = requirements?.find(r => r.is_required);
  if (unlockType === 'time' && unlockCondition?.delay_days) {
    const unlockDate = new Date(userCreatedAt);
    unlockDate.setDate(unlockDate.getDate() + unlockCondition.delay_days);
    const now = new Date();
    
    if (unlockDate > now) {
      const timeRemaining = formatDistanceToNow(unlockDate, { addSuffix: true });
      
      return (
        <Badge variant="secondary" className="gap-2">
          <Clock className="h-3 w-3" />
          Unlocks {timeRemaining}
        </Badge>
      );
    }
  }

  if (unlockType === 'completion' && requiredPhaseName) {
    return (
      <Badge variant="secondary" className="gap-2">
        <Lock className="h-3 w-3" />
        Complete "{requiredPhaseName}" first ({requiredPhaseProgress || 0}%)
      </Badge>
    );
  }

  if (requiredQuiz && requiredQuiz.quizzes) {
    return (
      <Badge variant="secondary" className="gap-2">
        <ClipboardCheck className="h-3 w-3" />
        Quiz Required: {requiredQuiz.quizzes.title}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-2">
      <Lock className="h-3 w-3" />
      Locked
    </Badge>
  );
};
