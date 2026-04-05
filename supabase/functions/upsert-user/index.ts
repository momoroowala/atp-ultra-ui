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

interface UpsertUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  tierId: string;
  phoneNumber?: string;
  sendInvite?: boolean; // defaults to true
}

Deno.serve(async (req) => {
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
    console.log('📝 Upsert user request received');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate via ADMIN_API_KEY
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

    // Parse and validate request body
    const body: UpsertUserRequest = await req.json();
    const { email, firstName, lastName, tierId, phoneNumber, sendInvite } = body;
    const shouldSendInvite = sendInvite !== false; // defaults to true

    if (!email || !firstName || !lastName || !tierId) {
      console.error('❌ Missing required fields:', { email, firstName, lastName, tierId });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, firstName, lastName, tierId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate tier exists
    const { data: tier, error: tierError } = await supabase
      .from('tiers')
      .select('id, display_name')
      .eq('id', tierId)
      .single();

    if (tierError || !tier) {
      console.error('❌ Invalid tier_id:', tierId, tierError);
      return new Response(
        JSON.stringify({ error: `Invalid tier_id: ${tierId}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Tier validated:', tier.display_name);

    // Check if user already exists in auth
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing users', details: listError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const existingUser = existingUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    let userId: string;
    let action: 'invited' | 'updated';

    const appBaseUrl = 'https://app.abuvthepar.com';

    if (existingUser) {
      // User exists - update their profile and tier
      console.log('👤 User exists, updating profile:', existingUser.id);
      userId = existingUser.id;
      action = 'updated';

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          tier_id: tierId,
          phone: phoneNumber || null,
        })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Failed to update profile:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update user profile', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Profile updated');
    } else {
      // User doesn't exist - create them
      action = 'invited';

      if (shouldSendInvite) {
        // Send invitation email
        console.log('🆕 New user, sending invitation to:', email);

        const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phoneNumber,
            tier_id: tierId,
          },
          redirectTo: `${appBaseUrl}/create-new-password`,
        });

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
        // Create user silently without sending email
        console.log('🆕 New user, creating silently (no email):', email);

        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
          email: email,
          email_confirm: true, // Auto-confirm the email
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
            phone: phoneNumber,
            tier_id: tierId,
          },
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

    // Generate magic link for password creation/reset
    console.log('🔗 Generating magic link for:', email);
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${appBaseUrl}/create-new-password`,
      },
    });

    if (linkError) {
      console.error('❌ Failed to generate magic link:', linkError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate magic link', details: linkError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the token from the generated link and construct our custom URL
    const generatedUrl = new URL(linkData.properties.action_link);
    const token = generatedUrl.searchParams.get('token');
    const type = generatedUrl.searchParams.get('type');
    
    // Construct the magic link that redirects to our app
    const magicLink = `${supabaseUrl}/auth/v1/verify?token=${token}&type=${type}&redirect_to=${encodeURIComponent(`${appBaseUrl}/create-new-password`)}`;

    console.log('✅ Magic link generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        action,
        emailSent: action === 'invited' ? shouldSendInvite : false,
        message: action === 'invited' 
          ? (shouldSendInvite ? 'User invited successfully' : 'User created successfully (no email sent)')
          : 'User tier updated successfully',
        magicLink,
        user: {
          id: userId,
          email: email,
        },
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
