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

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all pending messages that are due
    const { data: pendingMessages, error: fetchError } = await supabase
      .from('scheduled_messages')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching scheduled messages:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!pendingMessages || pendingMessages.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processed = 0;
    let failed = 0;

    for (const msg of pendingMessages) {
      try {
        // Parse attachments
        let attachments = msg.attachments;
        if (typeof attachments === 'string') {
          attachments = JSON.parse(attachments);
        }

        // Insert the message into community_messages
        const insertData: Record<string, unknown> = {
          content: msg.content,
          sender_id: msg.sender_id,
          attachments: JSON.stringify(attachments || []),
          mentions: msg.mentions || [],
        };

        if (msg.channel_id) {
          insertData.channel_id = msg.channel_id;
        }
        if (msg.dm_conversation_id) {
          insertData.dm_conversation_id = msg.dm_conversation_id;
        }

        const { error: insertError } = await supabase
          .from('community_messages')
          .insert(insertData);

        if (insertError) {
          console.error(`Failed to insert message ${msg.id}:`, insertError);
          await supabase
            .from('scheduled_messages')
            .update({ status: 'failed' })
            .eq('id', msg.id);
          failed++;
          continue;
        }

        // Handle recurring vs one-time
        if (msg.is_recurring && msg.recurrence_pattern) {
          const currentScheduled = new Date(msg.scheduled_at);
          let nextDate: Date;

          switch (msg.recurrence_pattern) {
            case 'daily':
              nextDate = new Date(currentScheduled.getTime() + 24 * 60 * 60 * 1000);
              break;
            case 'weekly':
              nextDate = new Date(currentScheduled.getTime() + 7 * 24 * 60 * 60 * 1000);
              break;
            case 'biweekly':
              nextDate = new Date(currentScheduled.getTime() + 14 * 24 * 60 * 60 * 1000);
              break;
            default:
              nextDate = new Date(currentScheduled.getTime() + 7 * 24 * 60 * 60 * 1000);
          }

          // Check if past end date
          if (msg.recurrence_end_date && nextDate > new Date(msg.recurrence_end_date)) {
            await supabase
              .from('scheduled_messages')
              .update({ status: 'sent', last_sent_at: new Date().toISOString() })
              .eq('id', msg.id);
          } else {
            await supabase
              .from('scheduled_messages')
              .update({
                scheduled_at: nextDate.toISOString(),
                last_sent_at: new Date().toISOString(),
              })
              .eq('id', msg.id);
          }
        } else {
          // One-time message: mark as sent
          await supabase
            .from('scheduled_messages')
            .update({ status: 'sent', last_sent_at: new Date().toISOString() })
            .eq('id', msg.id);
        }

        processed++;
      } catch (err) {
        console.error(`Error processing message ${msg.id}:`, err);
        failed++;
      }
    }

    return new Response(JSON.stringify({ processed, failed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
