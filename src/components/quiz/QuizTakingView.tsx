import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { QuizQuestion } from '@/hooks/useQuizQuestions';

interface QuizTakingViewProps {
  quiz: any;
  questions: QuizQuestion[];
  onSubmit: (answers: Record<string, string>) => void;
  onCancel: () => void;
}

export const QuizTakingView = ({ quiz, questions, onSubmit, onCancel }: QuizTakingViewProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Guard against empty questions
  if (!questions || questions.length === 0) {
    return (
      <Dialog open={true} onOpenChange={() => onCancel()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{quiz.title}</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            Loading quiz questions...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const allQuestionsAnswered = questions.every(q => answers[q.id]);
  const currentQuestionAnswered = !!answers[currentQuestion.id];

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (allQuestionsAnswered) {
      onSubmit(answers);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quiz.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Question Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {currentQuestion.question_text}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onValueChange={(value) => setAnswers({ ...answers, [currentQuestion.id]: value })}
              >
                <div className="space-y-3">
                  {currentQuestion.answer_options?.map((option: any) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label
                        htmlFor={option.id}
                        className="flex-1 cursor-pointer text-base"
                      >
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={!allQuestionsAnswered}
              >
                Submit Quiz
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!currentQuestionAnswered}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Answer Overview */}
          <div className="flex flex-wrap gap-2 justify-center">
            {questions.map((_, index) => {
              const isAnswered = !!answers[questions[index].id];
              const canNavigate = index <= currentQuestionIndex || isAnswered;
              
              return (
                <Button
                  key={index}
                  variant={currentQuestionIndex === index ? 'default' : 'outline'}
                  size="sm"
                  className="w-10 h-10"
                  onClick={() => canNavigate && setCurrentQuestionIndex(index)}
                  disabled={!canNavigate}
                >
                  {isAnswered ? '✓' : index + 1}
                </Button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
