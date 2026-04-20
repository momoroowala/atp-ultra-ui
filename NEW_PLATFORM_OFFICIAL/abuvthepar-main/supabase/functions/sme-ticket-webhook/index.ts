import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

const EXPECTED_API_KEY = Deno.env.get('SME_WEBHOOK_API_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate via x-api-key header
    const apiKey = req.headers.get('x-api-key');
    if (apiKey !== EXPECTED_API_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { event, sme_ticket_id, ticket_id: local_ticket_id } = body;

    if (!event || !sme_ticket_id) {
      return new Response(JSON.stringify({ error: 'Missing event or sme_ticket_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Look up local ticket by sme_ticket_id
    let ticketId = local_ticket_id;
    if (!ticketId) {
      const { data: meta } = await supabase
        .from('ticket_metadata')
        .select('ticket_id')
        .eq('sme_ticket_id', sme_ticket_id)
        .maybeSingle();

      if (!meta) {
        return new Response(JSON.stringify({ error: 'Ticket not found for sme_ticket_id' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      ticketId = meta.ticket_id;
    }

    if (event === 'status_update') {
      const { status } = body;
      if (!status) {
        return new Response(JSON.stringify({ error: 'Missing status' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update both ticket_metadata and support_tickets
      await supabase
        .from('ticket_metadata')
        .upsert(
          { ticket_id: ticketId, status_override: status, sme_ticket_id, updated_at: new Date().toISOString() },
          { onConflict: 'ticket_id' }
        );

      await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId);

      return new Response(JSON.stringify({ success: true, action: 'status_updated' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (event === 'staff_reply') {
      const { message, responder_name, responder_email } = body;
      if (!message) {
        return new Response(JSON.stringify({ error: 'Missing message' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Insert reply as a staff response
      await supabase
        .from('ticket_responses')
        .insert({
          ticket_id: ticketId,
          response_text: message,
          responder_name: responder_name || 'SME Support',
          responder_email: responder_email || 'support@scalingmadeeasy.com',
          is_staff: true,
          attachments: body.attachments || [],
        });

      // Get ticket submitter to create notification
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('submitter_user_id, subject')
        .eq('id', ticketId)
        .single();

      if (ticket?.submitter_user_id) {
        await supabase
          .from('support_notifications')
          .insert({
            user_id: ticket.submitter_user_id,
            ticket_id: ticketId,
            notification_type: 'staff_reply',
            message: `Staff replied to: "${ticket.subject}"`,
          });
      }

      return new Response(JSON.stringify({ success: true, action: 'reply_added' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown event: ${event}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[sme-ticket-webhook] Error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
