import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_order: number;
  answer_options: { id: string; text: string }[];
  correct_answer_id: string;
  explanation: string | null;
  created_at: string;
  updated_at: string;
}

export const useQuizQuestions = (quizId: string | null) => {
  const queryClient = useQueryClient();

  const { data: questions, isLoading } = useQuery({
    queryKey: ['quiz-questions', quizId],
    queryFn: async () => {
      if (!quizId) return [];
      
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('question_order', { ascending: true });

      if (error) throw error;
      return data as QuizQuestion[];
    },
    enabled: !!quizId,
  });

  const createQuestion = useMutation({
    mutationFn: async (newQuestion: Omit<QuizQuestion, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('quiz_questions')
        .insert([newQuestion])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-questions', quizId] });
      toast({ title: 'Question added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to add question', description: error.message, variant: 'destructive' });
    },
  });

  const updateQuestion = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QuizQuestion> & { id: string }) => {
      const { data, error } = await supabase
        .from('quiz_questions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-questions', quizId] });
      toast({ title: 'Question updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update question', description: error.message, variant: 'destructive' });
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-questions', quizId] });
      toast({ title: 'Question deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete question', description: error.message, variant: 'destructive' });
    },
  });

  const reorderQuestions = useMutation({
    mutationFn: async (reorderedQuestions: { id: string; question_order: number }[]) => {
      const updates = reorderedQuestions.map(q => 
        supabase.from('quiz_questions').update({ question_order: q.question_order }).eq('id', q.id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-questions', quizId] });
      toast({ title: 'Questions reordered successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to reorder questions', description: error.message, variant: 'destructive' });
    },
  });

  return {
    questions,
    isLoading,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
  };
};
