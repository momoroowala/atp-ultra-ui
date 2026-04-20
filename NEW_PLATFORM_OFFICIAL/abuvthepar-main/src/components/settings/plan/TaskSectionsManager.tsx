import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { sanitizeHtml } from '@/utils/sanitizeHtml';

interface TaskSectionsManagerProps {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TaskSectionsManager = ({ taskId, open, onOpenChange }: TaskSectionsManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sections } = useQuery({
    queryKey: ['task-sections', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discipline_task_sections')
        .select('*')
        .eq('task_id', taskId)
        .order('order_index');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

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

  const createSection = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('discipline_task_sections').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-sections', taskId] });
      toast({ title: 'Section added successfully' });
    },
  });

  const deleteSection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('discipline_task_sections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-sections', taskId] });
      toast({ title: 'Section deleted' });
    },
  });

  const videoSections = sections?.filter(s => s.section_type === 'video') || [];
  const readoutSections = sections?.filter(s => s.section_type === 'readout') || [];
  const formSection = sections?.find(s => s.section_type === 'form');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Module Sections</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="videos">Videos ({videoSections.length})</TabsTrigger>
            <TabsTrigger value="readouts">Readouts ({readoutSections.length})</TabsTrigger>
            <TabsTrigger value="form">Form ({formSection ? '1' : '0'})</TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="space-y-4">
            <VideoSectionTab
              taskId={taskId}
              sections={videoSections}
              onAdd={createSection.mutate}
              onDelete={deleteSection.mutate}
            />
          </TabsContent>

          <TabsContent value="readouts" className="space-y-4">
            <ReadoutSectionTab
              taskId={taskId}
              sections={readoutSections}
              onAdd={createSection.mutate}
              onDelete={deleteSection.mutate}
            />
          </TabsContent>

          <TabsContent value="form" className="space-y-4">
            <FormSectionTab
              taskId={taskId}
              formSection={formSection}
              formFields={formFields || []}
              onAddSection={createSection.mutate}
              onDeleteSection={deleteSection.mutate}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

// Video Section Tab
const VideoSectionTab = ({ taskId, sections, onAdd, onDelete }: any) => {
  const [newVideo, setNewVideo] = useState({ title: '', video_url: '', duration: 0, subtitle: '' });

  const handleAdd = () => {
    const maxOrder = sections.length > 0 ? Math.max(...sections.map((s: any) => s.order_index)) : -1;
    onAdd({
      task_id: taskId,
      section_type: 'video',
      title: newVideo.title,
      data: {
        video_url: newVideo.video_url,
        duration: Number(newVideo.duration),
        subtitle: newVideo.subtitle,
      },
      order_index: maxOrder + 1,
    });
    setNewVideo({ title: '', video_url: '', duration: 0, subtitle: '' });
  };

  return (
    <div className="space-y-4">
      {sections.map((section: any) => (
        <Card key={section.id} className="p-4">
          <div className="flex items-start gap-4">
            <GripVertical className="h-5 w-5 text-muted-foreground mt-2" />
            <div className="flex-1">
              <h4 className="font-medium">{section.title}</h4>
              <p className="text-sm text-muted-foreground">{section.data?.video_url}</p>
              <p className="text-xs text-muted-foreground">Duration: {section.data?.duration} min</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onDelete(section.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}

      <Card className="p-4 space-y-4">
        <h4 className="font-medium">Add Video Section</h4>
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input
              value={newVideo.title}
              onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
              placeholder="e.g., Introduction Video"
            />
          </div>
          <div>
            <Label>Video URL</Label>
            <Input
              value={newVideo.video_url}
              onChange={(e) => setNewVideo({ ...newVideo, video_url: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={newVideo.duration}
                onChange={(e) => setNewVideo({ ...newVideo, duration: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input
                value={newVideo.subtitle}
                onChange={(e) => setNewVideo({ ...newVideo, subtitle: e.target.value })}
                placeholder="Optional subtitle"
              />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={!newVideo.title || !newVideo.video_url}>
            <Plus className="h-4 w-4 mr-2" />
            Add Video
          </Button>
        </div>
      </Card>
    </div>
  );
};

// Readout Section Tab
const ReadoutSectionTab = ({ taskId, sections, onAdd, onDelete }: any) => {
  const [newReadout, setNewReadout] = useState({ title: '', content_html: '' });

  const handleAdd = () => {
    const maxOrder = sections.length > 0 ? Math.max(...sections.map((s: any) => s.order_index)) : -1;
    onAdd({
      task_id: taskId,
      section_type: 'readout',
      title: newReadout.title,
      data: { content_html: newReadout.content_html },
      order_index: maxOrder + 1,
    });
    setNewReadout({ title: '', content_html: '' });
  };

  return (
    <div className="space-y-4">
      {sections.map((section: any) => (
        <Card key={section.id} className="p-4">
          <div className="flex items-start gap-4">
            <GripVertical className="h-5 w-5 text-muted-foreground mt-2" />
            <div className="flex-1">
              <h4 className="font-medium">{section.title}</h4>
              <div className="text-sm text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.data?.content_html || '') }} />
            </div>
            <Button variant="ghost" size="sm" onClick={() => onDelete(section.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}

      <Card className="p-4 space-y-4">
        <h4 className="font-medium">Add Readout Section</h4>
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input
              value={newReadout.title}
              onChange={(e) => setNewReadout({ ...newReadout, title: e.target.value })}
              placeholder="e.g., Key Concepts"
            />
          </div>
          <div>
            <Label>Content</Label>
            <ReactQuill
              value={newReadout.content_html}
              onChange={(value) => setNewReadout({ ...newReadout, content_html: value })}
              className="bg-background"
            />
          </div>
          <Button onClick={handleAdd} disabled={!newReadout.title || !newReadout.content_html}>
            <Plus className="h-4 w-4 mr-2" />
            Add Readout
          </Button>
        </div>
      </Card>
    </div>
  );
};

// Form Section Tab
const FormSectionTab = ({ taskId, formSection, formFields, onAddSection, onDeleteSection }: any) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newField, setNewField] = useState({
    label: '',
    name: '',
    field_type: 'text',
    required: false,
    placeholder: '',
    help_text: '',
  });

  const createFormField = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('discipline_task_form_fields').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-form-fields', taskId] });
      toast({ title: 'Form field added' });
      setNewField({
        label: '',
        name: '',
        field_type: 'text',
        required: false,
        placeholder: '',
        help_text: '',
      });
    },
  });

  const deleteFormField = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('discipline_task_form_fields').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-form-fields', taskId] });
      toast({ title: 'Form field deleted' });
    },
  });

  const handleCreateFormSection = () => {
    onAddSection({
      task_id: taskId,
      section_type: 'form',
      title: 'Form',
      data: {},
      order_index: 999, // Forms typically go last
    });
  };

  const handleAddField = () => {
    const maxOrder = formFields.length > 0 ? Math.max(...formFields.map((f: any) => f.order_index)) : -1;
    createFormField.mutate({
      task_id: taskId,
      ...newField,
      order_index: maxOrder + 1,
    });
  };

  if (!formSection) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No form section created yet</p>
        <Button onClick={handleCreateFormSection}>
          <Plus className="h-4 w-4 mr-2" />
          Create Form Section
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Form Fields ({formFields.length})</h4>
        <Button variant="destructive" size="sm" onClick={() => onDeleteSection(formSection.id)}>
          Delete Form Section
        </Button>
      </div>

      {formFields.map((field: any) => (
        <Card key={field.id} className="p-4">
          <div className="flex items-start gap-4">
            <GripVertical className="h-5 w-5 text-muted-foreground mt-2" />
            <div className="flex-1">
              <h5 className="font-medium">{field.label} {field.required && <span className="text-destructive">*</span>}</h5>
              <p className="text-sm text-muted-foreground">Type: {field.field_type} | Name: {field.name}</p>
              {field.help_text && <p className="text-xs text-muted-foreground">{field.help_text}</p>}
            </div>
            <Button variant="ghost" size="sm" onClick={() => deleteFormField.mutate(field.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}

      <Card className="p-4 space-y-4">
        <h4 className="font-medium">Add Form Field</h4>
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
            <Label>Name *</Label>
            <Input
              value={newField.name}
              onChange={(e) => setNewField({ ...newField, name: e.target.value })}
              placeholder="e.g., user_name"
            />
          </div>
          <div>
            <Label>Field Type</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={newField.field_type}
              onChange={(e) => setNewField({ ...newField, field_type: e.target.value })}
            >
              <option value="text">Text</option>
              <option value="textarea">Textarea</option>
              <option value="email">Email</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="select">Select</option>
              <option value="radio">Radio</option>
              <option value="checkbox">Checkbox</option>
              <option value="file">File</option>
            </select>
          </div>
          <div>
            <Label>Placeholder</Label>
            <Input
              value={newField.placeholder}
              onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <Label>Help Text</Label>
            <Textarea
              value={newField.help_text}
              onChange={(e) => setNewField({ ...newField, help_text: e.target.value })}
              rows={2}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="required"
              checked={newField.required}
              onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="required" className="cursor-pointer">Required</Label>
          </div>
        </div>
        <Button onClick={handleAddField} disabled={!newField.label || !newField.name}>
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </Card>
    </div>
  );
};
