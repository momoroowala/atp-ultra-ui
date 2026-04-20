import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  let email = ''
  
  try {
    // Dual Authentication Logic
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const adminApiKey = Deno.env.get('ADMIN_API_KEY');

    let isAuthenticated = false;
    let authMethod = '';

    // Method 1: Check if it's an API key (for Zapier/external calls)
    if (token === adminApiKey && adminApiKey) {
      isAuthenticated = true;
      authMethod = 'API_KEY';
      console.log('✅ Authenticated via API key');
    }

    // Method 2: Check if it's a valid JWT with admin role (for app calls)
    if (!isAuthenticated) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: authHeader }
          }
        }
      );

      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      
      if (user && !userError) {
        // Initialize admin client for RPC call
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        );

        // Check if user has a staff role
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
            console.log(`✅ Authenticated via JWT as ${roleKey}:`, user.email);
          } else {
            console.log('❌ User does not have staff role:', user.email);
          }
        } else {
          console.log('❌ Role check failed:', roleError?.message);
        }
      }
    }

    if (!isAuthenticated) {
      console.log('❌ Authentication failed');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Unauthorized. Admin access required.' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🔐 Request authenticated via: ${authMethod}`);

    // Initialize admin client for operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const requestBody = await req.json()
    email = requestBody.email
    const { firstName, lastName, phoneNumber, tierId, roleId } = requestBody

    if (!email) {
      throw new Error('Email is required')
    }

    if (!tierId) {
      throw new Error('Tier is required')
    }

    // Pre-check: does this email already exist in user_profiles?
    const { data: existingUser } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('user_email', email.toLowerCase().trim())
      .maybeSingle();

    if (existingUser) {
      console.log(`⚠️ User already exists: ${email}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `User with email ${email} already exists.`,
          alreadyExists: true,
          statusCode: 409
        }),
        { 
          status: 409, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      )
    }

    // Get the site URL from the request origin or referer, with fallback
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/');
    const siteUrl = origin || 'https://app.abuvthepar.com';
    const redirectTo = `${siteUrl}/create-new-password`;

    console.log('Inviting user:', {
      email,
      redirectTo,
      firstName,
      lastName,
      tierId,
      roleId
    })

    // Use Supabase's native invite (which uses your configured SMTP)
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phoneNumber,
          tier_id: tierId,
          role_id: roleId,
          role: 'member'
        },
        redirectTo
      }
    )

    if (error) {
      throw error
    }

    console.log('Invitation email sent successfully via Supabase SMTP')
    console.log('User invited successfully:', {
      userId: data?.user?.id,
      email: data?.user?.email,
      inviteSentAt: data?.user?.invited_at
    })

    // Upsert user profile with provided data
    if (data?.user?.id) {
      const profileData: any = {
        id: data.user.id,
        user_email: email
      };
      
      if (firstName) profileData.first_name = firstName;
      if (lastName) profileData.last_name = lastName;
      if (phoneNumber) profileData.phone = phoneNumber;
      if (tierId) profileData.tier_id = tierId;
      if (roleId) profileData.role_id = roleId;

      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (profileError) {
        console.error('Error upserting user profile:', profileError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Invitation sent to ${email}`,
        user: data.user
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    )
  } catch (error: any) {
    console.error('Error inviting user:', error)
    
    // Determine the appropriate status code and error message
    let statusCode = 400
    let errorMessage = error?.message || 'An error occurred'
    
    // Handle SMTP/email sending errors
    if (error?.status === 500 || error?.message?.toLowerCase().includes('smtp') || 
        error?.message?.toLowerCase().includes('sending')) {
      statusCode = 500
      errorMessage = 'Email service configuration error. Please check Supabase SMTP settings or contact support.'
    }
    
    // Handle rate limiting
    else if (error?.status === 429 || error?.code === 'over_email_send_rate_limit') {
      statusCode = 429
      errorMessage = 'Rate limit exceeded. Too many invitation emails sent. Please wait a few minutes before trying again.'
    }
    
    // Handle user already exists
    else if (error?.message?.toLowerCase().includes('already') || 
             error?.code === 'user_already_exists' ||
             error?.status === 409) {
      statusCode = 409
      errorMessage = `User with email ${email} already exists or has already been invited.`
    }
    
    // Handle invalid email
    else if (error?.message?.toLowerCase().includes('email') && 
             error?.message?.toLowerCase().includes('invalid')) {
      statusCode = 422
      errorMessage = `Invalid email address: ${email}`
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        code: error?.code || 'unknown_error',
        statusCode: statusCode
      }),
      { 
        status: statusCode, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    )
  }
})
