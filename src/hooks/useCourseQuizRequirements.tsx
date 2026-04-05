import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCourseQuizRequirements = (courseId: string | undefined) => {
  return useQuery({
    queryKey: ['course-quiz-requirements', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID is required');

      // Get all active quizzes for this course (for navigation display)
      const { data: quizzes, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_active', true);

      if (quizzesError) throw quizzesError;

      // Get phase quiz requirements (for locking logic)
      const { data: requirements, error: reqError } = await supabase
        .from('phase_quiz_requirements')
        .select(`
          *,
          quizzes (
            id,
            title,
            passing_grade,
            description,
            course_id,
            is_active
          )
        `)
        .eq('quizzes.course_id', courseId)
        .eq('quizzes.is_active', true);

      if (reqError) throw reqError;

      // Build display map (which quizzes appear after which phase based on linked_phase_id)
      const displayMap: Record<string, any[]> = {};
      (quizzes || []).forEach(quiz => {
        const phaseId = quiz.linked_phase_id;
        if (phaseId) {
          if (!displayMap[phaseId]) {
            displayMap[phaseId] = [];
          }
          displayMap[phaseId].push({
            quiz_id: quiz.id,
            phase_id: phaseId,
            quizzes: quiz
          });
        }
      });

      // Build locking map (which quizzes lock which phase based on phase_quiz_requirements)
      const lockingMap: Record<string, any[]> = {};
      (requirements || []).forEach(req => {
        const phaseId = req.phase_id;
        if (!lockingMap[phaseId]) {
          lockingMap[phaseId] = [];
        }
        lockingMap[phaseId].push({
          quiz_id: req.quiz_id,
          phase_id: req.phase_id,
          is_required: req.is_required,
          quizzes: req.quizzes
        });
      });

      // Merge both maps per phase, marking required quizzes correctly
      const mergedMap: Record<string, any[]> = {};
      const phaseKeys = new Set([
        ...Object.keys(displayMap),
        ...Object.keys(lockingMap)
      ]);

      phaseKeys.forEach((phaseId) => {
        const byQuiz = new Map<string, any>();

        (displayMap[phaseId] || []).forEach((item) => {
          byQuiz.set(item.quiz_id, { ...item, is_required: false });
        });

        (lockingMap[phaseId] || []).forEach((item) => {
          const existing = byQuiz.get(item.quiz_id);
          if (existing) {
            byQuiz.set(item.quiz_id, { ...existing, ...item, is_required: Boolean(item.is_required) || Boolean(existing.is_required) });
          } else {
            byQuiz.set(item.quiz_id, item);
          }
        });

        mergedMap[phaseId] = Array.from(byQuiz.values());
      });

      return mergedMap;
    },
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000,
  });
};
