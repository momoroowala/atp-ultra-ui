import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function verifySignature(body: string, req: Request): Promise<boolean> {
  const secret = Deno.env.get('FATHOM_WEBHOOK_SECRET');
  if (!secret) {
    console.warn('FATHOM_WEBHOOK_SECRET not set, skipping signature verification');
    return true;
  }

  const msgId = req.headers.get('webhook-id');
  const timestamp = req.headers.get('webhook-timestamp');
  const signature = req.headers.get('webhook-signature');

  if (!msgId || !timestamp || !signature) {
    console.warn('⚠️ Missing webhook headers, skipping signature check');
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(now - ts) > 31536000) {
    console.error('Webhook timestamp too old or invalid:', timestamp);
    return false;
  }

  try {
    const secretKey = secret.startsWith('whsec_') ? secret.slice(6) : secret;
    const standardBase64 = secretKey.replace(/-/g, '+').replace(/_/g, '/');
    const keyBytes = Uint8Array.from(atob(standardBase64), c => c.charCodeAt(0));

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

    const toSign = `${msgId}.${timestamp}.${body}`;
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(toSign));
    const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));

    const signatures = signature.split(' ');
    for (const s of signatures) {
      const parts = s.split(',');
      if (parts.length >= 2) {
        const sigValue = parts.slice(1).join(',');
        if (sigValue === computed) return true;
      }
    }

    console.error('Signature mismatch. Computed:', computed, 'Received:', signature);
    return false;
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    console.log('📥 Fathom webhook received, body length:', bodyText.length);

    const isValid = await verifySignature(bodyText, req);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.parse(bodyText);
    console.log('📦 Fathom payload keys:', Object.keys(payload));

    const meetingTitle = payload.meeting_title || payload.title || 'Fathom Recording';
    const fathomUrl = payload.url || payload.share_url || '';
    const shareUrl = payload.share_url || fathomUrl;
    const recordingStartTime = payload.recording_start_time || payload.created_at;

    const summary = payload.default_summary?.markdown_formatted
      || payload.default_summary?.plain_text
      || (typeof payload.summary === 'string' ? payload.summary : null);

    const actionItems = payload.action_items || null;
    const transcript = payload.transcript || null;

    const fathomRecordingId = fathomUrl || `fathom-${Date.now()}`;

    if (!fathomUrl) {
      console.warn('⚠️ No URL in Fathom payload, using timestamp-based ID');
    }

    console.log('🔍 Parsed:', { meetingTitle, fathomUrl, recordingStartTime, hasSummary: !!summary, actionItemsCount: actionItems?.length, hasTranscript: !!transcript });

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Try to match to a calendar_call by title + date
    let callId: string | null = null;
    if (meetingTitle && recordingStartTime) {
      const dateStr = recordingStartTime.split('T')[0];
      const { data: matchedCalls } = await serviceClient
        .from('calendar_calls')
        .select('id')
        .eq('call_date', dateStr)
        .ilike('title', `%${meetingTitle.substring(0, 50)}%`)
        .limit(1);

      if (matchedCalls && matchedCalls.length > 0) {
        callId = matchedCalls[0].id;
        console.log('✅ Matched to calendar call:', callId);
      }
    }

    const recordedDate = recordingStartTime
      ? recordingStartTime.split('T')[0]
      : new Date().toISOString().split('T')[0];

    // Keep a reasonable excerpt for the card description (not truncated to 500)
    const descriptionExcerpt = summary ? summary.substring(0, 2000) : null;

    // Get admin user for created_by
    const { data: adminUser } = await serviceClient
      .from('user_profiles')
      .select('id, roles!inner(role_key)')
      .in('roles.role_key', ['admin', 'mega_admin'])
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    const createdBy = adminUser?.id || '00000000-0000-0000-0000-000000000000';

    // === DEDUPLICATION: Check if we already have a recording for this fathom_recording_id ===
    let existingRecordingId: string | null = null;
    const { data: existingNote } = await serviceClient
      .from('fathom_meeting_notes')
      .select('recording_id')
      .eq('fathom_recording_id', fathomRecordingId)
      .maybeSingle();

    if (existingNote?.recording_id) {
      existingRecordingId = existingNote.recording_id;
      console.log('🔄 Found existing recording, will update:', existingRecordingId);

      // Update existing recording instead of creating a new one
      const { error: updateError } = await serviceClient
        .from('call_recordings')
        .update({
          title: meetingTitle,
          recording_url: shareUrl || fathomUrl || 'https://fathom.video',
          recorded_date: recordedDate,
          description: descriptionExcerpt,
          tags: ['fathom-ai'],
        })
        .eq('id', existingRecordingId);

      if (updateError) {
        console.error('❌ Failed to update call_recording:', updateError);
      } else {
        console.log('✅ Updated existing call_recording:', existingRecordingId);
      }
    } else {
      // Create new recording
      const { data: newRecording, error: recError } = await serviceClient
        .from('call_recordings')
        .insert({
          title: meetingTitle,
          recording_url: shareUrl || fathomUrl || 'https://fathom.video',
          recorded_date: recordedDate,
          description: descriptionExcerpt,
          created_by: createdBy,
          tags: ['fathom-ai'],
          is_active: true,
        })
        .select('id')
        .single();

      if (recError) {
        console.error('❌ Failed to create call_recording:', recError);
      } else {
        existingRecordingId = newRecording.id;
        console.log('✅ Created call_recording:', existingRecordingId);
      }
    }

    // Insert/upsert fathom_meeting_notes
    const { error: noteError } = await serviceClient
      .from('fathom_meeting_notes')
      .upsert({
        fathom_recording_id: fathomRecordingId,
        call_id: callId,
        recording_id: existingRecordingId,
        meeting_title: meetingTitle,
        summary: summary || null,
        transcript: transcript || null,
        action_items: actionItems || null,
        fathom_meeting_url: fathomUrl,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'fathom_recording_id' });

    if (noteError) {
      console.error('❌ Failed to insert fathom note:', noteError);
      throw noteError;
    }

    console.log('✅ Fathom webhook processed successfully');

    return new Response(JSON.stringify({ success: true, recording_id: existingRecordingId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('❌ fathom-webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
