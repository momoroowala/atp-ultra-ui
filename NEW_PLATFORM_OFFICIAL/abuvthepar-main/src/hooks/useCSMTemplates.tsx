import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CSMTemplate {
  id: string;
  created_by: string;
  title: string;
  content: string;
  trigger_type: string;
  schedule_interval: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateInput {
  title: string;
  content: string;
  trigger_type: string;
  schedule_interval?: string;
}

export function useCSMTemplates() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['csm-dm-templates'],
    queryFn: async (): Promise<CSMTemplate[]> => {
      const { data, error } = await supabase
        .from('csm_dm_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as CSMTemplate[];
    },
    enabled: !!user,
  });

  const createTemplate = useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      // If on_assignment, revert all existing on_assignment templates to manual
      if (input.trigger_type === 'on_assignment') {
        await supabase
          .from('csm_dm_templates')
          .update({ trigger_type: 'manual' } as any)
          .eq('trigger_type', 'on_assignment');
      }

      const { data, error } = await supabase
        .from('csm_dm_templates')
        .insert({
          created_by: user!.id,
          title: input.title,
          content: input.content,
          trigger_type: input.trigger_type,
          schedule_interval: input.schedule_interval || null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['csm-dm-templates'] });
      toast.success('Template created');
    },
    onError: () => toast.error('Failed to create template'),
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...input }: CreateTemplateInput & { id: string }) => {
      if (input.trigger_type === 'on_assignment') {
        await supabase
          .from('csm_dm_templates')
          .update({ trigger_type: 'manual' } as any)
          .eq('trigger_type', 'on_assignment')
          .neq('id', id);
      }

      const { error } = await supabase
        .from('csm_dm_templates')
        .update({
          title: input.title,
          content: input.content,
          trigger_type: input.trigger_type,
          schedule_interval: input.schedule_interval || null,
        } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['csm-dm-templates'] });
      toast.success('Template updated');
    },
    onError: () => toast.error('Failed to update template'),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('csm_dm_templates')
        .update({ is_active: false } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['csm-dm-templates'] });
      toast.success('Template deleted');
    },
    onError: () => toast.error('Failed to delete template'),
  });

  return {
    templates: templatesQuery.data ?? [],
    isLoading: templatesQuery.isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
