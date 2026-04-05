import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useQuizStatus = (quizIds: string[]) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['quiz-statuses', user?.id, quizIds],
    queryFn: async () => {
      if (!user || quizIds.length === 0) return {};

      const statusMap: Record<string, 'not_started' | 'passed' | 'failed'> = {};

      // Get all submissions for these quizzes
      const { data: submissions, error } = await supabase
        .from('quiz_submissions')
        .select('quiz_id, passed')
        .eq('user_id', user.id)
        .in('quiz_id', quizIds)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      // Initialize all quizzes as not started
      quizIds.forEach(quizId => {
        statusMap[quizId] = 'not_started';
      });

      // Update status based on latest submission for each quiz
      const latestSubmissions = new Map();
      (submissions || []).forEach(sub => {
        if (!latestSubmissions.has(sub.quiz_id)) {
          latestSubmissions.set(sub.quiz_id, sub);
        }
      });

      latestSubmissions.forEach((sub, quizId) => {
        statusMap[quizId] = sub.passed ? 'passed' : 'failed';
      });

      return statusMap;
    },
    enabled: !!user && quizIds.length > 0,
  });
};