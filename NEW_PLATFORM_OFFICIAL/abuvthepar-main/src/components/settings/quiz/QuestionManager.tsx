import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, GripVertical, Edit, Trash2, CheckCircle } from 'lucide-react';
import { useQuizQuestions } from '@/hooks/useQuizQuestions';
import { QuestionDialog } from './QuestionDialog';
import { Card } from '@/components/ui/card';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface QuestionManagerProps {
  quizId: string;
}

const SortableQuestion = ({ question, onEdit, onDelete }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-4">
      <div className="flex items-start gap-3">
        <button {...attributes} {...listeners} className="cursor-grab mt-1">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-medium">{question.question_text}</p>
          <div className="mt-2 space-y-1">
            {question.answer_options?.map((option: any) => (
              <div key={option.id} className="flex items-center gap-2 text-sm">
                {option.id === question.correct_answer_id && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                <span className={option.id === question.correct_answer_id ? 'font-medium' : ''}>
                  {option.text}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(question)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(question.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export const QuestionManager = ({ quizId }: QuestionManagerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const { questions, deleteQuestion, reorderQuestions } = useQuizQuestions(quizId);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && questions) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);

      const reordered = arrayMove(questions, oldIndex, newIndex);
      const updates = reordered.map((q, index) => ({
        id: q.id,
        question_order: index,
      }));

      reorderQuestions.mutate(updates);
    }
  };

  const handleEdit = (question: any) => {
    setEditingQuestion(question);
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setEditingQuestion(null);
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Questions</h3>
        <Button size="sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      {questions && questions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No questions yet. Add your first question to get started.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={questions?.map(q => q.id) || []}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {questions?.map((question) => (
                <SortableQuestion
                  key={question.id}
                  question={question}
                  onEdit={handleEdit}
                  onDelete={deleteQuestion.mutate}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <QuestionDialog
        open={isDialogOpen}
        onClose={handleClose}
        quizId={quizId}
        question={editingQuestion}
        nextOrder={questions?.length || 0}
      />
    </div>
  );
};
