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
    const { courseId } = await req.json();

    if (!courseId) {
      throw new Error('Course ID is required');
    }

    console.log('Fetching course detail for:', courseId);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized');
    }

    const token = authHeader.replace('Bearer ', '');

    // Use service role client to bypass RLS for efficient queries
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    const userId = user.id;

    console.log('User authenticated:', userId);

    const startTime = Date.now();

    // Parallel fetch all required data
    const [courseResult, phasesResult, accessResult] = await Promise.all([
      // 1. Get course
      supabaseAdmin.from('courses').select('*').eq('id', courseId).single(),
      
      // 2. Get phases
      supabaseAdmin
        .from('phases')
        .select('id, title, description, phase_order, unlock_type, unlock_condition, course_id')
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('phase_order', { ascending: true }),
      
      // 3. Check access
      supabaseAdmin.rpc('has_course_access', {
        _user_id: userId,
        _course_id: courseId,
      }),
    ]);

    console.log('Initial queries completed in:', Date.now() - startTime, 'ms');

    if (courseResult.error) throw courseResult.error;
    if (phasesResult.error) throw phasesResult.error;
    if (accessResult.error) throw accessResult.error;

    const course = courseResult.data;
    const phases = phasesResult.data || [];
    const hasAccess = accessResult.data;

    if (!hasAccess) {
      console.log('User does not have access to course');
      return new Response(
        JSON.stringify({
          ...course,
          hasAccess: false,
          phases: [],
          tasksByPhase: [],
          totalTasks: 0,
          completedTasks: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const phaseIds = phases.map(p => p.id);

    if (phaseIds.length === 0) {
      console.log('No phases found for course');
      return new Response(
        JSON.stringify({
          ...course,
          hasAccess: true,
          phases,
          tasksByPhase: [],
          totalTasks: 0,
          completedTasks: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch task counts and responses in parallel (bypassing RLS)
    const [tasksResult, responsesResult] = await Promise.all([
      supabaseAdmin
        .from('tasks')
        .select('id, phase_id')
        .in('phase_id', phaseIds)
        .eq('is_active', true),
      
      supabaseAdmin
        .from('task_responses')
        .select('task_id, status, completed_at')
        .eq('user_id', userId),
    ]);

    console.log('Tasks and responses fetched in:', Date.now() - startTime, 'ms');

    if (tasksResult.error) throw tasksResult.error;
    if (responsesResult.error) throw responsesResult.error;

    const tasks = tasksResult.data || [];
    const allResponses = responsesResult.data || [];

    // Filter responses to only tasks in this course
    const taskIds = tasks.map(t => t.id);
    const responses = allResponses.filter(r => taskIds.includes(r.task_id));

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

    // Calculate overall progress
    const totalTasks = tasks.length;
    const completedTasks = responses.filter(r => r.status === 'completed').length;

    const totalTime = Date.now() - startTime;
    console.log('Total execution time:', totalTime, 'ms');

    return new Response(
      JSON.stringify({
        ...course,
        hasAccess: true,
        phases,
        tasksByPhase,
        totalTasks,
        completedTasks,
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
