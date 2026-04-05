import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ClipboardCheck } from 'lucide-react';

interface QuizNotificationModalProps {
  open: boolean;
  onClose: () => void;
  onStartQuiz: () => void;
  quiz: {
    title: string;
    description: string | null;
    passing_grade: number;
  };
  questionCount: number;
}

export const QuizNotificationModal = ({
  open,
  onClose,
  onStartQuiz,
  quiz,
  questionCount,
}: QuizNotificationModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            <DialogTitle>Quiz Required!</DialogTitle>
          </div>
          <DialogDescription>
            Great job completing this phase! A short quiz is available to unlock your next phase.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">{quiz.title}</h3>
            {quiz.description && (
              <p className="text-sm text-muted-foreground">{quiz.description}</p>
            )}
          </div>
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Questions:</span>
              <span className="font-medium">{questionCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Passing Grade:</span>
              <span className="font-medium">{quiz.passing_grade}%</span>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Later
            </Button>
            <Button onClick={onStartQuiz}>
              Start Quiz
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
