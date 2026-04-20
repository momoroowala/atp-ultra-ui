import { supabase } from "@/integrations/supabase/client";
import { createSupportNotification } from "@/hooks/useSupportNotifications";

// ─── SME Central Hub (proxied through edge function) ──────
export async function syncToSME(ticketId: string, payload: Record<string, unknown>): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("sme-sync-proxy", {
      body: { ticketId, payload },
    });

    if (error) {
      console.error("[syncToSME] Edge function error:", error);
      return null;
    }

    return data?.smeTicketId ?? null;
  } catch (e) {
    console.error("[syncToSME] Failed:", e);
    return null;
  }
}

// ─── Auth caching ─
let _cachedUserInfo: { email: string; name: string; userId: string; tierId: string | null; expiresAt: number } | null =
  null;

async function getUserInfo() {
  const now = Date.now();
  if (_cachedUserInfo && _cachedUserInfo.expiresAt > now) {
    return _cachedUserInfo;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("first_name, last_name, tier_id")
    .eq("id", user.id)
    .maybeSingle();

  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || user.email || "Unknown User";

  const result = { email: user.email!, name, userId: user.id, tierId: profile?.tier_id ?? null };
  _cachedUserInfo = { ...result, expiresAt: now + 5 * 60 * 1000 };
  return result;
}

export function clearAuthCache() {
  _cachedUserInfo = null;
}

/** Fire-and-forget staff notifications with smart routing */
function notifyStaffAsync(
  ticketId: string,
  type: "new_ticket" | "client_reply",
  message: string,
  excludeUserId: string,
  topic?: string,
) {
  (async () => {
    try {
      let staffUsers: Array<{ user_id: string }> | null = null;

      // Smart routing: bug reports go to admins, everything else to CSMs
      if (type === "new_ticket" && topic === "Bug Report") {
        const { data } = await supabase.rpc("get_admin_only_user_ids");
        staffUsers = data as Array<{ user_id: string }> | null;
      } else if (type === "new_ticket") {
        const { data } = await supabase.rpc("get_csm_user_ids");
        staffUsers = data as Array<{ user_id: string }> | null;
        // Fallback: if no CSMs found, notify all staff
        if (!staffUsers || staffUsers.length === 0) {
          const { data: fallback } = await supabase.rpc("get_staff_user_ids");
          staffUsers = fallback as Array<{ user_id: string }> | null;
        }
      } else {
        // For replies, notify all staff
        const { data } = await supabase.rpc("get_staff_user_ids");
        staffUsers = data as Array<{ user_id: string }> | null;
      }

      if (!staffUsers) return;
      for (const staff of staffUsers) {
        if (staff.user_id !== excludeUserId) {
          createSupportNotification(staff.user_id, ticketId, type, message);
        }
      }
    } catch (e) {
      console.warn("[notifyStaff] Failed:", e);
    }
  })();
}

// ─── Client-facing API ─────────────────────────────────────

export async function createTicket(
  subject: string,
  description: string,
  priority: string,
  ticketType?: string,
  attachments?: Array<{ name: string; url: string; size: number; type: string }>,
  topic?: string,
) {
  const { email, name, userId, tierId } = await getUserInfo();

  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      subject,
      description,
      priority,
      ticket_type: ticketType || "support",
      topic: topic || "General",
      submitter_name: name,
      submitter_email: email,
      submitter_user_id: userId,
      submitter_tier_id: tierId,
      attachments: attachments || [],
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Fire-and-forget staff notifications with topic-based routing
  notifyStaffAsync(data.id, "new_ticket", `New ticket: "${subject}"`, userId, topic);

  // Sync bug reports to SME central hub and store SME ticket ID (awaited to guarantee persistence)
  if (topic === "Bug Report") {
    try {
      const smeTicketId = await syncToSME(data.id, {
        action: "create",
        subject,
        description,
        priority,
        ticket_type: "bug",
        submitter_name: name,
        submitter_email: email,
        attachments: attachments || [],
      });
      if (smeTicketId) {
        const { error: upsertErr } = await supabase
          .from("ticket_metadata")
          .upsert(
            { ticket_id: data.id, sme_ticket_id: smeTicketId, updated_at: new Date().toISOString() },
            { onConflict: "ticket_id" },
          );
        if (upsertErr) {
          console.error("[createTicket] ticket_metadata upsert FAILED:", upsertErr);
        } else {
          console.log("[createTicket] Stored sme_ticket_id:", smeTicketId, "for ticket:", data.id);
        }
      } else {
        console.error("[createTicket] syncToSME returned null — no sme_ticket_id stored for ticket:", data.id);
      }
    } catch (e) {
      console.error("[createTicket] SME sync failed:", e);
    }
  }

  return { success: true, ticket: data };
}

export async function listTickets() {
  const { userId } = await getUserInfo();

  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("submitter_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return { success: true, tickets: data || [] };
}

export async function getTicket(ticketId: string) {
  const { data: ticket, error } = await supabase.from("support_tickets").select("*").eq("id", ticketId).single();

  if (error) throw new Error(error.message);

  // Get responses
  const { data: responses } = await supabase
    .from("ticket_responses")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  return { success: true, ticket: { ...ticket, responses: responses || [] } };
}

export async function respondToTicket(
  ticketId: string,
  message: string,
  attachments?: Array<{ name: string; url: string; size: number; type: string }>,
) {
  const { email, name, userId } = await getUserInfo();

  const { data, error } = await supabase
    .from("ticket_responses")
    .insert({
      ticket_id: ticketId,
      response_text: message,
      responder_name: name,
      responder_email: email,
      responder_user_id: userId,
      is_staff: false,
      attachments: attachments || [],
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Mark ticket as having new reply for staff
  await supabase.from("support_tickets").update({ has_new_reply: true }).eq("id", ticketId);

  // Notify staff
  notifyStaffAsync(ticketId, "client_reply", `Client replied to ticket`, userId);

  return { success: true, response: data };
}

export async function uploadAttachment(_fileBase64: string, fileName: string, fileType: string, file?: File) {
  if (!file) throw new Error("File object is required for upload");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const fileExt = fileName.split(".").pop() || "bin";
  const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("ticket-attachments")
    .upload(filePath, file, { contentType: fileType, upsert: false });

  if (uploadError) throw new Error(uploadError.message || "Failed to upload file");

  const { data: urlData } = supabase.storage.from("ticket-attachments").getPublicUrl(filePath);

  return { success: true, url: urlData.publicUrl };
}

// ─── CSM / Admin API ───────────────────────────────────────

export async function listAllTickets() {
  const { data, error } = await supabase.from("support_tickets").select("*").order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return { success: true, tickets: data || [] };
}

export async function getTicketAsStaff(ticketId: string) {
  const { data: ticket, error } = await supabase.from("support_tickets").select("*").eq("id", ticketId).single();

  if (error) throw new Error(error.message);

  const { data: responses } = await supabase
    .from("ticket_responses")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  // Clear has_new_reply when staff views ticket
  await supabase.from("support_tickets").update({ has_new_reply: false }).eq("id", ticketId);

  return { success: true, ticket: { ...ticket, responses: responses || [] } };
}

export async function respondAsStaff(
  ticketId: string,
  message: string,
  attachments?: Array<{ name: string; url: string; size: number; type: string }>,
) {
  const { name, email, userId } = await getUserInfo();

  const { error } = await supabase
    .from("ticket_responses")
    .insert({
      ticket_id: ticketId,
      response_text: message,
      responder_name: name,
      responder_email: email,
      responder_user_id: userId,
      is_staff: true,
      attachments: attachments || [],
    });

  if (error) throw new Error(error.message);

  // Notify the ticket submitter and sync to SME if bug/internal
  (async () => {
    try {
      const { data: ticket } = await supabase
        .from("support_tickets")
        .select("submitter_user_id, subject, topic, internal")
        .eq("id", ticketId)
        .single();

      if (ticket?.submitter_user_id && ticket.submitter_user_id !== userId) {
        createSupportNotification(
          ticket.submitter_user_id,
          ticketId,
          "staff_reply",
          `Staff replied to: "${ticket.subject}"`,
        );
      }

      // Sync reply to SME for bug reports and internal tickets
      if (ticket?.topic === "Bug Report" || ticket?.internal) {
        // Fetch the SME ticket ID from metadata
        const { data: meta } = await supabase
          .from("ticket_metadata")
          .select("sme_ticket_id")
          .eq("ticket_id", ticketId)
          .single();

        if (meta?.sme_ticket_id) {
          syncToSME(ticketId, {
            action: "respond",
            ticket_id: meta.sme_ticket_id,
            response_text: message,
            submitter_email: email,
          });
        } else {
          console.warn("[respondAsStaff] No sme_ticket_id found, skipping SME sync");
        }
      }
    } catch (e) {
      console.warn("[respondAsStaff] Failed to notify/sync:", e);
    }
  })();

  return { success: true };
}

export async function createInternalTicket(
  subject: string,
  description: string,
  priority: string,
  internalType: string,
  attachments?: Array<{ name: string; url: string; size: number; type: string }>,
) {
  const { email, name, userId } = await getUserInfo();

  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      subject,
      description,
      priority,
      ticket_type: "support",
      topic: internalType,
      submitter_name: name,
      submitter_email: email,
      submitter_user_id: userId,
      internal: true,
      attachments: attachments || [],
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Sync all internal tickets to SME central hub and store SME ticket ID (awaited to guarantee persistence)
  try {
    const smeTicketId = await syncToSME(data.id, {
      action: "create",
      subject,
      description,
      priority,
      ticket_type: "internal",
      topic: internalType,
      submitter_name: name,
      submitter_email: email,
      attachments: attachments || [],
    });
    if (smeTicketId) {
      const { error: upsertErr } = await supabase
        .from("ticket_metadata")
        .upsert(
          { ticket_id: data.id, sme_ticket_id: smeTicketId, updated_at: new Date().toISOString() },
          { onConflict: "ticket_id" },
        );
      if (upsertErr) {
        console.error("[createInternalTicket] ticket_metadata upsert FAILED:", upsertErr);
      } else {
        console.log("[createInternalTicket] Stored sme_ticket_id:", smeTicketId, "for ticket:", data.id);
      }
    } else {
      console.error("[createInternalTicket] syncToSME returned null — no sme_ticket_id stored for ticket:", data.id);
    }
  } catch (e) {
    console.error("[createInternalTicket] SME sync failed:", e);
  }

  return { success: true, ticket: data };
}

// ─── CSM Metadata (Supabase) ───────────────────────────────

export async function getTicketMetadata(ticketId: string) {
  const { data, error } = await supabase.from("ticket_metadata").select("*").eq("ticket_id", ticketId).maybeSingle();

  if (error) throw error;
  return data;
}

async function upsertMetadata(ticketId: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("ticket_metadata")
    .upsert({ ticket_id: ticketId, ...updates, updated_at: new Date().toISOString() }, { onConflict: "ticket_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTicketStatus(ticketId: string, status: string) {
  // Update the actual ticket status
  await supabase.from("support_tickets").update({ status }).eq("id", ticketId);
  // Also update metadata override
  return upsertMetadata(ticketId, { status_override: status });
}

export async function assignTicket(ticketId: string, assigneeEmail: string, assigneeName: string) {
  return upsertMetadata(ticketId, { assigned_to_email: assigneeEmail, assigned_to_name: assigneeName });
}

export async function addTag(ticketId: string, tag: string) {
  const existing = await getTicketMetadata(ticketId);
  const currentTags: string[] = (existing?.tags as string[] | null) || [];
  if (currentTags.includes(tag)) return existing;
  return upsertMetadata(ticketId, { tags: [...currentTags, tag] });
}

export async function removeTag(ticketId: string, tag: string) {
  const existing = await getTicketMetadata(ticketId);
  const currentTags: string[] = (existing?.tags as string[] | null) || [];
  return upsertMetadata(ticketId, { tags: currentTags.filter((t: string) => t !== tag) });
}

export async function escalateTicket(ticketId: string, reason?: string) {
  return upsertMetadata(ticketId, {
    escalated: true,
    escalated_reason: reason || null,
    escalated_at: new Date().toISOString(),
  });
}

export async function closeWithResolution(ticketId: string, resolutionNote: string) {
  const metadata = await upsertMetadata(ticketId, {
    status_override: "closed",
    resolution_note: resolutionNote,
  });
  await supabase.from("support_tickets").update({ status: "closed" }).eq("id", ticketId);
  return metadata;
}

// ─── Internal Notes (Supabase) ─────────────────────────────

export async function getInternalNotes(ticketId: string) {
  const { data, error } = await supabase
    .from("ticket_internal_notes")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addInternalNote(
  ticketId: string,
  note: string,
  attachments?: Array<{ name: string; url: string; size: number; type: string }>,
) {
  const { email, name, userId } = await getUserInfo();

  const { data, error } = await supabase
    .from("ticket_internal_notes")
    .insert({
      ticket_id: ticketId,
      note,
      author_id: userId,
      author_name: name,
      author_email: email,
      attachments: attachments?.length ? attachments : [],
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function editInternalNote(noteId: string, newNote: string) {
  const { data, error } = await supabase
    .from("ticket_internal_notes")
    .update({ note: newNote, updated_at: new Date().toISOString() })
    .eq("id", noteId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteInternalNote(noteId: string) {
  const { error } = await supabase.from("ticket_internal_notes").delete().eq("id", noteId);

  if (error) throw error;
}
