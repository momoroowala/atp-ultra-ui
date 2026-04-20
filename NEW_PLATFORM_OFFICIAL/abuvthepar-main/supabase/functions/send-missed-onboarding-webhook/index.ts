const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GHL_WEBHOOK_URL =
  "https://services.leadconnectorhq.com/hooks/TErnMpSi8cr6BKHYnozL/webhook-trigger/68cf18a8-3c97-4fc4-9ed0-b7d8f39d5671";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { email, first_name, last_name, phone, user_id, action, triggered_at } = body;

    if (!email || !user_id || !action) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, user_id, action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = {
      email,
      first_name: first_name || "",
      last_name: last_name || "",
      phone: phone || "",
      user_id,
      action,
      triggered_at: triggered_at || new Date().toISOString(),
    };

    console.log("Sending missed onboarding webhook to GHL:", JSON.stringify(payload));

    const ghlResponse = await fetch(GHL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseText = await ghlResponse.text();
    console.log("GHL response:", ghlResponse.status, responseText);

    if (!ghlResponse.ok) {
      return new Response(
        JSON.stringify({ error: "GHL webhook failed", status: ghlResponse.status, detail: responseText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
