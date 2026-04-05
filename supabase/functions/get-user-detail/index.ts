import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

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

interface Task {
  id: string;
  title: string;
  description: string | null;
  task_order: number;
  points: number;
  due_date_enabled: boolean;
  due_date_days: number | null;
  due_date_start_type: string | null;
  due_date_start_phase_id: string | null;
  is_active: boolean;
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify caller is authenticated and has staff role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check caller has admin, csm, or executive role
    const { data: callerProfile } = await supabase
      .from('user_profiles')
      .select('role_id, roles(role_key)')
      .eq('id', caller.id)
      .single();

    const callerRoleKey = (callerProfile?.roles as any)?.role_key;
    const allowedRoles = ['admin', 'mega_admin', 'csm', 'executive'];

    if (!callerRoleKey || !allowedRoles.includes(callerRoleKey)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Fetching user details for:', userId, 'by staff:', caller.id);

    // Fetch all data in parallel
    const [
      profileResult,
      responsesResult,
      phasesResult,
      quizResult,
      coursesResult,
      onboardingResult,
      loginStreakResult,
      ticketsResult,
    ] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('*, tiers(tier_key, display_name), roles(role_key, display_name)')
        .eq('id', userId)
        .single(),
      
      supabase
        .from('task_responses')
        .select('*')
        .eq('user_id', userId),
      
      supabase
        .from('phases')
        .select('id, title, description, phase_order, course_id, unlock_type, unlock_condition, points, is_active')
        .eq('is_active', true)
        .order('phase_order', { ascending: true }),
      
      supabase
        .from('quiz_submissions')
        .select('*, quizzes(id, title, passing_grade)')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false }),
      
      supabase
        .from('courses')
        .select('id, title, description, course_order, is_active')
        .eq('is_active', true)
        .order('course_order', { ascending: true }),
      
      supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),

      // Login streaks
      supabase
        .from('user_login_streaks')
        .select('*')
        .eq('user_id', userId)
        .single(),

      // Support tickets
      supabase
        .from('support_tickets')
        .select('id, ticket_number, subject, description, status, topic, priority, created_at, ticket_type')
        .eq('submitter_user_id', userId)
        .order('created_at', { ascending: false }),
    ]);

    if (profileResult.error && profileResult.error.code !== 'PGRST116') {
      console.error('❌ Profile error:', profileResult.error);
      throw profileResult.error;
    }

    // Get tasks separately to avoid timeout
    const phaseIds = phasesResult.data?.map(p => p.id) || [];
    const tasksResult = await supabase
      .from('tasks')
      .select('id, phase_id, title, description, task_order, points, due_date_enabled, due_date_days, due_date_start_type, due_date_start_phase_id, is_active')
      .in('phase_id', phaseIds)
      .eq('is_active', true)
      .order('task_order', { ascending: true });

    if (tasksResult.error) {
      console.error('❌ Tasks error:', tasksResult.error);
      throw tasksResult.error;
    }

    const profile = profileResult.data;
    const responses = responsesResult.data || [];
    const phases = phasesResult.data || [];
    const tasks = tasksResult.data || [];
    const quizSubmissions = quizResult.data || [];
    const courses = coursesResult.data || [];
    const onboardingTasks = onboardingResult.data || [];
    const loginStreak = loginStreakResult.data || null;
    const tickets = ticketsResult.data || [];

    if (!profile) {
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const authUser = usersData?.users?.find((u: any) => u.id === userId);
      
      if (!authUser) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          profile: {
            id: authUser.id,
            user_email: authUser.email,
            created_at: authUser.created_at,
            first_name: '',
            last_name: '',
            tier: null,
            level: 1,
            points: 0,
          },
          summary: {
            totalTasks: 0,
            completedTasks: 0,
            notStartedTasks: 0,
            overdueTasks: 0,
            dueSoonTasks: 0,
            progressPercentage: 0,
          },
          phases: [],
          quizzes: [],
          loginStreak: null,
          tickets: [],
          csmName: null,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Resolve CSM name if assigned
    let csmName: string | null = null;
    if (profile.assigned_csm_id) {
      const { data: csmProfile } = await supabase
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('id', profile.assigned_csm_id)
        .single();
      if (csmProfile) {
        csmName = `${csmProfile.first_name || ''} ${csmProfile.last_name || ''}`.trim() || null;
      }
    }

    // Group tasks by phase
    const tasksByPhase = tasks.reduce((acc, task) => {
      if (!acc[task.phase_id]) {
        acc[task.phase_id] = [];
      }
      acc[task.phase_id].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    // Calculate points from completed tasks
    const completedResponses = responses.filter(r => r.status === 'completed');
    const points = completedResponses.reduce((sum, response) => {
      const task = tasks.find(t => t.id === response.task_id);
      return sum + (task?.points || 0);
    }, 0);

    // Find most recent task completion timestamp
    const lastTaskCompletedAt = completedResponses.reduce((latest: string | null, r) => {
      const completedAt = r.completed_at || r.updated_at;
      if (!completedAt) return latest;
      if (!latest) return completedAt;
      return new Date(completedAt) > new Date(latest) ? completedAt : latest;
    }, null);

    const level = Math.floor(points / 500) + 1;

    const tier = profile.tiers?.display_name || null;
    
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const userEmail = authUser?.user?.email || '';
    const lastSignInAt = authUser?.user?.last_sign_in_at || null;

    // Process phases with tasks
    const phasesWithTasks = phases.map(phase => {
      const phaseTasks = (tasksByPhase[phase.id] || []).map(task => {
        const response = responses.find(r => r.task_id === task.id);
        
        let status = 'pending';
        let dueDate = null;
        
        if (response?.status === 'completed') {
          status = 'completed';
        } else if (task.due_date_enabled && profile.created_at && task.due_date_days) {
          const startDate = new Date(profile.created_at);
          dueDate = new Date(startDate);
          dueDate.setDate(dueDate.getDate() + task.due_date_days);
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const due = new Date(dueDate);
          due.setHours(0, 0, 0, 0);
          
          if (due < today) {
            status = 'overdue';
          } else {
            const threeDaysFromNow = new Date(today);
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
            if (due <= threeDaysFromNow) {
              status = 'due_soon';
            }
          }
        }

        return {
          ...task,
          status,
          dueDate: dueDate?.toISOString() || null,
          response,
        };
      });

      const completedCount = phaseTasks.filter(t => t.status === 'completed').length;
      const totalCount = phaseTasks.length;

      return {
        ...phase,
        tasks: phaseTasks,
        completedCount,
        totalCount,
        progressPercentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      };
    });

    // Calculate summary stats
    const allTasks = phasesWithTasks.flatMap(p => p.tasks);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const notStartedTasks = allTasks.filter(t => t.status === 'pending').length;
    const overdueTasks = allTasks.filter(t => t.status === 'overdue').length;
    const dueSoonTasks = allTasks.filter(t => t.status === 'due_soon').length;

    // Group phases by course
    const coursesWithPhases = courses.map(course => {
      const coursePhases = phasesWithTasks.filter(p => p.course_id === course.id);
      const courseTasks = coursePhases.flatMap(p => p.tasks);
      const courseCompletedTasks = courseTasks.filter(t => t.status === 'completed').length;
      const courseTotalTasks = courseTasks.length;

      return {
        ...course,
        phases: coursePhases,
        totalTasks: courseTotalTasks,
        completedTasks: courseCompletedTasks,
        progressPercentage: courseTotalTasks > 0 ? Math.round((courseCompletedTasks / courseTotalTasks) * 100) : 0,
      };
    });

    // Calculate onboarding progress
    const onboardingCompleted = onboardingTasks.filter(t => t.completed).length;
    const onboardingTotal = onboardingTasks.length;
    const onboardingPercentage = onboardingTotal > 0 ? Math.round((onboardingCompleted / onboardingTotal) * 100) : 0;

    const result = {
      profile: {
        ...profile,
        user_email: userEmail,
        tier,
        level,
        points,
        role: profile.roles?.display_name || null,
        last_sign_in_at: lastSignInAt,
      },
      summary: {
        totalTasks,
        completedTasks,
        notStartedTasks,
        overdueTasks,
        dueSoonTasks,
        progressPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      courses: coursesWithPhases,
      phases: phasesWithTasks,
      quizzes: quizSubmissions || [],
      onboarding: {
        tasks: onboardingTasks,
        completed: onboardingCompleted,
        total: onboardingTotal,
        percentage: onboardingPercentage,
      },
      lastTaskCompletedAt,
      loginStreak,
      tickets,
      csmName,
    };

    console.log('✅ User details complete:', {
      userId,
      totalTasks,
      completedTasks,
      phasesCount: phasesWithTasks.length,
      ticketsCount: tickets.length,
      hasLoginStreak: !!loginStreak,
      csmName,
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error fetching user details:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to load user details' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
