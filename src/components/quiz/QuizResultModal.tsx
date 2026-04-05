import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, Trophy, RotateCcw } from 'lucide-react';
import { QuizQuestion } from '@/hooks/useQuizQuestions';
import { QuizSubmission } from '@/hooks/useQuizSubmissions';
import confetti from 'canvas-confetti';

interface QuizResultModalProps {
  open: boolean;
  submission: QuizSubmission;
  questions: QuizQuestion[];
  onRetake: () => void;
  onContinue: () => void;
}

export const QuizResultModal = ({
  open,
  submission,
  questions,
  onRetake,
  onContinue,
}: QuizResultModalProps) => {
  // Trigger confetti on pass
  useEffect(() => {
    if (open && submission.passed) {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#3b82f6', '#8b5cf6', '#ec4899']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#3b82f6', '#8b5cf6', '#ec4899']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [open, submission.passed]);

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {submission.passed ? (
              <>
                <Trophy className="h-6 w-6 text-yellow-500" />
                Congratulations!
              </>
            ) : (
              <>
                <RotateCcw className="h-6 w-6 text-muted-foreground" />
                Keep Trying!
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Score Summary */}
          <Card className="p-6">
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold">
                {submission.score.toFixed(1)}%
              </div>
              <p className="text-muted-foreground">
                {submission.passed ? (
                  <span className="text-green-600 font-medium">
                    You passed! Next phase unlocked.
                  </span>
                ) : (
                  <span className="text-destructive font-medium">
                    Passing grade required: {questions[0] ? '70' : '70'}%
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                Attempt #{submission.attempt_number}
              </p>
            </div>
          </Card>

          {/* Question Review */}
          <div className="space-y-4">
            <h3 className="font-semibold">Question Review</h3>
            {questions.map((question, index) => {
              const userAnswer = submission.answers[question.id];
              const isCorrect = userAnswer === question.correct_answer_id;
              const userOption = question.answer_options?.find(o => o.id === userAnswer);
              const correctOption = question.answer_options?.find(o => o.id === question.correct_answer_id);

              return (
                <Card key={question.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          Question {index + 1}: {question.question_text}
                        </p>
                      </div>
                    </div>

                    <div className="ml-7 space-y-2">
                      {!isCorrect && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Your answer: </span>
                          <span className="text-destructive">{userOption?.text || 'Not answered'}</span>
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="text-muted-foreground">Correct answer: </span>
                        <span className="text-green-600 font-medium">{correctOption?.text}</span>
                      </div>
                      {question.explanation && (
                        <div className="bg-muted p-3 rounded-md text-sm">
                          <p className="text-muted-foreground font-medium mb-1">Explanation:</p>
                          <p>{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            {!submission.passed && (
              <Button onClick={onRetake}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry Quiz
              </Button>
            )}
            <Button variant={submission.passed ? 'default' : 'outline'} onClick={onContinue}>
              {submission.passed ? 'Continue' : 'Close'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};