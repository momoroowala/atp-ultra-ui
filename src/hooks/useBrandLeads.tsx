import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAchievementBadges } from './useAchievementBadges';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

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
  created_at: string;
  updated_at: string;
  owner_name?: string;
}

export type BrandLeadInsert = Omit<BrandLead, 'id' | 'created_at' | 'updated_at' | 'owner_name'>;
export type BrandLeadUpdate = Partial<Omit<BrandLead, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'owner_name'>>;

export const LEAD_CATEGORIES = [
  'Arts Craft & Sewing', 'Baby & Baby Care', 'Beauty & Personal Care',
  'Clothing Shoes & Jewelry', 'Electronics', 'Garden & Outdoor',
  'Grocery & Gourmet', 'Health & Household', 'Home & Kitchen',
  'Industrial and Scientific', 'Luggage and Travel Gear', 'Tools & Home Improvement',
  'Misc/Uncategorized', 'Musical Instruments', 'Office Products',
  'Pet Supplies', 'Sports & Outdoors', 'Toys & Games',
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

// ---------------------------------------------------------------------------
// localStorage-based storage for demo (Supabase tables don't exist on dev)
// ---------------------------------------------------------------------------

const LEADS_STORAGE_KEY = 'brand_leads_local';

function getStoredLeads(): BrandLead[] {
  try {
    return JSON.parse(localStorage.getItem(LEADS_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLeads(leads: BrandLead[]) {
  localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
}

function generateId(): string {
  try { return crypto.randomUUID(); } catch { return 'lead-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8); }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useBrandLeads = (userIds?: string[]) => {
  const { user } = useAuth();
  const { checkBadges } = useAchievementBadges();
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['brand-leads', user?.id, userIds],
    queryFn: async () => {
      // Try Supabase first
      try {
        const { data: leadsData, error } = await supabase
          .from('brand_leads' as any)
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && leadsData && leadsData.length > 0) {
          // Supabase works -- use it
          let filtered = leadsData;
          if (userIds !== undefined) {
            if (userIds.length === 0) return [] as BrandLead[];
            filtered = leadsData.filter((r: any) => userIds.includes(r.user_id));
          }
          return filtered.map((row: any) => ({ ...row } as BrandLead));
        }
      } catch { /* Supabase failed, use localStorage */ }

      // Fallback: localStorage
      let stored = getStoredLeads();
      if (userIds !== undefined && userIds.length > 0) {
        stored = stored.filter(l => userIds.includes(l.user_id));
      }
      return stored;
    },
    enabled: !!user?.id,
  });

  const createLead = useMutation({
    mutationFn: async (lead: BrandLeadInsert): Promise<BrandLead> => {
      const now = new Date().toISOString();
      const newLead: BrandLead = {
        ...lead,
        id: generateId(),
        created_at: now,
        updated_at: now,
      };

      // Try Supabase, fall back to localStorage
      try {
        const { data, error } = await supabase
          .from('brand_leads' as any)
          .insert(lead as any)
          .select()
          .single();
        if (!error && data) return data as unknown as BrandLead;
      } catch { /* fall through */ }

      // localStorage fallback
      const stored = getStoredLeads();
      stored.unshift(newLead);
      saveLeads(stored);
      return newLead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-leads'] });
      checkBadges();
      toast.success('Lead added successfully');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to add lead'),
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: BrandLeadUpdate }): Promise<BrandLead> => {
      const now = new Date().toISOString();

      // Try Supabase
      try {
        const { data, error } = await supabase
          .from('brand_leads' as any)
          .update({ ...updates, updated_at: now } as any)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as unknown as BrandLead;
      } catch { /* fall through */ }

      // localStorage fallback
      const stored = getStoredLeads();
      const idx = stored.findIndex(l => l.id === id);
      if (idx === -1) throw new Error('Lead not found');
      stored[idx] = { ...stored[idx], ...updates, updated_at: now };
      saveLeads(stored);
      return stored[idx];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-leads'] });
      toast.success('Lead updated');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update lead'),
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('brand_leads' as any)
          .delete()
          .eq('id', id);
        if (!error) return;
      } catch { /* fall through */ }

      // localStorage fallback
      const stored = getStoredLeads().filter(l => l.id !== id);
      saveLeads(stored);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-leads'] });
      toast.success('Lead deleted');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete lead'),
  });

  const bulkCreateLeads = useMutation({
    mutationFn: async (newLeads: Omit<BrandLeadInsert, 'user_id'>[]) => {
      if (!user?.id) throw new Error('Not authenticated');
      const now = new Date().toISOString();

      // Get current leads for upsert matching
      const currentLeads = getStoredLeads();
      const existingByName = new Map<string, number>(); // name -> index in currentLeads
      currentLeads.forEach((l, i) => {
        existingByName.set(l.company_brand_name.toLowerCase().trim(), i);
      });

      let insertedCount = 0;
      let updatedCount = 0;

      for (const lead of newLeads) {
        const key = lead.company_brand_name.toLowerCase().trim();
        const existingIdx = existingByName.get(key);

        if (existingIdx !== undefined) {
          // Update existing: merge non-null fields
          const existing = currentLeads[existingIdx];
          for (const [field, value] of Object.entries(lead)) {
            if (field === 'company_brand_name') continue;
            if (value !== null && value !== undefined && value !== '') {
              (existing as any)[field] = value;
            }
          }
          existing.updated_at = now;
          updatedCount++;
        } else {
          // Insert new
          const newLead: BrandLead = {
            ...(lead as any),
            user_id: user.id,
            id: generateId(),
            created_at: now,
            updated_at: now,
            status: lead.status || 'Email Sent',
            business_model: lead.business_model || 'Brand',
          };
          currentLeads.unshift(newLead);
          // Update the map so subsequent duplicate rows in same CSV get merged
          existingByName.set(key, 0);
          // Shift all existing indices since we unshifted
          for (const [k, v] of existingByName.entries()) {
            if (k !== key) existingByName.set(k, v + 1);
          }
          insertedCount++;
        }
      }

      saveLeads(currentLeads);
      return { insertedCount, updatedCount };
    },
    onSuccess: ({ insertedCount, updatedCount }) => {
      queryClient.invalidateQueries({ queryKey: ['brand-leads'] });
      checkBadges();
      const parts = [];
      if (insertedCount > 0) parts.push(`${insertedCount} new leads added`);
      if (updatedCount > 0) parts.push(`${updatedCount} existing leads updated`);
      toast.success(parts.join(', ') || 'Import complete');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to import leads'),
  });

  return { leads, isLoading, createLead, updateLead, deleteLead, bulkCreateLeads };
};
