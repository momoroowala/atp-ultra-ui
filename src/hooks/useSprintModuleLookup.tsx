import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ModuleLink {
  courseId: string;
  phaseId: string;
}

export const useSprintModuleLookup = () => {
  const { data: phasesMap = new Map<string, ModuleLink>() } = useQuery({
    queryKey: ['sprint-module-lookup'],
    queryFn: async () => {
      // Fetch all phases to match moduleRefs against phase titles
      const { data, error } = await supabase
        .from('phases')
        .select('id, title, course_id')
        .eq('is_active', true);

      if (error) throw error;

      const map = new Map<string, ModuleLink>();
      data?.forEach((phase) => {
        // Store with lowercase title for fuzzy matching
        map.set(phase.title.toLowerCase(), {
          courseId: phase.course_id,
          phaseId: phase.id,
        });
      });
      return map;
    },
    staleTime: 10 * 60 * 1000,
  });

  const getModuleLink = (moduleRef: string): { courseId: string; phaseId: string } | null => {
    // Try exact lowercase match first
    const refLower = moduleRef.toLowerCase();
    
    for (const [title, link] of phasesMap.entries()) {
      if (title.includes(refLower) || refLower.includes(title)) {
        return link;
      }
    }
    
    // Try partial keyword match - strip "2026 " prefix and match
    const stripped = refLower.replace(/^2026\s+/, '');
    for (const [title, link] of phasesMap.entries()) {
      if (title.includes(stripped) || stripped.includes(title)) {
        return link;
      }
    }

    return null;
  };

  return { getModuleLink };
};
