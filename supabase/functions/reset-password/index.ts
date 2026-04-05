import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

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

interface ResetPasswordRequest {
  email: string;
}

const appBaseUrl = 'https://app.abuvthepar.com';

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }

  try {
    // Authentication: Require either ADMIN_API_KEY or JWT with admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
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
      // Use service role client to verify the user from the JWT
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      // Get user from the JWT using service role (bypasses session issues)
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
      
      if (user && !userError) {
        const { data: roleData, error: roleError } = await supabaseAdmin
          .from('user_profiles')
          .select('roles!inner(role_key)')
          .eq('id', user.id)
          .eq('is_active', true)
          .single();

        if (!roleError && roleData) {
          const roleKey = (roleData as any).roles?.role_key;
          if (['admin', 'mega_admin'].includes(roleKey)) {
            isAuthenticated = true;
            authMethod = `JWT_${roleKey.toUpperCase()}`;
            console.log(`✅ Authenticated as ${roleKey} via JWT: ${user.email}`);
          } else {
            console.log('❌ JWT user does not have staff role');
          }
        } else {
          console.log('❌ JWT role check failed:', roleError?.message);
        }
      } else {
        console.log('❌ JWT validation failed:', userError?.message);
      }
    }

    if (!isAuthenticated) {
      console.error('❌ Authentication failed: No valid API key or admin JWT');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log(`🔐 Request authenticated via: ${authMethod}`);

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not found');
    }
    const resend = new Resend(resendApiKey);

    // Parse request body
    const { email }: ResetPasswordRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log(`Resetting password for user: ${email}`);

    // First, find the user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log(`Found user with ID: ${user.id}`);

    // Generate a secure recovery link using Supabase's built-in method
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${appBaseUrl}/create-new-password`,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      throw new Error(`Failed to generate recovery link: ${linkError?.message || 'No link returned'}`);
    }

    const recoveryLink = linkData.properties.action_link;
    console.log(`Recovery link generated for user: ${email}`);

    // Send email with recovery link (no plaintext password)
    const emailResponse = await resend.emails.send({
      from: 'Trading Coach AI <noreply@ai.smarttradingblueprint.com>',
      to: [email],
      subject: 'Reset Your Trading Coach AI Password',
      html: `
        <h1>Password Reset - Trading Coach AI</h1>
        <p>A password reset has been requested for your account by an administrator.</p>
        <p><a href="${recoveryLink}" style="display:inline-block;padding:12px 24px;background-color:#4F46E5;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Click here to reset your password</a></p>
        <p>If the button above doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break:break-all;">${recoveryLink}</p>
        <p>This link will expire shortly. If you did not request this password reset, please contact support immediately.</p>
        <br>
        <p>Best regards,<br>Trading Coach AI Team</p>
      `,
    });

    console.log('Password reset email sent:', emailResponse);

    const response = {
      message: 'Password reset link sent successfully',
      email_sent: !!emailResponse,
      user_email: email
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in reset-password function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
