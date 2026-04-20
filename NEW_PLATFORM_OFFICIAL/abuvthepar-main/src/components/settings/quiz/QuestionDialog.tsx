import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useQuizQuestions } from '@/hooks/useQuizQuestions';
import { Plus, X } from 'lucide-react';

interface QuestionDialogProps {
  open: boolean;
  onClose: () => void;
  quizId: string;
  question?: any;
  nextOrder: number;
}

export const QuestionDialog = ({ open, onClose, quizId, question, nextOrder }: QuestionDialogProps) => {
  const [questionText, setQuestionText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [options, setOptions] = useState<{ id: string; text: string }[]>([
    { id: '1', text: '' },
    { id: '2', text: '' },
  ]);
  const [correctAnswerId, setCorrectAnswerId] = useState('1');

  const { createQuestion, updateQuestion } = useQuizQuestions(quizId);

  useEffect(() => {
    if (question) {
      setQuestionText(question.question_text || '');
      setExplanation(question.explanation || '');
      setOptions(question.answer_options || []);
      setCorrectAnswerId(question.correct_answer_id || '1');
    } else {
      setQuestionText('');
      setExplanation('');
      setOptions([
        { id: '1', text: '' },
        { id: '2', text: '' },
      ]);
      setCorrectAnswerId('1');
    }
  }, [question, open]);

  const addOption = () => {
    const newId = String(Math.max(...options.map(o => Number(o.id))) + 1);
    setOptions([...options, { id: newId, text: '' }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter(o => o.id !== id));
    if (correctAnswerId === id) {
      setCorrectAnswerId(options[0].id);
    }
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map(o => o.id === id ? { ...o, text } : o));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const questionData = {
      quiz_id: quizId,
      question_text: questionText,
      question_order: question?.question_order ?? nextOrder,
      answer_options: options,
      correct_answer_id: correctAnswerId,
      explanation: explanation || null,
    };

    if (question) {
      updateQuestion.mutate({ id: question.id, ...questionData }, { onSuccess: onClose });
    } else {
      createQuestion.mutate(questionData, { onSuccess: onClose });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{question ? 'Edit Question' : 'Add New Question'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="questionText">Question *</Label>
            <Textarea
              id="questionText"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter your question"
              required
              maxLength={500}
              rows={3}
            />
          </div>

          <div>
            <Label>Answer Options *</Label>
            <RadioGroup value={correctAnswerId} onValueChange={setCorrectAnswerId}>
              <div className="space-y-2 mt-2">
                {options.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                    <Input
                      value={option.text}
                      onChange={(e) => updateOption(option.id, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      required
                      className="flex-1"
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(option.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </RadioGroup>
            {options.length < 6 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              Select the correct answer by clicking the radio button
            </p>
          </div>

          <div>
            <Label htmlFor="explanation">Explanation (Optional)</Label>
            <Textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain why this is the correct answer"
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {question ? 'Update' : 'Add'} Question
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
