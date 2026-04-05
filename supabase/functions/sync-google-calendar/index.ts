import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);
    if (response.status === 403) {
      const body = await response.json();
      if (body?.error?.errors?.[0]?.reason === 'rateLimitExceeded' && attempt < maxRetries - 1) {
        console.log(`Rate limited, retrying in ${1000 * Math.pow(2, attempt)}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }
      // Return a new Response with the already-consumed body
      return new Response(JSON.stringify(body), { status: response.status, headers: response.headers });
    }
    return response;
  }
  // Should never reach here, but TypeScript needs it
  return fetch(url, options);
}

async function getStoredRefreshToken(): Promise<string | null> {
  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
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
  const refreshToken = await getStoredRefreshToken() || Deno.env.get('GOOGLE_OAUTH_REFRESH_TOKEN');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google OAuth credentials not configured');
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
    throw new Error(`Failed to get access token: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

function buildCalendarEvent(call: any) {
  const timeParts = call.call_time.split(':').map(Number);
  const hours = timeParts[0];
  const minutes = timeParts[1] || 0;

  const startDateTime = `${call.call_date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

  let endHours = hours + 1;
  let endDate = call.call_date;
  if (endHours >= 24) {
    endHours = endHours - 24;
    const d = new Date(call.call_date + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    endDate = d.toISOString().split('T')[0];
  }
  const endDateTime = `${endDate}T${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

  return {
    summary: call.title,
    description: `${call.description || ''}\n\nJoin: ${call.call_link}`.trim(),
    location: call.call_link,
    start: {
      dateTime: startDateTime,
      timeZone: call.timezone || 'America/New_York',
    },
    end: {
      dateTime: endDateTime,
      timeZone: call.timezone || 'America/New_York',
    },
  };
}

serve(async (req) => {
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
    const { action, call } = await req.json();
    const accessToken = await getAccessToken();
    const calendarApiBase = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

    if (action === 'generate-meet-link') {
      // Create a temporary event with conference data to get a Meet link
      const tempEvent = {
        summary: 'Temp Meet Link Generator',
        start: {
          dateTime: new Date().toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: new Date(Date.now() + 3600000).toISOString(),
          timeZone: 'UTC',
        },
        conferenceData: {
          createRequest: {
            requestId: crypto.randomUUID(),
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      };

      const createResponse = await fetchWithRetry(`${calendarApiBase}?conferenceDataVersion=1`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tempEvent),
      });

      const createData = await createResponse.json();
      if (!createResponse.ok) {
        throw new Error(`Failed to create temp event: ${JSON.stringify(createData)}`);
      }

      // Extract the Meet link
      const meetLink = createData.conferenceData?.entryPoints?.find(
        (ep: any) => ep.entryPointType === 'video'
      )?.uri;

      if (!meetLink) {
        // Clean up temp event even if no link found
        await fetch(`${calendarApiBase}/${createData.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        throw new Error('Google Meet link was not generated');
      }

      // Delete the temporary event
      await fetch(`${calendarApiBase}/${createData.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return new Response(JSON.stringify({ success: true, meetLink }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create') {
      const event = buildCalendarEvent(call);
      
      // Always use createRequest to let Google generate a native Meet link
      const eventWithConference = {
        ...event,
        conferenceData: {
          createRequest: {
            requestId: crypto.randomUUID(),
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      };

      const response = await fetchWithRetry(`${calendarApiBase}?conferenceDataVersion=1`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventWithConference),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Google Calendar create failed [${response.status}]: ${JSON.stringify(data)}`);
      }

      // Extract the Google-generated Meet link
      const meetLink = data.conferenceData?.entryPoints?.find(
        (ep: any) => ep.entryPointType === 'video'
      )?.uri || null;

      return new Response(JSON.stringify({ success: true, google_calendar_event_id: data.id, meetLink }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update') {
      if (!call.google_calendar_event_id) {
        return new Response(JSON.stringify({ success: false, error: 'No Google Calendar event ID' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const event = buildCalendarEvent(call);
      const updateUrl = `${calendarApiBase}/${call.google_calendar_event_id}?conferenceDataVersion=1`;
      const response = await fetchWithRetry(updateUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Google Calendar update failed [${response.status}]: ${JSON.stringify(data)}`);
      }

      // Extract the Meet link from the existing conference data
      const meetLink = data.conferenceData?.entryPoints?.find(
        (ep: any) => ep.entryPointType === 'video'
      )?.uri || null;

      return new Response(JSON.stringify({ success: true, meetLink }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      if (!call.google_calendar_event_id) {
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const response = await fetchWithRetry(`${calendarApiBase}/${call.google_calendar_event_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok && response.status !== 404) {
        const data = await response.text();
        throw new Error(`Google Calendar delete failed [${response.status}]: ${data}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'test-connection') {
      const response = await fetchWithRetry('https://www.googleapis.com/calendar/v3/calendars/primary', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Google Calendar test failed [${response.status}]: ${JSON.stringify(data)}`);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        email: data.id,
        summary: data.summary,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('sync-google-calendar error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
