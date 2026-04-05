import { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  Loader2,
  Send,
  AlertTriangle,
  StickyNote,
  Tag,
  X,
  UserPlus,
  Search,
  Pencil,
  Trash2,
  Check,
  Download,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { ReplyAttachmentInput, type UploadedAttachment } from "@/components/support/ReplyAttachmentInput";
import { useRealtimeTicketResponses } from "@/hooks/useRealtimeTicketResponses";
import { createSupportNotification } from "@/hooks/useSupportNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type TicketViewMode } from "@/hooks/useCSMTickets";
import {
  useCSMTicketDetail,
  useUpdateTicketStatus,
  useAssignTicket,
  useAddInternalNote,
  useEditInternalNote,
  useDeleteInternalNote,
  useAddTag,
  useRemoveTag,
  useEscalateTicket,
  useCloseWithResolution,
  useRespondAsStaff,
} from "@/hooks/useCSMTickets";
import { TicketConversation } from "@/components/support/TicketConversation";
import { toast } from "sonner";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  open: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  in_progress: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  waiting_client: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  closed: "bg-slate-500/15 text-slate-500 border-slate-500/30",
};
const statusLabels: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting_client: "Waiting on Client",
  resolved: "Resolved",
  closed: "Closed",
};
const TAG_OPTIONS = ["bug", "billing", "content", "urgent", "escalated", "feature"];

function extractStoragePath(url: string): string | null {
  const match = url.match(/\/object\/public\/ticket-attachments\/(.+)$/);
  return match ? match[1] : null;
}

function NoteAttachmentItem({ att }: { att: { name: string; url: string; size?: number; type?: string } }) {
  const [downloading, setDownloading] = useState(false);
  const isImage = att.type?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(att.name);
  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    setDownloading(true);
    try {
      const storagePath = extractStoragePath(att.url);
      if (storagePath) {
        const { data, error } = await supabase.storage.from("ticket-attachments").download(storagePath);
        if (error) throw error;
        const blobUrl = URL.createObjectURL(data);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = att.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } else {
        window.open(att.url, "_blank");
      }
    } catch {
      window.open(att.url, "_blank");
    } finally {
      setDownloading(false);
    }
  };
  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="flex items-center gap-2 text-xs bg-background/50 border border-border rounded-md px-2.5 py-1.5 hover:bg-accent/50 transition-colors group w-full text-left"
    >
      {isImage ? (
        <ImageIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      ) : (
        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      )}
      <span className="truncate flex-1">{att.name}</span>
      {att.size && <span className="text-muted-foreground shrink-0">{(att.size / 1024).toFixed(0)} KB</span>}
      {downloading ? (
        <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin shrink-0" />
      ) : (
        <Download className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </button>
  );
}

interface CSMTicketDetailProps {
  ticketId: string;
  onBack: () => void;
  viewMode?: TicketViewMode;
}

export function CSMTicketDetail({ ticketId, onBack, viewMode = "csm" }: CSMTicketDetailProps) {
  const { user } = useAuth();
  const { data, isLoading } = useCSMTicketDetail(ticketId);
  const updateStatusMutation = useUpdateTicketStatus();
  const assignMutation = useAssignTicket();
  const addNoteMutation = useAddInternalNote();
  const editNoteMutation = useEditInternalNote();
  const deleteNoteMutation = useDeleteInternalNote();
  const addTagMutation = useAddTag();
  const removeTagMutation = useRemoveTag();
  const escalateMutation = useEscalateTicket();
  const closeMutation = useCloseWithResolution();
  const respondMutation = useRespondAsStaff();
  const [retrying, setRetrying] = useState(false);

  const { data: ticketMeta, refetch: refetchMeta } = useQuery({
    queryKey: ["ticket-meta-sync", ticketId],
    queryFn: async () => {
      const { data } = await supabase
        .from("ticket_metadata")
        .select("sync_status, sync_error, sync_retry_count, sme_ticket_id")
        .eq("ticket_id", ticketId)
        .maybeSingle();
      return data;
    },
  });

  useRealtimeTicketResponses(ticketId, [["csm-ticket", ticketId], ["csm-tickets"]]);

  const [reply, setReply] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<UploadedAttachment[]>([]);
  const [note, setNote] = useState("");
  const [noteAttachments, setNoteAttachments] = useState<UploadedAttachment[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [assignSearch, setAssignSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<{ email: string; name: string } | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [customTagInput, setCustomTagInput] = useState("");
  const [showCustomTagInput, setShowCustomTagInput] = useState(false);
  const customTagRef = useRef<HTMLInputElement>(null);

  const { data: staffUsers } = useQuery({
    queryKey: ["staff-users-for-assign"],
    queryFn: async () => {
      const { data: adminIds } = await supabase.rpc("get_staff_user_ids");
      if (!adminIds?.length) return [];
      const userIds = (adminIds as Array<{ user_id: string }>).map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("id, first_name, last_name, user_email")
        .in("id", userIds);
      return (profiles || []).map((p) => ({
        user_id: p.id,
        name: [p.first_name, p.last_name].filter(Boolean).join(" ") || p.user_email || "Unknown",
        email: p.user_email || "",
      }));
    },
    staleTime: 5 * 60 * 1000,
    enabled: assignDialogOpen,
  });

  const filteredStaff = useMemo(() => {
    if (!staffUsers) return [];
    if (!assignSearch.trim()) return staffUsers;
    const q = assignSearch.toLowerCase();
    return staffUsers.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
  }, [staffUsers, assignSearch]);

  const ticket = data?.ticket as any;
  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([]);

  useEffect(() => {
    if (data?.ticket?.responses) setOptimisticMessages([]);
  }, [data?.ticket?.responses?.length]);

  const handleRetrySync = async () => {
    if (!ticket) return;
    setRetrying(true);
    try {
      const { syncToSME } = await import("@/services/ticketApi");
      const smeId = await (syncToSME as any)(ticketId, {
        action: "create",
        subject: ticket.subject,
        description: ticket.description,
        priority: ticket.priority,
        ticket_type: "bug",
        submitter_name: ticket.submitter_name,
        submitter_email: ticket.submitter_email,
        attachments: ticket.attachments || [],
      });
      if (smeId) {
        toast.success("Sync successful — Slack notification sent.");
        refetchMeta();
      } else {
        toast.error("Retry failed — try again shortly.");
      }
    } catch {
      toast.error("Retry failed — try again shortly.");
    } finally {
      setRetrying(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateStatusMutation.mutateAsync({ ticketId, status });
      if (ticket?.submitter_user_id)
        createSupportNotification(
          ticket.submitter_user_id,
          ticketId,
          "status_change",
          `Ticket status changed to ${statusLabels[status] || status}`,
        );
      toast.success(`Status updated to ${statusLabels[status] || status}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleReply = async () => {
    if (!reply.trim() && replyAttachments.length === 0) return;
    const msgText = reply.trim();
    const msgAttachments = replyAttachments.length ? [...replyAttachments] : undefined;
    const optimisticMsg = {
      id: `optimistic-${Date.now()}`,
      message: msgText,
      response_text: msgText,
      created_at: new Date().toISOString(),
      is_staff: true,
      sender_name: "You",
      attachments: msgAttachments,
      _optimistic: true,
    };
    setOptimisticMessages((prev) => [...prev, optimisticMsg]);
    setReply("");
    setReplyAttachments([]);
    try {
      await respondMutation.mutateAsync({ ticketId, message: msgText, attachments: msgAttachments });
      if (ticket?.submitter_user_id)
        createSupportNotification(
          ticket.submitter_user_id,
          ticketId,
          "reply",
          `New reply on your ticket "${ticket.subject}"`,
        );
    } catch {
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setReply(msgText);
      if (msgAttachments) setReplyAttachments(msgAttachments);
      toast.error("Failed to send reply");
    }
  };

  const handleAddNote = async () => {
    if (!note.trim() && noteAttachments.length === 0) return;
    try {
      await addNoteMutation.mutateAsync({
        ticketId,
        note: note.trim(),
        attachments: noteAttachments.length ? noteAttachments : undefined,
      });
      setNote("");
      setNoteAttachments([]);
      toast.success("Internal note added");
    } catch {
      toast.error("Failed to add note");
    }
  };

  const handleAddTag = async (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || existingTags.includes(trimmed)) return;
    try {
      await addTagMutation.mutateAsync({ ticketId, tag: trimmed });
      toast.success(`Tag "${trimmed}" added`);
    } catch {
      toast.error("Failed to add tag");
    }
  };

  const handleAddCustomTag = async () => {
    if (!customTagInput.trim()) return;
    await handleAddTag(customTagInput);
    setCustomTagInput("");
    setShowCustomTagInput(false);
  };
  const handleRemoveTag = async (tag: string) => {
    try {
      await removeTagMutation.mutateAsync({ ticketId, tag });
    } catch {
      toast.error("Failed to remove tag");
    }
  };

  const handleClose = async () => {
    if (!resolutionNote.trim()) {
      toast.error("Please provide a resolution note");
      return;
    }
    try {
      await closeMutation.mutateAsync({ ticketId, resolutionNote: resolutionNote.trim() });
      setResolutionNote("");
      setCloseDialogOpen(false);
      toast.success("Ticket closed");
    } catch {
      toast.error("Failed to close ticket");
    }
  };

  const handleAssign = async () => {
    if (!selectedStaff) return;
    try {
      await assignMutation.mutateAsync({
        ticketId,
        assigneeEmail: selectedStaff.email,
        assigneeName: selectedStaff.name,
      });
      setSelectedStaff(null);
      setAssignSearch("");
      setAssignDialogOpen(false);
      toast.success("Ticket assigned");
    } catch {
      toast.error("Failed to assign ticket");
    }
  };

  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  if (!ticket)
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Ticket not found</p>
        <Button variant="ghost" onClick={onBack} className="mt-4">
          Go back
        </Button>
      </div>
    );

  const existingTags: string[] = ticket.tags || [];
  const availableTags = TAG_OPTIONS.filter((t) => !existingTags.includes(t));

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to inbox
      </Button>

      <Card className="p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</p>
            <h2 className="text-lg font-semibold mt-1">{ticket.subject}</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              {ticket.submitter_name && <span>{ticket.submitter_name}</span>}
              {ticket.submitter_email && <span>({ticket.submitter_email})</span>}
              {ticket.topic && <span>· {ticket.topic}</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Created {format(new Date(ticket.created_at), "MMM d, yyyy h:mm a")}
            </p>
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            <Badge variant="outline" className={statusColors[ticket.status] || ""}>
              {statusLabels[ticket.status] || ticket.status}
            </Badge>
            <Badge variant="outline">{ticket.priority}</Badge>
            {ticket.assigned_to_name && <Badge variant="outline">Assigned: {ticket.assigned_to_name}</Badge>}
            {ticket.internal && (
              <Badge variant="outline" className="bg-purple-500/15 text-purple-400 border-purple-500/30">
                Internal
              </Badge>
            )}
            {ticket.escalated && (
              <Badge variant="outline" className="bg-orange-500/15 text-orange-400 border-orange-500/30">
                <AlertTriangle className="w-3 h-3 mr-1" /> Escalated
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3 items-center">
          {existingTags.map((tag: string) => (
            <Badge key={tag} variant="secondary" className="gap-1 text-xs">
              {tag}
              <button onClick={() => handleRemoveTag(tag)} className="ml-0.5 hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {showCustomTagInput ? (
            <div className="flex items-center gap-1">
              <Input
                ref={customTagRef}
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCustomTag();
                  if (e.key === "Escape") {
                    setShowCustomTagInput(false);
                    setCustomTagInput("");
                  }
                }}
                placeholder="Type tag name..."
                className="h-7 w-[140px] text-xs"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={handleAddCustomTag}
                disabled={!customTagInput.trim()}
              >
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-1 text-xs text-muted-foreground"
                onClick={() => {
                  setShowCustomTagInput(false);
                  setCustomTagInput("");
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <Select
              onValueChange={(v) => {
                if (v === "__custom__") {
                  setShowCustomTagInput(true);
                  setTimeout(() => customTagRef.current?.focus(), 50);
                } else {
                  handleAddTag(v);
                }
              }}
            >
              <SelectTrigger className="h-8 w-auto text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-full px-4 gap-1.5 border-none shadow-sm">
                <Tag className="w-3.5 h-3.5" />
                <span>Add tag</span>
              </SelectTrigger>
              <SelectContent>
                {availableTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
                <SelectItem value="__custom__" className="text-primary font-medium border-t mt-1 pt-1">
                  + Custom tag...
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </Card>

      {ticket.topic === "Bug Report" && ticketMeta && (
        <div>
          {ticketMeta.sync_status === "failed" && (
            <div className="rounded-lg border border-amber-400 bg-amber-100 dark:bg-amber-950/40 dark:border-amber-500/50 p-3 text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-200">SME sync failed</p>
              {ticketMeta.sync_error && <p className="text-amber-800 dark:text-amber-300 mt-1 text-xs">{ticketMeta.sync_error}</p>}
              {ticketMeta.sync_retry_count > 0 && (
                <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">Retried {ticketMeta.sync_retry_count}x</p>
              )}
              <button
                onClick={handleRetrySync}
                disabled={retrying}
                className="mt-2 px-3 py-1 bg-amber-600 text-white rounded text-xs font-medium hover:bg-amber-500 disabled:opacity-50 flex items-center gap-1"
              >
                {retrying && <Loader2 className="w-3 h-3 animate-spin" />}
                {retrying ? "Retrying..." : "Retry sync"}
              </button>
            </div>
          )}
          {ticketMeta.sync_status === "synced" && (
            <div className="flex items-center gap-1.5 text-xs text-green-400 px-1">
              <Check className="w-3.5 h-3.5" /> Synced to SME
            </div>
          )}
          {ticketMeta.sync_status === "pending" && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sync pending
            </div>
          )}
        </div>
      )}

      <Card className="p-3">
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={ticket.status} onValueChange={handleStatusChange} disabled={updateStatusMutation.isPending}>
            <SelectTrigger className="w-[180px]">
              {updateStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <SelectValue />}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="waiting_client">Waiting on Client</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <UserPlus className="w-4 h-4" /> Assign
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Ticket</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={assignSearch}
                    onChange={(e) => {
                      setAssignSearch(e.target.value);
                      setSelectedStaff(null);
                    }}
                    placeholder="Search by name or email..."
                    className="pl-9"
                    autoFocus
                  />
                </div>
                {selectedStaff ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{selectedStaff.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedStaff.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedStaff(null);
                        setAssignSearch("");
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="max-h-[200px] overflow-y-auto rounded-lg border">
                    {filteredStaff.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-3 text-center">No staff found</p>
                    ) : (
                      filteredStaff.map((staff) => (
                        <button
                          key={staff.user_id}
                          className="w-full text-left px-3 py-2 hover:bg-accent/50 transition-colors flex items-center justify-between border-b last:border-b-0"
                          onClick={() => {
                            setSelectedStaff({ email: staff.email, name: staff.name });
                            setAssignSearch(staff.name);
                          }}
                        >
                          <div>
                            <p className="text-sm font-medium">{staff.name}</p>
                            <p className="text-xs text-muted-foreground">{staff.email}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
                <Button
                  onClick={handleAssign}
                  disabled={!selectedStaff || assignMutation.isPending}
                  className="w-full gap-2"
                >
                  {assignMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}Assign
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                Close with Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Close Ticket</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="space-y-1">
                  <Label>Resolution Note *</Label>
                  <Textarea
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Describe how this was resolved..."
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleClose}
                  disabled={!resolutionNote.trim() || closeMutation.isPending}
                  className="w-full gap-2"
                >
                  {closeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}Close Ticket
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-3">Conversation</h3>
            <div>
              <TicketConversation
                description={ticket.description}
                createdAt={ticket.created_at}
                responses={[...(ticket.responses || []), ...optimisticMessages]}
                attachments={(ticket.attachments as any[]) || []}
              />
            </div>
          </Card>
          {!ticket.internal && (
            <Card className="p-4">
              <h3 className="text-sm font-medium mb-3">Reply to Client</h3>
              <div className="space-y-3">
                <Textarea
                  placeholder="Type your reply to the client..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={3}
                />
                <ReplyAttachmentInput attachments={replyAttachments} onAttachmentsChange={setReplyAttachments} />
                <div className="flex justify-end">
                  <Button
                    onClick={handleReply}
                    disabled={(!reply.trim() && replyAttachments.length === 0) || respondMutation.isPending}
                    className="gap-2"
                  >
                    {respondMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}{" "}
                    Send Reply
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card className="p-4 border-amber-500/20 bg-amber-500/5 h-full">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-amber-400" /> Internal Notes{" "}
              <span className="text-xs text-muted-foreground">(never visible to clients)</span>
            </h3>
            <div className="space-y-3 mb-3">
              {(ticket.internal_notes || []).map((n: any, i: number) => (
                <div key={n.id || i} className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  {editingNoteId === n.id ? (
                    <div className="flex gap-2">
                      <Textarea
                        value={editingNoteText}
                        onChange={(e) => setEditingNoteText(e.target.value)}
                        rows={2}
                        className="flex-1"
                      />
                      <div className="flex flex-col gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-green-400"
                          disabled={editNoteMutation.isPending}
                          onClick={async () => {
                            try {
                              await editNoteMutation.mutateAsync({
                                ticketId,
                                noteId: n.id,
                                note: editingNoteText.trim(),
                              });
                              setEditingNoteId(null);
                              toast.success("Note updated");
                            } catch {
                              toast.error("Failed to update note");
                            }
                          }}
                        >
                          {editNoteMutation.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingNoteId(null)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm whitespace-pre-wrap">{n.note || n.message}</p>
                      {n.attachments && n.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {n.attachments.map((att: any, ai: number) => (
                            <NoteAttachmentItem key={ai} att={att} />
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {n.author_name && <span>{n.author_name}</span>}
                          {n.created_at && <span>· {format(new Date(n.created_at), "MMM d, yyyy h:mm a")}</span>}
                        </div>
                        {n.id && n.author_id === user?.id && (
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground hover:text-amber-400"
                              onClick={() => {
                                setEditingNoteId(n.id);
                                setEditingNoteText(n.note || n.message || "");
                              }}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              disabled={deleteNoteMutation.isPending}
                              onClick={async () => {
                                try {
                                  await deleteNoteMutation.mutateAsync({ ticketId, noteId: n.id });
                                  toast.success("Note deleted");
                                } catch {
                                  toast.error("Failed to delete note");
                                }
                              }}
                            >
                              {deleteNoteMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add an internal note..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddNote}
                  disabled={(!note.trim() && noteAttachments.length === 0) || addNoteMutation.isPending}
                  size="sm"
                  className="self-end gap-1"
                >
                  {addNoteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <StickyNote className="w-4 h-4" />
                  )}{" "}
                  Add
                </Button>
              </div>
              <ReplyAttachmentInput attachments={noteAttachments} onAttachmentsChange={setNoteAttachments} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
