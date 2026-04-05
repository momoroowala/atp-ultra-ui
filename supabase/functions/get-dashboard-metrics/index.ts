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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized');
    }

    const token = authHeader.replace('Bearer ', '');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    if (error || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    const userId = user.id;

    console.log(`Fetching dashboard metrics for user: ${userId}`);

    const [
      milestonesRes,
      streaksRes,
      leaderboardRes,
      weeklyCheckinsRes,
    ] = await Promise.all([
      supabaseClient
        .from('user_milestones')
        .select('*')
        .eq('user_id', user.id)
        .order('milestone_type'),
      supabaseClient
        .from('user_login_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      supabaseClient
        .from('leaderboard_cache')
        .select('rank, total_points')
        .eq('user_id', user.id)
        .single(),
      supabaseClient
        .from('weekly_checkins')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start_date', { ascending: false })
        .limit(4),
    ]);

    if (milestonesRes.error) console.warn('Milestones fetch error:', milestonesRes.error);
    if (streaksRes.error) console.warn('Streaks fetch error:', streaksRes.error);
    if (leaderboardRes.error) console.warn('Leaderboard fetch error:', leaderboardRes.error);
    if (weeklyCheckinsRes.error) console.warn('Weekly checkins fetch error:', weeklyCheckinsRes.error);

    const response = {
      milestones: milestonesRes.data || [],
      streaks: streaksRes.data || null,
      leaderboard: leaderboardRes.data || null,
      weeklyCheckins: weeklyCheckinsRes.data || [],
    };

    console.log('Dashboard metrics fetched successfully');

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
