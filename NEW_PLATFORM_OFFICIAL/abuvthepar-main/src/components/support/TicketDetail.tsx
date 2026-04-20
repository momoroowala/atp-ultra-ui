import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useTicket, useRespondToTicket } from '@/hooks/useTickets';
import { TicketConversation } from './TicketConversation';
import { ReplyAttachmentInput, type UploadedAttachment } from './ReplyAttachmentInput';
import { useRealtimeTicketResponses } from '@/hooks/useRealtimeTicketResponses';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  open: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  in_progress: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  waiting_client: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  closed: 'bg-slate-500/15 text-slate-500 border-slate-500/30',
};

const statusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_client: 'Awaiting Your Reply',
  resolved: 'Resolved',
  closed: 'Closed',
};

const topicColors: Record<string, string> = {
  'Program Content Issue': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  'Platform Question': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  'Community & Communication': 'bg-green-500/15 text-green-400 border-green-500/30',
  'Billing & Account Request': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Bug Report': 'bg-red-500/15 text-red-400 border-red-500/30',
};

interface TicketDetailProps {
  ticketId: string;
  onBack: () => void;
}

export function TicketDetail({ ticketId, onBack }: TicketDetailProps) {
  const { data, isLoading } = useTicket(ticketId);
  const respondMutation = useRespondToTicket();
  const [reply, setReply] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<UploadedAttachment[]>([]);
  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useRealtimeTicketResponses(ticketId, [['ticket', ticketId]]);

  useEffect(() => {
    if (data?.ticket?.responses) setOptimisticMessages([]);
  }, [data?.ticket?.responses?.length]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.closest('.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [data?.ticket?.responses?.length, optimisticMessages.length]);

  const ticket = data?.ticket;
  const canReply = ticket?.status === 'open' || ticket?.status === 'waiting_client';
  const isRestricted = !canReply && ticket?.status;

  const handleSubmitReply = async () => {
    if (!reply.trim() && replyAttachments.length === 0) return;
    const msgText = reply.trim();
    const msgAttachments = replyAttachments.length ? [...replyAttachments] : undefined;

    const optimisticMsg = {
      id: `optimistic-${Date.now()}`,
      message: msgText,
      response_text: msgText,
      created_at: new Date().toISOString(),
      is_staff: false,
      attachments: msgAttachments,
      _optimistic: true,
    };
    setOptimisticMessages(prev => [...prev, optimisticMsg]);
    setReply('');
    setReplyAttachments([]);

    try {
      await respondMutation.mutateAsync({ ticketId, message: msgText, attachments: msgAttachments });
    } catch {
      setOptimisticMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      setReply(msgText);
      if (msgAttachments) setReplyAttachments(msgAttachments);
      toast.error('Failed to send reply');
    }
  };

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-32" /><Skeleton className="h-24 w-full" /><Skeleton className="h-48 w-full" /></div>;
  }

  if (!ticket) {
    return <div className="text-center py-12 text-muted-foreground"><p>Ticket not found</p><Button variant="ghost" onClick={onBack} className="mt-4">Go back</Button></div>;
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back to tickets</Button>

      <Card className="p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</p>
            <h2 className="text-lg font-semibold mt-1">{ticket.subject}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {ticket.topic && <Badge variant="outline" className={topicColors[ticket.topic] || 'bg-muted text-muted-foreground border-border'}>{ticket.topic}</Badge>}
            <Badge variant="outline" className={statusColors[ticket.status] || ''}>{statusLabels[ticket.status] || ticket.status}</Badge>
            <Badge variant="outline">{ticket.priority}</Badge>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <TicketConversation
          description={ticket.description}
          createdAt={ticket.created_at}
          responses={[...(ticket.responses || []), ...optimisticMessages]}
          attachments={ticket.attachments as any[] || []}
        />
        <div ref={scrollRef} />
      </Card>

      {canReply ? (
        <Card className="p-4">
          <div className="space-y-3">
            <Textarea placeholder="Type your reply..." value={reply} onChange={e => setReply(e.target.value)} rows={3} />
            <ReplyAttachmentInput attachments={replyAttachments} onAttachmentsChange={setReplyAttachments} />
            <div className="flex justify-end">
              <Button onClick={handleSubmitReply} disabled={!reply.trim() && replyAttachments.length === 0} className="gap-2">
                <Send className="w-4 h-4" /> Send Reply
              </Button>
            </div>
          </div>
        </Card>
      ) : isRestricted ? (
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Lock className="w-4 h-4" />
            {ticket.status === 'closed' ? 'This ticket is closed.' : 'Replies are not available for this ticket status.'}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
