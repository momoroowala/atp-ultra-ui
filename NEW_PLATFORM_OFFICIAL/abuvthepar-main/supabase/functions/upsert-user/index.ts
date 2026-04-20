import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface UpsertUserRequest {
  email: string;
  first_name: string;
  last_name: string;
  tier_key: string;
  phone?: string;
  send_email?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📝 Upsert user request received');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Auth: x-api-key header ──
    const providedApiKey = req.headers.get('x-api-key');
    const validApiKey = Deno.env.get('UPSERT_API_KEY');

    if (!providedApiKey || !validApiKey || providedApiKey !== validApiKey) {
      console.error('❌ Invalid or missing API key');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid or missing API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ API key authenticated');

    // ── Parse & validate body ──
    const body: UpsertUserRequest = await req.json();
    const { email, first_name, last_name, tier_key, phone, send_email } = body;
    const shouldSendEmail = send_email !== false; // defaults to true

    if (!email || !first_name || !last_name || !tier_key) {
      console.error('❌ Missing required fields:', { email, first_name, last_name, tier_key });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, first_name, last_name, tier_key' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Resolve tier_key → tier_id ──
    const { data: tier, error: tierError } = await supabase
      .from('tiers')
      .select('id, display_name, tier_key')
      .eq('tier_key', tier_key)
      .single();

    if (tierError || !tier) {
      console.error('❌ Invalid tier_key:', tier_key, tierError);
      return new Response(
        JSON.stringify({ error: `Invalid tier_key: ${tier_key}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Tier resolved:', tier.display_name, '→', tier.id);

    // ── Resolve client role → role_id ──
    const { data: clientRole, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('role_key', 'client')
      .single();

    if (roleError || !clientRole) {
      console.error('❌ Could not resolve client role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Server configuration error: client role not found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientRoleId = clientRole.id;
    console.log('✅ Client role_id resolved:', clientRoleId);

    // ── Check if user exists via user_profiles ──
    const normalizedEmail = email.toLowerCase().trim();
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, tier_id, role_id')
      .eq('user_email', normalizedEmail)
      .maybeSingle();

    const appBaseUrl = 'https://app.abuvthepar.com';
    let userId: string;
    let action: 'created' | 'updated';

    if (existingProfile) {
      // ── UPDATE existing user ──
      console.log('👤 User exists, updating profile:', existingProfile.id);
      userId = existingProfile.id;
      action = 'updated';

      // Update profile — do NOT change role_id
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          first_name,
          last_name,
          tier_id: tier.id,
          phone: phone || null,
        })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Failed to update profile:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update user profile', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Profile updated (role preserved)');
    } else {
      // ── CREATE new user ──
      action = 'created';

      const userMetadata = {
        first_name,
        last_name,
        phone: phone || undefined,
        tier_id: tier.id,
        role_id: clientRoleId,
      };

      if (shouldSendEmail) {
        console.log('🆕 New user, sending invitation to:', normalizedEmail);

        const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
          normalizedEmail,
          {
            data: userMetadata,
            redirectTo: `${appBaseUrl}/create-new-password`,
          }
        );

        if (inviteError) {
          console.error('❌ Failed to invite user:', inviteError);
          return new Response(
            JSON.stringify({ error: 'Failed to invite user', details: inviteError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        userId = inviteData.user.id;
        console.log('✅ User invited:', userId);
      } else {
        console.log('🆕 New user, creating silently (no email):', normalizedEmail);

        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
          email: normalizedEmail,
          email_confirm: true,
          user_metadata: userMetadata,
        });

        if (createError) {
          console.error('❌ Failed to create user:', createError);
          return new Response(
            JSON.stringify({ error: 'Failed to create user', details: createError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        userId = createData.user.id;
        console.log('✅ User created silently:', userId);
      }
    }

    // ── Generate magic link ──
    console.log('🔗 Generating magic link for:', normalizedEmail);
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
      options: {
        redirectTo: `${appBaseUrl}/create-new-password`,
      },
    });

    let magicLink: string | null = null;

    if (linkError) {
      console.error('⚠️ Failed to generate magic link:', linkError);
      // Don't fail the request — magic link is a convenience
    } else {
      const generatedUrl = new URL(linkData.properties.action_link);
      const token = generatedUrl.searchParams.get('token');
      const type = generatedUrl.searchParams.get('type');
      magicLink = `${supabaseUrl}/auth/v1/verify?token=${token}&type=${type}&redirect_to=${encodeURIComponent(`${appBaseUrl}/create-new-password`)}`;
      console.log('✅ Magic link generated successfully');
    }

    // ── Return SOP response ──
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          email: normalizedEmail,
          first_name,
          last_name,
          tier_key: tier.tier_key,
        },
        magic_link: magicLink,
        action,
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
