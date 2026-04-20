import { supabase } from "@/integrations/supabase/client";
import { createSupportNotification } from "@/hooks/useSupportNotifications";

// ─── SME Central Hub (DISABLED for dev - do not connect to production) ───
const SME_API_ENDPOINT = ""; // was: https://inormikzjcgchbaliysj.supabase.co/functions/v1/external-ticket-api
const SME_API_KEY = ""; // was: production key (removed for safety)
const SME_APP_SLUG = "atp";

export async function syncToSME(ticketId: string, payload: Record<string, unknown>): Promise<string | null> {
  await supabase
    .from("ticket_metadata")
    .upsert(
      { ticket_id: ticketId, sync_status: "pending", sync_attempted_at: new Date().toISOString() },
      { onConflict: "ticket_id" },
    );

  try {
    const res = await fetch(SME_API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": SME_API_KEY },
      body: JSON.stringify({ ...payload, app_slug: SME_APP_SLUG }),
    });
    const responseText = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(responseText);
    } catch {
      /* not JSON */
    }

    if (res.ok) {
      const smeId = data?.ticket_id || data?.id || data?.ticket?.id || null;
      await supabase
        .from("ticket_metadata")
        .upsert(
          { ticket_id: ticketId, sme_ticket_id: smeId, sync_status: "synced", sync_error: null },
          { onConflict: "ticket_id" },
        );
      return smeId;
    }

    const errMsg = `SME returned ${res.status}: ${responseText.slice(0, 300)}`;
    await supabase
      .from("ticket_metadata")
      .upsert({ ticket_id: ticketId, sync_status: "failed", sync_error: errMsg }, { onConflict: "ticket_id" });
    await supabase.rpc("increment_sync_retry_count", { row_ticket_id: ticketId });
    return null;
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    await supabase
      .from("ticket_metadata")
      .upsert({ ticket_id: ticketId, sync_status: "failed", sync_error: errMsg }, { onConflict: "ticket_id" });
    await supabase.rpc("increment_sync_retry_count", { row_ticket_id: ticketId });
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

  if (!user) {
    // Demo mode fallback (GitHub Pages -- auth is bypassed)
    if (import.meta.env.BASE_URL !== '/') {
      const result = { email: 'mo@test.dev', name: 'Mo', userId: 'demo-admin-001', tierId: null };
      _cachedUserInfo = { ...result, expiresAt: now + 5 * 60 * 1000 };
      return result;
    }
    throw new Error("Not authenticated");
  }

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

// ─── Raw REST helper with column discovery ─────────────────
// PostgREST rejects columns that don't exist in the table.
// We discover actual columns first, then strip unknowns before inserting.

const SB_URL = import.meta.env.VITE_SUPABASE_URL || "https://sfaqexmajpfllctqubbt.supabase.co";
const SB_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_xQbl303xYJ1ki_66uGqOPg_jlduAEem";

const _columnCache: Record<string, Set<string>> = {};

async function getToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || SB_KEY;
}

async function discoverColumns(table: string, token: string): Promise<Set<string>> {
  if (_columnCache[table]) return _columnCache[table];
  try {
    const res = await fetch(`${SB_URL}/rest/v1/${table}?limit=1`, {
      headers: { "apikey": SB_KEY, "Authorization": `Bearer ${token}` },
    });
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        _columnCache[table] = new Set(Object.keys(rows[0]));
        return _columnCache[table];
      }
    }
  } catch { /* ignore */ }
  // If table is empty or fetch failed, try inserting with minimal fields
  // and learn from the error, or just return null to skip stripping
  return new Set(); // empty = don't strip (will try all columns)
}

function stripToKnown(payload: Record<string, unknown>, known: Set<string>): Record<string, unknown> {
  if (known.size === 0) return payload; // no column info = send everything
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (known.has(k)) clean[k] = v;
  }
  return clean;
}

async function rawInsert(table: string, payload: Record<string, unknown>): Promise<any> {
  const token = await getToken();
  const known = await discoverColumns(table, token);
  let cleaned = known.size > 0 ? stripToKnown(payload, known) : { ...payload };

  // Retry loop: if PostgREST rejects a column, remove it and try again (max 5 retries)
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SB_KEY,
        "Authorization": `Bearer ${token}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify(cleaned),
    });
    if (res.ok) {
      const rows = await res.json();
      return Array.isArray(rows) ? rows[0] : rows;
    }
    const text = await res.text();
    const match = text.match(/Could not find the '(\w+)' column/);
    if (match) {
      // Remove the offending column and retry
      delete cleaned[match[1]];
      continue;
    }
    // Non-column error -- throw
    throw new Error(`Insert into ${table} failed: ${text}`);
  }
  throw new Error(`Insert into ${table} failed after removing unknown columns`);
}

// ─── localStorage-based ticket storage for demo ────────────
// Dev Supabase doesn't have support_tickets/ticket_responses tables.

const TICKETS_KEY = 'demo_support_tickets';
const RESPONSES_KEY = 'demo_ticket_responses';
let _ticketCounter = 0;

function getLocalTickets(): any[] {
  try { return JSON.parse(localStorage.getItem(TICKETS_KEY) || '[]'); } catch { return []; }
}
function saveLocalTickets(tickets: any[]) {
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
}
function getLocalResponses(): any[] {
  try { return JSON.parse(localStorage.getItem(RESPONSES_KEY) || '[]'); } catch { return []; }
}
function saveLocalResponses(responses: any[]) {
  localStorage.setItem(RESPONSES_KEY, JSON.stringify(responses));
}
function genId() {
  try { return crypto.randomUUID(); } catch { return 'tk-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8); }
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
  const now = new Date().toISOString();
  const tickets = getLocalTickets();
  _ticketCounter = Math.max(_ticketCounter, tickets.length);
  _ticketCounter++;

  const ticket = {
    id: genId(),
    ticket_number: _ticketCounter,
    subject,
    description,
    priority,
    status: 'open',
    ticket_type: ticketType || 'support',
    topic: topic || 'General',
    submitter_name: name,
    submitter_email: email,
    submitter_user_id: userId,
    submitter_tier_id: tierId,
    has_new_reply: false,
    internal: false,
    attachments: attachments || [],
    created_at: now,
    updated_at: now,
  };

  tickets.unshift(ticket);
  saveLocalTickets(tickets);

  return { success: true, ticket };
}

export async function listTickets() {
  const tickets = getLocalTickets();
  return { success: true, tickets };
}

export async function getTicket(ticketId: string) {
  const tickets = getLocalTickets();
  const ticket = tickets.find((t: any) => t.id === ticketId);
  if (!ticket) throw new Error('Ticket not found');

  const responses = getLocalResponses().filter((r: any) => r.ticket_id === ticketId);
  return { success: true, ticket: { ...ticket, responses } };
}

export async function respondToTicket(
  ticketId: string,
  message: string,
  attachments?: Array<{ name: string; url: string; size: number; type: string }>,
) {
  const { email, name, userId } = await getUserInfo();
  const now = new Date().toISOString();

  const response = {
    id: genId(),
    ticket_id: ticketId,
    response_text: message,
    responder_name: name,
    responder_email: email,
    responder_user_id: userId,
    is_staff: false,
    attachments: attachments || [],
    created_at: now,
    updated_at: now,
  };

  const responses = getLocalResponses();
  responses.push(response);
  saveLocalResponses(responses);

  // Mark ticket as having new reply
  const tickets = getLocalTickets();
  const ticketIdx = tickets.findIndex((t: any) => t.id === ticketId);
  if (ticketIdx !== -1) {
    tickets[ticketIdx].has_new_reply = true;
    tickets[ticketIdx].updated_at = now;
    saveLocalTickets(tickets);
  }

  return { success: true, response };
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
  return { success: true, tickets: getLocalTickets() };
}

export async function getTicketAsStaff(ticketId: string) {
  const tickets = getLocalTickets();
  const ticket = tickets.find((t: any) => t.id === ticketId);
  if (!ticket) throw new Error('Ticket not found');

  const responses = getLocalResponses().filter((r: any) => r.ticket_id === ticketId);

  // Clear has_new_reply
  const idx = tickets.findIndex((t: any) => t.id === ticketId);
  if (idx !== -1) {
    tickets[idx].has_new_reply = false;
    saveLocalTickets(tickets);
  }

  return { success: true, ticket: { ...ticket, responses } };
}

export async function respondAsStaff(
  ticketId: string,
  message: string,
  attachments?: Array<{ name: string; url: string; size: number; type: string }>,
) {
  const { name, email, userId } = await getUserInfo();

  const staffResponse = {
    id: genId(),
    ticket_id: ticketId,
    response_text: message,
    responder_name: name,
    responder_email: email,
    responder_user_id: userId,
    is_staff: true,
    attachments: attachments || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const responses = getLocalResponses();
  responses.push(staffResponse);
  saveLocalResponses(responses);

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

  const internalPayload: Record<string, unknown> = {
    subject,
    description,
    priority,
    ticket_type: "support",
    topic: internalType,
    submitter_name: name,
    submitter_email: email,
    submitter_user_id: userId,
    internal: true,
  };
  if (attachments && attachments.length > 0) internalPayload.attachments = attachments;

  const data = await rawInsert("support_tickets", internalPayload);

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

// ─── Ticket Metadata (localStorage) ──────────────────────────
const METADATA_KEY = 'demo_ticket_metadata';

function getLocalMetadata(): Record<string, any> {
  try { return JSON.parse(localStorage.getItem(METADATA_KEY) || '{}'); } catch { return {}; }
}
function saveLocalMetadata(meta: Record<string, any>) {
  localStorage.setItem(METADATA_KEY, JSON.stringify(meta));
}

export async function getTicketMetadata(ticketId: string) {
  const all = getLocalMetadata();
  return all[ticketId] || null;
}

async function upsertMetadata(ticketId: string, updates: Record<string, any>) {
  const all = getLocalMetadata();
  all[ticketId] = { ...(all[ticketId] || {}), ticket_id: ticketId, ...updates, updated_at: new Date().toISOString() };
  saveLocalMetadata(all);
  return all[ticketId];
}

export async function updateTicketStatus(ticketId: string, status: string) {
  // Update the actual ticket in localStorage
  const tickets = getLocalTickets();
  const idx = tickets.findIndex((t: any) => t.id === ticketId);
  if (idx !== -1) {
    tickets[idx].status = status;
    tickets[idx].updated_at = new Date().toISOString();
    saveLocalTickets(tickets);
  }
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
  // Update ticket status in localStorage
  const tickets = getLocalTickets();
  const idx = tickets.findIndex((t: any) => t.id === ticketId);
  if (idx !== -1) {
    tickets[idx].status = "closed";
    tickets[idx].updated_at = new Date().toISOString();
    saveLocalTickets(tickets);
  }
  return metadata;
}

// ─── Internal Notes (Supabase) ─────────────────────────────

const INTERNAL_NOTES_KEY = 'demo_internal_notes';
function getLocalInternalNotes(): any[] {
  try { return JSON.parse(localStorage.getItem(INTERNAL_NOTES_KEY) || '[]'); } catch { return []; }
}
function saveLocalInternalNotes(notes: any[]) {
  localStorage.setItem(INTERNAL_NOTES_KEY, JSON.stringify(notes));
}

export async function getInternalNotes(ticketId: string) {
  return getLocalInternalNotes().filter((n: any) => n.ticket_id === ticketId);
}

export async function addInternalNote(
  ticketId: string,
  note: string,
  attachments?: Array<{ name: string; url: string; size: number; type: string }>,
) {
  const { email, name, userId } = await getUserInfo();
  const now = new Date().toISOString();
  const newNote = {
    id: genId(),
    ticket_id: ticketId,
    note,
    author_id: userId,
    author_name: name,
    author_email: email,
    attachments: attachments || [],
    created_at: now,
    updated_at: now,
  };
  const notes = getLocalInternalNotes();
  notes.push(newNote);
  saveLocalInternalNotes(notes);
  return newNote;
}

export async function editInternalNote(noteId: string, newNote: string) {
  const notes = getLocalInternalNotes();
  const idx = notes.findIndex((n: any) => n.id === noteId);
  if (idx !== -1) {
    notes[idx].note = newNote;
    notes[idx].updated_at = new Date().toISOString();
    saveLocalInternalNotes(notes);
    return notes[idx];
  }
  throw new Error('Note not found');
}

export async function deleteInternalNote(noteId: string) {
  const notes = getLocalInternalNotes().filter((n: any) => n.id !== noteId);
  saveLocalInternalNotes(notes);
}
