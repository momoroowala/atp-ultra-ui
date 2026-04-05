import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Settings, Eye, EyeOff, GraduationCap, Target, HelpCircle, MapPin, ArrowRight } from 'lucide-react';
import { useQuizzes } from '@/hooks/useQuizzes';
import { useQuizQuestions } from '@/hooks/useQuizQuestions';
import { usePhasesWithTasks } from '@/hooks/usePhasesWithTasks';
import { usePhaseQuizRequirements } from '@/hooks/usePhaseQuizRequirements';
import { QuestionManager } from './QuestionManager';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface QuizCardProps {
  quiz: any;
  onEdit: (quiz: any) => void;
}

export const QuizCard = ({ quiz, onEdit }: QuizCardProps) => {
  const [showQuestions, setShowQuestions] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteQuiz, updateQuiz } = useQuizzes();
  const { questions } = useQuizQuestions(quiz.id);
  const { data: phases } = usePhasesWithTasks();
  const { requirements } = usePhaseQuizRequirements();

  const linkedPhase = phases?.find(p => p.id === quiz.linked_phase_id);
  const unlockRequirement = requirements?.find(r => r.quiz_id === quiz.id && r.is_required);
  const unlockPhase = phases?.find(p => p.id === unlockRequirement?.phase_id);

  const handleToggleActive = () => {
    updateQuiz.mutate({ id: quiz.id, is_active: !quiz.is_active });
  };

  const handleDelete = () => {
    deleteQuiz.mutate(quiz.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className="hover:border-primary/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Left Section: Icon, Title, Description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-primary" />
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <h3 className="text-lg font-semibold truncate">{quiz.title}</h3>
                  <Badge 
                    variant={quiz.is_active ? 'default' : 'secondary'} 
                    className="flex-shrink-0 text-xs px-2 py-0"
                  >
                    {quiz.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              {quiz.description && (
                <p className="text-sm text-muted-foreground line-clamp-1 ml-11">
                  {quiz.description}
                </p>
              )}
              
              {/* Metrics Row */}
              <div className="flex items-center gap-4 mt-3 ml-11 text-sm">
                <div className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Pass:</span>
                  <span className="font-medium">{quiz.passing_grade}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{questions?.length || 0}</span>
                  <span className="text-muted-foreground">Questions</span>
                </div>
                {(linkedPhase || unlockPhase) && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {linkedPhase && (
                      <Badge variant="outline" className="text-xs px-2 py-0">
                        {linkedPhase.title}
                      </Badge>
                    )}
                    {linkedPhase && unlockPhase && (
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    )}
                    {unlockPhase && (
                      <Badge variant="outline" className="text-xs px-2 py-0">
                        {unlockPhase.title}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Manage Questions Button */}
              <div className="mt-3 ml-11">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuestions(!showQuestions)}
                  className="h-8 text-xs"
                >
                  <Settings className="h-3.5 w-3.5 mr-1.5" />
                  {showQuestions ? 'Hide' : 'Manage'} Questions
                </Button>
              </div>
            </div>

            {/* Right Section: Action Buttons */}
            <div className="flex gap-1 flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(quiz)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={handleToggleActive}
              >
                {quiz.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Collapsible Questions Manager */}
          {showQuestions && (
            <div className="mt-4 pt-4 border-t">
              <QuestionManager quizId={quiz.id} />
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{quiz.title}" and all its questions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
