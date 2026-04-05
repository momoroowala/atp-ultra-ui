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
    const authHeader = req.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify calling user via service role
    const { data: { user: callingUser }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !callingUser) {
      console.error('Error getting calling user:', userError);
      throw new Error('Unauthorized');
    }

    // Two-step role check using service role (proven pattern from list-users)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role_id')
      .eq('id', callingUser.id)
      .eq('is_active', true)
      .single();

    if (profileError || !profile?.role_id) {
      console.error('Error getting profile:', profileError);
      throw new Error('Only admins can generate impersonation links');
    }

    const { data: role, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('role_key')
      .eq('id', profile.role_id)
      .single();

    if (roleError || !role || !['admin', 'mega_admin'].includes(role.role_key)) {
      console.error('Role check failed:', role?.role_key, roleError);
      throw new Error('Only admins can generate impersonation links');
    }

    console.log(`🔐 Authenticated via JWT_${role.role_key.toUpperCase()}`);

    // Parse request body
    const { targetUserId, appOrigin } = await req.json();
    const resolvedOrigin = appOrigin || 'https://app.abuvthepar.com';

    if (!targetUserId) {
      throw new Error('targetUserId is required');
    }

    // Get target user's email
    const { data: targetUser, error: targetUserError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);

    if (targetUserError || !targetUser) {
      console.error('Error getting target user:', targetUserError);
      throw new Error('Target user not found');
    }

    // Generate magic link for the target user
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetUser.user.email!,
      options: {
        redirectTo: `${resolvedOrigin}/home`,
      },
    });

    if (linkError || !linkData) {
      console.error('Error generating magic link:', linkError);
      throw new Error('Failed to generate impersonation link');
    }

    // Audit log
    const { error: auditError } = await supabaseAdmin
      .from('impersonation_audit_log')
      .insert({
        admin_user_id: callingUser.id,
        target_user_id: targetUserId,
        admin_email: callingUser.email!,
        target_email: targetUser.user.email!,
      });

    if (auditError) {
      console.error('Error logging impersonation:', auditError);
    }

    console.log(`Admin ${callingUser.email} generated impersonation link for ${targetUser.user.email}`);

    return new Response(
      JSON.stringify({
        link: linkData.properties.action_link,
        expiresIn: '1 hour'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in generate-impersonation-link:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      {
        status: error.message === 'Only admins can generate impersonation links' ? 403 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
