import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FATHOM_API_BASE = 'https://api.fathom.ai/external/v1';

async function getFathomApiKey(): Promise<string | null> {
  return Deno.env.get('FATHOM_API_KEY') || null;
}

async function fathomFetch(path: string, options: RequestInit = {}) {
  const apiKey = await getFathomApiKey();
  if (!apiKey) throw new Error('FATHOM_API_KEY not configured');

  const response = await fetch(`${FATHOM_API_BASE}${path}`, {
    ...options,
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Fathom API error [${response.status}]: ${text}`);
  }

  // Handle 204 No Content
  if (response.status === 204) return null;
  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;

    // Check staff role using is_staff() DB function
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: isStaff } = await serviceClient.rpc('is_staff', { _user_id: userId });
    if (!isStaff) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, webhook_url } = await req.json();

    if (action === 'get-status') {
      const apiKey = await getFathomApiKey();
      const hasKey = !!apiKey;

      // Check if webhook secret is configured
      const hasWebhookSecret = !!Deno.env.get('FATHOM_WEBHOOK_SECRET');

      // Check stored webhook status
      const { data: setting } = await serviceClient
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'fathom_webhook_id')
        .maybeSingle();

      return new Response(JSON.stringify({
        connected: hasKey,
        webhook_active: !!setting?.setting_value,
        webhook_id: setting?.setting_value || null,
        has_webhook_secret: hasWebhookSecret,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'test-connection') {
      try {
        const data = await fathomFetch('/user');
        return new Response(JSON.stringify({
          success: true,
          connected: true,
          user: data,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({
          success: false,
          connected: false,
          error: err.message,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (action === 'create-webhook') {
      if (!webhook_url) {
        return new Response(JSON.stringify({ error: 'webhook_url required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await fathomFetch('/webhooks', {
        method: 'POST',
        body: JSON.stringify({
          destination_url: webhook_url,
          triggered_for: ['my_recordings', 'shared_team_recordings', 'my_shared_with_team_recordings', 'shared_external_recordings'],
          include_summary: true,
          include_transcript: true,
          include_action_items: true,
        }),
      });

      // Store webhook ID in system_settings
      await serviceClient
        .from('system_settings')
        .upsert({
          setting_key: 'fathom_webhook_id',
          setting_value: data.id || 'active',
        }, { onConflict: 'setting_key' });

      return new Response(JSON.stringify({
        success: true,
        webhook_id: data.id,
        secret: data.secret,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete-webhook') {
      const { data: setting } = await serviceClient
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'fathom_webhook_id')
        .maybeSingle();

      if (setting?.setting_value) {
        try {
          await fathomFetch(`/webhooks/${setting.setting_value}`, { method: 'DELETE' });
        } catch (err) {
          console.warn('Failed to delete webhook from Fathom:', err);
        }
      }

      await serviceClient
        .from('system_settings')
        .delete()
        .eq('setting_key', 'fathom_webhook_id');

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'list-webhooks') {
      const data = await fathomFetch('/webhooks');
      return new Response(JSON.stringify({
        success: true,
        webhooks: data,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('manage-fathom error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
