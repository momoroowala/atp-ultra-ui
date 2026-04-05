import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Video, FileText, FormInput, Trash2, GripVertical, Play, Pencil, ClipboardList, Loader2 } from 'lucide-react';
import { FormFieldsManager } from './FormFieldsManager';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { detectVideoProvider } from '@/utils/videoEmbedHelpers';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableSectionCardProps {
  section: any;
  onEdit: (section: any) => void;
  onDelete: (id: string) => void;
  setFormFieldsOpen: (open: boolean) => void;
}

const SortableSectionCard = ({ 
  section, 
  onEdit, 
  onDelete,
  setFormFieldsOpen 
}: SortableSectionCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={`p-3 ${section.section_type === 'form' ? 'cursor-pointer hover:border-primary transition-colors' : ''}`}
      onPointerDown={(e) => {
        // Only stop propagation for form cards to prevent drag on click
        if (section.section_type === 'form') {
          e.stopPropagation();
        }
      }}
      onClick={() => {
        if (section.section_type === 'form') {
          setFormFieldsOpen(true);
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GripVertical 
            {...attributes}
            {...listeners}
            className="h-4 w-4 text-muted-foreground cursor-grab hover:text-foreground transition-colors active:cursor-grabbing" 
          />
          {section.section_type === 'video' && <Play className="h-4 w-4 text-primary" />}
          {section.section_type === 'readout' && <FileText className="h-4 w-4 text-primary" />}
          {section.section_type === 'form' && <FormInput className="h-4 w-4 text-primary" />}
          <div>
            <div className="font-medium text-sm">{section.title}</div>
            <div className="text-xs text-muted-foreground capitalize">{section.section_type}</div>
          </div>
        </div>
        <div className="flex gap-1">
          {section.section_type !== 'form' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(section);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(section.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
  onSave: (data: any) => void;
  children?: React.ReactNode;
  phaseId?: string;
  taskOrder?: number;
  mode?: 'module' | 'task';
}

export const TaskDialog = ({ open, onOpenChange, task, onSave, children, phaseId, taskOrder, mode = 'module' }: TaskDialogProps) => {
  const queryClient = useQueryClient();
  const [formFieldsOpen, setFormFieldsOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionDialog, setEditSectionDialog] = useState(false);
  const [editSectionData, setEditSectionData] = useState({ title: '', content: '', video_url: '', subtitle: '' });
  const [newVideoSection, setNewVideoSection] = useState({ title: '', video_url: '', subtitle: '' });
  const [newReadoutSection, setNewReadoutSection] = useState({ title: '', content_html: '' });
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: 50,
    due_date_enabled: false,
    due_date_start_type: 'join_date',
    due_date_start_phase_id: null as string | null,
    due_date_days: 7,
    plan_group: '',
    linked_module_id: null as string | null,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch task sections
  const { data: sections } = useQuery({
    queryKey: ['task-sections', task?.id],
    queryFn: async () => {
      if (!task?.id) return [];
      const { data, error } = await supabase
        .from('discipline_task_sections')
        .select('*')
        .eq('task_id', task.id)
        .order('order_index');
      if (error) throw error;
      return data;
    },
    enabled: open && !!task?.id,
  });

  const sortableItems = useMemo(
    () => (sections && sections.length > 0 ? sections.map((s: any) => s.id) : []),
    [sections]
  );


  const { data: previousPhases } = useQuery({
    queryKey: ['previous-phases-for-due-date'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phases')
        .select('id, title')
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: open && formData.due_date_enabled && formData.due_date_start_type === 'phase_completion',
  });

  // Fetch available modules for linking (task mode only)
  const { data: availableModules } = useQuery({
    queryKey: ['available-modules-for-linking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, phase_id, phases!inner(title)')
        .eq('show_in_course', true)
        .eq('is_active', true)
        .order('task_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: open && mode === 'task',
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        points: task.points || 50,
        due_date_enabled: task.due_date_enabled || false,
        due_date_start_type: task.due_date_start_type || 'join_date',
        due_date_start_phase_id: task.due_date_start_phase_id || null,
        due_date_days: task.due_date_days || 7,
        plan_group: task.plan_group || '',
        linked_module_id: task.linked_module_id || null,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        points: 50,
        due_date_enabled: false,
        due_date_start_type: 'join_date',
        due_date_start_phase_id: null,
        due_date_days: 7,
        plan_group: '',
        linked_module_id: null,
      });
    }
  }, [task, open]);

  // Section mutations
  const createSection = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('discipline_task_sections').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-sections', task?.id] });
      toast.success('Section added successfully');
    },
  });

  const deleteSection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('discipline_task_sections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-sections', task?.id] });
      toast.success('Section deleted');
    },
  });

  const updateSection = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('discipline_task_sections')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-sections', task?.id] });
      toast.success('Section updated successfully');
      setEditSectionDialog(false);
      setEditingSectionId(null);
    },
  });

  const createFormSection = useMutation({
    mutationFn: async () => {
      if (!task?.id) throw new Error('Module ID required');
      const maxOrder = sections && sections.length > 0 ? Math.max(...sections.map((s: any) => s.order_index)) : -1;
      const { error } = await supabase.from('discipline_task_sections').insert([{
        task_id: task.id,
        section_type: 'form',
        title: 'Exercise Form',
        data: {},
        order_index: maxOrder + 1,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-sections', task?.id] });
      toast.success('Form section created');
    },
  });

  const reorderSections = useMutation({
    mutationFn: async (updates: { id: string; order_index: number }[]) => {
      const promises = updates.map(({ id, order_index }) =>
        supabase
          .from('discipline_task_sections')
          .update({ order_index })
          .eq('id', id)
      );
      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-sections', task?.id] });
      toast.success('Section order updated');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !sections) return;

    const oldIndex = sections.findIndex((s: any) => s.id === active.id);
    const newIndex = sections.findIndex((s: any) => s.id === over.id);

    if (oldIndex === newIndex) return;

    const reorderedSections = arrayMove(sections, oldIndex, newIndex);
    
    const updates = reorderedSections.map((section: any, index) => ({
      id: section.id,
      order_index: index,
    }));

    reorderSections.mutate(updates);
  };

  const handleAddVideoSection = () => {
    if (!task?.id) return;
    const maxOrder = sections && sections.length > 0 ? Math.max(...sections.map((s: any) => s.order_index)) : -1;
    createSection.mutate({
      task_id: task.id,
      section_type: 'video',
      title: 'Video Section',
      data: {
        video_url: 'https://example.com/video',
        duration: 0,
        subtitle: '',
      },
      order_index: maxOrder + 1,
    });
  };

  const handleAddReadoutSection = () => {
    if (!task?.id) return;
    const maxOrder = sections && sections.length > 0 ? Math.max(...sections.map((s: any) => s.order_index)) : -1;
    createSection.mutate({
      task_id: task.id,
      section_type: 'readout',
      title: 'Readout Section',
      data: { content_html: '<p>Add your content here</p>' },
      order_index: maxOrder + 1,
    });
  };

  const handleEditSection = (section: any) => {
    setEditingSectionId(section.id);
    if (section.section_type === 'video') {
      setEditSectionData({
        title: section.title,
        video_url: section.data?.video_url || '',
        subtitle: section.data?.subtitle || '',
        content: '',
      });
    } else if (section.section_type === 'readout') {
      setEditSectionData({
        title: section.title,
        content: section.data?.content_html || '',
        video_url: '',
        subtitle: '',
      });
    }
    setEditSectionDialog(true);
  };

  const fetchVideoMetadata = async (videoUrl: string) => {
    const provider = detectVideoProvider(videoUrl);
    if (provider !== 'vimeo' && provider !== 'youtube') {
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('get-video-metadata', {
        body: { video_url: videoUrl },
      });

      if (error) {
        console.error('Error fetching video metadata:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error fetching video metadata:', err);
      return null;
    }
  };

  const handleSaveEditedSection = async () => {
    if (!editingSectionId) return;
    const section = sections?.find((s: any) => s.id === editingSectionId);
    if (!section) return;

    let updateData: any = { title: editSectionData.title };
    
    if (section.section_type === 'video') {
      setIsFetchingMetadata(true);
      
      // Fetch video metadata (duration and thumbnail) from edge function
      const metadata = await fetchVideoMetadata(editSectionData.video_url);
      
      updateData.data = {
        video_url: editSectionData.video_url,
        duration: metadata?.duration_seconds || 0,
        thumbnail_url: metadata?.thumbnail_url || undefined,
        subtitle: editSectionData.subtitle,
      };
      
      setIsFetchingMetadata(false);
    } else if (section.section_type === 'readout') {
      updateData.data = {
        content_html: editSectionData.content,
      };
    }

    updateSection.mutate({ id: editingSectionId, data: updateData });
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill all required fields (Title, Description)');
      return;
    }

    if (!formData.points || formData.points < 1) {
      toast.error('Points must be at least 1');
      return;
    }

    onSave({ ...formData, task_type: 'custom' });
  };




  return (
    <>
      {children}
      <Dialog open={open} onOpenChange={(v) => {
        if (!v) {
          setEditSectionDialog(false);
          setEditingSectionId(null);
        }
        onOpenChange(v);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{task ? 'Edit' : 'Create'} {mode === 'task' ? 'Task' : 'Module'}</DialogTitle>
            <DialogDescription className="sr-only">
              {task ? 'Edit' : 'Create'} {mode === 'task' ? 'task' : 'module'} details
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(100vh-200px)] pr-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={mode === 'task' ? 'Task title' : 'Module title'}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief summary"
                  rows={3}
                  required
                />
              </div>
              {!task && (
                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Note:</strong> After saving, you can add content sections by clicking "Edit" on the card.
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Points *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 50 })}
                  required
                />
              </div>

              {/* Task-mode only fields */}
              {mode === 'task' && (
                <>
                  <div className="space-y-2">
                    <Label>Plan Group</Label>
                    <Input
                      value={formData.plan_group}
                      onChange={(e) => setFormData({ ...formData, plan_group: e.target.value })}
                      placeholder="e.g., Getting Started, Week 1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Grouping headline shown on the My Roadmap page
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Link to Course Module</Label>
                    <Select
                      value={formData.linked_module_id || 'none'}
                      onValueChange={(value) => setFormData({ ...formData, linked_module_id: value === 'none' ? null : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No linked module" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No linked module</SelectItem>
                        {availableModules?.map((m: any) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.phases?.title ? `${m.phases.title} → ` : ''}{m.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Links a "Watch Video" button to a course module
                    </p>
                  </div>

                  {/* Due Date Configuration */}
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="due_date_enabled"
                        checked={formData.due_date_enabled}
                        onChange={(e) => setFormData({ ...formData, due_date_enabled: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="due_date_enabled" className="cursor-pointer">Enable Due Date</Label>
                    </div>

                    {formData.due_date_enabled && (
                      <div className="space-y-3 ml-6">
                        <div>
                          <Label>Start Type</Label>
                          <Select
                            value={formData.due_date_start_type}
                            onValueChange={(value) => setFormData({ ...formData, due_date_start_type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="join_date">Join Date</SelectItem>
                              <SelectItem value="phase_completion">Phase Completion</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.due_date_start_type === 'phase_completion' && (
                          <div>
                            <Label>Start Phase</Label>
                            <Select
                              value={formData.due_date_start_phase_id || ''}
                              onValueChange={(value) => setFormData({ ...formData, due_date_start_phase_id: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select phase..." />
                              </SelectTrigger>
                              <SelectContent>
                                {previousPhases?.map((phase: any) => (
                                  <SelectItem key={phase.id} value={phase.id}>
                                    {phase.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div>
                          <Label>Days Until Due</Label>
                          <Input
                            type="number"
                            min="1"
                            value={formData.due_date_days}
                            onChange={(e) => setFormData({ ...formData, due_date_days: parseInt(e.target.value) || 7 })}
                          />
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Due {formData.due_date_days} days after{' '}
                          {formData.due_date_start_type === 'phase_completion' ? 'phase completion' : 'user joins'}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Task Sections - Only for existing tasks */}
              {task?.id && (
                <div className="space-y-4 border-t pt-6">
                  <div>
                    <h3 className="font-medium text-lg">Content Sections</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {mode === 'task' ? 'Add form sections to this task' : 'Add video/readout content to this module'}
                    </p>
                  </div>

                  {/* Action Buttons - mode aware */}
                  <div className={`grid gap-3 ${mode === 'task' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {mode === 'module' && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-auto py-4 flex-col gap-2"
                          onClick={handleAddVideoSection}
                        >
                          <Video className="h-5 w-5" />
                          <span className="text-sm font-medium">Add Video</span>
                        </Button>
                        
                        <Button
                          type="button"
                          variant="outline"
                          className="h-auto py-4 flex-col gap-2"
                          onClick={handleAddReadoutSection}
                        >
                          <FileText className="h-5 w-5" />
                          <span className="text-sm font-medium">Add Readout</span>
                        </Button>
                      </>
                    )}
                    
                    {mode === 'task' && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto py-4 flex-col gap-2"
                        onClick={() => createFormSection.mutate()}
                      >
                        <ClipboardList className="h-5 w-5" />
                        <span className="text-sm font-medium">Add Form</span>
                      </Button>
                    )}
                  </div>
                  
                  {/* Existing Sections */}
                  {sections && sections.length > 0 && sortableItems.length > 0 && (
                    <DndContext
                      id="task-sections-dnd"
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleSectionDragEnd}
                    >
                      <SortableContext
                        items={sortableItems}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {sections.map((section: any) => (
                            <SortableSectionCard
                              key={section.id}
                              section={section}
                              onEdit={handleEditSection}
                              onDelete={(id) => deleteSection.mutate(id)}
                              setFormFieldsOpen={setFormFieldsOpen}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
          <Button onClick={handleSubmit} className="w-full mt-4">
            {task ? 'Update' : 'Create'} {mode === 'task' ? 'Task' : 'Module'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Form Fields Manager Dialog */}
      {task?.id && (
        <FormFieldsManager
          taskId={task.id}
          open={formFieldsOpen}
          onOpenChange={setFormFieldsOpen}
        />
      )}

      {/* Section Edit Dialog for Video/Readout */}
      <Dialog open={editSectionDialog} onOpenChange={setEditSectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
            <DialogDescription className="sr-only">Edit section content</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={editSectionData.title}
                  onChange={(e) => setEditSectionData({ ...editSectionData, title: e.target.value })}
                  placeholder="Section title"
                />
              </div>

              {sections?.find((s: any) => s.id === editingSectionId)?.section_type === 'video' && (
                <>
                  <div className="space-y-2">
                    <Label>Video URL</Label>
                    <Input
                      value={editSectionData.video_url}
                      onChange={(e) => setEditSectionData({ ...editSectionData, video_url: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/... or https://drive.google.com/..."
                    />
                    <p className="text-sm text-muted-foreground">
                      Supports YouTube (unlisted recommended for security), Vimeo, and Google Drive. Videos are automatically embedded with privacy protections to prevent easy sharing. Duration and thumbnail are fetched automatically.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Subtitle</Label>
                    <Input
                      value={editSectionData.subtitle}
                      onChange={(e) => setEditSectionData({ ...editSectionData, subtitle: e.target.value })}
                      placeholder="Optional subtitle"
                    />
                  </div>
                </>
              )}

              {sections?.find((s: any) => s.id === editingSectionId)?.section_type === 'readout' && (
                <div className="space-y-2">
                  <Label>Content</Label>
                  <ReactQuill
                    value={editSectionData.content}
                    onChange={(value) => setEditSectionData({ ...editSectionData, content: value })}
                    className="bg-background"
                  />
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditSectionDialog(false)} className="flex-1" disabled={isFetchingMetadata}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditedSection} className="flex-1" disabled={isFetchingMetadata}>
              {isFetchingMetadata ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fetching metadata...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
