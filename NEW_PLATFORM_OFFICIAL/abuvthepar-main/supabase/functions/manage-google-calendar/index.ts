import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function getServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

async function getStoredRefreshToken(): Promise<string | null> {
  const serviceClient = getServiceClient();
  const { data } = await serviceClient
    .from('system_settings')
    .select('setting_value')
    .eq('setting_key', 'google_calendar_refresh_token')
    .maybeSingle();
  return data?.setting_value || null;
}

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET');

  // Try DB-stored token first, then env var fallback
  const refreshToken = await getStoredRefreshToken() || Deno.env.get('GOOGLE_OAUTH_REFRESH_TOKEN');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google OAuth credentials not configured.');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to refresh access token: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const serviceClient = getServiceClient();
    const { data: profileData } = await serviceClient
      .from('user_profiles')
      .select('role_id')
      .eq('id', user.id)
      .single();

    let roleKey: string | null = null;
    if (profileData?.role_id) {
      const { data: roleData } = await serviceClient
        .from('roles')
        .select('role_key')
        .eq('id', profileData.role_id)
        .single();
      roleKey = roleData?.role_key || null;
    }

    if (!roleKey || !['admin', 'mega_admin'].includes(roleKey)) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action } = body;

    // ── get-auth-url: return Google OAuth consent URL ──
    if (action === 'get-auth-url') {
      const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID');
      if (!clientId) {
        return new Response(JSON.stringify({ error: 'GOOGLE_OAUTH_CLIENT_ID not configured' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const redirectUri = body.redirect_uri;
      if (!redirectUri) {
        return new Response(JSON.stringify({ error: 'redirect_uri is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email',
        access_type: 'offline',
        prompt: 'consent',
      });

      return new Response(JSON.stringify({
        success: true,
        url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── exchange-code: exchange auth code for tokens and store ──
    if (action === 'exchange-code') {
      const { code, redirect_uri } = body;
      if (!code || !redirect_uri) {
        return new Response(JSON.stringify({ error: 'code and redirect_uri are required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')!;
      const clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')!;

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirect_uri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
      }

      const { refresh_token, access_token } = tokenData;
      if (!refresh_token) {
        throw new Error('No refresh_token returned. Make sure prompt=consent and access_type=offline.');
      }

      // Get the connected email
      const userinfoResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const userinfo = await userinfoResp.json();
      const connectedEmail = userinfo.email || 'unknown';

      // Store refresh token and email in system_settings
      const serviceClient = getServiceClient();
      await serviceClient.from('system_settings').upsert({
        setting_key: 'google_calendar_refresh_token',
        setting_value: refresh_token,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'setting_key' });

      await serviceClient.from('system_settings').upsert({
        setting_key: 'google_calendar_email',
        setting_value: connectedEmail,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'setting_key' });

      return new Response(JSON.stringify({
        success: true,
        email: connectedEmail,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── test-connection ──
    if (action === 'test-connection') {
      try {
        const accessToken = await getAccessToken();
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(`Calendar API error [${response.status}]: ${JSON.stringify(data)}`);
        }

        const serviceClient = getServiceClient();
        await serviceClient.from('system_settings').upsert({
          setting_key: 'google_calendar_email',
          setting_value: data.id,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'setting_key' });

        return new Response(JSON.stringify({
          success: true,
          connected: true,
          email: data.id,
          calendar_name: data.summary,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ success: false, connected: false, error: msg }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ── get-status ──
    if (action === 'get-status') {
      const serviceClient = getServiceClient();
      const { data: emailSetting } = await serviceClient
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'google_calendar_email')
        .maybeSingle();

      const storedToken = await getStoredRefreshToken();
      const hasRefreshToken = !!storedToken || !!Deno.env.get('GOOGLE_OAUTH_REFRESH_TOKEN');

      return new Response(JSON.stringify({
        success: true,
        connected: hasRefreshToken && !!emailSetting?.setting_value,
        email: emailSetting?.setting_value || null,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── disconnect ──
    if (action === 'disconnect') {
      const serviceClient = getServiceClient();
      await serviceClient.from('system_settings').upsert({
        setting_key: 'google_calendar_email',
        setting_value: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'setting_key' });

      await serviceClient.from('system_settings').upsert({
        setting_key: 'google_calendar_refresh_token',
        setting_value: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'setting_key' });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('manage-google-calendar error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
