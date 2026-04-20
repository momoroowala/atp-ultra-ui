import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const ADMIN_API_KEY = Deno.env.get('ADMIN_API_KEY');
    let isAuthenticated = false;
    let authMethod = '';
    let authenticatedUserId: string | null = null;
    let authenticatedUserEmail: string | null = null;

    // Method 1: API Key Authentication
    if (token === ADMIN_API_KEY) {
      isAuthenticated = true;
      authMethod = 'API_KEY';
      console.log('✅ Authenticated via API key');
    }

    // Method 2: JWT Admin Authentication
    if (!isAuthenticated) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

      if (user && !authError) {
        // Create admin client to verify staff role
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data: roleData, error: roleError } = await supabaseAdmin
          .from('user_profiles')
          .select('roles!inner(role_key)')
          .eq('id', user.id)
          .eq('is_active', true)
          .single();

        if (!roleError && roleData) {
          const roleKey = (roleData as any).roles?.role_key;
          if (['admin', 'mega_admin', 'csm', 'executive'].includes(roleKey)) {
            isAuthenticated = true;
            authMethod = `JWT_${roleKey.toUpperCase()}`;
            authenticatedUserId = user.id;
            authenticatedUserEmail = user.email ?? null;
            console.log(`✅ Authenticated as ${roleKey} via JWT: ${user.email}`);
          } else {
            console.error('JWT user does not have staff role');
          }
        } else {
          console.error('JWT role check failed:', roleError);
        }
      } else {
        console.error('JWT authentication failed:', authError);
      }
    }

    // If neither authentication method succeeded, return 401
    if (!isAuthenticated) {
      console.error('❌ Authentication failed: No valid API key or admin JWT provided');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized: Valid API key or admin JWT token required'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Get target user ID from request
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Prevent self-deletion (only for JWT auth, not API key)
    if (authMethod.startsWith('JWT_') && userId === authenticatedUserId) {
      throw new Error('Cannot delete your own account');
    }

    // Log the deletion action
    if (authMethod === 'API_KEY') {
      console.log(`API key deleting user ${userId}`);
    } else {
      console.log(`Admin ${authenticatedUserEmail} deleting user ${userId}`);
    }

    // Create service role client for deletion
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Manual cleanup for tables (safety measure)
    const tablesToClean = [
      'ai_chat_sessions',
      'user_ai_interactions',
      'user_task_submissions',
      'task_responses',
      'quiz_submissions',
      'user_course_access',
      'course_progress',
      'user_achievement_badges',
      'user_habit_badges',
      'habit_completions',
      'habit_streaks',
      'user_habits',
      'notebook_entries',
      'chat_sessions',
      'user_login_streaks',
      'user_milestones',
      'user_points',
      'leaderboard_cache',
    ];

    for (const table of tablesToClean) {
      try {
        const { error } = await supabaseClient
          .from(table)
          .delete()
          .eq('user_id', userId);
        
        if (error) {
          console.warn(`Warning cleaning ${table}:`, error.message);
        } else {
          console.log(`Cleaned ${table} for user ${userId}`);
        }
      } catch (error) {
        console.warn(`Error cleaning ${table}:`, error);
      }
    }

    // Delete from auth.users (this will CASCADE to all related tables)
    console.log(`Deleting user ${userId} from auth.users`);
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId);

    let authUserDeleted = true;
    if (deleteError) {
      // If user not found in auth, that's okay - we'll just clean up the profile
      if (deleteError.message?.includes('User not found') || deleteError.code === 'user_not_found') {
        console.log(`User ${userId} not found in auth.users - cleaning up orphaned profile`);
        authUserDeleted = false;
      } else {
        console.error('Delete error:', deleteError);
        throw new Error(`Failed to delete user: ${deleteError.message}`);
      }
    }

    // Always clean up user_profiles (handles orphaned profiles)
    const { error: profileDeleteError } = await supabaseClient
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (profileDeleteError) {
      console.warn('Warning deleting user_profiles:', profileDeleteError.message);
    } else {
      console.log(`Cleaned user_profiles for user ${userId}`);
    }

    console.log(`Successfully deleted user ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: authUserDeleted 
          ? 'User and all associated data deleted successfully'
          : 'Orphaned profile and associated data cleaned up successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in delete-user function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
