import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TicketDetail } from '@/components/support/TicketDetail';
import { NewTicketForm } from '@/components/support/NewTicketForm';
import { useTickets } from '@/hooks/useTickets';
import { useMarkSupportNotificationsRead } from '@/hooks/useSupportNotifications';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface Ticket {
  id: string;
  ticket_number: string | number;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  topic?: string;
}

const priorityBorderColors: Record<string, string> = {
  urgent: 'border-l-4 border-l-red-500',
  high: 'border-l-4 border-l-orange-500',
  medium: 'border-l-4 border-l-blue-500',
  low: 'border-l-4 border-l-slate-300',
};

const statusCircleColors: Record<string, string> = {
  open: 'bg-yellow-400',
  in_progress: 'bg-yellow-400',
  waiting_client: 'bg-yellow-400',
  resolved: 'bg-green-400',
  closed: 'bg-slate-400',
};

const topicColors: Record<string, string> = {
  'Program Content Issue': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  'Platform Question': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  'Community & Communication': 'bg-green-500/15 text-green-400 border-green-500/30',
  'Billing & Account Request': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Bug Report': 'bg-red-500/15 text-red-400 border-red-500/30',
};

function sortTickets(tickets: Ticket[]): Ticket[] {
  const activeStatuses = new Set(['open', 'in_progress', 'waiting_client']);
  const active = tickets.filter(t => activeStatuses.has(t.status));
  const inactive = tickets.filter(t => !activeStatuses.has(t.status));
  const byDate = (a: Ticket, b: Ticket) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  return [...active.sort(byDate), ...inactive.sort(byDate)];
}

export default function Support() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const { data, isLoading } = useTickets();
  const markRead = useMarkSupportNotificationsRead();

  // Deep-link from notification bell
  useEffect(() => {
    const ticketFromUrl = searchParams.get('ticket');
    if (ticketFromUrl) {
      setSelectedTicketId(ticketFromUrl);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]); // re-run when query params change

  useEffect(() => { markRead.mutate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (selectedTicketId) {
    return (
      <div className="w-full p-4 md:p-6">
        <TicketDetail ticketId={selectedTicketId} onBack={() => setSelectedTicketId(null)} />
      </div>
    );
  }

  const tickets: Ticket[] = data?.tickets || [];
  const sorted = sortTickets(tickets);
  const activeStatuses = new Set(['open', 'in_progress', 'waiting_client']);

  return (
    <div className="w-full p-4 md:p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4">Support</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: Compact Ticket Form (60%) */}
        <div className="lg:col-span-3">
          <NewTicketForm />
        </div>

        {/* RIGHT: Ticket Tracker (40%) */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Your Tickets</h2>
            <span className="text-sm text-muted-foreground">
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : !tickets.length ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-sm font-medium">No tickets yet</p>
              <p className="text-xs mt-1">Submit a ticket to get started</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[calc(100vh-12rem)] space-y-2 pr-1">
              {sorted.map(ticket => {
                const isInactive = !activeStatuses.has(ticket.status);
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`
                      rounded-md bg-card cursor-pointer transition-colors hover:bg-accent/50
                      ${priorityBorderColors[ticket.priority] || 'border-l-4 border-l-slate-300'}
                      ${isInactive ? 'opacity-50' : ''}
                      px-3 py-2.5
                    `}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Status circle */}
                      <div className="pt-1 shrink-0">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${statusCircleColors[ticket.status] || 'bg-slate-400'}`}
                        />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate leading-tight">
                          {ticket.subject}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {ticket.topic && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 leading-4 ${topicColors[ticket.topic] || 'bg-muted text-muted-foreground border-border'}`}
                            >
                              {ticket.topic}
                            </Badge>
                          )}
                          <span className="text-[11px] text-muted-foreground">
                            {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
