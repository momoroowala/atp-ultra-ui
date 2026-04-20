import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface ResetPasswordRequest {
  email: string;
}

const generatePassword = (): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

const handler = async (req: Request): Promise<Response> => {
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
          if (['admin', 'mega_admin', 'csm', 'executive'].includes(roleKey)) {
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

    // Find the user id via the indexed user_profiles.user_email column instead of
    // paginating auth.admin.listUsers() (which fetches the entire auth table).
    // user_profiles.id is the auth user id in this schema, so it can be passed
    // directly to updateUserById below.
    const normalizedEmail = email.toLowerCase().trim();
    const { data: profile, error: profileLookupError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_email', normalizedEmail)
      .maybeSingle();

    if (profileLookupError) {
      throw new Error(`Failed to look up user: ${profileLookupError.message}`);
    }

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    const user = { id: profile.id as string };
    console.log(`Found user with ID: ${user.id}`);

    // Generate new password
    const newPassword = generatePassword();

    // Update the user's password using their UUID
    const { error: passwordUpdateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (passwordUpdateError) {
      throw new Error(`Failed to update password: ${passwordUpdateError.message}`);
    }

    console.log(`Password updated successfully for user: ${email}`);

    // Send email with new credentials
    const emailResponse = await resend.emails.send({
      from: 'Trading Coach AI <noreply@ai.smarttradingblueprint.com>',
      to: [email],
      subject: 'Your New Trading Coach AI Password',
      html: `
        <h1>Password Reset - Trading Coach AI</h1>
        <p>Your password has been reset by an administrator.</p>
        <p><strong>Your new login credentials:</strong></p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>New Password:</strong> ${newPassword}</li>
        </ul>
        <p>Please log in with these new credentials and consider changing your password after logging in.</p>
        <p>If you did not request this password reset, please contact support immediately.</p>
        <br>
        <p>Best regards,<br>Trading Coach AI Team</p>
      `,
    });

    console.log('Password reset email sent:', emailResponse);

    const response = {
      message: 'Password reset successfully',
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
