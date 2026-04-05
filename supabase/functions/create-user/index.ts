import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

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

interface CreateUserRequest {
  email: string;
  firstName?: string;
  lastName?: string;
}

const appBaseUrl = 'https://app.abuvthepar.com';

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

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    // Authentication: Require either ADMIN_API_KEY or JWT with admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized - No authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const ADMIN_API_KEY = Deno.env.get('ADMIN_API_KEY');
    let isAuthenticated = false;
    let authMethod = '';

    // Method 1: API Key Authentication (for Zapier/external integrations)
    if (ADMIN_API_KEY && token === ADMIN_API_KEY) {
      isAuthenticated = true;
      authMethod = 'API_KEY';
      console.log('✅ Authenticated via API key');
    }

    // Method 2: JWT Admin Authentication (for app calls)
    if (!isAuthenticated) {
      const supabaseAdminClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: { user }, error: userError } = await supabaseAdminClient.auth.getUser(token);
      
      if (user && !userError) {
        const { data: roleData, error: roleError } = await supabaseAdminClient
          .from('user_profiles')
          .select('roles!inner(role_key)')
          .eq('id', user.id)
          .eq('is_active', true)
          .single();

        if (!roleError && roleData) {
          const roleKey = (roleData as any).roles?.role_key;
          if (['admin', 'mega_admin', 'csm'].includes(roleKey)) {
            isAuthenticated = true;
            authMethod = `JWT_${roleKey.toUpperCase()}`;
            console.log(`✅ Authenticated as ${roleKey} via JWT: ${user.email}`);
          }
        }
      }
    }

    if (!isAuthenticated) {
      return new Response(JSON.stringify({ error: 'Unauthorized - Admin access required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log(`🔐 Request authenticated via: ${authMethod}`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, firstName, lastName }: CreateUserRequest = await req.json();
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Pre-check: does this email already exist in user_profiles?
    const { data: existingUser } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('user_email', email.toLowerCase().trim())
      .maybeSingle();

    if (existingUser) {
      console.log(`⚠️ User already exists: ${email}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `User with email ${email} already exists.`,
        alreadyExists: true 
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log(`Creating user silently for: ${email}`);

    // Step 1: Create the user without sending any email
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (createError) {
      console.error('Create user error:', createError);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log(`✅ User created silently: ${createData.user.id}`);

    // Step 2: Generate a recovery link so the admin can share it manually
    let magicLink: string | null = null;
    try {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: `${appBaseUrl}/create-new-password`,
        },
      });

      if (linkError) {
        console.error('Generate link error:', linkError);
      } else if (linkData?.properties?.action_link) {
        magicLink = linkData.properties.action_link;
        console.log('✅ Recovery link generated');
      }
    } catch (linkErr) {
      console.error('Failed to generate recovery link:', linkErr);
    }

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: createData.user.id,
        email: createData.user.email,
        created_at: createData.user.created_at,
      },
      magicLink,
      email_sent: false,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
