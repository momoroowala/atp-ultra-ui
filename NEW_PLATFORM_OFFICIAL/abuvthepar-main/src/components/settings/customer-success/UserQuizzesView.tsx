import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, CheckCircle, XCircle, Trash } from "lucide-react";
import { format } from "date-fns";
import { QuizAnswersModal } from "./QuizAnswersModal";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { deleteQuizSubmission, deleteAllQuizSubmissionsForUser } from "@/utils/adminTaskActions";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface UserQuizzesViewProps {
  userId: string;
  quizzes: any[];
}

export const UserQuizzesView = ({ userId, quizzes }: UserQuizzesViewProps) => {
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [showAnswersModal, setShowAnswersModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState<{ quizId: string; quizTitle: string } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleViewAnswers = (quiz: any) => {
    setSelectedQuiz(quiz);
    setShowAnswersModal(true);
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    setProcessingId(submissionId);
    try {
      await deleteQuizSubmission(submissionId);
      toast({ title: "Success", description: "Quiz submission removed" });
      queryClient.invalidateQueries({ queryKey: ['user-details', userId] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['quiz-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['phase-unlock-status'] });
      queryClient.invalidateQueries({ queryKey: ['phase-unlock-details'] });
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to remove submission",
        variant: "destructive" 
      });
    } finally {
      setProcessingId(null);
      setConfirmDelete(null);
    }
  };

  const handleDeleteAllSubmissions = async (quizId: string) => {
    setProcessingId(quizId);
    try {
      await deleteAllQuizSubmissionsForUser(userId, quizId);
      toast({ title: "Success", description: "All quiz attempts removed" });
      queryClient.invalidateQueries({ queryKey: ['user-details', userId] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['quiz-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['phase-unlock-status'] });
      queryClient.invalidateQueries({ queryKey: ['phase-unlock-details'] });
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to remove all attempts",
        variant: "destructive" 
      });
    } finally {
      setProcessingId(null);
      setConfirmDeleteAll(null);
    }
  };

  // Group quizzes by quiz_id to show "Remove All" option
  const quizGroups = quizzes.reduce((acc, submission) => {
    const quizId = submission.quiz_id;
    if (!acc[quizId]) {
      acc[quizId] = [];
    }
    acc[quizId].push(submission);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz Submissions</CardTitle>
        <CardDescription>View and manage user quiz attempts</CardDescription>
      </CardHeader>
      <CardContent>
        {quizzes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No quiz submissions yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quiz</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Date Submitted</TableHead>
                <TableHead>Attempt</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quizzes.map((quiz, idx) => {
                const isFirstInGroup = idx === 0 || quizzes[idx - 1].quiz_id !== quiz.quiz_id;
                const attemptsForThisQuiz = quizGroups[quiz.quiz_id]?.length || 0;
                
                return (
                  <TableRow key={quiz.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {quiz.quizzes?.title || 'Unknown Quiz'}
                        {isFirstInGroup && attemptsForThisQuiz > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDeleteAll({ 
                              quizId: quiz.quiz_id, 
                              quizTitle: quiz.quizzes?.title || 'Unknown Quiz' 
                            })}
                            disabled={processingId === quiz.quiz_id}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash className="h-3 w-3 mr-1" />
                            Remove All ({attemptsForThisQuiz})
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{Math.round(quiz.score)}%</span>
                    </TableCell>
                    <TableCell>
                      {quiz.passed ? (
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
                    </TableCell>
                    <TableCell>
                      {format(new Date(quiz.submitted_at), 'MM/dd/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Attempt {quiz.attempt_number}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewAnswers(quiz)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Answers
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDelete(quiz.id)}
                          disabled={processingId === quiz.id}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {showAnswersModal && selectedQuiz && (
        <QuizAnswersModal
          submission={selectedQuiz}
          onClose={() => {
            setShowAnswersModal(false);
            setSelectedQuiz(null);
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmationDialog
          open={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => handleDeleteSubmission(confirmDelete)}
          title="Remove Quiz Submission?"
          description="This will permanently delete this quiz submission and allow the user to retake the quiz. This action cannot be undone."
          confirmText="Remove Submission"
          isDestructive
        />
      )}

      {confirmDeleteAll && (
        <ConfirmationDialog
          open={!!confirmDeleteAll}
          onClose={() => setConfirmDeleteAll(null)}
          onConfirm={() => handleDeleteAllSubmissions(confirmDeleteAll.quizId)}
          title="Remove All Quiz Attempts?"
          description={`This will permanently delete ALL attempts for "${confirmDeleteAll.quizTitle}" and allow the user to retake the quiz. This action cannot be undone.`}
          confirmText="Remove All Attempts"
          isDestructive
        />
      )}
    </Card>
  );
};
