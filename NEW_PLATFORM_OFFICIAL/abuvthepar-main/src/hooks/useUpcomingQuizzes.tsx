import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UpcomingQuiz {
  id: string;
  title: string;
  description: string | null;
  passing_grade: number;
  phase_id: string;
  phase_title: string;
}

export const useUpcomingQuizzes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['upcoming-quizzes', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all phase quiz requirements with quiz and phase info
      const { data: requirements, error: reqError } = await supabase
        .from('phase_quiz_requirements')
        .select(`
          quiz_id,
          phase_id,
          is_required,
          quizzes!inner (
            id,
            title,
            description,
            passing_grade,
            linked_phase_id,
            is_active
          ),
          phases!inner (
            id,
            title,
            phase_order,
            is_active
          )
        `)
        .eq('is_required', true)
        .eq('quizzes.is_active', true)
        .eq('phases.is_active', true);

      if (reqError) throw reqError;
      if (!requirements || requirements.length === 0) return [];

      // Sort requirements by phase order to enforce sequential quiz completion
      const sortedRequirements = requirements.sort((a, b) => {
        const phaseA = a.phases as any;
        const phaseB = b.phases as any;
        return phaseA.phase_order - phaseB.phase_order;
      });

      const upcomingQuizzes: UpcomingQuiz[] = [];

      for (const req of sortedRequirements) {
        const quiz = req.quizzes as any;
        const phase = req.phases as any;

        // Check if base conditions for this phase are met (using the DB function)
        const { data: baseConditionsMet, error: baseError } = await supabase
          .rpc('check_phase_base_conditions', {
            _phase_id: req.phase_id,
            _user_id: user.id
          });

        if (baseError) {
          console.error('Error checking base conditions:', baseError);
          continue;
        }

        // Skip if base conditions not met
        if (!baseConditionsMet) continue;

        // Determine which phase's tasks must be completed before this quiz
        let tasksPhaseId = (quiz as any).linked_phase_id;
        
        // If no linked_phase_id, look up the previous phase by phase_order
        if (!tasksPhaseId) {
          const previousPhaseOrder = phase.phase_order - 1;
          if (previousPhaseOrder > 0) {
            const prevPhase = sortedRequirements.find(r => {
              const p = r.phases as any;
              return p.phase_order === previousPhaseOrder;
            });
            tasksPhaseId = prevPhase ? (prevPhase.phases as any).id : req.phase_id;
          } else {
            tasksPhaseId = req.phase_id;
          }
        }

        

        // Query tasks, excluding those with visibility_condition_enabled = true
        const { data: phaseTasks } = await supabase
          .from('tasks')
          .select('id')
          .eq('phase_id', tasksPhaseId)
          .eq('is_active', true)
          .or('visibility_condition_enabled.is.null,visibility_condition_enabled.eq.false');

        if (phaseTasks && phaseTasks.length > 0) {
          const { data: completedTasks } = await supabase
            .from('task_responses')
            .select('task_id')
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .in('task_id', phaseTasks.map((t: any) => t.id));

          

          // Skip if not all tasks in the required phase are completed
          if (!completedTasks || completedTasks.length < phaseTasks.length) {
            continue;
          }
        }

        // Check if previous phase quiz is completed (enforce sequential quiz chain)
        const previousPhaseOrder = phase.phase_order - 1;
        if (previousPhaseOrder > 0) {
          const prevReq = sortedRequirements.find(r => {
            const p = r.phases as any;
            return p.phase_order === previousPhaseOrder;
          });

          if (prevReq) {
            const prevQuiz = prevReq.quizzes as any;
            const { data: prevPassed } = await supabase
              .from('quiz_submissions')
              .select('id')
              .eq('quiz_id', prevQuiz.id)
              .eq('user_id', user.id)
              .eq('passed', true)
              .limit(1);

            // Skip this quiz if previous phase quiz not passed
            if (!prevPassed || prevPassed.length === 0) {
              continue;
            }
          }
        }

        // Check if user has already passed this quiz
        const { data: passedSubmission } = await supabase
          .from('quiz_submissions')
          .select('id')
          .eq('quiz_id', quiz.id)
          .eq('user_id', user.id)
          .eq('passed', true)
          .limit(1);

        // If base conditions met and quiz not passed, return immediately (we only show the first one)
        if (!passedSubmission || passedSubmission.length === 0) {
          return [{
            id: quiz.id,
            title: quiz.title,
            description: quiz.description,
            passing_grade: quiz.passing_grade,
            phase_id: req.phase_id,
            phase_title: phase.title,
          }];
        }
      }

      return [];
    },
    enabled: !!user,
    staleTime: 120000,
    gcTime: 300000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
};
