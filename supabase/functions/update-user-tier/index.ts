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

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📝 Update user tier request received');

    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for API key authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const providedApiKey = authHeader.replace('Bearer ', '');
    const validApiKey = Deno.env.get('ADMIN_API_KEY');

    if (!validApiKey || providedApiKey !== validApiKey) {
      console.error('❌ Invalid API key');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ API key authenticated');

    // Parse request body
    const { email, tier_id } = await req.json();

    if (!email || !tier_id) {
      console.error('❌ Missing required fields:', { email, tier_id });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email and tier_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Looking up user with email:', email);

    // Find user by email
    const { data: userProfile, error: lookupError } = await supabase
      .from('user_profiles')
      .select('id, user_email, first_name, last_name, tier_id')
      .eq('user_email', email)
      .single();

    if (lookupError || !userProfile) {
      console.error('❌ User not found:', email, lookupError);
      return new Response(
        JSON.stringify({ error: `User not found with email: ${email}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User found:', userProfile.id);

    // Verify tier exists
    const { data: tier, error: tierError } = await supabase
      .from('tiers')
      .select('id, display_name')
      .eq('id', tier_id)
      .single();

    if (tierError || !tier) {
      console.error('❌ Invalid tier_id:', tier_id, tierError);
      return new Response(
        JSON.stringify({ error: `Invalid tier_id: ${tier_id}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎯 Updating user tier to:', tier.display_name);

    // Update user tier
    const { data: updated, error: updateError } = await supabase
      .from('user_profiles')
      .update({ tier_id: tier_id })
      .eq('id', userProfile.id)
      .select('id, user_email, first_name, last_name, tier_id')
      .single();

    if (updateError) {
      console.error('❌ Failed to update tier:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update user tier', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User tier updated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User tier updated successfully',
        data: {
          user_id: updated.id,
          email: updated.user_email,
          name: `${updated.first_name || ''} ${updated.last_name || ''}`.trim(),
          old_tier_id: userProfile.tier_id,
          new_tier_id: updated.tier_id,
          tier_name: tier.display_name
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
