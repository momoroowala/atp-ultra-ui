import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface QuizAnswersModalProps {
  submission: any;
  onClose: () => void;
}

export const QuizAnswersModal = ({ submission, onClose }: QuizAnswersModalProps) => {
  const { data: questions, isLoading } = useQuery({
    queryKey: ['quiz-questions', submission.quiz_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', submission.quiz_id)
        .order('question_order', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quiz Answers: {submission.quizzes?.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Submission Info */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Score</div>
              <div className="text-2xl font-bold">{Math.round(submission.score)}%</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Result</div>
              <div className="mt-1">
                {submission.passed ? (
                  <Badge className="bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Passed
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Failed
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Submitted</div>
              <div className="text-sm font-medium mt-1">
                {format(new Date(submission.submitted_at), 'MM/dd/yyyy HH:mm')}
              </div>
            </div>
          </div>

          {/* Questions and Answers */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {questions?.map((question, index) => {
                const userAnswer = submission.answers?.[question.id];
                const isCorrect = userAnswer === question.correct_answer_id;
                const answerOptions = question.answer_options as any[];

                return (
                  <div 
                    key={question.id}
                    className={`border rounded-lg p-4 ${
                      isCorrect ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold">
                        Question {index + 1}: {question.question_text}
                      </h4>
                      {isCorrect ? (
                        <Badge className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Correct
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Incorrect
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      {answerOptions?.map((option: any) => {
                        const isUserAnswer = option.id === userAnswer;
                        const isCorrectAnswer = option.id === question.correct_answer_id;

                        return (
                          <div
                            key={option.id}
                            className={`p-3 rounded border ${
                              isCorrectAnswer
                                ? 'bg-green-500/10 border-green-500'
                                : isUserAnswer
                                ? 'bg-red-500/10 border-red-500'
                                : 'border-border'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{option.text}</span>
                              {isCorrectAnswer && (
                                <Badge variant="outline" className="bg-green-500/20 border-green-500">
                                  Correct Answer
                                </Badge>
                              )}
                              {isUserAnswer && !isCorrectAnswer && (
                                <Badge variant="outline" className="bg-red-500/20 border-red-500">
                                  Your Answer
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {question.explanation && !isCorrect && (
                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                        <p className="text-sm font-medium text-blue-400 mb-1">Explanation:</p>
                        <p className="text-sm">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
