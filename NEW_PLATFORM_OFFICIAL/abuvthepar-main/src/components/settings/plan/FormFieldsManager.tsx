import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, GripVertical, Edit } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FormFieldsManagerProps {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
}

export const FormFieldsManager = ({ taskId, open, onOpenChange, children }: FormFieldsManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingField, setEditingField] = useState<any>(null);
  const [newField, setNewField] = useState({
    label: '',
    name: '',
    field_type: 'text',
    required: false,
    placeholder: '',
    help_text: '',
    options: [] as string[],
    default_value: '',
  });

  // Fetch form section
  const { data: formSection } = useQuery({
    queryKey: ['task-form-section', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discipline_task_sections')
        .select('*')
        .eq('task_id', taskId)
        .eq('section_type', 'form')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch form fields
  const { data: formFields } = useQuery({
    queryKey: ['task-form-fields', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discipline_task_form_fields')
        .select('*')
        .eq('task_id', taskId)
        .order('order_index');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Create form section mutation
  const createFormSection = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('discipline_task_sections').insert([{
        task_id: taskId,
        section_type: 'form',
        title: 'Form',
        data: {},
        order_index: 999,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-form-section', taskId] });
      toast({ title: 'Form section created' });
    },
    onError: (error: any) => {
      console.error('Error creating form section:', error);
      toast({ 
        title: 'Failed to create form section', 
        description: error.message || 'You may not have permission to create form sections.',
        variant: 'destructive' 
      });
    },
  });

  // Create form field mutation
  const createFormField = useMutation({
    mutationFn: async (data: any) => {
      const maxOrder = formFields && formFields.length > 0 
        ? Math.max(...formFields.map((f: any) => f.order_index)) 
        : -1;
      const { error } = await supabase.from('discipline_task_form_fields').insert([{
        ...data,
        order_index: maxOrder + 1,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-form-fields', taskId] });
      toast({ title: 'Field added successfully' });
      resetNewField();
    },
    onError: (error: any) => {
      console.error('Error creating form field:', error);
      toast({ 
        title: 'Failed to add field', 
        description: error.message || 'You may not have permission to add form fields. Please contact an administrator.',
        variant: 'destructive' 
      });
    },
  });

  // Update form field mutation
  const updateFormField = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('discipline_task_form_fields')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-form-fields', taskId] });
      toast({ title: 'Field updated successfully' });
      setEditingField(null);
    },
    onError: (error: any) => {
      console.error('Error updating form field:', error);
      toast({ 
        title: 'Failed to update field', 
        description: error.message || 'You may not have permission to update form fields.',
        variant: 'destructive' 
      });
    },
  });

  // Delete form field mutation
  const deleteFormField = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('discipline_task_form_fields')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-form-fields', taskId] });
      toast({ title: 'Field deleted successfully' });
    },
    onError: (error: any) => {
      console.error('Error deleting form field:', error);
      toast({ 
        title: 'Failed to delete field', 
        description: error.message || 'You may not have permission to delete form fields.',
        variant: 'destructive' 
      });
    },
  });

  const resetNewField = () => {
    setNewField({
      label: '',
      name: '',
      field_type: 'text',
      required: false,
      placeholder: '',
      help_text: '',
      options: [],
      default_value: '',
    });
  };

  const handleAddField = () => {
    if (!newField.label || !newField.name) {
      toast({ title: 'Label and Name are required', variant: 'destructive' });
      return;
    }

    if (!formSection) {
      createFormSection.mutate(undefined, {
        onSuccess: () => {
          createFormField.mutate({
            task_id: taskId,
            label: newField.label,
            name: newField.name,
            field_type: newField.field_type,
            required: newField.required,
            placeholder: newField.placeholder,
            help_text: newField.help_text,
            options: newField.options.length > 0 ? newField.options : null,
            default_value: newField.default_value || null,
          });
        },
      });
    } else {
      createFormField.mutate({
        task_id: taskId,
        label: newField.label,
        name: newField.name,
        field_type: newField.field_type,
        required: newField.required,
        placeholder: newField.placeholder,
        help_text: newField.help_text,
        options: newField.options.length > 0 ? newField.options : null,
        default_value: newField.default_value || null,
      });
    }
  };

  const handleUpdateField = () => {
    if (!editingField) return;
    updateFormField.mutate({
      id: editingField.id,
      data: {
        label: editingField.label,
        name: editingField.name,
        field_type: editingField.field_type,
        required: editingField.required,
        placeholder: editingField.placeholder,
        help_text: editingField.help_text,
        options: editingField.options?.length > 0 ? editingField.options : null,
        default_value: editingField.default_value || null,
      },
    });
  };

  const requiresOptions = (fieldType: string) => {
    return ['select', 'multiselect', 'radio'].includes(fieldType);
  };

  const isUploadField = (fieldType: string) => {
    return fieldType === 'upload';
  };

  return (
    <>
      {children && <div onClick={() => onOpenChange(true)}>{children}</div>}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Configure Exercise Form</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className="space-y-4">
            {/* Existing Fields */}
            {formFields && formFields.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-sm">Existing Fields</h3>
                {formFields.map((field: any) => (
                  <Card key={field.id} className="p-4">
                    {editingField?.id === field.id ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Label *</Label>
                            <Input
                              value={editingField.label}
                              onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Name (identifier) *</Label>
                            <Input
                              value={editingField.name}
                              onChange={(e) => setEditingField({ ...editingField, name: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Field Type</Label>
                            <Select
                              value={editingField.field_type}
                              onValueChange={(value) => setEditingField({ ...editingField, field_type: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="textarea">Textarea</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="date">Date</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="url">URL</SelectItem>
                                <SelectItem value="upload">Upload</SelectItem>
                                <SelectItem value="select">Select</SelectItem>
                                <SelectItem value="multiselect">Multi-select</SelectItem>
                                <SelectItem value="radio">Radio</SelectItem>
                                <SelectItem value="checkbox">Checkbox</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Placeholder</Label>
                            <Input
                              value={editingField.placeholder || ''}
                              onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                            />
                          </div>
                        </div>

                        {requiresOptions(editingField.field_type) && (
                          <div className="space-y-2">
                            <Label>Options</Label>
                            <Card className="p-3 space-y-2">
                              {(editingField.options || []).map((option: string, index: number) => (
                                <div key={index} className="flex gap-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => {
                                      const updatedOptions = [...(editingField.options || [])];
                                      updatedOptions[index] = e.target.value;
                                      setEditingField({ ...editingField, options: updatedOptions });
                                    }}
                                    placeholder="Enter option"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const updatedOptions = (editingField.options || []).filter((_: string, i: number) => i !== index);
                                      setEditingField({ ...editingField, options: updatedOptions });
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingField({ 
                                  ...editingField, 
                                  options: [...(editingField.options || []), ''] 
                                })}
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add option
                              </Button>
                            </Card>
                          </div>
                        )}

                        {isUploadField(editingField.field_type) && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                              <strong>Upload Field:</strong> Users will be able to upload multiple images and videos (up to 50MB each). 
                              Files are stored in the task-submissions bucket.
                            </p>
                          </div>
                        )}

                        <div>
                          <Label>Help Text</Label>
                          <Textarea
                            value={editingField.help_text || ''}
                            onChange={(e) => setEditingField({ ...editingField, help_text: e.target.value })}
                            rows={2}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`required-edit-${field.id}`}
                            checked={editingField.required}
                            onChange={(e) => setEditingField({ ...editingField, required: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor={`required-edit-${field.id}`} className="cursor-pointer">Required</Label>
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={handleUpdateField} size="sm">Save</Button>
                          <Button onClick={() => setEditingField(null)} variant="outline" size="sm">Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-start gap-4">
                        <GripVertical className="h-5 w-5 text-muted-foreground mt-1" />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">
                                {field.label} <span className="text-muted-foreground font-normal">({field.field_type})</span>
                                {field.required && <span className="text-destructive ml-1">*</span>}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                <span className="font-medium">name:</span> {field.name}
                              </p>
                              {field.options && field.options.length > 0 && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  <span className="font-medium">options:</span> {field.options.join(', ')}
                                </p>
                              )}
                              {field.help_text && (
                                <p className="text-xs text-muted-foreground mt-1">{field.help_text}</p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setEditingField(field)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => deleteFormField.mutate(field.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {/* Add New Field */}
            <Card className="p-4 space-y-4 bg-muted/50">
              <h3 className="font-medium">Add New Field</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Label *</Label>
                  <Input
                    value={newField.label}
                    onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                    placeholder="e.g., Your Name"
                  />
                </div>
                <div>
                  <Label>Name (identifier) *</Label>
                  <Input
                    value={newField.name}
                    onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                    placeholder="e.g., user_name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Field Type</Label>
                  <Select
                    value={newField.field_type}
                    onValueChange={(value) => setNewField({ ...newField, field_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="textarea">Textarea</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                      <SelectItem value="upload">Upload</SelectItem>
                      <SelectItem value="select">Select</SelectItem>
                      <SelectItem value="multiselect">Multi-select</SelectItem>
                      <SelectItem value="radio">Radio</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Placeholder</Label>
                  <Input
                    value={newField.placeholder}
                    onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                    placeholder="Optional placeholder text"
                  />
                </div>
              </div>

              {requiresOptions(newField.field_type) && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  <Card className="p-3 space-y-2">
                    {newField.options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const updatedOptions = [...newField.options];
                            updatedOptions[index] = e.target.value;
                            setNewField({ ...newField, options: updatedOptions });
                          }}
                          placeholder="Enter option"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updatedOptions = newField.options.filter((_, i) => i !== index);
                            setNewField({ ...newField, options: updatedOptions });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNewField({ ...newField, options: [...newField.options, ''] })}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add option
                    </Button>
                  </Card>
                </div>
              )}

              {isUploadField(newField.field_type) && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Upload Field:</strong> Users will be able to upload multiple images and videos (up to 50MB each). 
                    Files are stored in the task-submissions bucket.
                  </p>
                </div>
              )}

              <div>
                <Label>Help Text</Label>
                <Textarea
                  value={newField.help_text}
                  onChange={(e) => setNewField({ ...newField, help_text: e.target.value })}
                  placeholder="Optional helper text shown below the field"
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="required-new"
                  checked={newField.required}
                  onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="required-new" className="cursor-pointer">Required</Label>
              </div>

              <Button 
                onClick={handleAddField} 
                disabled={!newField.label || !newField.name || (requiresOptions(newField.field_type) && newField.options.length === 0)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
    </>
  );
};
