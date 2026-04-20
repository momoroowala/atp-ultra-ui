import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, FileText, Award } from 'lucide-react';
import { format } from 'date-fns';
import { useUpcomingQuizzes } from '@/hooks/useUpcomingQuizzes';
import { useHomeworkAssignments } from '@/hooks/useHomeworkAssignments';
import { QuizNotificationModal } from '@/components/quiz/QuizNotificationModal';
import { QuizTakingView } from '@/components/quiz/QuizTakingView';
import { QuizResultModal } from '@/components/quiz/QuizResultModal';
import { useQuizQuestions } from '@/hooks/useQuizQuestions';
import { useQuizSubmissions } from '@/hooks/useQuizSubmissions';
import { toast } from '@/hooks/use-toast';
interface HomeworkItem {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  points_value: number;
  is_exam: boolean;
  type: 'homework' | 'quiz';
  quiz_id?: string;
  phase_title?: string;
  progress?: {
    status: 'pending' | 'in_progress' | 'pending_review' | 'changes_required' | 'completed' | 'skipped';
    submitted_at: string | null;
    score: number | null;
  };
}
export const HomeworkSection = () => {
  const {
    user
  } = useAuth();
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [takingQuiz, setTakingQuiz] = useState(false);
  const [quizSubmission, setQuizSubmission] = useState<any | null>(null);
  const {
    data: upcomingQuizzes = [],
    isLoading: quizzesLoading,
    isError: quizzesError,
    refetch: refetchQuizzes
  } = useUpcomingQuizzes();
  const {
    data: homeworkAssignments = [],
    isLoading: homeworkLoading,
    isError: homeworkError,
    refetch: refetchHomework
  } = useHomeworkAssignments();
  const {
    questions: quizQuestions
  } = useQuizQuestions(selectedQuizId);
  const {
    submitQuiz
  } = useQuizSubmissions(selectedQuizId);
  const items = useMemo(() => {
    const allItems: HomeworkItem[] = [];

    // Add pending homework assignments
    if (homeworkAssignments) {
      const pendingHomework = homeworkAssignments.map(hw => ({
        id: hw.id,
        title: hw.title,
        description: hw.description,
        due_date: hw.due_date,
        points_value: hw.points_value,
        is_exam: hw.is_exam,
        type: 'homework' as const
      }));
      allItems.push(...pendingHomework);
    }

    // Add only the next upcoming quiz (first in the sorted list)
    if (upcomingQuizzes && upcomingQuizzes.length > 0) {
      const nextQuiz = upcomingQuizzes[0];
      const quizItem: HomeworkItem = {
        id: nextQuiz.id,
        title: nextQuiz.title,
        description: `Complete this exam to unlock the next phase. Passing grade: ${nextQuiz.passing_grade}%`,
        due_date: null,
        points_value: 0,
        is_exam: true,
        type: 'quiz' as const,
        quiz_id: nextQuiz.id,
        phase_title: nextQuiz.phase_title
      };
      allItems.push(quizItem);
    }
    return allItems;
  }, [homeworkAssignments, upcomingQuizzes]);
  const isLoading = quizzesLoading || homeworkLoading;
  const isError = quizzesError || homeworkError;
  const handleItemClick = (item: HomeworkItem) => {
    if (item.type === 'quiz' && item.quiz_id) {
      setSelectedQuizId(item.quiz_id);
    }
    // For homework items, could navigate to homework page in the future
  };
  const handleStartQuiz = () => {
    setTakingQuiz(true);
  };
  const handleQuizSubmit = async (answers: Record<string, string>) => {
    if (!selectedQuizId || !quizQuestions || !user) return;
    try {
      const result = await submitQuiz.mutateAsync({
        quizId: selectedQuizId,
        answers,
        questions: quizQuestions.map(q => ({
          id: q.id,
          correct_answer_id: q.correct_answer_id
        }))
      });

      // Store submission for result modal
      setQuizSubmission(result);
      setTakingQuiz(false);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit quiz. Please try again.',
        variant: 'destructive'
      });
    }
  };
  const handleCloseQuiz = () => {
    setSelectedQuizId(null);
    setTakingQuiz(false);
    setQuizSubmission(null);
  };
  const handleRetakeQuiz = () => {
    setQuizSubmission(null);
    setTakingQuiz(true);
  };
  const selectedQuiz = upcomingQuizzes?.find(q => q.id === selectedQuizId);
  return <>
      

      {/* Quiz Notification Modal */}
      {selectedQuiz && selectedQuizId && !takingQuiz && !quizSubmission && <QuizNotificationModal quiz={{
      title: selectedQuiz.title,
      description: selectedQuiz.description,
      passing_grade: selectedQuiz.passing_grade
    }} questionCount={quizQuestions?.length || 0} open={true} onClose={handleCloseQuiz} onStartQuiz={handleStartQuiz} />}

      {/* Quiz Taking View */}
      {takingQuiz && selectedQuiz && quizQuestions && quizQuestions.length > 0 && <QuizTakingView quiz={{
      title: selectedQuiz.title,
      description: selectedQuiz.description
    }} questions={quizQuestions} onSubmit={handleQuizSubmit} onCancel={handleCloseQuiz} />}

      {/* Quiz Result Modal */}
      {quizSubmission && quizQuestions && <QuizResultModal open={true} submission={quizSubmission} questions={quizQuestions} onRetake={handleRetakeQuiz} onContinue={handleCloseQuiz} />}
    </>;
};