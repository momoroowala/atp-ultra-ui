import { useState } from 'react';
import { useCSMTickets, type CSMTicketFilters, type TicketViewMode } from '@/hooks/useCSMTickets';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow, format } from 'date-fns';
import { Search, Filter, Plus, RefreshCw, Inbox, Download, AlertTriangle, MessageCircle, X } from 'lucide-react';
import { CSMTicketDetail } from './CSMTicketDetail';
import { CSMInternalTicketForm } from './CSMInternalTicketForm';

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
  open: 'Open', in_progress: 'In Progress', waiting_client: 'Waiting on Client', resolved: 'Resolved', closed: 'Closed',
};

type View = 'inbox' | 'detail' | 'create-internal';

function exportTicketsCSV(tickets: any[]) {
  const headers = ['Ticket ID', 'Subject', 'Client/Internal', 'Topic', 'Status', 'Solved', 'Priority', 'Escalated', 'Submitter Name', 'Submitter Email', 'Assigned', 'Created', 'Last Updated'];
  const esc = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
  const rows = tickets.map((t: any) => [
    t.ticket_number || '',
    esc(t.subject),
    t.internal ? 'Internal' : 'Client',
    t.topic || '',
    statusLabels[t.status] || t.status || '',
    (t.status === 'resolved' || t.status === 'closed') ? 'Solved' : 'Unsolved',
    t.priority || '',
    t.escalated ? 'Yes' : 'No',
    esc(t.submitter_name),
    t.submitter_email || '',
    t.assigned_to_name || '',
    t.created_at ? format(new Date(t.created_at), 'yyyy-MM-dd HH:mm') : '',
    t.updated_at ? format(new Date(t.updated_at), 'yyyy-MM-dd HH:mm') : '',
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `support-tickets-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

interface CSMTicketInboxProps { viewMode?: TicketViewMode; }

export function CSMTicketInbox({ viewMode = 'csm' }: CSMTicketInboxProps) {
  const [view, setView] = useState<View>('inbox');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const isStaffView = viewMode === 'admin' || viewMode === 'mega_admin';
  const [filters, setFilters] = useState<CSMTicketFilters>(() => ({
    source: isStaffView ? 'staff' : undefined,
  }));
  const [filterUnread, setFilterUnread] = useState(false);

  const { data, isLoading, error, refetch } = useCSMTickets(filters, viewMode);
  const tickets = data?.tickets || [];

  const filtered = tickets.filter((t: any) => {
    if (filterUnread && !t.has_new_reply) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return t.subject?.toLowerCase().includes(q) || String(t.ticket_number)?.toLowerCase().includes(q) || t.submitter_name?.toLowerCase().includes(q) || t.submitter_email?.toLowerCase().includes(q);
  });

  if (view === 'detail' && selectedTicketId) {
    return <CSMTicketDetail ticketId={selectedTicketId} onBack={() => { setView('inbox'); setSelectedTicketId(null); }} viewMode={viewMode} />;
  }
  if (view === 'create-internal') {
    return <CSMInternalTicketForm onBack={() => setView('inbox')} onCreated={() => { setView('inbox'); refetch(); }} />;
  }

  const unreadCount = tickets.filter((t: any) => t.has_new_reply).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
          <Inbox className="w-5 h-5" /> Support Inbox
          {unreadCount > 0 && (
            <Badge className="ml-1 cursor-pointer bg-primary/80 text-primary-foreground hover:bg-primary" onClick={() => setFilterUnread(!filterUnread)}>
              {filterUnread ? <span className="flex items-center gap-1">{unreadCount} new <X className="w-3 h-3" /></span> : `${unreadCount} new`}
            </Badge>
          )}
        </h2>
        <div className="flex flex-wrap gap-2">
          {(viewMode === 'admin' || viewMode === 'mega_admin') && (
            <Button variant="outline" size="sm" onClick={() => exportTicketsCSV(filtered)} className="gap-2"><Download className="w-4 h-4" /> Export CSV</Button>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2"><RefreshCw className="w-4 h-4" /> Refresh</Button>
          <Button size="sm" onClick={() => setView('create-internal')} className="gap-2"><Plus className="w-4 h-4" /> Internal Ticket</Button>
        </div>
      </div>

      <Card className="p-3 sm:p-4">
        <div className="flex flex-wrap gap-2 sm:gap-3 items-end">
          <div className="w-full sm:flex-1 sm:min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
          <Select value={filters.status || 'all'} onValueChange={v => setFilters(f => ({ ...f, status: v === 'all' ? undefined : v }))}>
            <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="waiting_client">Waiting on Client</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.priority || 'all'} onValueChange={v => setFilters(f => ({ ...f, priority: v === 'all' ? undefined : v }))}>
            <SelectTrigger className="w-[calc(50%-4px)] sm:w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.topic || 'all'} onValueChange={v => setFilters(f => ({ ...f, topic: v === 'all' ? undefined : v }))}>
            <SelectTrigger className="w-[calc(50%-4px)] sm:w-[160px]"><SelectValue placeholder="Topic" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              <SelectItem value="Program Content Issue">Program Content</SelectItem>
              <SelectItem value="Platform Question">Platform Question</SelectItem>
              <SelectItem value="Community & Communication">Community</SelectItem>
              <SelectItem value="Billing & Account Request">Billing & Account</SelectItem>
              {viewMode === 'mega_admin' && <SelectItem value="Bug Report">Bug Report</SelectItem>}
            </SelectContent>
          </Select>
          <Select value={filters.source || 'all'} onValueChange={v => setFilters(f => ({ ...f, source: v === 'all' ? undefined : v }))}>
            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tickets</SelectItem>
              {isStaffView && <SelectItem value="staff">{viewMode === 'mega_admin' ? 'Escalated / Internal / Bugs' : 'Escalated / Internal'}</SelectItem>}
              <SelectItem value="client">Client Tickets</SelectItem>
              <SelectItem value="internal">Internal Only</SelectItem>
              <SelectItem value="escalated">Escalated Only</SelectItem>
            </SelectContent>
          </Select>
          {(filters.status || filters.priority || filters.topic || filters.source || search) && (
            <Button variant="ghost" size="sm" onClick={() => { setFilters({ source: isStaffView ? 'staff' : undefined }); setSearch(''); }}>Clear</Button>
          )}
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : error ? (
          <CardContent className="text-center py-12">
            <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-3 opacity-70" />
            <p className="font-medium text-destructive mb-1">Failed to load tickets</p>
            <p className="text-sm text-muted-foreground mb-4">{error.message || 'A permission or network error occurred.'}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Try Again</Button>
          </CardContent>
        ) : filtered.length === 0 ? (
          <CardContent className="text-center py-12">
            <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground">No tickets found</p>
          </CardContent>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Ticket</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="hidden lg:table-cell">Topic</TableHead>
                  <TableHead className="hidden md:table-cell">Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Priority</TableHead>
                  <TableHead className="hidden xl:table-cell">Assigned</TableHead>
                  <TableHead className="hidden sm:table-cell">Created</TableHead>
                  
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ticket: any) => (
                  <TableRow key={ticket.id} className={`cursor-pointer hover:bg-accent/50 ${ticket.has_new_reply ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`} onClick={() => { setSelectedTicketId(ticket.id); setView('detail'); }}>
                    <TableCell className="font-mono text-xs">{ticket.ticket_number}</TableCell>
                    <TableCell className="font-medium max-w-[250px] truncate">
                      <div className="flex items-center gap-2">
                        {ticket.has_new_reply && <MessageCircle className="w-4 h-4 text-primary fill-primary shrink-0" />}
                        {ticket.escalated && <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />}
                        <span className={`truncate ${ticket.has_new_reply ? 'font-semibold' : ''}`}>{ticket.subject}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {ticket.topic ? <Badge variant="outline" className={topicColors[ticket.topic] || 'bg-muted text-muted-foreground border-border'}>{ticket.topic}</Badge> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm hidden md:table-cell">
                      {ticket.internal ? <span className="text-muted-foreground italic">Internal</span> : <span>{ticket.submitter_name || ticket.submitter_email}</span>}
                    </TableCell>
                    <TableCell><Badge variant="outline" className={statusColors[ticket.status] || ''}>{statusLabels[ticket.status] || ticket.status}</Badge></TableCell>
                    <TableCell className="hidden sm:table-cell"><Badge variant="outline" className={priorityColors[ticket.priority] || ''}>{ticket.priority}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden xl:table-cell">{ticket.assigned_to_name || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap hidden sm:table-cell">{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
