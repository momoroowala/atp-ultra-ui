import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081',
  'https://app.abuvthepar.com',
];

function getCorsOrigin(req: Request): string {
  const origin = req.headers.get('origin') || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseId, dryRun = false } = await req.json();

    if (!courseId) {
      throw new Error('courseId is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Get all phases for this course
    const { data: phases, error: phaseErr } = await supabase
      .from('phases')
      .select('id')
      .eq('course_id', courseId);

    if (phaseErr) throw phaseErr;
    const phaseIds = (phases || []).map(p => p.id);

    if (phaseIds.length === 0) {
      return new Response(JSON.stringify({ message: 'No phases found', splits: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Get all tasks in those phases
    const { data: tasks, error: taskErr } = await supabase
      .from('tasks')
      .select('*')
      .in('phase_id', phaseIds)
      .order('task_order', { ascending: true });

    if (taskErr) throw taskErr;

    // 3. For each task, get its video sections
    const splits: any[] = [];

    for (const task of (tasks || [])) {
      const { data: sections, error: secErr } = await supabase
        .from('discipline_task_sections')
        .select('*')
        .eq('task_id', task.id)
        .eq('section_type', 'video')
        .order('order_index', { ascending: true });

      if (secErr) throw secErr;
      if (!sections || sections.length <= 1) continue;

      // This task has multiple videos — needs splitting
      const firstSection = sections[0];
      const additionalSections = sections.slice(1);

      const splitInfo: any = {
        originalTaskId: task.id,
        originalTitle: task.title,
        phase_id: task.phase_id,
        firstVideoTitle: firstSection.title || task.title,
        newModules: [],
      };

      if (!dryRun) {
        // Rename original task to first video's title
        const newTitle = firstSection.title || task.title;
        await supabase
          .from('tasks')
          .update({ title: newTitle })
          .eq('id', task.id);
      }

      // Process each additional video section
      for (let i = 0; i < additionalSections.length; i++) {
        const section = additionalSections[i];
        const newTitle = section.title || `${task.title} (${i + 2})`;

        splitInfo.newModules.push({ sectionId: section.id, newTitle });

        if (!dryRun) {
          // Create a new task copying metadata from original
          const { data: newTask, error: insertErr } = await supabase
            .from('tasks')
            .insert({
              phase_id: task.phase_id,
              title: newTitle,
              description: task.description,
              task_description: task.task_description,
              task_order: task.task_order + i + 1, // temporary, will reorder later
              task_type: task.task_type,
              points: task.points,
              is_active: task.is_active,
              visible_tier_ids: task.visible_tier_ids,
              visible_tiers: task.visible_tiers,
              show_in_course: task.show_in_course,
              content: task.content,
              content_url: task.content_url,
              duration_minutes: task.duration_minutes,
              tier: task.tier,
              unlock_type: task.unlock_type,
              plan_group: task.plan_group,
              due_date_enabled: task.due_date_enabled,
              due_date_days: task.due_date_days,
              due_date_start_type: task.due_date_start_type,
              due_date_start_phase_id: task.due_date_start_phase_id,
              linked_module_id: task.linked_module_id,
              visibility_condition_enabled: task.visibility_condition_enabled,
              visibility_condition_field_id: task.visibility_condition_field_id,
              visibility_condition_value: task.visibility_condition_value,
              visibility_conditions: task.visibility_conditions,
            })
            .select('id')
            .single();

          if (insertErr) throw insertErr;

          // Move the section to the new task and reset order_index to 0
          const { error: moveErr } = await supabase
            .from('discipline_task_sections')
            .update({ task_id: newTask.id, order_index: 0 })
            .eq('id', section.id);

          if (moveErr) throw moveErr;

          splitInfo.newModules[splitInfo.newModules.length - 1].newTaskId = newTask.id;
        }
      }

      splits.push(splitInfo);
    }

    // 4. Reorder task_order sequentially within each affected phase
    if (!dryRun && splits.length > 0) {
      const affectedPhaseIds = [...new Set(splits.map(s => s.phase_id))];

      for (const phaseId of affectedPhaseIds) {
        const { data: phaseTasks, error: reorderErr } = await supabase
          .from('tasks')
          .select('id')
          .eq('phase_id', phaseId)
          .order('task_order', { ascending: true });

        if (reorderErr) throw reorderErr;

        for (let idx = 0; idx < (phaseTasks || []).length; idx++) {
          await supabase
            .from('tasks')
            .update({ task_order: idx + 1 })
            .eq('id', phaseTasks![idx].id);
        }
      }
    }

    const summary = {
      dryRun,
      tasksProcessed: splits.length,
      totalNewModules: splits.reduce((sum, s) => sum + s.newModules.length, 0),
      splits,
    };

    console.log('Split summary:', JSON.stringify(summary, null, 2));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in split-multi-video-tasks:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
