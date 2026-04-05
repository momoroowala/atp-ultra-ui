import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  course_id: string;
  linked_phase_id: string;
  quiz_order: number;
  passing_grade: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useQuizzes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          phases!linked_phase_id (
            id,
            title,
            phase_order
          )
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Sort by phase order first, then by quiz_order
      const sorted = (data || []).sort((a: any, b: any) => {
        const aPhaseOrder = a.phases?.phase_order ?? 999;
        const bPhaseOrder = b.phases?.phase_order ?? 999;
        
        if (aPhaseOrder !== bPhaseOrder) {
          return aPhaseOrder - bPhaseOrder;
        }
        
        return (a.quiz_order || 0) - (b.quiz_order || 0);
      });
      
      return sorted as Quiz[];
    },
    enabled: !!user,
  });

  const createQuiz = useMutation({
    mutationFn: async (newQuiz: Omit<Quiz, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data, error } = await supabase
        .from('quizzes')
        .insert([{ ...newQuiz, created_by: user?.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success('Quiz created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create quiz: ' + error.message);
    },
  });

  const updateQuiz = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Quiz> & { id: string }) => {
      const { data, error } = await supabase
        .from('quizzes')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['phase-unlock-status'] });
      queryClient.invalidateQueries({ queryKey: ['phase-unlock-details'] });
      toast.success('Quiz updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update quiz: ' + error.message);
    },
  });

  const deleteQuiz = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quizzes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['phase-quiz-requirements'] });
      queryClient.invalidateQueries({ queryKey: ['phase-unlock-status'] });
      queryClient.invalidateQueries({ queryKey: ['phase-unlock-details'] });
      toast.success('Quiz deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete quiz: ' + error.message);
    },
  });

  return {
    quizzes,
    isLoading,
    createQuiz,
    updateQuiz,
    deleteQuiz,
  };
};
