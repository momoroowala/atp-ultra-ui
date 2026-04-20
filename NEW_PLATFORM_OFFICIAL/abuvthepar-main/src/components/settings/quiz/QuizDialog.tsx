import { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuizzes } from '@/hooks/useQuizzes';
import { useAdminCourses } from '@/hooks/useCourses';
import { useCourseWithPhases } from '@/hooks/useCourseWithPhases';
import { usePhaseQuizRequirements } from '@/hooks/usePhaseQuizRequirements';
import { toast } from '@/hooks/use-toast';

interface QuizDialogProps {
  open: boolean;
  onClose: () => void;
  quiz?: any;
}

export const QuizDialog = ({ open, onClose, quiz }: QuizDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passingGrade, setPassingGrade] = useState(70);
  const [courseId, setCourseId] = useState<string>('');
  const [linkedPhaseId, setLinkedPhaseId] = useState<string>('');
  const [quizOrder, setQuizOrder] = useState<number>(0);
  const [requiredForPhaseIds, setRequiredForPhaseIds] = useState<string[]>([]);
  
  const { createQuiz, updateQuiz } = useQuizzes();
  const { courses } = useAdminCourses();
  const { data: courseData } = useCourseWithPhases(courseId);
  const { requirements, linkQuizToPhase, unlinkQuizFromPhase } = usePhaseQuizRequirements();

  // Get phases from the selected course
  const phases = useMemo(() => {
    if (!courseData?.phases) return [];
    return courseData.phases;
  }, [courseData]);

  // Initialize courseId first when editing
  useEffect(() => {
    if (quiz && open) {
      setCourseId(quiz.course_id || '');
    } else if (!quiz && open) {
      setCourseId('');
    }
  }, [quiz, open]);

  // Initialize other fields after courseId is set
  useEffect(() => {
    if (quiz && open) {
      setTitle(quiz.title || '');
      setDescription(quiz.description || '');
      setPassingGrade(quiz.passing_grade || 70);
      setLinkedPhaseId(quiz.linked_phase_id || '');
      setQuizOrder(quiz.quiz_order || 0);
      
      // Find all phases this quiz unlocks
      const unlockPhaseIds = requirements
        ?.filter(r => r.quiz_id === quiz.id && r.is_required)
        .map(r => r.phase_id) || [];
      setRequiredForPhaseIds(unlockPhaseIds);
    } else if (!quiz && open) {
      setTitle('');
      setDescription('');
      setPassingGrade(70);
      setLinkedPhaseId('');
      setQuizOrder(0);
      setRequiredForPhaseIds([]);
    }
  }, [quiz, open, requirements, courseId]);

  // Reset phase selection when course changes
  useEffect(() => {
    if (!quiz) { // Only reset for new quizzes
      setLinkedPhaseId('');
      setRequiredForPhaseIds([]);
    }
  }, [courseId, quiz]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!courseId) {
      toast({ 
        title: "Error", 
        description: "Please select a course",
        variant: "destructive"
      });
      return;
    }
    
    if (!linkedPhaseId) {
      toast({ 
        title: "Error", 
        description: "Please select a phase to display this quiz after",
        variant: "destructive"
      });
      return;
    }
    
    const quizData = {
      title,
      description,
      passing_grade: passingGrade,
      course_id: courseId,
      linked_phase_id: linkedPhaseId,
      quiz_order: quizOrder,
      is_active: true,
    };

    const onSuccess = async (savedQuiz: any) => {
      // Get all existing requirements for this quiz
      const existingReqs = requirements?.filter(r => r.quiz_id === savedQuiz.id) || [];
      
      // Remove requirements that are no longer selected
      for (const req of existingReqs) {
        if (!requiredForPhaseIds.includes(req.phase_id)) {
          await unlinkQuizFromPhase.mutateAsync(req.id);
        }
      }
      
      // Add new requirements
      for (const phaseId of requiredForPhaseIds) {
        const exists = existingReqs.find(r => r.phase_id === phaseId);
        if (!exists) {
          await linkQuizToPhase.mutateAsync({
            phaseId,
            quizId: savedQuiz.id,
            isRequired: true
          });
        }
      }
      
      onClose();
    };

    if (quiz) {
      updateQuiz.mutate({ id: quiz.id, ...quizData }, { onSuccess: () => onSuccess(quiz) });
    } else {
      createQuiz.mutate(quizData, { onSuccess });
    }
  };


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quiz ? 'Edit Quiz' : 'Create New Quiz'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Quiz Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter quiz title"
              required
              maxLength={200}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this quiz covers"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="passingGrade">Passing Grade (%)</Label>
            <Input
              id="passingGrade"
              type="number"
              min="0"
              max="100"
              value={passingGrade}
              onChange={(e) => setPassingGrade(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <Label htmlFor="course">Course *</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Select the course this quiz belongs to
            </p>
            <Select value={courseId} onValueChange={setCourseId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses?.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="linkedPhase">Display After Phase *</Label>
            <p className="text-sm text-muted-foreground mb-2">
              This quiz will appear after this phase in the course navigation
            </p>
            <Select 
              value={linkedPhaseId} 
              onValueChange={setLinkedPhaseId} 
              required
              disabled={!courseId}
            >
              <SelectTrigger>
                <SelectValue placeholder={courseId ? "Select a phase" : "Select a course first"} />
              </SelectTrigger>
              <SelectContent>
                {phases?.map((phase) => (
                  <SelectItem key={phase.id} value={phase.id}>
                    {phase.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quizOrder">Quiz Order</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Order when multiple quizzes appear after the same phase (lower numbers appear first)
            </p>
            <Input
              id="quizOrder"
              type="number"
              min="0"
              value={quizOrder}
              onChange={(e) => setQuizOrder(Number(e.target.value))}
            />
          </div>

          <div>
            <Label>Required to Unlock Phases</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Select which phases require passing this quiz to unlock
            </p>
            <div className="space-y-2 border rounded-md p-4 max-h-60 overflow-y-auto bg-muted/20">
              {courseId && linkedPhaseId && phases
                ?.filter(p => p.phase_order > (phases.find(ph => ph.id === linkedPhaseId)?.phase_order || 0))
                .map((phase) => (
                  <div key={phase.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`unlock-${phase.id}`}
                      checked={requiredForPhaseIds.includes(phase.id)}
                      onCheckedChange={(checked) => {
                        setRequiredForPhaseIds(prev => 
                          checked 
                            ? [...prev, phase.id]
                            : prev.filter(id => id !== phase.id)
                        );
                      }}
                    />
                    <label
                      htmlFor={`unlock-${phase.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {phase.title}
                    </label>
                  </div>
                ))}
              {(!courseId || !linkedPhaseId || phases?.filter(p => p.phase_order > (phases.find(ph => ph.id === linkedPhaseId)?.phase_order || 0)).length === 0) && (
                <p className="text-sm text-muted-foreground">
                  {!courseId ? 'Select a course first' : !linkedPhaseId ? 'Select a phase first' : 'No phases after the selected phase'}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {quiz ? 'Update' : 'Create'} Quiz
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
