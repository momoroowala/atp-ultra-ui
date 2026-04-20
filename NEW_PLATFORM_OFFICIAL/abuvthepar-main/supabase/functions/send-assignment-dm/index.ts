import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ELIGIBLE_TIERS = ["platinum", "diamond"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("[send-assignment-dm] No auth header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller via token
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !caller) {
      console.log("[send-assignment-dm] Auth failed:", authError?.message);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, csm_id } = await req.json();
    console.log("[send-assignment-dm] Called with user_id:", user_id, "csm_id:", csm_id);
    if (!user_id || !csm_id) {
      return new Response(
        JSON.stringify({ error: "user_id and csm_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller is staff
    const callerId = caller.id;
    const { data: staffCheck } = await admin
      .from("user_profiles")
      .select("role_id, roles!inner(role_key)")
      .eq("id", callerId)
      .single();

    const roleKey = (staffCheck?.roles as any)?.role_key;
    console.log("[send-assignment-dm] Caller role:", roleKey);
    if (!["admin", "mega_admin", "csm", "executive"].includes(roleKey)) {
      return new Response(JSON.stringify({ error: "Staff access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check student tier
    const { data: studentProfile } = await admin
      .from("user_profiles")
      .select("first_name, last_name, tier_id, tiers!inner(tier_key)")
      .eq("id", user_id)
      .single();

    if (!studentProfile) {
      console.log("[send-assignment-dm] Student not found:", user_id);
      return new Response(
        JSON.stringify({ skipped: true, reason: "Student not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tierKey = (studentProfile.tiers as any)?.tier_key;
    console.log("[send-assignment-dm] Student tier:", tierKey);
    if (!ELIGIBLE_TIERS.includes(tierKey)) {
      return new Response(
        JSON.stringify({ skipped: true, reason: `Tier ${tierKey} not eligible` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch on_assignment template
    const { data: template, error: tmplErr } = await admin
      .from("csm_dm_templates")
      .select("*")
      .eq("trigger_type", "on_assignment")
      .eq("is_active", true)
      .limit(1)
      .single();

    console.log("[send-assignment-dm] Template lookup:", template ? template.title : "none found", tmplErr?.message);

    if (!template) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "No active on_assignment template" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get CSM name
    const { data: csmProfile } = await admin
      .from("user_profiles")
      .select("first_name, last_name")
      .eq("id", csm_id)
      .single();

    const studentName = [studentProfile.first_name, studentProfile.last_name]
      .filter(Boolean)
      .join(" ") || "there";
    const csmName = csmProfile
      ? [csmProfile.first_name, csmProfile.last_name].filter(Boolean).join(" ")
      : "Your CSM";

    // Replace template variables
    let messageContent = template.content
      .replace(/\{\{student_name\}\}/g, studentName)
      .replace(/\{\{csm_name\}\}/g, csmName);

    console.log("[send-assignment-dm] Message prepared, finding/creating DM conversation");

    // Find or create DM conversation
    const { data: existingConvos } = await admin
      .from("community_dm_participants")
      .select("conversation_id")
      .eq("user_id", csm_id);

    let conversationId: string | null = null;

    if (existingConvos && existingConvos.length > 0) {
      const convoIds = existingConvos.map((c) => c.conversation_id);
      const { data: matchingParticipant } = await admin
        .from("community_dm_participants")
        .select("conversation_id")
        .eq("user_id", user_id)
        .in("conversation_id", convoIds)
        .limit(1)
        .single();

      if (matchingParticipant) {
        conversationId = matchingParticipant.conversation_id;
      }
    }

    if (!conversationId) {
      // Create new conversation
      const { data: newConvo, error: convoErr } = await admin
        .from("community_dm_conversations")
        .insert({ last_message_at: new Date().toISOString() })
        .select("id")
        .single();

      if (convoErr || !newConvo) {
        throw new Error("Failed to create DM conversation: " + convoErr?.message);
      }

      conversationId = newConvo.id;

      // Add participants
      await admin.from("community_dm_participants").insert([
        { conversation_id: conversationId, user_id: csm_id },
        { conversation_id: conversationId, user_id: user_id },
      ]);
      console.log("[send-assignment-dm] Created new conversation:", conversationId);
    } else {
      console.log("[send-assignment-dm] Using existing conversation:", conversationId);
    }

    // Send the message
    const { error: msgError } = await admin.from("community_messages").insert({
      dm_conversation_id: conversationId,
      sender_id: csm_id,
      content: messageContent,
    });

    if (msgError) {
      throw new Error("Failed to send DM: " + msgError.message);
    }

    // Update conversation last_message_at
    await admin
      .from("community_dm_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    console.log("[send-assignment-dm] Message sent successfully to conversation:", conversationId);

    return new Response(
      JSON.stringify({ success: true, conversation_id: conversationId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-assignment-dm error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
