import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MessageInput {
  content: string;
  channel_id?: string;
  dm_conversation_id?: string;
  parent_message_id?: string;
  attachments?: { url: string; type: string; name: string }[];
  mentions?: string[];
  shared_from_thread_id?: string;
  post_type?: string;
}

interface ModerationResult {
  is_inappropriate: boolean;
  reason: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI moderation not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Check if user is blocked
    const { data: blockData } = await supabase
      .from("community_blocked_users")
      .select("id, reason")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (blockData) {
      return new Response(
        JSON.stringify({
          error: "You are blocked from sending messages",
          reason: blockData.reason,
          blocked: true,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const messageInput: MessageInput = await req.json();

    // Build content for moderation (text + image descriptions)
    let contentToModerate = messageInput.content;
    
    if (messageInput.attachments && messageInput.attachments.length > 0) {
      const imageAttachments = messageInput.attachments.filter(
        (a) => a.type === "image" || a.type.startsWith("image/")
      );
      if (imageAttachments.length > 0) {
        contentToModerate += `\n\n[User also attached ${imageAttachments.length} image(s)]`;
      }
    }

    // Skip moderation for very short messages (unlikely to be inappropriate)
    let moderationResult: ModerationResult = { is_inappropriate: false, reason: "" };

    if (contentToModerate.trim().length > 2) {
      // Call AI for moderation
      const moderationResponse = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: `You are a content moderator for a professional e-commerce education community focused on Shopify store building and UGC video creation. Analyze the following message and flag it as inappropriate if it contains ANY of:
- Profanity, vulgar language, or curse words (including but not limited to: fuck, shit, ass, bitch, damn, crap, bastard, etc.)
- Hate speech or discrimination
- Harassment, bullying, or personal attacks
- Spam or promotional content (external links to competing products/courses)
- Explicit/adult content or sexual references
- Violence, threats, or aggressive language
- Sharing of personal information (phone numbers, addresses, SSN)

Be STRICT about profanity - this is a professional educational environment for entrepreneurs.
E-commerce terminology, marketing discussion, and video creation topics are acceptable.

Respond ONLY with valid JSON (no markdown): { "is_inappropriate": boolean, "reason": string }
If inappropriate, explain briefly in the reason field. If appropriate, set is_inappropriate to false and reason to empty string.`,
              },
              {
                role: "user",
                content: contentToModerate,
              },
            ],
            temperature: 0.1,
          }),
        }
      );

      if (!moderationResponse.ok) {
        console.error(
          "AI moderation failed:",
          moderationResponse.status,
          await moderationResponse.text()
        );
        // On AI failure, allow message but log it
        console.log("Allowing message due to AI failure");
      } else {
        const aiResult = await moderationResponse.json();
        const aiContent = aiResult.choices?.[0]?.message?.content || "";
        console.log("AI moderation response:", aiContent);
        
        try {
          // Parse JSON response, handling potential markdown code blocks
          let jsonStr = aiContent.trim();
          if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
          }
          moderationResult = JSON.parse(jsonStr);
        } catch (parseError) {
          console.error("Failed to parse AI response:", aiContent, parseError);
          // On parse failure, allow message
        }
      }
    }

    // Prepare message data
    const messageData = {
      content: messageInput.content,
      channel_id: messageInput.channel_id || null,
      dm_conversation_id: messageInput.dm_conversation_id || null,
      parent_message_id: messageInput.parent_message_id || null,
      shared_from_thread_id: messageInput.shared_from_thread_id || null,
      attachments: JSON.stringify(messageInput.attachments || []),
      mentions: messageInput.mentions || [],
      sender_id: userId,
      is_flagged: moderationResult.is_inappropriate,
      is_hidden: moderationResult.is_inappropriate,
      ai_flagged: moderationResult.is_inappropriate,
      flag_reason: moderationResult.reason || null,
      moderation_status: moderationResult.is_inappropriate ? "pending" : "none",
      post_type: messageInput.post_type || "text",
    };

    // Insert message
    const { data: message, error: insertError } = await supabase
      .from("community_messages")
      .insert(messageData as any)
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert message:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to send message" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If message was not flagged, trigger push notifications
    if (!moderationResult.is_inappropriate) {
      // Fire and forget push notification
      supabase.functions.invoke("send-push-notification", {
        body: {
          channelId: messageInput.channel_id,
          dmConversationId: messageInput.dm_conversation_id,
          senderId: userId,
          messageContent: messageInput.content,
          messageId: message.id,
        },
      }).catch((err) => console.error("Push notification failed:", err));
    }

    return new Response(
      JSON.stringify({
        message,
        flagged: moderationResult.is_inappropriate,
        flag_reason: moderationResult.reason,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Moderation error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
