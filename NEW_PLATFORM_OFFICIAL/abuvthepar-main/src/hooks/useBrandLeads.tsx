import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAchievementBadges } from './useAchievementBadges';
import { toast } from 'sonner';

export interface BrandLead {
  id: string;
  user_id: string;
  company_brand_name: string;
  category: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  last_email_sent_date: string | null;
  status: string;
  business_model: string;
  website: string | null;
  state: string | null;
  amazon_lead_product_url: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  owner_name?: string;
}

export type BrandLeadInsert = Omit<BrandLead, 'id' | 'created_at' | 'updated_at' | 'owner_name' | 'sort_order'> & { sort_order?: number };
export type BrandLeadUpdate = Partial<Omit<BrandLead, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'owner_name'>>;

export const LEAD_CATEGORIES = [
  'Arts Craft & Sewing',
  'Baby & Baby Care',
  'Beauty & Personal Care',
  'Clothing Shoes & Jewelry',
  'Electronics',
  'Garden & Outdoor',
  'Grocery & Gourmet',
  'Health & Household',
  'Home & Kitchen',
  'Industrial and Scientific',
  'Luggage and Travel Gear',
  'Tools & Home Improvement',
  'Misc/Uncategorized',
  'Musical Instruments',
  'Office Products',
  'Pet Supplies',
  'Sports & Outdoors',
  'Toys & Games',
] as const;

export const LEAD_STATUSES = [
  { value: 'Email Sent', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'Approved', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'Not Approved', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  { value: '2 Email Sent', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { value: 'Phone Call', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
] as const;

export const BUSINESS_MODELS = ['Brand'] as const;

export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
] as const;

/**
 * @param userIds - filter leads by these user IDs (undefined = current user's leads)
 * @param profileMap - optional pre-fetched map of userId -> display name to avoid extra user_profiles query
 */
export const useBrandLeads = (userIds?: string[], profileMap?: Map<string, string>) => {
  const { user } = useAuth();
  const { checkBadges } = useAchievementBadges();
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['brand-leads', user?.id, userIds],
    queryFn: async () => {
      let query = supabase
        .from('brand_leads' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (userIds !== undefined) {
        if (userIds.length === 0) return [] as BrandLead[];
        query = query.in('user_id', userIds);
      }

      const { data: leadsData, error } = await query;
      if (error) throw error;

      // Use provided profileMap if available, otherwise fetch owner names
      let resolvedMap = profileMap;
      if (!resolvedMap || resolvedMap.size === 0) {
        const uniqueIds = [...new Set((leadsData || []).map((r: any) => r.user_id))];
        resolvedMap = new Map<string, string>();
        if (uniqueIds.length > 0) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, first_name, last_name')
            .in('id', uniqueIds);
          for (const p of profiles || []) {
            resolvedMap.set(p.id, [p.first_name, p.last_name].filter(Boolean).join(' '));
          }
        }
      }

      return (leadsData || []).map((row: any) => ({
        ...row,
        owner_name: resolvedMap!.get(row.user_id) || undefined,
      } as BrandLead));
    },
    enabled: !!user?.id,
  });

  const createLead = useMutation({
    mutationFn: async (lead: BrandLeadInsert) => {
      const { data, error } = await supabase
        .from('brand_leads' as any)
        .insert(lead as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as BrandLead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-leads'] });
      checkBadges();
      toast.success('Lead added successfully');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to add lead'),
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: BrandLeadUpdate }) => {
      const { data, error } = await supabase
        .from('brand_leads' as any)
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as BrandLead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-leads'] });
      toast.success('Lead updated');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update lead'),
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('brand_leads' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-leads'] });
      toast.success('Lead deleted');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete lead'),
  });

  const bulkCreateLeads = useMutation({
    mutationFn: async (leads: Omit<BrandLeadInsert, 'user_id'>[]) => {
      if (!user?.id) throw new Error('Not authenticated');
      const rows = leads.map(l => ({ ...l, user_id: user.id }));
      const BATCH_SIZE = 25;
      const allResults: any[] = [];
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase
          .from('brand_leads' as any)
          .insert(batch as any)
          .select();
        if (error) throw error;
        allResults.push(...(data || []));
      }
      return allResults;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['brand-leads'] });
      checkBadges();
      toast.success(`${(data as any[])?.length || 0} leads imported successfully`);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to import leads'),
  });

  const reorderLead = useMutation({
    mutationFn: async ({ id, status, sort_order }: { id: string; status: string; sort_order: number }) => {
      const { error } = await supabase
        .from('brand_leads' as any)
        .update({ status, sort_order, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-leads'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to reorder lead'),
  });

  return { leads, isLoading, createLead, updateLead, deleteLead, bulkCreateLeads, reorderLead };
};
