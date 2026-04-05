import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Activate pending delegations whose start_date <= today
    const { data: pendingDelegations } = await supabase
      .from('csm_delegations')
      .select('id')
      .eq('status', 'pending')
      .lte('start_date', new Date().toISOString().split('T')[0]);

    for (const d of pendingDelegations || []) {
      const { error } = await supabase.rpc('activate_csm_delegation', { p_delegation_id: d.id });
      if (error) console.error(`Failed to activate delegation ${d.id}:`, error.message);
      else console.log(`Activated delegation ${d.id}`);
    }

    // 2. Revert active delegations whose end_date < today
    const { data: expiredDelegations } = await supabase
      .from('csm_delegations')
      .select('id')
      .eq('status', 'active')
      .lt('end_date', new Date().toISOString().split('T')[0]);

    for (const d of expiredDelegations || []) {
      const { error } = await supabase.rpc('revert_csm_delegation', { p_delegation_id: d.id });
      if (error) console.error(`Failed to revert delegation ${d.id}:`, error.message);
      else console.log(`Reverted delegation ${d.id}`);
    }

    return new Response(JSON.stringify({ 
      activated: pendingDelegations?.length || 0, 
      reverted: expiredDelegations?.length || 0 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
