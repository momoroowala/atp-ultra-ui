import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  Search, ArrowLeft, Send, FileText, ChevronDown, ChevronRight, Pin,
  Pencil, Trash2, Plus, Users, Sparkles, MessageSquare, User, ExternalLink,
  Loader2, AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { useCommunityDMs } from '@/hooks/useCommunityDMs';
import { useCommunityMessages, SendMessageInput } from '@/hooks/useCommunityMessages';
import { useCSMStudents, CSMStudent } from '@/hooks/useCSMStudents';
import { useMyAssignedStudentIds } from '@/hooks/useMyAssignedStudentIds';
import { useCSMTemplates, CSMTemplate, CreateTemplateInput } from '@/hooks/useCSMTemplates';
import { useAuth } from '@/hooks/useAuth';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { useAllUsersProgress } from '@/hooks/useAllUsersProgress';
import { useRoles } from '@/hooks/useRoles';
import { useIsMobile } from '@/hooks/use-mobile';
import { MessageList } from '@/components/community/MessageList';
import { MessageInput } from '@/components/community/MessageInput';
import { UserDetailsView } from '@/components/settings/customer-success/UserDetailsView';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CommunityMessage } from '@/hooks/useCommunityMessages';

// ── Health helpers ──
type HealthStatus = 'active' | 'slipping' | 'danger';

function getHealthStatus(lastSignIn: string | null): HealthStatus {
  if (!lastSignIn) return 'danger';
  const days = differenceInDays(new Date(), new Date(lastSignIn));
  if (days < 7) return 'active';
  if (days < 30) return 'slipping';
  return 'danger';
}

const healthColors: Record<HealthStatus, string> = {
  active: 'bg-green-500',
  slipping: 'bg-amber-500',
  danger: 'bg-red-500',
};

const healthLabels: Record<HealthStatus, string> = {
  active: 'Active',
  slipping: 'Slipping',
  danger: 'At Risk',
};

// ── Main component ──
export function CSMMyChats() {
  const { user } = useAuth();
  const { isAdmin } = useRoleCheck();
  const isMobile = useIsMobile();
  const { conversations, isLoading: chatsLoading, createOrGetDM, markAsRead } = useCommunityDMs();
  const { data: students = [] } = useCSMStudents(user?.id || '');
  const { data: assignedStudents } = useMyAssignedStudentIds();
  const { templates, isLoading: templatesLoading, createTemplate, updateTemplate, deleteTemplate } = useCSMTemplates();

  // State (showBulkDialog declared early for query dependency)
  const [showBulkDialog, setShowBulkDialog] = useState(false);

  // For admins: fetch ALL client students for bulk send
  const { data: roles } = useRoles();
  const clientRoleId = roles?.find(r => r.role_key === 'client')?.id;
  const { data: allClientsData } = useAllUsersProgress({
    perPage: 1000,
    roleFilter: clientRoleId || 'all',
    csmFilter: null,
    statusFilter: 'all',
    sortColumn: 'first_name',
    sortDirection: 'asc',
    enabled: isAdmin && showBulkDialog,
  });

  const allStudentsForBulk: CSMStudent[] = useMemo(() => {
    if (!isAdmin || !allClientsData?.users) return students;
    return allClientsData.users.map(u => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      tier: u.tier,
      tierId: u.tierId,
      assignedCsmId: u.assignedCsmId,
      isActive: u.isActive,
      completedTasks: u.completedTasks,
      totalTasks: u.totalTasks,
      progressPercentage: u.progressPercentage,
      lastSignInAt: u.lastSignInAt,
      createdAt: u.joinedDate,
      onboardingBookingStatus: u.onboardingBookingStatus,
      onboardingDate: u.onboardingDate,
      offboardingDate: u.offboardingDate,
      guaranteeStatus: u.guaranteeStatus,
      revenue: u.revenue,
    }));
  }, [isAdmin, allClientsData, students]);

  // State
  const [search, setSearch] = useState('');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CSMTemplate | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [replyingTo, setReplyingTo] = useState<CommunityMessage | null>(null);

  // Build student map for quick lookup
  const studentMap = useMemo(() => {
    const m = new Map<string, CSMStudent>();
    students.forEach(s => m.set(s.id, s));
    return m;
  }, [students]);

  // Map participant IDs to students
  const convStudentMap = useMemo(() => {
    const m = new Map<string, CSMStudent | undefined>();
    conversations.forEach(conv => {
      const participant = conv.participants?.[0];
      if (participant) {
        m.set(conv.id, studentMap.get(participant.id));
      }
    });
    return m;
  }, [conversations, studentMap]);

  // Students with no conversation
  const studentsWithoutConv = useMemo(() => {
    if (!assignedStudents?.ids) return [];
    const convParticipantIds = new Set(
      conversations.flatMap(c => c.participants?.map(p => p.id) || [])
    );
    return students.filter(
      s => assignedStudents.ids.has(s.id) && !convParticipantIds.has(s.id)
    );
  }, [students, conversations, assignedStudents]);

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(conv => {
      const p = conv.participants?.[0];
      const name = `${p?.first_name || ''} ${p?.last_name || ''}`.toLowerCase();
      const email = (p?.user_email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [conversations, search]);

  const filteredNoConvStudents = useMemo(() => {
    if (!search.trim()) return studentsWithoutConv;
    const q = search.toLowerCase();
    return studentsWithoutConv.filter(s => {
      const name = `${s.firstName} ${s.lastName}`.toLowerCase();
      return name.includes(q) || s.email.toLowerCase().includes(q);
    });
  }, [studentsWithoutConv, search]);

  // Current selected student for right panel (with fallback from conversation participant data)
  const selectedStudent = useMemo(() => {
    const fromMap = selectedStudentId
      ? studentMap.get(selectedStudentId)
      : selectedConvId
        ? convStudentMap.get(selectedConvId)
        : undefined;
    if (fromMap) return fromMap;

    // Fallback: build a lightweight CSMStudent from conversation participant info
    if (selectedConvId) {
      const conv = conversations.find(c => c.id === selectedConvId);
      const p = conv?.participants?.[0];
      if (p) {
        return {
          id: p.id,
          firstName: p.first_name || '',
          lastName: p.last_name || '',
          email: p.user_email || '',
          tier: '',
          tierId: null,
          assignedCsmId: null,
          isActive: true,
          completedTasks: 0,
          totalTasks: 0,
          progressPercentage: 0,
          lastSignInAt: null,
          createdAt: '',
          onboardingBookingStatus: null,
          onboardingDate: null,
          offboardingDate: null,
          guaranteeStatus: null,
          revenue: null,
        } as CSMStudent;
      }
    }
    return undefined;
  }, [selectedConvId, selectedStudentId, studentMap, convStudentMap, conversations]);

  // Selected conversation participant name
  const selectedConvName = useMemo(() => {
    if (!selectedConvId) return '';
    const conv = conversations.find(c => c.id === selectedConvId);
    const p = conv?.participants?.[0];
    return p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.user_email || 'Unknown' : 'Unknown';
  }, [selectedConvId, conversations]);

  // Handle selecting a conversation
  const handleSelectConv = useCallback((convId: string) => {
    setSelectedConvId(convId);
    const conv = conversations.find(c => c.id === convId);
    const participantId = conv?.participants?.[0]?.id;
    setSelectedStudentId(participantId || null);
    markAsRead.mutate(convId);
  }, [conversations, markAsRead]);

  // Handle clicking a student with no conversation
  const handleStartConvWithStudent = useCallback(async (studentId: string) => {
    try {
      const result = await createOrGetDM.mutateAsync(studentId);
      setSelectedConvId(result.id);
      setSelectedStudentId(studentId);
      if (!result.isNew) {
        markAsRead.mutate(result.id);
      }
    } catch {
      toast.error('Failed to start conversation');
    }
  }, [createOrGetDM, markAsRead]);

  // ── Render ──
  const showLeftPanel = !isMobile || !selectedConvId;
  const showMiddlePanel = !isMobile || !!selectedConvId;

  return (
    <Card className="h-[600px] flex overflow-hidden">
      {/* ═══ LEFT PANEL ═══ */}
      {showLeftPanel && (
        <div className="w-full md:w-1/3 border-r border-border flex flex-col">
          {/* Header */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Conversations</h3>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setShowTemplates(!showTemplates)}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Templates
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setShowBulkDialog(true)}
                >
                  <Users className="h-3.5 w-3.5" />
                  Bulk
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>

          {/* Templates collapsible */}
          <AnimatePresence>
            {showTemplates && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-border overflow-hidden"
              >
                <div className="p-2 space-y-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">Templates</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => { setEditingTemplate(null); setShowTemplateEditor(true); }}>
                      <Plus className="h-3 w-3" /> New
                    </Button>
                  </div>
                  {templatesLoading ? (
                    <div className="h-8 bg-muted animate-pulse rounded" />
                  ) : templates.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">No templates yet</p>
                  ) : (
                    <ScrollArea className="max-h-[150px]">
                      {[...templates].sort((a, b) => (a.trigger_type === 'on_assignment' ? -1 : 1) - (b.trigger_type === 'on_assignment' ? -1 : 1)).map(t => (
                        <div
                          key={t.id}
                          className={`flex items-center justify-between p-1.5 rounded text-xs hover:bg-accent/50 group ${t.trigger_type === 'on_assignment' ? 'bg-primary/5' : ''}`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            {t.trigger_type === 'on_assignment' && <Pin className="h-3 w-3 text-primary shrink-0" />}
                            <span className="truncate">{t.title}</span>
                          </div>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setEditingTemplate(t); setShowTemplateEditor(true); }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => deleteTemplate.mutate(t.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Conversation list */}
          <ScrollArea className="flex-1">
            <div className="p-1.5 space-y-0.5">
              {chatsLoading ? (
                [1, 2, 3].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)
              ) : (
                <>
                  {filteredConversations.map(conv => {
                    const p = conv.participants?.[0];
                    const name = conv.name || (p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.user_email : 'Unknown');
                    const unread = (conv.unread_count ?? 0) > 0;
                    const student = convStudentMap.get(conv.id);
                    const health = student ? getHealthStatus(student.lastSignInAt) : undefined;
                    const isSelected = conv.id === selectedConvId;

                    return (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConv(conv.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2.5 ${
                          isSelected ? 'bg-primary/10 border border-primary/30' :
                          unread ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-accent/50'
                        }`}
                      >
                        {health && <span className={`w-2 h-2 rounded-full shrink-0 ${healthColors[health]}`} />}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm truncate ${unread ? 'font-semibold' : ''}`}>{name}</p>
                            {conv.last_message?.created_at && (
                              <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                                {formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: false })}
                              </span>
                            )}
                          </div>
                          {conv.last_message?.content && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message.content}</p>
                          )}
                        </div>
                        {unread && (
                          <span className="shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                            {conv.unread_count}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* Students with no conversation */}
                  {filteredNoConvStudents.length > 0 && (
                    <>
                      <div className="px-3 pt-3 pb-1">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">No conversation yet</span>
                      </div>
                      {filteredNoConvStudents.map(s => {
                        const health = getHealthStatus(s.lastSignInAt);
                        return (
                          <button
                            key={s.id}
                            onClick={() => handleStartConvWithStudent(s.id)}
                            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors flex items-center gap-2.5"
                          >
                            <span className={`w-2 h-2 rounded-full shrink-0 ${healthColors[health]}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm truncate">{s.firstName} {s.lastName}</p>
                              <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                            </div>
                            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          </button>
                        );
                      })}
                    </>
                  )}

                  {filteredConversations.length === 0 && filteredNoConvStudents.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No conversations found</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* ═══ MIDDLE PANEL ═══ */}
      {showMiddlePanel && (
        <div className="w-full md:w-1/3 flex flex-col border-r border-border">
          {selectedConvId ? (
            <>
              {/* Chat header */}
              <div className="px-3 py-2.5 border-b border-border flex items-center gap-2">
                {isMobile && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedConvId(null)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <span className="font-semibold text-sm truncate flex-1">{selectedConvName}</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-hidden">
                <MessageList
                  conversationId={selectedConvId}
                  onReplyToMessage={setReplyingTo}
                />
              </div>

              {/* Input with template dropdown */}
              <div className="flex-shrink-0 border-t border-border p-2">
                <ChatInputWithTemplates
                  conversationId={selectedConvId}
                  templates={templates}
                  studentName={selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : ''}
                  csmName={user?.user_metadata?.first_name || ''}
                  replyingTo={replyingTo}
                  onCancelReply={() => setReplyingTo(null)}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a conversation</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ RIGHT PANEL ═══ */}
      {!isMobile && (
        <div className="w-1/3 flex flex-col">
          {selectedStudent ? (
            <StudentOverviewPanel student={selectedStudent} onViewProfile={() => setShowUserDetails(true)} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a student</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Dialogs ── */}
      <TemplateEditorDialog
        open={showTemplateEditor}
        onOpenChange={setShowTemplateEditor}
        template={editingTemplate}
        onCreate={createTemplate.mutate}
        onUpdate={updateTemplate.mutate}
      />

      <BulkSendDialog
        open={showBulkDialog}
        onOpenChange={setShowBulkDialog}
        students={isAdmin ? allStudentsForBulk : students}
        templates={templates}
        csmName={user?.user_metadata?.first_name || ''}
        userId={user?.id || ''}
        createOrGetDM={createOrGetDM}
        isAdmin={isAdmin}
      />

      {/* User Details Sheet */}
      <Sheet open={showUserDetails} onOpenChange={setShowUserDetails}>
        <SheetContent side="right" className="sm:max-w-2xl w-full p-0 overflow-y-auto">
          {selectedStudent && (
            <UserDetailsView
              userId={selectedStudent.id}
              onBack={() => setShowUserDetails(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}

// ── Chat input with template insertion ──
function ChatInputWithTemplates({
  conversationId, templates, studentName, csmName, replyingTo, onCancelReply
}: {
  conversationId: string;
  templates: CSMTemplate[];
  studentName: string;
  csmName: string;
  replyingTo: CommunityMessage | null;
  onCancelReply: () => void;
}) {
  const { sendMessage } = useCommunityMessages(undefined, conversationId);
  const [text, setText] = useState('');

  const insertTemplate = (template: CSMTemplate) => {
    const content = template.content
      .replace(/\{\{student_name\}\}/gi, studentName)
      .replace(/\{\{csm_name\}\}/gi, csmName);
    setText(content);
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage.mutate({
      content: trimmed,
      dm_conversation_id: conversationId,
      parent_message_id: replyingTo?.id,
    });
    setText('');
    onCancelReply();
  };

  return (
    <div className="space-y-2">
      {replyingTo && (
        <div className="flex items-center gap-2 p-1.5 bg-muted rounded text-xs">
          <span className="text-muted-foreground">Replying to {replyingTo.sender?.first_name}</span>
          <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto" onClick={onCancelReply}>
            <span className="text-xs">×</span>
          </Button>
        </div>
      )}
      <div className="flex items-end gap-1.5">
        {templates.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <FileText className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-w-[250px]">
              {templates.map(t => (
                <DropdownMenuItem key={t.id} onClick={() => insertTemplate(t)} className="text-xs">
                  {t.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          className="min-h-[36px] max-h-[100px] text-sm resize-none"
          rows={1}
        />
        <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSend} disabled={!text.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Student Overview Panel ──
function StudentOverviewPanel({ student, onViewProfile }: { student: CSMStudent; onViewProfile: () => void }) {
  const health = getHealthStatus(student.lastSignInAt);
  const engagementScore = Math.min(100, Math.round(student.progressPercentage * 0.7 + (student.isActive ? 30 : 0)));

  const lastLogin = student.lastSignInAt
    ? formatDistanceToNow(new Date(student.lastSignInAt), { addSuffix: true })
    : 'Never';

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-4">
        {/* Avatar & Name */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary font-bold text-lg">
            {student.firstName?.[0]}{student.lastName?.[0]}
          </div>
          <h4 className="font-semibold text-sm">{student.firstName} {student.lastName}</h4>
          <p className="text-xs text-muted-foreground">{student.email}</p>
        </div>

        {/* Health */}
        <div className="flex items-center justify-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${healthColors[health]}`} />
          <span className="text-xs font-medium">{healthLabels[health]}</span>
          {student.tier && <Badge variant="secondary" className="text-[10px] h-5">{student.tier}</Badge>}
        </div>

        {/* Engagement Score */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Engagement</span>
            <span className="font-medium">{engagementScore}%</span>
          </div>
          <Progress value={engagementScore} className="h-1.5" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Last Login', value: lastLogin },
            { label: 'Completion', value: `${Math.round(student.progressPercentage)}%` },
            { label: 'Tasks Done', value: `${student.completedTasks}/${student.totalTasks}` },
            { label: 'Status', value: student.isActive ? 'Active' : 'Inactive' },
            { label: 'Joined', value: student.createdAt ? formatDistanceToNow(new Date(student.createdAt), { addSuffix: true }) : 'N/A' },
            { label: 'Total Progress', value: `${Math.round(student.progressPercentage)}%` },
          ].map((stat, i) => (
            <div key={i} className="bg-muted/50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{stat.label}</p>
              <p className="text-xs font-semibold mt-0.5">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* View Profile */}
        <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={onViewProfile}>
          <ExternalLink className="h-3.5 w-3.5" />
          View Full Profile
        </Button>
      </div>
    </ScrollArea>
  );
}

// ── Template Editor Dialog ──
function TemplateEditorDialog({
  open, onOpenChange, template, onCreate, onUpdate
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: CSMTemplate | null;
  onCreate: (input: CreateTemplateInput) => void;
  onUpdate: (input: CreateTemplateInput & { id: string }) => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [triggerType, setTriggerType] = useState('manual');
  const [scheduleInterval, setScheduleInterval] = useState('weekly');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setContent(template.content);
      setTriggerType(template.trigger_type);
      setScheduleInterval(template.schedule_interval || 'weekly');
    } else {
      setTitle('');
      setContent('');
      setTriggerType('manual');
      setScheduleInterval('weekly');
    }
    setAiPrompt('');
    setShowAi(false);
  }, [template, open]);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-dm-template', {
        body: { prompt: aiPrompt },
      });
      if (error) throw error;
      if (data?.title) setTitle(data.title);
      if (data?.content) setContent(data.content);
      toast.success('Template generated!');
    } catch {
      toast.error('AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    const input: CreateTemplateInput = {
      title: title.trim(),
      content: content.trim(),
      trigger_type: triggerType,
      schedule_interval: triggerType === 'scheduled' ? scheduleInterval : undefined,
    };
    if (template) {
      onUpdate({ ...input, id: template.id });
    } else {
      onCreate(input);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">{template ? 'Edit Template' : 'New Template'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* AI Generator */}
          <Collapsible open={showAi} onOpenChange={setShowAi}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-xs gap-1">
                <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> AI Generator</span>
                {showAi ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              <Input
                placeholder="Describe the template you want..."
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                className="text-xs"
              />
              <Button size="sm" className="text-xs gap-1" onClick={handleAiGenerate} disabled={aiLoading || !aiPrompt.trim()}>
                {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Generate
              </Button>
            </CollapsibleContent>
          </Collapsible>

          <Input placeholder="Template title" value={title} onChange={e => setTitle(e.target.value)} className="text-sm" />
          <Textarea
            placeholder="Message content... Use {{student_name}} and {{csm_name}}"
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={4}
            className="text-sm"
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Trigger</label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="on_assignment">On Assignment</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
              {triggerType === 'on_assignment' && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  Only one template can be On Assignment. Setting this will unset any other.
                </p>
              )}
            </div>
            {triggerType === 'scheduled' && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Interval</label>
                <Select value={scheduleInterval} onValueChange={setScheduleInterval}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Biweekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>{template ? 'Update' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Bulk Send Dialog ──
function BulkSendDialog({
  open, onOpenChange, students, templates, csmName, userId, createOrGetDM, isAdmin = false
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  students: CSMStudent[];
  templates: CSMTemplate[];
  csmName: string;
  userId: string;
  createOrGetDM: ReturnType<typeof useCommunityDMs>['createOrGetDM'];
  isAdmin?: boolean;
}) {
  const [recipientMode, setRecipientMode] = useState('my_students');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [customSearch, setCustomSearch] = useState('');

  const recipients = useMemo(() => {
    switch (recipientMode) {
      case 'at_risk':
        return students.filter(s => getHealthStatus(s.lastSignInAt) === 'danger');
      case 'active_only':
        return students.filter(s => s.isActive && getHealthStatus(s.lastSignInAt) === 'active');
      case 'custom':
        return students.filter(s => selectedIds.has(s.id));
      default:
        return students;
    }
  }, [recipientMode, students, selectedIds]);

  const filteredCustomStudents = useMemo(() => {
    if (!customSearch.trim()) return students;
    const q = customSearch.toLowerCase();
    return students.filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
  }, [students, customSearch]);

  const handleSend = async () => {
    if (!message.trim() || recipients.length === 0) return;
    setSending(true);
    try {
      // Log bulk message
      await supabase.from('csm_bulk_messages').insert({
        sender_id: userId,
        message_content: message,
        recipient_count: recipients.length,
        status: 'sending',
      } as any);

      let sent = 0;
      for (const student of recipients) {
        try {
          const result = await createOrGetDM.mutateAsync(student.id);
          const personalizedMsg = message
            .replace(/\{\{student_name\}\}/gi, `${student.firstName} ${student.lastName}`)
            .replace(/\{\{csm_name\}\}/gi, csmName);

          await supabase.from('community_messages').insert({
            content: personalizedMsg,
            dm_conversation_id: result.id,
            sender_id: userId,
          } as any);
          sent++;
        } catch (err) {
          console.error(`Failed to send to ${student.email}:`, err);
        }
      }

      toast.success(`Sent to ${sent}/${recipients.length} students`);
      onOpenChange(false);
      setMessage('');
      setSelectedIds(new Set());
    } catch {
      toast.error('Bulk send failed');
    } finally {
      setSending(false);
    }
  };

  const insertTemplate = (t: CSMTemplate) => {
    setMessage(t.content);
  };

  const toggleStudent = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Bulk Send Message</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Recipients</label>
            <Select value={recipientMode} onValueChange={setRecipientMode}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="my_students">{isAdmin ? 'All Students' : 'My Students'} ({students.length})</SelectItem>
                <SelectItem value="at_risk">At-Risk Only ({students.filter(s => getHealthStatus(s.lastSignInAt) === 'danger').length})</SelectItem>
                <SelectItem value="active_only">Active Only ({students.filter(s => s.isActive && getHealthStatus(s.lastSignInAt) === 'active').length})</SelectItem>
                <SelectItem value="custom">Custom Selection</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recipientMode === 'custom' && (
            <div className="space-y-2">
              <Input
                placeholder="Search students..."
                value={customSearch}
                onChange={e => setCustomSearch(e.target.value)}
                className="h-7 text-xs"
              />
              <ScrollArea className="h-[150px] border rounded-lg p-1.5">
                {filteredCustomStudents.map(s => (
                  <label key={s.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-accent/50 cursor-pointer text-xs">
                    <Checkbox
                      checked={selectedIds.has(s.id)}
                      onCheckedChange={() => toggleStudent(s.id)}
                    />
                    <span className="truncate">{s.firstName} {s.lastName}</span>
                    <span className="text-muted-foreground ml-auto truncate">{s.email}</span>
                  </label>
                ))}
              </ScrollArea>
              <p className="text-[10px] text-muted-foreground">{selectedIds.size} selected</p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-muted-foreground">Message</label>
              {templates.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1">
                      <FileText className="h-3 w-3" /> Use Template
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {templates.map(t => (
                      <DropdownMenuItem key={t.id} onClick={() => insertTemplate(t)} className="text-xs">
                        {t.title}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your message... Use {{student_name}} and {{csm_name}}"
              rows={3}
              className="text-sm"
            />
          </div>

          <p className="text-[10px] text-muted-foreground">
            Will send to <strong>{recipientMode === 'custom' ? selectedIds.size : recipients.length}</strong> recipients
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSend} disabled={sending || !message.trim() || recipients.length === 0}>
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
            Send to {recipientMode === 'custom' ? selectedIds.size : recipients.length}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
