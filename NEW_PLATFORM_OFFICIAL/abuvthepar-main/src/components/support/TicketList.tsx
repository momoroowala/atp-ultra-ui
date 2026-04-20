import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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

interface TicketListProps {
  tickets: Ticket[];
  loading: boolean;
  onSelect: (id: string) => void;
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  in_progress: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  waiting_client: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  closed: 'bg-slate-500/15 text-slate-500 border-slate-500/30',
};

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground border-border',
  medium: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  urgent: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const topicColors: Record<string, string> = {
  'Program Content Issue': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  'Platform Question': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  'Community & Communication': 'bg-green-500/15 text-green-400 border-green-500/30',
  'Billing & Account Request': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Bug Report': 'bg-red-500/15 text-red-400 border-red-500/30',
};

const statusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_client: 'Awaiting Your Reply',
  resolved: 'Resolved',
  closed: 'Closed',
};

export function TicketList({ tickets, loading, onSelect }: TicketListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
      </div>
    );
  }

  if (!tickets.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No tickets yet</p>
        <p className="text-sm mt-1">Create a new ticket to get started</p>
      </div>
    );
  }

  const sorted = [...tickets].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-3">
      {sorted.map(ticket => (
        <Card
          key={ticket.id}
          className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => onSelect(ticket.id)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
                {ticket.status === 'waiting_client' && <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />}
              </div>
              <p className="font-medium truncate">{ticket.subject}</p>
              <div className="flex items-center gap-2 mt-1">
                {ticket.topic && <Badge variant="outline" className={`text-xs ${topicColors[ticket.topic] || 'bg-muted text-muted-foreground border-border'}`}>{ticket.topic}</Badge>}
                <span className="text-xs text-muted-foreground">· {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge variant="outline" className={statusColors[ticket.status] || ''}>{statusLabels[ticket.status] || ticket.status}</Badge>
              <Badge variant="outline" className={priorityColors[ticket.priority] || ''}>{ticket.priority}</Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
