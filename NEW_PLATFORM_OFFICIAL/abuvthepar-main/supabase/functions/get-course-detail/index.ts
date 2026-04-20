import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseId } = await req.json();
    
    if (!courseId) {
      throw new Error('Course ID is required');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized');
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub;

    if (!userId) {
      throw new Error('Invalid token payload');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const startTime = Date.now();

    // Parallel fetch: course, phases, access check
    const [courseResult, phasesResult, accessResult] = await Promise.all([
      supabaseAdmin.from('courses').select('*').eq('id', courseId).single(),
      supabaseAdmin
        .from('phases')
        .select('id, title, description, phase_order, unlock_type, unlock_condition, course_id')
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('phase_order', { ascending: true }),
      supabaseAdmin.rpc('has_course_access', {
        _user_id: userId,
        _course_id: courseId,
      }),
    ]);

    if (courseResult.error) throw courseResult.error;
    if (phasesResult.error) throw phasesResult.error;
    if (accessResult.error) throw accessResult.error;

    const course = courseResult.data;
    const phases = phasesResult.data || [];
    const hasAccess = accessResult.data;

    if (!hasAccess) {
      return new Response(
        JSON.stringify({
          ...course,
          hasAccess: false,
          phases: [],
          tasks: [],
          responses: [],
          tasksByPhase: [],
          totalTasks: 0,
          completedTasks: 0,
          unlockStatusMap: {},
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const phaseIds = phases.map(p => p.id);

    if (phaseIds.length === 0) {
      return new Response(
        JSON.stringify({
          ...course,
          hasAccess: true,
          phases,
          tasks: [],
          responses: [],
          tasksByPhase: [],
          totalTasks: 0,
          completedTasks: 0,
          unlockStatusMap: {},
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parallel fetch: full tasks, responses, and unlock status for all phases
    const unlockPromises = phaseIds.map(phaseId =>
      supabaseAdmin.rpc('is_phase_unlocked', {
        _phase_id: phaseId,
        _user_id: userId,
      }).then(res => ({ phaseId, unlocked: res.data || false, error: res.error }))
    );

    const [tasksResult, responsesResult, ...unlockResults] = await Promise.all([
      supabaseAdmin
        .from('tasks')
        .select('id, title, description, task_order, phase_id, duration_minutes, points, task_type, content, show_in_course, plan_group, linked_module_id')
        .in('phase_id', phaseIds)
        .eq('is_active', true)
        .order('task_order', { ascending: true }),
      supabaseAdmin
        .from('task_responses')
        .select('task_id, status, completed_at')
        .eq('user_id', userId),
      ...unlockPromises,
    ]);

    if (tasksResult.error) throw tasksResult.error;
    if (responsesResult.error) throw responsesResult.error;

    const tasks = tasksResult.data || [];
    const allResponses = responsesResult.data || [];

    // Filter responses to only tasks in this course
    const taskIds = tasks.map(t => t.id);
    const responses = allResponses.filter(r => taskIds.includes(r.task_id));

    // Build unlock status map
    const unlockStatusMap: Record<string, boolean> = {};
    for (const result of unlockResults) {
      if (!result.error) {
        unlockStatusMap[result.phaseId] = result.unlocked;
      }
    }

    // Calculate progress by phase
    const tasksByPhase = phases.map(phase => {
      const phaseTaskIds = tasks.filter(t => t.phase_id === phase.id).map(t => t.id);
      const completedCount = phaseTaskIds.filter(taskId => {
        const response = responses.find(r => r.task_id === taskId);
        return response?.status === 'completed';
      }).length;

      return {
        phase,
        totalTasks: phaseTaskIds.length,
        completedTasks: completedCount,
      };
    });

    const totalTasks = tasks.length;
    const completedTasks = responses.filter(r => r.status === 'completed').length;

    console.log('Total execution time:', Date.now() - startTime, 'ms');

    return new Response(
      JSON.stringify({
        ...course,
        hasAccess: true,
        phases,
        tasks,
        responses,
        tasksByPhase,
        totalTasks,
        completedTasks,
        unlockStatusMap,
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=60',
        } 
      }
    );

  } catch (error) {
    console.error('Error in get-course-detail:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: errorMessage === 'Unauthorized' ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
