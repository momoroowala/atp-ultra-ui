import { useState, useEffect, FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarCall } from "@/hooks/useCalendarCalls";
import { formatTimeInUserTZ, getUserTimezone, formatDateLabelInUserTZ, isCallUpcomingInUserTZ } from "@/utils/timezoneHelpers";
import { TierBadges } from "./TierBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Edit, Calendar, Clock, Globe, Lock, Check, X, Users, MessageSquare, Send, CalendarCheck } from "lucide-react";
import { useCallRsvps, useUpsertRsvp } from "@/hooks/useCallRsvp";
import { useAuth } from "@/hooks/useAuth";

/* ------------------------------------------------------------------ */
/*  Q&A types & localStorage helpers                                  */
/* ------------------------------------------------------------------ */

interface QAQuestion {
  id: string;
  question: string;
  label: string;
  submittedBy: string;
  submittedAt: string;
}

const QA_LABELS = ["General", "Technical", "Brand Related", "Shipping", "Other"] as const;
type QALabel = (typeof QA_LABELS)[number];

const LABEL_COLORS: Record<QALabel, string> = {
  General: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Technical: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "Brand Related": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Shipping: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Other: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

function getStorageKey(callId: string) {
  return `calendar_qa_${callId}`;
}

function loadQuestions(callId: string): QAQuestion[] {
  try {
    const raw = localStorage.getItem(getStorageKey(callId));
    return raw ? (JSON.parse(raw) as QAQuestion[]) : [];
  } catch {
    return [];
  }
}

function saveQuestions(callId: string, questions: QAQuestion[]) {
  localStorage.setItem(getStorageKey(callId), JSON.stringify(questions));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface CalendarCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  call: CalendarCall;
  isAdmin: boolean;
  userTierId: string | null;
  upsellUrl: string | null | undefined;
  onEdit: (call: CalendarCall) => void;
}

export const CalendarCallModal = ({ open, onOpenChange, call, isAdmin, userTierId, upsellUrl, onEdit }: CalendarCallModalProps) => {
  const { yesCount, noCount, currentUserRsvp, isLoading: rsvpLoading } = useCallRsvps(open ? call?.id : undefined);
  const upsertRsvp = useUpsertRsvp();
  const { user } = useAuth();

  /* ----- Q&A state ----- */
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newLabel, setNewLabel] = useState<QALabel>("General");

  // Reload questions from localStorage whenever the modal opens for a call
  useEffect(() => {
    if (open && call?.id) {
      setQuestions(loadQuestions(call.id));
    }
  }, [open, call?.id]);

  // Normalize visible_tier_ids to always be an array
  const normalizedTierIds = call?.visible_tier_ids
    ? Array.isArray(call.visible_tier_ids)
      ? call.visible_tier_ids
      : [call.visible_tier_ids]
    : [];

  // Normalize visible_tiers to always be an array
  const normalizedVisibleTiers = call?.visible_tiers
    ? Array.isArray(call.visible_tiers)
      ? call.visible_tiers
      : [call.visible_tiers]
    : [];

  const hasAccess =
    isAdmin ||
    normalizedTierIds.length === 0 ||
    normalizedVisibleTiers.includes("all") ||
    (userTierId && normalizedTierIds.some((id) => String(id) === String(userTierId)));

  const handleJoin = () => {
    if (hasAccess) {
      window.open(call.call_link, "_blank");
    } else if (upsellUrl) {
      window.open(upsellUrl, "_blank");
    }
  };

  const handleEdit = () => {
    onOpenChange(false);
    onEdit(call);
  };

  const handleRsvp = (status: 'yes' | 'no') => {
    upsertRsvp.mutate({ callId: call.id, status });
  };

  const handleSubmitQuestion = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newQuestion.trim();
    if (!trimmed) return;

    const entry: QAQuestion = {
      id: crypto.randomUUID(),
      question: trimmed,
      label: newLabel,
      submittedBy: user?.email ?? "Unknown",
      submittedAt: new Date().toISOString(),
    };

    const updated = [...questions, entry];
    setQuestions(updated);
    saveQuestions(call.id, updated);
    setNewQuestion("");
    setNewLabel("General");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{call.title}</DialogTitle>
          <DialogDescription className="sr-only">Details for {call.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {call.description && (
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-muted-foreground whitespace-pre-wrap">{call.description}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatDateLabelInUserTZ(call.call_date, call.call_time, call.timezone)}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formatTimeInUserTZ(call.call_date, call.call_time, call.timezone)}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span>Your timezone: {getUserTimezone()}</span>
            </div>
          </div>

          {isAdmin && normalizedVisibleTiers.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Visible to</h4>
              <TierBadges tiers={normalizedVisibleTiers} />
            </div>
          )}

          {/* RSVP Section */}
          {hasAccess && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium text-sm">RSVP</h4>
                {!rsvpLoading && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {yesCount} attending · {noCount} not attending
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant={currentUserRsvp === 'yes' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleRsvp('yes')}
                  disabled={upsertRsvp.isPending}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Yes, I'm joining
                </Button>
                <Button
                  variant={currentUserRsvp === 'no' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => handleRsvp('no')}
                  disabled={upsertRsvp.isPending}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-1" />
                  Can't make it
                </Button>
              </div>
            </div>
          )}

          {/* Q&A Section - admin / CSM only */}
          {isAdmin && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium text-sm">Q&A Questions</h4>
                <span className="text-xs text-muted-foreground ml-auto">
                  {questions.length} question{questions.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Question list - scrollable */}
              {questions.length > 0 && (
                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      className="rounded-md border bg-muted/30 p-3 space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm leading-snug">{q.question}</p>
                        <span
                          className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            LABEL_COLORS[q.label as QALabel] ?? LABEL_COLORS.Other
                          }`}
                        >
                          {q.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{q.submittedBy}</span>
                        <span>·</span>
                        <span>
                          {new Date(q.submittedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          {new Date(q.submittedAt).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {questions.length === 0 && (
                <p className="text-xs text-muted-foreground">No questions yet. Be the first to ask!</p>
              )}

              {/* New question form */}
              <form onSubmit={handleSubmitQuestion} className="flex items-end gap-2 pt-1">
                <div className="flex-1">
                  <Input
                    placeholder="Ask a question..."
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <Select value={newLabel} onValueChange={(val) => setNewLabel(val as QALabel)}>
                  <SelectTrigger className="w-[130px] h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QA_LABELS.map((label) => (
                      <SelectItem key={label} value={label} className="text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" size="sm" className="h-9 px-3" disabled={!newQuestion.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          )}

          {/* Action Buttons */}
          {(() => {
            // Determine if the call is happening right now (within 30 min before to 2 hours after start)
            const callStart = new Date(`${call.call_date}T${call.call_time}`);
            const now = new Date();
            const msUntilStart = callStart.getTime() - now.getTime();
            const minUntilStart = msUntilStart / 60000;
            const isLive = minUntilStart <= 30 && minUntilStart >= -120; // 30 min before to 2 hours after
            const isFuture = minUntilStart > 30;

            return (
              <div className="flex gap-2 pt-4">
                {hasAccess ? (
                  isLive ? (
                    <Button onClick={handleJoin} className="flex-1 bg-green-600 hover:bg-green-700">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Join Now
                    </Button>
                  ) : isFuture ? (
                    <Button
                      variant={currentUserRsvp === 'yes' ? 'default' : 'outline'}
                      onClick={() => handleRsvp('yes')}
                      disabled={upsertRsvp.isPending}
                      className="flex-1"
                    >
                      <CalendarCheck className="mr-2 h-4 w-4" />
                      {currentUserRsvp === 'yes' ? "RSVP'd" : 'RSVP'}
                    </Button>
                  ) : (
                    <Button variant="outline" disabled className="flex-1">
                      Call Ended
                    </Button>
                  )
                ) : (
                  <Button variant="outline" onClick={handleJoin} disabled={!upsellUrl} className="flex-1">
                    <Lock className="mr-2 h-4 w-4" />
                    Unlock
                  </Button>
                )}

                {isAdmin && (
                  <Button variant="outline" onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
            );
          })()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
