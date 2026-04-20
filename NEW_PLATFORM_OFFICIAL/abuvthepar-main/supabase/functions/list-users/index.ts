import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const ADMIN_API_KEY = Deno.env.get('ADMIN_API_KEY');
    let isAuthenticated = false;
    let authMethod = '';

    if (ADMIN_API_KEY && token === ADMIN_API_KEY) {
      isAuthenticated = true;
      authMethod = 'API_KEY';
      console.log('✅ Authenticated via API key');
    }

    if (!isAuthenticated) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
      console.log('🔍 getUser result:', user?.id, user?.email, userError?.message);
      
      if (user && !userError) {
        // Two-step role check to avoid join issues
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .select('role_id')
          .eq('id', user.id)
          .eq('is_active', true)
          .single();

        console.log('🔍 profile:', profile?.role_id, 'error:', profileError?.message);

        if (!profileError && profile?.role_id) {
          const { data: role, error: roleError } = await supabaseAdmin
            .from('roles')
            .select('role_key')
            .eq('id', profile.role_id)
            .single();

          console.log('🔍 role:', role?.role_key, 'error:', roleError?.message);

          if (!roleError && role) {
            const roleKey = role.role_key;
            if (['admin', 'mega_admin', 'csm', 'executive'].includes(roleKey)) {
              isAuthenticated = true;
              authMethod = `JWT_${roleKey.toUpperCase()}`;
            }
          }
        }
      }
    }

    if (!isAuthenticated) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔐 Request authenticated via: ${authMethod}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const {
      page = 1,
      perPage = 15,
      search = '',
      tierFilter = [],
      roleFilter = 'all',
      courseFilter = [],
      invitationFilter = 'all',
      sortColumn = 'created_at',
      sortDirection = 'desc',
      csmFilter = null,
      onboardingFilter = 'all',
      guaranteeFilter = 'all'
    } = body;

    console.log('📊 list-users parameters:', { page, perPage, search, tierFilter, roleFilter, courseFilter, invitationFilter, sortColumn, sortDirection, csmFilter, onboardingFilter, guaranteeFilter });

    const { data: users, error: queryError } = await supabase.rpc('get_users_with_progress', {
      p_page: page,
      p_per_page: perPage,
      p_search: search || '',
      p_tier_ids: tierFilter.length > 0 ? tierFilter : null,
      p_role_id: roleFilter !== 'all' ? roleFilter : null,
      p_course_ids: courseFilter.length > 0 ? courseFilter : null,
      p_sort_column: sortColumn,
      p_sort_direction: sortDirection,
      p_invitation_filter: invitationFilter,
      p_csm_filter: csmFilter,
      p_onboarding_filter: onboardingFilter,
      p_guarantee_filter: guaranteeFilter
    });

    if (queryError) {
      console.error('❌ Query error:', queryError);
      throw queryError;
    }

    const totalCount = users && users.length > 0 ? Number(users[0].total_count) : 0;
    const totalPages = Math.ceil(totalCount / perPage);

    const formattedUsers = (users || []).map((user: any) => ({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      tier: user.tier,
      tier_id: user.tier_id,
      role: user.role,
      role_id: user.role_id,
      is_active: user.is_active,
      total_tasks: user.total_tasks,
      completed_tasks: user.completed_tasks,
      progress_percentage: user.progress_percentage,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      assigned_csm_id: user.assigned_csm_id || null,
      onboarding_completed: user.onboarding_completed ?? false,
      onboarding_date: user.onboarding_date || null,
      offboarding_date: user.offboarding_date || null,
      guarantee_status: user.guarantee_status || 'pending',
      onboarding_booking_status: user.onboarding_booking_status || null,
      revenue: user.revenue ?? null,
      phone: user.phone || null,
    }));

    console.log(`✅ Returning ${formattedUsers.length} users (total: ${totalCount})`);

    return new Response(
      JSON.stringify({
        users: formattedUsers,
        pagination: { page, perPage, totalCount, totalPages }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('❌ Error in list-users:', error);
    const errMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
