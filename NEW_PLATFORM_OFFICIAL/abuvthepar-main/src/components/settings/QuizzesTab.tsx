import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useQuizzes } from '@/hooks/useQuizzes';
import { QuizCard } from './quiz/QuizCard';
import { QuizDialog } from './quiz/QuizDialog';
import { Skeleton } from '@/components/ui/skeleton';

export const QuizzesTab = () => {
  const { quizzes, isLoading } = useQuizzes();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<any>(null);

  const handleEdit = (quiz: any) => {
    setEditingQuiz(quiz);
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setEditingQuiz(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quiz Management</h2>
          <p className="text-muted-foreground">
            Create and manage quizzes to unlock phases
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Quiz
        </Button>
      </div>

      {quizzes && quizzes.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No quizzes created yet</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Quiz
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {quizzes?.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} onEdit={handleEdit} />
          ))}
        </div>
      )}

      <QuizDialog 
        open={isDialogOpen} 
        onClose={handleClose} 
        quiz={editingQuiz}
      />
    </div>
  );
};
