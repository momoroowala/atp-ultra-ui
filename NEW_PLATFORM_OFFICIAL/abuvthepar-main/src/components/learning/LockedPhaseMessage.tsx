import { Lock, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
interface LockedPhaseMessageProps {
  phaseName: string;
  requiredQuizzes: Array<{
    id: string;
    title: string;
    passing_grade: number;
  }>;
  onNavigateToQuiz: (quizId: string) => void;
}
export const LockedPhaseMessage = ({
  phaseName,
  requiredQuizzes,
  onNavigateToQuiz
}: LockedPhaseMessageProps) => {
  return <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Phase Locked</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        This phase is currently locked. To unlock "{phaseName}", you must complete and pass the required {requiredQuizzes.length === 1 ? 'quiz' : 'quizzes'} listed below.
      </p>
      
      {requiredQuizzes.length > 0 && <div className="space-y-4 w-full max-w-md">
          <p className="font-medium">Complete the following to unlock:</p>
          {requiredQuizzes.map(quiz => <Card key={quiz.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">{quiz.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Passing grade: {quiz.passing_grade}%
                  </p>
                </div>
                <Button onClick={() => onNavigateToQuiz(quiz.id)} className="shrink-0">
                  Take Quiz
                </Button>
              </div>
            </Card>)}
        </div>}
    </div>;
};