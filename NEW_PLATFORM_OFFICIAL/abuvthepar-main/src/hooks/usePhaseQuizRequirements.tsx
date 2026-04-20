import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PhaseQuizRequirement {
  id: string;
  phase_id: string;
  quiz_id: string;
  is_required: boolean;
  created_at: string;
}

export const usePhaseQuizRequirements = (phaseId?: string) => {
  const queryClient = useQueryClient();

  const { data: requirements, isLoading } = useQuery({
    queryKey: ['phase-quiz-requirements', phaseId],
    queryFn: async () => {
      const query = supabase
        .from('phase_quiz_requirements')
        .select('*, quizzes(*)');
      
      if (phaseId) {
        query.eq('phase_id', phaseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const linkQuizToPhase = useMutation({
    mutationFn: async ({ phaseId, quizId, isRequired = true }: { 
      phaseId: string; 
      quizId: string; 
      isRequired?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('phase_quiz_requirements')
        .insert([{ phase_id: phaseId, quiz_id: quizId, is_required: isRequired }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-quiz-requirements'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['phase-unlock-status'] });
      queryClient.invalidateQueries({ queryKey: ['phase-unlock-details'] });
      toast({ title: 'Quiz linked to phase successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to link quiz', description: error.message, variant: 'destructive' });
    },
  });

  const unlinkQuizFromPhase = useMutation({
    mutationFn: async (requirementId: string) => {
      const { error } = await supabase
        .from('phase_quiz_requirements')
        .delete()
        .eq('id', requirementId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-quiz-requirements'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['phase-unlock-status'] });
      queryClient.invalidateQueries({ queryKey: ['phase-unlock-details'] });
      toast({ title: 'Quiz unlinked from phase' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to unlink quiz', description: error.message, variant: 'destructive' });
    },
  });

  return {
    requirements,
    isLoading,
    linkQuizToPhase,
    unlinkQuizFromPhase,
  };
};
