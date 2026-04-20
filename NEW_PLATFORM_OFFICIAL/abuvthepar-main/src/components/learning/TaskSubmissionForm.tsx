import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Task } from '@/hooks/usePhasesWithTasks';
import confetti from 'canvas-confetti';
import { FileUploadField } from './FileUploadField';
import { tryGraduateOnboarding } from '@/utils/onboardingGraduation';

interface TaskSubmissionFormProps {
  task: Task;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Record<string, any>;
  isEditing?: boolean;
}

interface FormField {
  id: string;
  name: string;
  label: string;
  field_type: string;
  required: boolean;
  placeholder?: string;
  help_text?: string;
  options?: string[];
  default_value?: string;
  order_index: number;
}

export const TaskSubmissionForm = ({
  task,
  onSuccess,
  onCancel,
  initialData,
  isEditing = false,
}: TaskSubmissionFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, any>>(initialData || {});

  const { data: formFields = [] } = useQuery({
    queryKey: ['task-form-fields', task.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discipline_task_form_fields')
        .select('*')
        .eq('task_id', task.id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as FormField[];
    },
  });

  useEffect(() => {
    if (formFields.length > 0 && !initialData) {
      const defaultData: Record<string, any> = {};
      formFields.forEach(field => {
        if (field.field_type === 'upload') {
          defaultData[field.name] = [];
        } else if (field.field_type === 'checkbox') {
          defaultData[field.name] = field.default_value === 'true';
        } else {
          defaultData[field.name] = field.default_value || '';
        }
      });
      setFormData(defaultData);
    }
  }, [formFields, initialData]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      // Session guard: verify auth before proceeding
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUserId = sessionData?.session?.user?.id;
      if (!sessionUserId || sessionUserId !== user!.id) {
        throw new Error('Your session has expired. Please sign in again and resubmit.');
      }

      // Update task_responses - mark as completed only for new submissions
      const { error: responseError } = await supabase
        .from('task_responses')
        .upsert(
          {
            user_id: user!.id,
            task_id: task.id,
            status: isEditing ? 'completed' : 'completed', // Keep completed for both
            response: formData,
            completed_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,task_id',
          }
        );

      if (responseError) {
        console.error('Module response error:', responseError);
        throw new Error(responseError.message || 'Failed to save task response');
      }

      // Save or update submission record (use upsert to handle both cases)
      const { error: submissionError } = await supabase
        .from('user_task_submissions')
        .upsert(
          {
            user_id: user!.id,
            task_id: task.id,
            data: formData,
          },
          {
            onConflict: 'user_id,task_id',
          }
        );

      if (submissionError) {
        console.error('Submission error:', submissionError);
        throw new Error(submissionError.message || 'Failed to save submission');
      }

      // Award points only for first-time completion (when not editing)
      if (!isEditing) {
        const { error: rpcError } = await supabase.rpc('award_points_for_task', {
          p_task_id: task.id,
          p_points: task.points,
          p_description: `Completed: ${task.title}`,
          p_activity_type: 'task_completion',
        });

        if (rpcError && !rpcError.message?.includes('already')) {
          throw rpcError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-with-sections'] });
      queryClient.invalidateQueries({ queryKey: ['task-progress'] });
      queryClient.invalidateQueries({ queryKey: ['phases-with-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['phase-unlock-details'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      if (user) tryGraduateOnboarding(user.id, task.id, queryClient);
      
      // Always show confetti on task completion
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      
      toast.success(isEditing ? '✅ Submission Updated!' : '🎉 Congratulations!', {
        description: isEditing 
          ? 'Your submission has been updated successfully!'
          : `Module completed! You earned ${task.points} points!`,
      });
      
      onSuccess();
    },
    onError: (error) => {
      console.error('Full submission error:', error);
      const errorMessage = (error as Error)?.message || 'Unknown error';
      toast.error('Submission failed', {
        description: errorMessage,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const requiredFields = formFields.filter(f => f.required);
    for (const field of requiredFields) {
      const value = formData[field.name];
      
      // For checkboxes, require them to be checked (true)
      if (field.field_type === 'checkbox') {
        if (value !== true) {
          toast.error(`Please check: ${field.label}`);
          return;
        }
      } else {
        // For other fields, check if empty
        if (!value || (Array.isArray(value) && value.length === 0) || value === '') {
          toast.error(`${field.label} is required`);
          return;
        }
      }
    }
    
    submitMutation.mutate();
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name];
    
    const updateField = (newValue: any) => {
      setFormData(prev => ({ ...prev, [field.name]: newValue }));
    };

    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'url':
      case 'number':
      case 'date':
        return (
          <div key={field.id} className="space-y-3">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive/80 ml-1 text-xs">*</span>}
            </Label>
            {field.help_text && (
              <p className="text-sm text-muted-foreground leading-relaxed">{field.help_text}</p>
            )}
            <Input
              id={field.name}
              type={field.field_type}
              value={value || ''}
              onChange={(e) => updateField(e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-3">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive/80 ml-1 text-xs">*</span>}
            </Label>
            {field.help_text && (
              <p className="text-sm text-muted-foreground leading-relaxed">{field.help_text}</p>
            )}
            <Textarea
              id={field.name}
              value={value || ''}
              onChange={(e) => updateField(e.target.value)}
              placeholder={field.placeholder}
              rows={6}
              required={field.required}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-3">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive/80 ml-1 text-xs">*</span>}
            </Label>
            {field.help_text && (
              <p className="text-sm text-muted-foreground leading-relaxed">{field.help_text}</p>
            )}
            <Select value={value || ''} onValueChange={updateField}>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option, idx) => (
                  <SelectItem key={idx} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="space-y-3">
            <Label className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive/80 ml-1 text-xs">*</span>}
            </Label>
            {field.help_text && (
              <p className="text-sm text-muted-foreground leading-relaxed">{field.help_text}</p>
            )}
            <RadioGroup value={value || ''} onValueChange={updateField}>
              {field.options?.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.name}-${idx}`} />
                  <Label htmlFor={`${field.name}-${idx}`} className="font-normal">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-3">
            <div className="flex items-start space-x-3">
              <Checkbox
                id={field.name}
                checked={value || false}
                onCheckedChange={updateField}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor={field.name} className="text-sm font-medium cursor-pointer">
                  {field.label}
                  {field.required && <span className="text-destructive/80 ml-1 text-xs">*</span>}
                </Label>
                {field.help_text && (
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">{field.help_text}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'upload':
        return (
          <FileUploadField
            key={field.id}
            fieldName={field.name}
            label={field.label}
            required={field.required}
            helpText={field.help_text}
            value={value || []}
            onChange={updateField}
          />
        );

      default:
        return null;
    }
  };

  if (formFields.length === 0) {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="response" className="text-sm font-medium">Your Response</Label>
          <Textarea
            id="response"
            value={formData.text || ''}
            onChange={(e) => setFormData({ text: e.target.value })}
            placeholder="Enter your response here..."
            rows={8}
            required
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? 'Submitting...' : 'Submit'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitMutation.isPending}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isEditing && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 mb-6">
          <p className="text-sm font-medium">
            ✏️ Editing your previous submission
          </p>
        </div>
      )}
      <fieldset disabled={submitMutation.isPending} className="space-y-6">
        {formFields.map(field => renderField(field))}

        <div className="flex gap-3 pt-6 border-t">
          <Button type="submit" disabled={submitMutation.isPending} size="lg">
            {submitMutation.isPending ? (isEditing ? 'Updating...' : 'Submitting...') : (isEditing ? 'Update Submission' : 'Submit')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitMutation.isPending}
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </fieldset>
    </form>
  );
};
