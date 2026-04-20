import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type BadgeCategory = 'onboarding' | 'learning' | 'community' | 'consistency' | 'special';

export interface AdminBadge {
  id: string;
  badge_key: string;
  badge_name: string;
  description: string | null;
  category: BadgeCategory;
  tier: string;
  icon_emoji: string | null;
  points_value: number | null;
  requirement_type: string | null;
  requirement_value: any;
  auto_award: boolean | null;
  is_active: boolean | null;
  created_at: string | null;
}

export const BADGE_CATEGORIES: { value: BadgeCategory; label: string }[] = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'learning', label: 'Learning' },
  { value: 'community', label: 'Community' },
  { value: 'consistency', label: 'Consistency' },
  { value: 'special', label: 'Special' },
];

export const useAdminBadges = () => {
  const queryClient = useQueryClient();

  const { data: badges = [], isLoading } = useQuery({
    queryKey: ['admin-achievement-badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievement_badges')
        .select('*')
        .order('category', { ascending: true })
        .order('points_value', { ascending: true });
      if (error) throw error;
      return data as AdminBadge[];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-achievement-badges'] });
    queryClient.invalidateQueries({ queryKey: ['achievement-badges'] });
  };

  const createBadge = useMutation({
    mutationFn: async (badge: Omit<AdminBadge, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('achievement_badges').insert(badge);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateBadge = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AdminBadge> & { id: string }) => {
      const { error } = await supabase.from('achievement_badges').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteBadge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('achievement_badges').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const badgesByCategory = BADGE_CATEGORIES.map((cat) => ({
    ...cat,
    badges: badges.filter((b) => b.category === cat.value),
  }));

  return { badges, badgesByCategory, isLoading, createBadge, updateBadge, deleteBadge };
};
