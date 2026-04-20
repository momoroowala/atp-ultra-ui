import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle, Eye,
  Shield, ShieldAlert, ShieldCheck, ShieldX, Activity,
  LogIn, Flame, Calendar, StickyNote, ChevronDown, ChevronUp, Save, Loader2,
  GraduationCap, ExternalLink, Video, FileText, AlertTriangle, Pencil, X, DollarSign,
  Trash2, ArrowUpDown, Plus, Send, Download, MessageCircle
} from "lucide-react";
import { formatCurrency } from "@/utils/currency";
import { useUserDetails, useSaveAdminNotes, useSaveOnboardingDetails } from "@/hooks/useUserDetails";
import { useClientInternalNotes, useAddClientNote, useDeleteClientNote } from "@/hooks/useClientInternalNotes";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow, differenceInDays, addMonths, isWithinInterval } from "date-fns";
import { UserQuizzesView } from "./UserQuizzesView";
import { TaskSubmissionModal } from "./TaskSubmissionModal";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { UserCourseAccessManager } from "./UserCourseAccessManager";

import { markTaskComplete, markTaskIncomplete } from "@/utils/adminTaskActions";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useUserRsvpStats } from "@/hooks/useCallRsvp";
import { useAuth } from "@/hooks/useAuth";
import { Phone, ListChecks, ClipboardList } from "lucide-react";
import { useCSMMilestones } from "@/hooks/useCSMMilestones";
import { useClientActionItems } from "@/hooks/useClientActionItems";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDistanceToNow as formatDistance } from "date-fns";
import { exportUserDataCSV } from "@/utils/exportUserData";
import { useCommunityDMs } from "@/hooks/useCommunityDMs";
import { useCommunityMessages } from "@/hooks/useCommunityMessages";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const CallsJoinedStat = ({ userId }: { userId: string }) => {
  const { data: rsvpStats } = useUserRsvpStats(userId);
  if (!rsvpStats) return null;
  return (
    <div className="flex items-center gap-2">
      <Phone className="h-4 w-4 text-muted-foreground" />
      <div>
        <div className="text-xs text-muted-foreground">Calls RSVPed</div>
        <div className="font-medium text-sm">{rsvpStats.yesCount} / {rsvpStats.totalRsvps} joined</div>
      </div>
    </div>
  );
};

interface UserDetailsViewProps {
  userId: string;
  onBack: () => void;
  onViewTicket?: (ticketId: string) => void;
}

import { getRiskScore as getRiskScoreUtil } from '@/utils/riskScore';

// Risk score calculation — delegates to shared utility
const getRiskScore = (data: any) => {
  return getRiskScoreUtil({
    isActive: data?.profile?.is_active ?? true,
    lastSignInAt: data?.profile?.last_sign_in_at,
    overdueTasks: data?.summary?.overdueTasks || 0,
    totalTasks: data?.summary?.totalTasks || 1,
  });
};

const RiskBadge = ({ risk }: { risk: string }) => {
  const config: Record<string, { icon: typeof Shield; className: string }> = {
    Critical: { icon: ShieldX, className: 'bg-red-600 text-white' },
    High: { icon: ShieldAlert, className: 'bg-orange-500 text-white' },
    Medium: { icon: Shield, className: 'bg-yellow-500 text-black' },
    Low: { icon: ShieldCheck, className: 'bg-green-600 text-white' },
  };
  const { icon: Icon, className } = config[risk] || config.Low;
  return (
    <Badge className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {risk} Risk
    </Badge>
  );
};


export const UserDetailsView = ({ userId, onBack, onViewTicket }: UserDetailsViewProps) => {
  const { data, isLoading, error } = useUserDetails(userId);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { createOrGetDM } = useCommunityDMs();
  const saveNotes = useSaveAdminNotes();
  const saveOnboarding = useSaveOnboardingDetails();
  const { data: internalNotes = [], isLoading: notesLoading } = useClientInternalNotes(userId);
  const addNote = useAddClientNote();
  const deleteNote = useDeleteClientNote();
  const { milestones: csmMilestones, completedIds: csmCompletedIds, toggleMilestone: toggleCSMMilestone, createMilestone: createCSMMilestone, isCreating: isCreatingMilestone, isLoading: csmMilestonesLoading } = useCSMMilestones(userId);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const { items: actionItems, isLoading: actionItemsLoading, addItem: addActionItem, toggleItem: toggleActionItem, deleteItem: deleteActionItem } = useClientActionItems(userId);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; taskId: string } | null>(null);
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [milestonesOpen, setMilestonesOpen] = useState(false);
  const [actionItemsOpen, setActionItemsOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [newActionItemText, setNewActionItemText] = useState('');
  const [newActionItemDueDate, setNewActionItemDueDate] = useState<string>('');
  const [notesSortAsc, setNotesSortAsc] = useState(false);
  const [onboardingEditing, setOnboardingEditing] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState<Record<string, any>>({});
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [editingRevenue, setEditingRevenue] = useState(false);
  const [revenueValue, setRevenueValue] = useState<string>('');
  const [exporting, setExporting] = useState(false);
  const currentNotes = data?.profile?.admin_notes ?? '';

  const handleExport = async () => {
    if (!data) return;
    setExporting(true);
    try {
      await exportUserDataCSV(data, userId);
      toast({ title: "Export downloaded" });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [dmConversationId, setDmConversationId] = useState<string | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const { sendMessage } = useCommunityMessages(undefined, dmConversationId || undefined);

  const handleSendMessage = () => {
    createOrGetDM.mutate(userId, {
      onSuccess: (conv) => {
        setDmConversationId(conv.id);
        setShowMessageDialog(true);
      },
      onError: () => {
        toast({ title: "Failed to open conversation", variant: "destructive" });
      },
    });
  };

  const handleSendDirectMessage = () => {
    if (!messageText.trim() || !dmConversationId) return;
    sendMessage.mutate(
      { content: messageText.trim(), dm_conversation_id: dmConversationId },
      {
        onSuccess: () => {
          setMessageText('');
          setShowMessageDialog(false);
          setShowFollowUp(true);
        },
        onError: () => {
          toast({ title: "Failed to send message", variant: "destructive" });
        },
      }
    );
  };

  const handleStartOnboardingEdit = () => {
    setOnboardingForm({
      onboarding_booking_status: data?.profile?.onboarding_booking_status || '',
      onboarding_date: data?.profile?.onboarding_date ? new Date(data.profile.onboarding_date).toISOString().slice(0, 16) : '',
      onboarding_call_recording: data?.profile?.onboarding_call_recording || '',
      onboarding_call_summary: data?.profile?.onboarding_call_summary || '',
      onboarding_sheet_url: data?.profile?.onboarding_sheet_url || '',
      offboarding_date: data?.profile?.offboarding_date || '',
    });
    setOnboardingEditing(true);
  };

  const handleSaveOnboarding = () => {
    const payload: Record<string, any> = {};
    if (onboardingForm.onboarding_booking_status) payload.onboarding_booking_status = onboardingForm.onboarding_booking_status;
    if (onboardingForm.onboarding_date) payload.onboarding_date = new Date(onboardingForm.onboarding_date).toISOString();
    else payload.onboarding_date = null;
    payload.onboarding_call_recording = onboardingForm.onboarding_call_recording || null;
    payload.onboarding_call_summary = onboardingForm.onboarding_call_summary || null;
    payload.onboarding_sheet_url = onboardingForm.onboarding_sheet_url || null;
    payload.offboarding_date = onboardingForm.offboarding_date || null;

    saveOnboarding.mutate(
      { userId, details: payload },
      {
        onSuccess: () => {
          toast({ title: "Onboarding details saved" });
          setOnboardingEditing(false);
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const handleAddNote = () => {
    if (!newNoteText.trim() || !user) return;
    const authorName = user.user_metadata?.first_name
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
      : user.email || 'Unknown';
    addNote.mutate(
      { clientUserId: userId, authorId: user.id, authorName, note: newNoteText.trim() },
      {
        onSuccess: () => {
          setNewNoteText('');
          toast({ title: "Note added" });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  };

  const handleDeleteNote = (noteId: string) => {
    deleteNote.mutate(
      { noteId, clientUserId: userId },
      {
        onSuccess: () => toast({ title: "Note deleted" }),
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  };

  const sortedNotes = [...internalNotes].sort((a, b) => {
    const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return notesSortAsc ? diff : -diff;
  });

  const handleMarkComplete = async (taskId: string) => {
    setProcessingTaskId(taskId);
    queryClient.setQueryData(['user-details', userId], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        phases: oldData.phases.map((phase: any) => ({
          ...phase,
          tasks: phase.tasks.map((task: any) =>
            task.id === taskId ? { ...task, status: 'completed' } : task
          ),
          completedCount: phase.tasks.filter((t: any) => t.id === taskId || t.status === 'completed').length,
          progressPercentage: Math.round(
            (phase.tasks.filter((t: any) => t.id === taskId || t.status === 'completed').length / phase.tasks.length) * 100
          )
        })),
        summary: {
          ...oldData.summary,
          completedTasks: oldData.summary.completedTasks + 1,
          notStartedTasks: Math.max(0, oldData.summary.notStartedTasks - 1)
        }
      };
    });
    try {
      await markTaskComplete(userId, taskId);
      toast({ title: "Success", description: "Task marked as complete" });
      await queryClient.invalidateQueries({ queryKey: ['user-details', userId] });
    } catch (error: any) {
      await queryClient.invalidateQueries({ queryKey: ['user-details', userId] });
      toast({ title: "Error", description: error.message || "Failed to mark task complete", variant: "destructive" });
    } finally {
      setProcessingTaskId(null);
    }
  };

  const handleMarkIncomplete = async (taskId: string) => {
    setProcessingTaskId(taskId);
    setConfirmAction(null);
    queryClient.setQueryData(['user-details', userId], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        phases: oldData.phases.map((phase: any) => ({
          ...phase,
          tasks: phase.tasks.map((task: any) =>
            task.id === taskId ? { ...task, status: 'pending' } : task
          ),
          completedCount: Math.max(0, phase.tasks.filter((t: any) => t.status === 'completed' && t.id !== taskId).length),
          progressPercentage: Math.round(
            (Math.max(0, phase.tasks.filter((t: any) => t.status === 'completed' && t.id !== taskId).length) / phase.tasks.length) * 100
          )
        })),
        summary: {
          ...oldData.summary,
          completedTasks: Math.max(0, oldData.summary.completedTasks - 1),
          notStartedTasks: oldData.summary.notStartedTasks + 1
        }
      };
    });
    try {
      await markTaskIncomplete(userId, taskId);
      toast({ title: "Success", description: "Task marked as incomplete" });
      await queryClient.invalidateQueries({ queryKey: ['user-details', userId] });
    } catch (error: any) {
      await queryClient.invalidateQueries({ queryKey: ['user-details', userId] });
      toast({ title: "Error", description: error.message || "Failed to mark task incomplete", variant: "destructive" });
    } finally {
      setProcessingTaskId(null);
    }
  };

  const handleViewSubmission = (task: any) => {
    setSelectedTask(task);
    setShowSubmissionModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>;
      case 'due_soon':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Due Soon</Badge>;
      case 'pending':
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Overview
        </Button>
        <Card>
          <CardHeader><CardTitle>Error Loading User Details</CardTitle></CardHeader>
          <CardContent>
            <p className="text-destructive">{error.message}</p>
            <p className="text-sm text-muted-foreground mt-2">This may be a permissions issue.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />Back to Overview
      </Button>
        <Card>
          <CardHeader><CardTitle>User Not Found</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">Unable to load user details.</p></CardContent>
        </Card>
      </div>
    );
  }

  const riskScore = getRiskScore(data);
  
  const loginStreak = data.loginStreak;
  const tickets = data.tickets || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Overview
        </Button>
        <div className="flex items-center gap-2 mr-10">
          <Button variant="outline" size="sm" onClick={handleSendMessage} disabled={createOrGetDM.isPending}>
            {createOrGetDM.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-2" />}
            Send Message
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Export Report
          </Button>
        </div>
      </div>

      {/* Row 1: Overview + Engagement + Onboarding */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overview Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Overview</CardTitle>
              <div className="flex gap-2">
                <RiskBadge risk={riskScore} />
                {!data.profile.is_active && (
                  <Badge className="bg-destructive text-destructive-foreground">⚠ Refunded</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">Name</div>
              <div className="font-medium text-sm">{data.profile.first_name} {data.profile.last_name}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Email</div>
              <div className="font-medium text-sm break-all">{data.profile.user_email}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Tier</div>
                <Badge variant="outline" className="text-xs">{data.profile.tier || 'No Tier'}</Badge>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Assigned CSM</div>
                <div className="font-medium text-sm">{data.csmName || 'Unassigned'}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Signup Date</div>
                <div className="font-medium text-sm">
                  {data.profile.created_at ? format(new Date(data.profile.created_at), 'MMM dd, yyyy') : '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Last Active</div>
                <div className="font-medium text-sm">
                  {loginStreak?.last_login_date
                    ? formatDistanceToNow(new Date(loginStreak.last_login_date), { addSuffix: true })
                    : data.profile.last_sign_in_at
                      ? formatDistanceToNow(new Date(data.profile.last_sign_in_at), { addSuffix: true })
                      : 'Never'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Level</div>
                <Badge variant="outline" className="text-xs">Level {data.profile.level}</Badge>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Points</div>
                <div className="font-medium text-sm">{data.profile.points}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Revenue</div>
                {editingRevenue ? (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground text-sm">$</span>
                    <Input
                      type="number"
                      className="h-7 w-24 text-sm px-1.5"
                      value={revenueValue}
                      onChange={e => setRevenueValue(e.target.value)}
                      onBlur={() => {
                        const numVal = revenueValue.trim() === '' ? null : parseInt(revenueValue, 10);
                        saveOnboarding.mutate(
                          { userId, details: { revenue: numVal } },
                          {
                            onSuccess: () => {
                              toast({ title: "Revenue updated" });
                              setEditingRevenue(false);
                            },
                            onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
                          }
                        );
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        if (e.key === 'Escape') setEditingRevenue(false);
                      }}
                      autoFocus
                      min="0"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-sm">
                      {data.profile.revenue != null ? formatCurrency(data.profile.revenue) : '—'}
                    </span>
                    <button onClick={() => { setEditingRevenue(true); setRevenueValue(data.profile.revenue != null ? String(data.profile.revenue) : ''); }}>
                      <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                )}
              </div>
              <div />
            </div>
          </CardContent>
        </Card>

        {/* Engagement Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <LogIn className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Last Login</div>
                  <div className="font-medium text-sm">
                    {loginStreak?.last_login_date
                      ? formatDistanceToNow(new Date(loginStreak.last_login_date), { addSuffix: true })
                      : data.profile.last_sign_in_at
                        ? formatDistanceToNow(new Date(data.profile.last_sign_in_at), { addSuffix: true })
                        : 'Never'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Login Streak</div>
                  <div className="font-medium text-sm">{loginStreak?.current_streak ?? 0} days</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Total Logins</div>
                  <div className="font-medium text-sm">{loginStreak?.total_logins ?? 0}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Completion</div>
                <div className="flex items-center gap-2">
                  <Progress value={data.summary.progressPercentage} className="w-20 h-2" />
                  <span className="text-sm font-medium">{data.summary.progressPercentage}%</span>
                </div>
              </div>
            </div>
            <CallsJoinedStat userId={userId} />
            <div className="border-t pt-3 grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-lg font-bold">{data.summary.totalTasks}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div>
                <div className="text-lg font-bold text-primary">{data.summary.completedTasks}</div>
                <div className="text-xs text-muted-foreground">Done</div>
              </div>
              <div>
                <div className="text-lg font-bold text-destructive">{data.summary.overdueTasks}</div>
                <div className="text-xs text-muted-foreground">Overdue</div>
              </div>
              <div>
                <div className="text-lg font-bold text-accent-foreground">{data.summary.dueSoonTasks}</div>
                <div className="text-xs text-muted-foreground">Due Soon</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Onboarding Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Onboarding
              </CardTitle>
              {!onboardingEditing ? (
                <Button variant="ghost" size="sm" onClick={handleStartOnboardingEdit}>
                  <Pencil className="h-3 w-3 mr-1" />Edit
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setOnboardingEditing(false)}>
                    <X className="h-3 w-3" />
                  </Button>
                  <Button size="sm" onClick={handleSaveOnboarding} disabled={saveOnboarding.isPending}>
                    {saveOnboarding.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                    Save
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {onboardingEditing ? (
              <>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Booking Status</div>
                  <Select value={onboardingForm.onboarding_booking_status} onValueChange={(v) => setOnboardingForm(p => ({ ...p, onboarding_booking_status: v }))}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="missed">Missed</SelectItem>
                      <SelectItem value="rescheduled">Rescheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Date & Time</div>
                  <Input type="datetime-local" className="h-9" value={onboardingForm.onboarding_date} onChange={(e) => setOnboardingForm(p => ({ ...p, onboarding_date: e.target.value }))} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Call Recording URL</div>
                  <Input className="h-9" placeholder="https://..." value={onboardingForm.onboarding_call_recording} onChange={(e) => setOnboardingForm(p => ({ ...p, onboarding_call_recording: e.target.value }))} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Call Summary</div>
                  <Textarea className="min-h-[60px]" placeholder="Summary notes..." value={onboardingForm.onboarding_call_summary} onChange={(e) => setOnboardingForm(p => ({ ...p, onboarding_call_summary: e.target.value }))} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Onboarding Sheet URL</div>
                  <Input className="h-9" placeholder="https://..." value={onboardingForm.onboarding_sheet_url} onChange={(e) => setOnboardingForm(p => ({ ...p, onboarding_sheet_url: e.target.value }))} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Offboarding Date</div>
                  <Input type="date" className="h-9" value={onboardingForm.offboarding_date} onChange={(e) => setOnboardingForm(p => ({ ...p, offboarding_date: e.target.value }))} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="text-xs text-muted-foreground">Booking Status</div>
                  {data.profile.onboarding_booking_status ? (
                    <Badge className={
                      data.profile.onboarding_booking_status === 'completed' ? 'bg-primary text-primary-foreground' :
                      data.profile.onboarding_booking_status === 'missed' ? 'bg-destructive text-destructive-foreground' :
                      'bg-secondary text-secondary-foreground'
                    }>
                      {data.profile.onboarding_booking_status === 'completed' ? 'Completed' :
                       data.profile.onboarding_booking_status === 'missed' ? 'Missed' : 'Rescheduled'}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not set</span>
                  )}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Onboarding Date</div>
                  <div className="font-medium text-sm">
                    {data.profile.onboarding_date
                      ? format(new Date(data.profile.onboarding_date), 'MMM dd, yyyy h:mm a')
                      : 'Not scheduled'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Offboarding Date</div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {data.profile.offboarding_date
                        ? format(new Date(data.profile.offboarding_date), 'MMM dd, yyyy')
                        : 'Not set'}
                    </span>
                    {data.profile.offboarding_date && (() => {
                      const offDate = new Date(data.profile.offboarding_date);
                      const now = new Date();
                      const twoMonthsFromNow = addMonths(now, 2);
                      if (offDate <= twoMonthsFromNow && offDate >= now) {
                        return (
                          <Badge className="bg-secondary text-secondary-foreground">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Offboarding Soon
                          </Badge>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Call Recording</div>
                    {data.profile.onboarding_call_recording ? (
                      <a href={data.profile.onboarding_call_recording} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                        <Video className="h-3 w-3" />Watch
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">No recording</span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Onboarding Sheet</div>
                    {data.profile.onboarding_sheet_url ? (
                      <a href={data.profile.onboarding_sheet_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                        <FileText className="h-3 w-3" />Open Sheet
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">No sheet</span>
                    )}
                  </div>
                </div>
                {data.profile.onboarding_call_summary && (
                  <div>
                    <div className="text-xs text-muted-foreground">Call Summary</div>
                    <p className="text-sm line-clamp-3">{data.profile.onboarding_call_summary}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Milestones + Action Items + Internal Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CSM Milestones Card */}
        <Collapsible open={milestonesOpen} onOpenChange={setMilestonesOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer pb-3 hover:bg-muted/50 transition-colors rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ListChecks className="h-4 w-4" />
                    CSM Milestones
                    <Badge variant="secondary" className="text-xs">
                      {csmCompletedIds.length}/{csmMilestones.length}
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => { e.stopPropagation(); setShowAddMilestone(prev => !prev); }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <ChevronDown className={`h-4 w-4 transition-transform ${milestonesOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-2">
                {showAddMilestone && (
                  <form
                    className="flex items-center gap-2 pb-2 border-b mb-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newMilestoneTitle.trim()) return;
                      createCSMMilestone(newMilestoneTitle.trim());
                      setNewMilestoneTitle('');
                      setShowAddMilestone(false);
                    }}
                  >
                    <Input
                      placeholder="New milestone title…"
                      value={newMilestoneTitle}
                      onChange={(e) => setNewMilestoneTitle(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <Button type="submit" size="sm" className="h-8" disabled={!newMilestoneTitle.trim() || isCreatingMilestone}>
                      Add
                    </Button>
                  </form>
                )}
                {csmMilestonesLoading ? (
                  <div className="text-sm text-muted-foreground text-center py-4">Loading…</div>
                ) : csmMilestones.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">No milestones configured</div>
                ) : (
                  csmMilestones.map((m) => (
                    <label
                      key={m.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={csmCompletedIds.includes(m.id)}
                        onCheckedChange={() => toggleCSMMilestone(m.id)}
                      />
                      <span className={`text-sm ${csmCompletedIds.includes(m.id) ? 'line-through text-muted-foreground' : ''}`}>
                        {m.title}
                      </span>
                    </label>
                  ))
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* 1-on-1 Action Items Card */}
        <Collapsible open={actionItemsOpen} onOpenChange={setActionItemsOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer pb-3 hover:bg-muted/50 transition-colors rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    1-on-1 Action Items
                    {actionItems.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {actionItems.filter(i => i.is_completed).length}/{actionItems.length}
                      </Badge>
                    )}
                  </CardTitle>
                  <ChevronDown className={`h-4 w-4 transition-transform ${actionItemsOpen ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newActionItemText}
                      onChange={(e) => setNewActionItemText(e.target.value)}
                      placeholder="Add action item…"
                      className="h-9 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newActionItemText.trim() && user) {
                          addActionItem.mutate({ text: newActionItemText.trim(), createdBy: user.id, dueDate: newActionItemDueDate || null }, {
                            onSuccess: () => { setNewActionItemText(''); setNewActionItemDueDate(''); },
                          });
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!newActionItemText.trim() || !user) return;
                        addActionItem.mutate({ text: newActionItemText.trim(), createdBy: user.id, dueDate: newActionItemDueDate || null }, {
                          onSuccess: () => { setNewActionItemText(''); setNewActionItemDueDate(''); },
                        });
                      }}
                      disabled={addActionItem.isPending || !newActionItemText.trim()}
                      className="h-9"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Due date</span>
                    <Input
                      type="date"
                      value={newActionItemDueDate}
                      onChange={(e) => setNewActionItemDueDate(e.target.value)}
                      className="h-7 text-xs w-[160px]"
                      placeholder="Due date (optional)"
                    />
                    {newActionItemDueDate && (
                      <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setNewActionItemDueDate('')}>Clear</button>
                    )}
                  </div>
                </div>
                {actionItemsLoading ? (
                  <div className="text-sm text-muted-foreground text-center py-4">Loading…</div>
                ) : actionItems.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">No action items yet</div>
                ) : (
                  <div className="space-y-1">
                    {actionItems.map((item) => {
                      const dueDateBadge = (() => {
                        if (!item.due_date || item.is_completed) return null;
                        const d = new Date(item.due_date + 'T00:00:00');
                        const today = new Date(); today.setHours(0,0,0,0);
                        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
                        if (d < today) return <Badge variant="destructive" className="text-[9px] h-4">Overdue</Badge>;
                        if (d.getTime() === today.getTime()) return <Badge className="bg-amber-500 text-white text-[9px] h-4">Due today</Badge>;
                        if (d.getTime() === tomorrow.getTime()) return <Badge className="bg-amber-400 text-white text-[9px] h-4">Tomorrow</Badge>;
                        return <Badge variant="outline" className="text-[9px] h-4">{format(d, 'MMM d')}</Badge>;
                      })();
                      return (
                        <div key={item.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 group">
                          <Checkbox
                            checked={item.is_completed}
                            onCheckedChange={() => toggleActionItem.mutate(item.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-sm ${item.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                                {item.text}
                              </span>
                              {dueDateBadge}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                              <span>{format(new Date(item.created_at), 'MMM d')}</span>
                              {item.is_completed && item.completed_at && (
                                <span className="text-emerald-600">✓ {format(new Date(item.completed_at), 'MMM d')}</span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteActionItem.mutate(item.id)}
                            disabled={deleteActionItem.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Internal Notes Card */}
        <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer pb-3 hover:bg-muted/50 transition-colors rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <StickyNote className="h-4 w-4" />
                    Internal Notes
                    {internalNotes.length > 0 && (
                      <Badge variant="secondary" className="text-xs">{internalNotes.length}</Badge>
                    )}
                  </CardTitle>
                  <ChevronDown className={`h-4 w-4 transition-transform ${notesOpen ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Add a note about this client…"
                    className="min-h-[60px] flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddNote();
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={addNote.isPending || !newNoteText.trim()}
                    className="self-end"
                  >
                    {addNote.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                {internalNotes.length > 1 && (
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setNotesSortAsc(!notesSortAsc)} className="text-xs text-muted-foreground">
                      <ArrowUpDown className="h-3 w-3 mr-1" />
                      {notesSortAsc ? 'Oldest First' : 'Newest First'}
                    </Button>
                  </div>
                )}
                {notesLoading ? (
                  <div className="text-sm text-muted-foreground text-center py-4">Loading notes…</div>
                ) : sortedNotes.length === 0 && !currentNotes ? (
                  <div className="text-sm text-muted-foreground text-center py-4">No notes yet</div>
                ) : (
                  <div className="space-y-3">
                    {sortedNotes.map((note) => (
                      <div key={note.id} className="border rounded-lg p-3 space-y-1 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{note.author_name}</span>
                            <span className="text-xs text-muted-foreground" title={format(new Date(note.created_at), 'MMM dd, yyyy h:mm a')}>
                              {formatDistance(new Date(note.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          {(user?.id === note.author_id) && (
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteNote(note.id)} disabled={deleteNote.isPending}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                      </div>
                    ))}
                    {currentNotes && (
                      <div className="border rounded-lg p-3 space-y-1 bg-muted/20 border-dashed">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">Legacy Notes</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap text-muted-foreground">{currentNotes}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList>
          <TabsTrigger value="tasks">Tasks & Submissions</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="support">Support History ({tickets.length})</TabsTrigger>
          <TabsTrigger value="course-access">Course Access</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course & Phase Progress</CardTitle>
              <CardDescription>Manage user task submissions organized by course and phase</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {(data.courses || []).map((course: any) => (
                  <AccordionItem key={course.id} value={`course-${course.id}`}>
                    <AccordionTrigger>
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-lg">{course.title}</span>
                          <Badge variant="secondary">{course.phases?.length || 0} phases</Badge>
                          <Badge variant="outline">{course.completedTasks}/{course.totalTasks} tasks</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={course.progressPercentage} className="w-32 h-2" />
                          <span className="text-sm font-medium text-muted-foreground">{course.progressPercentage}%</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Accordion type="single" collapsible className="w-full pl-4">
                        {(course.phases || []).map((phase: any) => (
                          <AccordionItem key={phase.id} value={`phase-${phase.id}`}>
                            <AccordionTrigger>
                              <div className="flex items-center justify-between w-full pr-4">
                                <div className="flex items-center gap-3">
                                  <span className="font-medium">Phase {phase.phase_order}: {phase.title}</span>
                                  <Badge variant="outline">{phase.completedCount}/{phase.totalCount} completed</Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Progress value={phase.progressPercentage} className="w-24 h-2" />
                                  <span className="text-sm text-muted-foreground">{phase.progressPercentage}%</span>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Task</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {(phase.tasks || []).map((task: any) => (
                                    <TableRow key={task.id}>
                                      <TableCell>
                                        <div>
                                          <div className="font-medium">{task.title}</div>
                                          {task.description && (
                                            <div className="text-sm text-muted-foreground">{task.description}</div>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : '-'}
                                      </TableCell>
                                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                                      <TableCell>
                                        {task.completedAt ? format(new Date(task.completedAt), 'MMM dd, yyyy') : '-'}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                          {task.hasSubmission && (
                                            <Button variant="outline" size="sm" onClick={() => handleViewSubmission(task)}>
                                              <Eye className="h-3 w-3 mr-1" />View
                                            </Button>
                                          )}
                                          {task.status !== 'completed' ? (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleMarkComplete(task.id)}
                                              disabled={processingTaskId === task.id}
                                            >
                                              {processingTaskId === task.id ? (
                                                <span className="flex items-center"><span className="animate-spin mr-1">⏳</span>Processing...</span>
                                              ) : (
                                                <><CheckCircle className="h-3 w-3 mr-1" />Mark Complete</>
                                              )}
                                            </Button>
                                          ) : (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => setConfirmAction({ type: 'incomplete', taskId: task.id })}
                                              disabled={processingTaskId === task.id}
                                            >
                                              {processingTaskId === task.id ? (
                                                <span className="flex items-center"><span className="animate-spin mr-1">⏳</span>Processing...</span>
                                              ) : (
                                                <><XCircle className="h-3 w-3 mr-1" />Mark Incomplete</>
                                              )}
                                            </Button>
                                          )}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes">
          <UserQuizzesView userId={userId} quizzes={data.quizzes} />
        </TabsContent>

        {/* Support History Tab */}
        <TabsContent value="support">
          <Card>
            <CardHeader>
              <CardTitle>Support Ticket History</CardTitle>
              <CardDescription>All tickets submitted by this client</CardDescription>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <p className="text-muted-foreground text-sm py-6 text-center">No support tickets found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket: any) => {
                      const isExpanded = expandedTicketId === ticket.id;
                      return (
                        <React.Fragment key={ticket.id}>
                          <TableRow
                            className="cursor-pointer hover:bg-accent/50 transition-colors"
                            onClick={() => setExpandedTicketId(prev => prev === ticket.id ? null : ticket.id)}
                          >
                            <TableCell className="font-mono text-xs">#{ticket.ticket_number}</TableCell>
                            <TableCell className="font-medium">{ticket.subject}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs capitalize">{ticket.topic || ticket.ticket_type}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={ticket.priority === 'high' || ticket.priority === 'urgent' ? 'destructive' : 'secondary'}
                                className="text-xs capitalize"
                              >
                                {ticket.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs capitalize">{ticket.status}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(ticket.created_at), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow className="bg-accent/20 border-b">
                              <TableCell colSpan={7} className="py-4 px-6">
                                <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap mb-3">
                                  {ticket.description || 'No description provided.'}
                                </p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>Created {format(new Date(ticket.created_at), 'MMM dd, yyyy h:mm a')}</span>
                                  </div>
                                  {onViewTicket && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => { e.stopPropagation(); onViewTicket(ticket.id); }}
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                      View Full Ticket
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="course-access">
          <UserCourseAccessManager userId={userId} userTierId={data?.profile?.tier_id} />
        </TabsContent>
      </Tabs>

      {selectedTask && showSubmissionModal && (
        <TaskSubmissionModal
          onClose={() => { setShowSubmissionModal(false); setSelectedTask(null); }}
          task={selectedTask}
        />
      )}

      <ConfirmationDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction?.type === 'incomplete') {
            handleMarkIncomplete(confirmAction.taskId);
          }
        }}
        title="Mark Task Incomplete"
        description="Are you sure you want to mark this task as incomplete? The user's submission will be kept but marked as pending."
        confirmText="Mark Incomplete"
      />

      <Dialog open={showMessageDialog} onOpenChange={(open) => { setShowMessageDialog(open); if (!open) { setMessageText(''); setDmConversationId(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Message to {data?.profile?.first_name} {data?.profile?.last_name}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Type your message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={4}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendDirectMessage();
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMessageDialog(false)}>Cancel</Button>
            <Button onClick={handleSendDirectMessage} disabled={!messageText.trim() || sendMessage.isPending}>
              {sendMessage.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showFollowUp} onOpenChange={(open) => { if (!open) { setShowFollowUp(false); setDmConversationId(null); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Message sent!</DialogTitle>
            <DialogDescription>
              Your message has been sent successfully. Would you like to continue viewing this student or go to the conversation?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => { setShowFollowUp(false); setDmConversationId(null); }}>
              Stay Here
            </Button>
            <Button onClick={() => { window.location.href = `/1on1s/${dmConversationId}`; }}>
              Go to Messages
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
