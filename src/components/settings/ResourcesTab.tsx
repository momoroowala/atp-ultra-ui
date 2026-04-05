import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, FileText, Link as LinkIcon, BookOpen, Video, Trash2, Edit } from 'lucide-react';

const resourceTypeIcons = {
  pdf: FileText,
  link: LinkIcon,
  guide: BookOpen,
  video: Video,
};

export const ResourcesTab = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    resource_type: 'pdf' | 'link' | 'guide' | 'video';
    url: string;
    category: string;
  }>({
    title: '',
    description: '',
    resource_type: 'link',
    url: '',
    category: '',
  });

  const { data: resources, isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createResource = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('resources').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource created successfully');
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateResource = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase.from('resources').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource updated successfully');
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const deleteResource = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('resources').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Resource deleted successfully');
    },
  });

  const resetForm = () => {
    setFormData({ title: '', description: '', resource_type: 'link', url: '', category: '' });
    setEditingResource(null);
  };

  const handleSubmit = () => {
    if (editingResource) {
      updateResource.mutate({ id: editingResource.id, ...formData });
    } else {
      createResource.mutate(formData);
    }
  };

  const filteredResources = resources?.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingResource ? 'Edit Resource' : 'Add Resource'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.resource_type} onValueChange={(value: any) => setFormData({ ...formData, resource_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingResource ? 'Update' : 'Create'} Resource
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredResources?.map((resource) => {
          const Icon = resourceTypeIcons[resource.resource_type as keyof typeof resourceTypeIcons];
          return (
            <Card key={resource.id} className="hover-lift-subtle">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingResource(resource);
                        setFormData({
                          title: resource.title,
                          description: resource.description || '',
                          resource_type: resource.resource_type as 'pdf' | 'link' | 'guide' | 'video',
                          url: resource.url,
                          category: resource.category || '',
                        });
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteResource.mutate(resource.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {resource.category && <Badge variant="secondary">{resource.category}</Badge>}
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">{resource.description}</CardDescription>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    Open Resource
                  </a>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
