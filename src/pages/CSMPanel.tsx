import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Headphones, GraduationCap, LayoutDashboard, MessageSquare, Ticket, UserCheck, Plus, ArrowUpCircle } from 'lucide-react';
import { CSMTicketInbox } from '@/components/csm/CSMTicketInbox';
import { CSMStudentsTab } from '@/components/csm/CSMStudentsTab';
import { CSMDelegationPanel } from '@/components/csm/CSMDelegationPanel';
import { CSMDashboardTab } from '@/components/csm/CSMDashboardTab';
import { CSMTicketDetail } from '@/components/csm/CSMTicketDetail';
import { CSMChatDrawer } from '@/components/csm/CSMChatDrawer';
import { UserDetailsView } from '@/components/settings/customer-success/UserDetailsView';
import { useMarkSupportNotificationsRead } from '@/hooks/useSupportNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { useCSMStudents, useCSMList } from '@/hooks/useCSMStudents';
import { useMyAssignedStudentIds } from '@/hooks/useMyAssignedStudentIds';
import { useCommunityDMs } from '@/hooks/useCommunityDMs';
import { useMyDelegation } from '@/hooks/useCSMDelegations';
import { useCSMTickets } from '@/hooks/useCSMTickets';
import { format } from 'date-fns';
import { toast as sonnerToast } from 'sonner';

export default function CSMPanel() {
  const location = useLocation();
  const locationState = location.state as { viewStudentId?: string; activeTab?: string } | null;
  const [activeTab, setActiveTab] = useState(locationState?.activeTab || 'dashboard');
  const [viewStudentId, setViewStudentId] = useState<string | null>(locationState?.viewStudentId || null);
  const markRead = useMarkSupportNotificationsRead();
  const { user } = useAuth();
  const { isCSM } = useRoleCheck();

  // Communications sub-view: 'chats' or 'tickets'
  const [commsView, setCommsView] = useState<'chats' | 'tickets'>('chats');

  // Shared state for chats & tickets sub-views
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [drawerConvId, setDrawerConvId] = useState<string | null>(null);
  const [drawerConvName, setDrawerConvName] = useState('');
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
  const [chatStudentFilter, setChatStudentFilter] = useState<string>('all');

  // Hooks for chats & tickets
  const { data: students = [] } = useCSMStudents(user?.id || '');
  const { conversations, isLoading: chatsLoading } = useCommunityDMs();
  const { data: ticketData, isLoading: ticketsLoading } = useCSMTickets(undefined, 'csm');
  const { data: assignedStudents } = useMyAssignedStudentIds();
  const { data: delegation } = useMyDelegation();
  const coveringFor = delegation?.asDelegate;

  const myTickets = (ticketData?.tickets || []).filter((t: any) => {
    if (isCSM && assignedStudents) {
      const byId = t.submitter_user_id && assignedStudents.ids.has(t.submitter_user_id);
      const byEmail = t.submitter_email && assignedStudents.emails.has(t.submitter_email.toLowerCase());
      return byId || byEmail;
    }
    return t.assigned_to_email === user?.email;
  });

  const unreadChatCount = conversations.filter(conv => (conv.unread_count ?? 0) > 0).length;
  const openTicketCount = myTickets.filter((t: any) => t.status === 'open').length;
  const commsCount = unreadChatCount + openTicketCount;

  // Student attention count: students who haven't signed in within 14 days or never signed in
  const studentsNeedingAttention = students.filter((s: any) => {
    if (!s.lastSignInAt) return true; // never logged in
    const daysSince = (Date.now() - new Date(s.lastSignInAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 14;
  }).length;

  useEffect(() => { markRead.mutate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle navigation state from UserProfilePopover "View Full Profile" button
  useEffect(() => {
    if (locationState?.viewStudentId) {
      setViewStudentId(locationState.viewStudentId);
      if (locationState.activeTab) setActiveTab(locationState.activeTab);
      // Clear state so refreshing the page doesn't re-trigger
      window.history.replaceState({}, document.title);
    }
  }, [locationState?.viewStudentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // If viewing a student profile (from popover "View Full Profile"), show it full-screen
  if (viewStudentId) {
    return (
      <main className="flex-1 overflow-auto bg-content">
        <div className="container mx-auto px-4 md:px-6 py-5">
          <UserDetailsView
            userId={viewStudentId}
            onBack={() => setViewStudentId(null)}
            onViewTicket={(ticketId) => { setViewStudentId(null); setSelectedTicketId(ticketId); }}
          />
        </div>
      </main>
    );
  }

  // If viewing a ticket detail, show it full-screen
  if (selectedTicketId) {
    return (
      <main className="flex-1 overflow-auto bg-content">
        <div className="container mx-auto px-4 md:px-6 py-5">
          <CSMTicketDetail
            ticketId={selectedTicketId}
            onBack={() => setSelectedTicketId(null)}
            viewMode="csm"
          />
        </div>
      </main>
    );
  }

  const isStudentRelatedTab = ['students', 'communications'].includes(activeTab);

  // Tab count -- always 3 tabs
  const tabCount = 3;

  // Add Student / Upgrade Tier dialogs
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [upgradeTierOpen, setUpgradeTierOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ firstName: '', lastName: '', email: '', tier: 'STB' });
  const [upgradeForm, setUpgradeForm] = useState({ studentId: '', newTier: 'Elite' });

  const TIERS = ['STB', 'Elite', 'Ultimate', 'Platinum', 'Diamond'];

  const handleAddStudent = () => {
    if (!newStudent.firstName || !newStudent.lastName || !newStudent.email) {
      sonnerToast.error('Please fill in all required fields');
      return;
    }
    sonnerToast.success(`Student ${newStudent.firstName} ${newStudent.lastName} added (demo)`);
    setNewStudent({ firstName: '', lastName: '', email: '', tier: 'STB' });
    setAddStudentOpen(false);
  };

  const handleUpgradeTier = () => {
    if (!upgradeForm.studentId) {
      sonnerToast.error('Please select a student');
      return;
    }
    const student = students.find(s => s.id === upgradeForm.studentId);
    const name = student ? `${student.firstName} ${student.lastName}` : 'Unknown';
    sonnerToast.success(`${name} upgraded to ${upgradeForm.newTier} (demo)`);
    setUpgradeForm({ studentId: '', newTier: 'Elite' });
    setUpgradeTierOpen(false);
  };

  return (
    <main className="flex-1 overflow-auto bg-content csm-panel-readable">
      <style>{`
        .csm-panel-readable .text-\\[9px\\] { font-size: 11px !important; }
        .csm-panel-readable .text-\\[10px\\] { font-size: 12px !important; }
        .csm-panel-readable .text-\\[11px\\] { font-size: 13px !important; }
        .csm-panel-readable .text-xs { font-size: 13px !important; line-height: 1.4 !important; }
        .csm-panel-readable .text-sm { font-size: 14px !important; }
        .csm-panel-readable .text-\\[13px\\] { font-size: 14px !important; }
      `}</style>
      <div className="container mx-auto px-4 md:px-6 py-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Headphones className="w-6 h-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">CSM Panel</h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary">CSM</Badge>
          </div>
          <CSMDelegationPanel />
        </div>

        {isStudentRelatedTab && coveringFor && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary shrink-0" />
            Covering for <strong>{coveringFor.original_csm?.first_name} {coveringFor.original_csm?.last_name}</strong> until{' '}
            <strong>{coveringFor.end_date ? format(new Date(coveringFor.end_date), 'MMM d, yyyy') : ''}</strong>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`w-full grid justify-start overflow-x-auto overflow-y-hidden flex-nowrap`} style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}>
            <TabsTrigger value="dashboard" className="gap-1.5 shrink-0">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-1.5 shrink-0">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Students</span>
            </TabsTrigger>
            <TabsTrigger value="communications" className="gap-1.5 relative shrink-0">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Communications</span>
              {commsCount > 0 && (
                <span className="absolute -top-1.5 -right-1 z-20 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {commsCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <CSMDashboardTab onNavigateToStudents={() => setActiveTab('students')} />
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Students</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setAddStudentOpen(true)}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Student
                </Button>
                <Button variant="outline" size="sm" onClick={() => setUpgradeTierOpen(true)}>
                  <ArrowUpCircle className="h-4 w-4 mr-1.5" />
                  Upgrade Tier
                </Button>
              </div>
            </div>
            <CSMStudentsTab />
          </TabsContent>

          <TabsContent value="communications" className="space-y-4">
            {/* Sub-toggle for Chats vs Tickets */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
              <button
                onClick={() => setCommsView('chats')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  commsView === 'chats'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chats
                {unreadChatCount > 0 && (
                  <Badge variant="default" className="h-5 min-w-[20px] px-1 text-[10px]">{unreadChatCount}</Badge>
                )}
              </button>
              <button
                onClick={() => setCommsView('tickets')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  commsView === 'tickets'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Ticket className="h-3.5 w-3.5" />
                Tickets
                {openTicketCount > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-[20px] px-1 text-[10px]">{openTicketCount}</Badge>
                )}
              </button>
            </div>

            {/* Chats view */}
            {commsView === 'chats' && (
              <>
                <div className="flex items-center gap-3">
                  <Select value={chatStudentFilter} onValueChange={setChatStudentFilter}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Filter by student" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Chats</SelectItem>
                      {students.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.firstName} {s.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg divide-y">
                  {chatsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="p-4 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-60" />
                      </div>
                    ))
                  ) : (() => {
                    const filtered = chatStudentFilter === 'all'
                      ? conversations
                      : conversations.filter(conv => conv.participants.some((p: any) => p.id === chatStudentFilter));
                    return filtered.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">No conversations found</div>
                    ) : (
                      filtered.map(conv => {
                        const otherParticipants = conv.participants.filter(p => p.id !== user?.id);
                        const participantNames = otherParticipants
                          .map(p => `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.user_email)
                          .join(', ');
                        const clientParticipant = otherParticipants[0];
                        return (
                          <div
                            key={conv.id}
                            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => {
                              setDrawerConvName(participantNames || 'Unknown');
                              setDrawerConvId(conv.id);
                              if (clientParticipant?.id) setSelectedChatUserId(clientParticipant.id);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{participantNames || 'Unknown'}</span>
                                {(conv.unread_count ?? 0) > 0 && (
                                  <Badge className="text-xs">{conv.unread_count}</Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {conv.last_message_at ? format(new Date(conv.last_message_at), 'MM/dd HH:mm') : ''}
                              </span>
                            </div>
                            {conv.last_message && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{conv.last_message.content}</p>
                            )}
                          </div>
                        );
                      })
                    );
                  })()}
                </div>
              </>
            )}

            {/* Tickets view */}
            {commsView === 'tickets' && (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ticketsLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        </TableRow>
                      ))
                    ) : myTickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {isCSM ? 'No tickets from your assigned students' : 'No tickets assigned to you'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      myTickets.map((ticket: any) => (
                        <TableRow
                          key={ticket.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedTicketId(ticket.id)}
                        >
                          <TableCell className="font-medium">{ticket.subject}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {ticket.submitter_name || ticket.submitter_email || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'}>{ticket.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={ticket.priority === 'high' ? 'destructive' : 'outline'}>{ticket.priority}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {ticket.created_at ? format(new Date(ticket.created_at), 'MM/dd/yyyy') : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

        </Tabs>

        {/* Chat user details sheet */}
        <Sheet open={!!selectedChatUserId} onOpenChange={(open) => { if (!open) setSelectedChatUserId(null); }} modal={false}>
          <SheetContent side="left" className="sm:max-w-[calc(100vw-34rem)] w-full p-0 overflow-y-auto" hideOverlay onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
            {selectedChatUserId && (
              <UserDetailsView
                userId={selectedChatUserId}
                onBack={() => setSelectedChatUserId(null)}
                onViewTicket={(ticketId) => { setSelectedChatUserId(null); setSelectedTicketId(ticketId); }}
              />
            )}
          </SheetContent>
        </Sheet>

        {selectedChatUserId && drawerConvId && (
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm pointer-events-none" />
        )}
        {drawerConvId && (
          <CSMChatDrawer
            open={!!drawerConvId}
            onOpenChange={(open) => { if (!open) setDrawerConvId(null); }}
            conversationId={drawerConvId}
            participantName={drawerConvName}
          />
        )}

        {/* Add Student Dialog */}
        <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Student</DialogTitle>
              <DialogDescription>Add a new student to your roster.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="add-first-name">First Name *</Label>
                <Input
                  id="add-first-name"
                  value={newStudent.firstName}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="First name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-last-name">Last Name *</Label>
                <Input
                  id="add-last-name"
                  value={newStudent.lastName}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Last name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-email">Email *</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="student@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-tier">Tier</Label>
                <Select value={newStudent.tier} onValueChange={(v) => setNewStudent(prev => ({ ...prev, tier: v }))}>
                  <SelectTrigger id="add-tier">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIERS.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddStudentOpen(false)}>Cancel</Button>
              <Button onClick={handleAddStudent}>Add Student</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Upgrade Tier Dialog */}
        <Dialog open={upgradeTierOpen} onOpenChange={setUpgradeTierOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Upgrade Tier</DialogTitle>
              <DialogDescription>Change a student's membership tier.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="upgrade-student">Student</Label>
                <Select value={upgradeForm.studentId} onValueChange={(v) => setUpgradeForm(prev => ({ ...prev, studentId: v }))}>
                  <SelectTrigger id="upgrade-student">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.firstName} {s.lastName}{s.tier ? ` (${s.tier})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="upgrade-tier">New Tier</Label>
                <Select value={upgradeForm.newTier} onValueChange={(v) => setUpgradeForm(prev => ({ ...prev, newTier: v }))}>
                  <SelectTrigger id="upgrade-tier">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIERS.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUpgradeTierOpen(false)}>Cancel</Button>
              <Button onClick={handleUpgradeTier}>Upgrade</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
