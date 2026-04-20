import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PhaseUnlockDetails {
  isFullyUnlocked: boolean;
  baseConditionsMet: boolean;
  quizRequired: boolean;
  quizPassed: boolean;
  requiredQuizId?: string;
  requiredQuizTitle?: string;
}

export const usePhaseUnlockDetails = (phaseIds: string[]) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['phase-unlock-details', user?.id, phaseIds],
    queryFn: async () => {
      if (!user || phaseIds.length === 0) return {};

      const unlockDetailsMap: Record<string, PhaseUnlockDetails> = {};

      for (const phaseId of phaseIds) {
        // Check if base conditions are met (without quiz requirement)
        const { data: baseConditionsMet, error: baseError } = await supabase
          .rpc('check_phase_base_conditions', {
            _phase_id: phaseId,
            _user_id: user.id
          });

        if (baseError) {
          console.error('Error checking base conditions:', baseError);
          continue;
        }

        // Check if phase is fully unlocked (base + quiz)
        const { data: isFullyUnlocked, error: fullError } = await supabase
          .rpc('is_phase_unlocked', {
            _phase_id: phaseId,
            _user_id: user.id
          });

        if (fullError) {
          console.error('Error checking full unlock:', fullError);
          continue;
        }

        // Check if quiz is required for this phase
        const { data: quizRequirement, error: quizError } = await supabase
          .from('phase_quiz_requirements')
          .select('id, quiz_id, is_required, quizzes(id, title)')
          .eq('phase_id', phaseId)
          .eq('is_required', true)
          .maybeSingle();

        if (quizError && quizError.code !== 'PGRST116') {
          console.error('Error checking quiz requirement:', quizError);
        }

        let quizPassed = false;
        let requiredQuizId: string | undefined;
        let requiredQuizTitle: string | undefined;

        if (quizRequirement) {
          requiredQuizId = quizRequirement.quiz_id;
          requiredQuizTitle = (quizRequirement.quizzes as any)?.title;

          // Check if user has passed the required quiz
          const { data: submission } = await supabase
            .from('quiz_submissions')
            .select('passed')
            .eq('user_id', user.id)
            .eq('quiz_id', quizRequirement.quiz_id)
            .eq('passed', true)
            .maybeSingle();

          quizPassed = !!submission;
        }

        unlockDetailsMap[phaseId] = {
          isFullyUnlocked: isFullyUnlocked || false,
          baseConditionsMet: baseConditionsMet || false,
          quizRequired: !!quizRequirement,
          quizPassed,
          requiredQuizId,
          requiredQuizTitle,
        };
      }

      return unlockDetailsMap;
    },
    enabled: !!user && phaseIds.length > 0,
    // Inherit global cache settings from App.tsx
  });
};
