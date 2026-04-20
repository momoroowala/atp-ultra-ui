import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface QuizSubmission {
  id: string;
  quiz_id: string;
  user_id: string;
  answers: Record<string, string>;
  score: number;
  passed: boolean;
  submitted_at: string;
  attempt_number: number;
}

export const useQuizSubmissions = (quizId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['quiz-submissions', quizId, user?.id],
    queryFn: async () => {
      if (!quizId || !user) return [];
      
      const { data, error } = await supabase
        .from('quiz_submissions')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data as QuizSubmission[];
    },
    enabled: !!quizId && !!user,
  });

  const submitQuiz = useMutation({
    mutationFn: async ({ 
      quizId, 
      answers, 
      questions 
    }: { 
      quizId: string; 
      answers: Record<string, string>;
      questions: { id: string; correct_answer_id: string }[];
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Calculate score
      const correctAnswers = questions.filter(q => answers[q.id] === q.correct_answer_id).length;
      const score = (correctAnswers / questions.length) * 100;

      // Get quiz passing grade
      const { data: quiz } = await supabase
        .from('quizzes')
        .select('passing_grade')
        .eq('id', quizId)
        .single();

      const passed = score >= (quiz?.passing_grade || 70);

      // Get attempt number
      const { data: previousSubmissions } = await supabase
        .from('quiz_submissions')
        .select('attempt_number')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .order('attempt_number', { ascending: false })
        .limit(1);

      const attemptNumber = (previousSubmissions?.[0]?.attempt_number || 0) + 1;

      const { data, error } = await supabase
        .from('quiz_submissions')
        .insert([{
          quiz_id: quizId,
          user_id: user.id,
          answers,
          score,
          passed,
          attempt_number: attemptNumber,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['quiz-statuses'] });
      queryClient.invalidateQueries({ queryKey: ['phase-unlock-status'] });
      queryClient.invalidateQueries({ queryKey: ['course-detail'] });
      
      if (data.passed) {
        toast({ title: 'Congratulations!', description: `You passed with a score of ${data.score.toFixed(1)}%` });
      } else {
        toast({ 
          title: 'Quiz Failed', 
          description: `You scored ${data.score.toFixed(1)}%. Please try again.`,
          variant: 'destructive'
        });
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to submit quiz', description: error.message, variant: 'destructive' });
    },
  });

  return {
    submissions,
    isLoading,
    submitQuiz,
  };
};
