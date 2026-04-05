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
  GraduationCap, ExternalLink, Video, FileText, AlertTriangle, Pencil, X, DollarSign
} from "lucide-react";
import { formatCurrency } from "@/utils/currency";
import { useUserDetails, useSaveAdminNotes, useSaveOnboardingDetails } from "@/hooks/useUserDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow, differenceInDays, addMonths, isWithinInterval } from "date-fns";
import { UserQuizzesView } from "./UserQuizzesView";
import { TaskSubmissionModal } from "./TaskSubmissionModal";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { UserCourseAccessManager } from "./UserCourseAccessManager";

import { markTaskComplete, markTaskIncomplete } from "@/utils/adminTaskActions";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useUserRsvpStats } from "@/hooks/useCallRsvp";
import { Phone } from "lucide-react";

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
    lastTaskCompletedAt: data?.lastTaskCompletedAt || null,
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

const getOnboardingStatus = (data: any) => {
  const bookingStatus = data?.profile?.onboarding_booking_status;
  if (bookingStatus === 'completed') return 'Completed';
  if (bookingStatus === 'missed') return 'Missed';
  if (bookingStatus === 'rescheduled') return 'Rescheduled';
  if (data?.profile?.onboarding_completed) return 'Completed';
  const completed = data?.summary?.completedTasks || 0;
  return completed > 0 ? 'In Progress' : 'Not Started';
};

const OnboardingBadge = ({ status }: { status: string }) => {
  const cls = status === 'Completed'
    ? 'bg-green-600 text-white'
    : status === 'Missed'
      ? 'bg-destructive text-destructive-foreground'
      : status === 'Rescheduled'
        ? 'bg-yellow-500 text-black'
        : status === 'In Progress'
          ? 'bg-yellow-500 text-black'
          : 'bg-muted text-muted-foreground';
  return <Badge className={cls}>{status}</Badge>;
};

export const UserDetailsView = ({ userId, onBack, onViewTicket }: UserDetailsViewProps) => {
  const { data, isLoading, error } = useUserDetails(userId);
  const queryClient = useQueryClient();
  const saveNotes = useSaveAdminNotes();
  const saveOnboarding = useSaveOnboardingDetails();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; taskId: string } | null>(null);
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [onboardingEditing, setOnboardingEditing] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState<Record<string, any>>({});
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [editingRevenue, setEditingRevenue] = useState(false);
  const [revenueValue, setRevenueValue] = useState<string>('');
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailValue, setEmailValue] = useState<string>('');

  const currentNotes = notesValue ?? data?.profile?.admin_notes ?? '';

  const handleStartOnboardingEdit = () => {
    setOnboardingEditing(true);
    setOnboardingForm({
      onboarding_booking_status: data?.profile?.onboarding_booking_status || '',
      onboarding_date: data?.profile?.onboarding_date ? new Date(data.profile.onboarding_date).toISOString().slice(0, 16) : '',
      onboarding_call_recording: data?.profile?.onboarding_call_recording || '',
      onboarding_call_summary: data?.profile?.onboarding_call_summary || '',
      onboarding_sheet_url: data?.profile?.onboarding_sheet_url || '',
      offboarding_date: data?.profile?.offboarding_date || '',
    });
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
          toast.success("Onboarding details saved");
          setOnboardingEditing(false);
        },
        onError: (err: any) => {
          toast.error(err.message);
        },
      }
    );
  };

  const handleSaveNotes = () => {
    saveNotes.mutate(
      { userId, notes: currentNotes },
      {
        onSuccess: () => {
          toast.success("Notes saved");
          setNotesValue(null);
        },
        onError: (err: any) => {
          toast.error(err.message);
        },
      }
    );
  };

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
      toast.success("Task marked as complete");
      await queryClient.invalidateQueries({ queryKey: ['user-details', userId] });
    } catch (error: any) {
      await queryClient.invalidateQueries({ queryKey: ['user-details', userId] });
      toast.error(error.message || "Failed to mark task complete");
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
      toast.success("Task marked as incomplete");
      await queryClient.invalidateQueries({ queryKey: ['user-details', userId] });
    } catch (error: any) {
      await queryClient.invalidateQueries({ queryKey: ['user-details', userId] });
      toast.error(error.message || "Failed to mark task incomplete");
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
  const onboardingStatus = getOnboardingStatus(data);
  const loginStreak = data.loginStreak;
  const tickets = data.tickets || [];

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />Back to Overview
      </Button>

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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Name</div>
                <div className="font-medium text-sm">{data.profile.first_name} {data.profile.last_name}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                {editingEmail ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="email"
                      className="h-7 w-full text-sm px-1.5"
                      value={emailValue}
                      onChange={e => setEmailValue(e.target.value)}
                      onBlur={() => {
                        const trimmed = emailValue.trim();
                        if (!trimmed || trimmed === data.profile.user_email) {
                          setEditingEmail(false);
                          return;
                        }
                        saveOnboarding.mutate(
                          { userId, details: { user_email: trimmed } },
                          {
                            onSuccess: () => {
                              toast.success("Email updated");
                              setEditingEmail(false);
                            },
                            onError: (err: any) => toast.error(err.message),
                          }
                        );
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        if (e.key === 'Escape') setEditingEmail(false);
                      }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-sm truncate">{data.profile.user_email}</span>
                    <button onClick={() => { setEditingEmail(true); setEmailValue(data.profile.user_email || ''); }}>
                      <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                )}
              </div>
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
                <div className="text-xs text-muted-foreground">Onboarding</div>
                <OnboardingBadge status={onboardingStatus} />
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
                              toast.success("Revenue updated");
                              setEditingRevenue(false);
                            },
                            onError: (err: any) => toast.error(err.message),
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
                  <div className="text-xs text-muted-foreground">Date & Time</div>
                  <div className="font-medium text-sm">
                    {data.profile.onboarding_date
                      ? format(new Date(data.profile.onboarding_date), 'MMM dd, yyyy h:mm a')
                      : 'Not scheduled'}
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
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Internal Notes */}
      <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer pb-3 hover:bg-muted/50 transition-colors rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <StickyNote className="h-4 w-4" />
                  Internal Notes
                </CardTitle>
                <ChevronDown className={`h-4 w-4 transition-transform ${notesOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3">
              <Textarea
                value={currentNotes}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Add internal notes about this client... (not visible to the client)"
                className="min-h-[100px]"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={saveNotes.isPending || (notesValue === null)}
                >
                  {saveNotes.isPending ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3 mr-1" />
                  )}
                  Save Notes
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

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
          <UserCourseAccessManager userId={userId} />
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
    </div>
  );
};
