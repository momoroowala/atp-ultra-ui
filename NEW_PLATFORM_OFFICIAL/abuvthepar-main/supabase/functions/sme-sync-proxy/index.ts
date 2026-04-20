import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SME_API_ENDPOINT = "https://inormikzjcgchbaliysj.supabase.co/functions/v1/external-ticket-api";
const SME_APP_SLUG = "atp";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const smeApiKey = Deno.env.get("SME_API_KEY");

    if (!smeApiKey) {
      return new Response(JSON.stringify({ error: "SME_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { ticketId, payload } = body;

    if (!ticketId || !payload) {
      return new Response(JSON.stringify({ error: "Missing ticketId or payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update metadata to pending
    await supabase
      .from("ticket_metadata")
      .upsert(
        { ticket_id: ticketId, sync_status: "pending", sync_attempted_at: new Date().toISOString() },
        { onConflict: "ticket_id" }
      );

    // Forward to SME
    const res = await fetch(SME_API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": smeApiKey },
      body: JSON.stringify({ ...payload, app_slug: SME_APP_SLUG }),
    });

    const responseText = await res.text();
    let data: any = null;
    try { data = JSON.parse(responseText); } catch { /* not JSON */ }

    if (res.ok) {
      const smeId = data?.ticket_id || data?.id || data?.ticket?.id || null;
      await supabase
        .from("ticket_metadata")
        .upsert(
          { ticket_id: ticketId, sme_ticket_id: smeId, sync_status: "synced", sync_error: null },
          { onConflict: "ticket_id" }
        );
      return new Response(JSON.stringify({ smeTicketId: smeId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const errMsg = `SME returned ${res.status}: ${responseText.slice(0, 300)}`;
    await supabase
      .from("ticket_metadata")
      .upsert({ ticket_id: ticketId, sync_status: "failed", sync_error: errMsg }, { onConflict: "ticket_id" });
    await supabase.rpc("increment_sync_retry_count", { row_ticket_id: ticketId });

    return new Response(JSON.stringify({ error: errMsg, smeTicketId: null }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
