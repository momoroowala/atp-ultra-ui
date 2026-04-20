import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, RefreshCw, Download, Eye, Mail, UserPlus, Loader2, Shield, AlertTriangle, Users, ArrowUpDown, ArrowUp, ArrowDown, Check, ChevronsUpDown, ChevronDown, ChevronLeft, ChevronRight, X, DollarSign, Pencil, Plus } from "lucide-react";
import { useAllUsersProgress, type UserProgress } from "@/hooks/useAllUsersProgress";
import { useTiers } from "@/hooks/useTiers";
import { useRoles } from "@/hooks/useRoles";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BulkInviteDialog } from "../BulkInviteDialog";
import { UserActionsMenu } from "./UserActionsMenu";
import { format, differenceInDays } from "date-fns";
import { useUserCourseAccess } from "@/hooks/useUserCourseAccess";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useCSMList, useAssignCSM } from "@/hooks/useCSMStudents";
import { toast as sonnerToast } from "sonner";
import { formatCurrency } from "@/utils/currency";
import { useAuth } from "@/hooks/useAuth";
interface UserManagementOverviewProps {
  onViewDetails: (userId: string) => void;
  assignedStudentIds?: { ids: Set<string>; emails: Set<string> };
}
export const UserManagementOverview = ({
  onViewDetails,
  assignedStudentIds
}: UserManagementOverviewProps) => {
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const {
    isAdmin, isCSM, isExecutive, isMegaAdmin
  } = useRoleCheck();
  const {
    data: tiers = [],
    isLoading: tiersLoading
  } = useTiers();
  const {
    data: roles = []
  } = useRoles();
  const { data: csmList = [] } = useCSMList();
  const assignCSM = useAssignCSM();
  const { user: authUser } = useAuth();

  // My Students toggle
  const [myStudentsOnly, setMyStudentsOnly] = useState(isCSM && !isAdmin && !isMegaAdmin && !!assignedStudentIds);
  const [addUserOpen, setAddUserOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string[]>([]);
  const [onboardingFilter, setOnboardingFilter] = useState<string>("all");
  const [guaranteeFilter, setGuaranteeFilter] = useState<string>("all");
  const [csmFilterValue, setCsmFilterValue] = useState<string>("all");
  const [invitationFilter, setInvitationFilter] = useState<string>("all");
  const [bulkInviteOpen, setBulkInviteOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Inline revenue editing
  const [editingRevenueUserId, setEditingRevenueUserId] = useState<string | null>(null);
  const [editingRevenueValue, setEditingRevenueValue] = useState<string>('');

  // Bulk action state
  const [bulkActionTier, setBulkActionTier] = useState<string>("");
  const [bulkActionRole, setBulkActionRole] = useState<string>("");

  // Invite form state
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteTier, setInviteTier] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<string>('');

  // Create form state
  const [createLoading, setCreateLoading] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createFirstName, setCreateFirstName] = useState('');
  const [createLastName, setCreateLastName] = useState('');
  const [createTier, setCreateTier] = useState<string>('');
  const [createRole, setCreateRole] = useState<string>('');

  // Set default tier and role when loaded
  useEffect(() => {
    if (tiers.length > 0 && !inviteTier) {
      const defaultTier = tiers.find(t => t.tier_key === 'client_stb');
      setInviteTier(defaultTier?.id || tiers[0].id);
      setCreateTier(defaultTier?.id || tiers[0].id);
    }
    if (roles.length > 0 && !inviteRole) {
      const clientRole = roles.find(r => r.role_key === 'client');
      setInviteRole(clientRole?.id || roles[0].id);
      setCreateRole(clientRole?.id || roles[0].id);
    }
  }, [tiers, roles]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [levelFilter, statusFilter, tierFilter, onboardingFilter, guaranteeFilter, csmFilterValue, invitationFilter]);

  // Fetch users with pagination and all filters applied server-side
  const {
    data,
    isLoading,
    error,
    refetch
  } = useAllUsersProgress({
    page: currentPage,
    perPage,
    searchQuery: debouncedSearch,
    tierFilter,
    invitationFilter,
    sortColumn: sortColumn === 'status' ? 'created_at' : (sortColumn || 'created_at'),
    sortDirection,
    csmFilter: myStudentsOnly && assignedStudentIds && authUser?.id ? authUser.id : (csmFilterValue === 'all' ? null : csmFilterValue),
    onboardingFilter,
    guaranteeFilter
  });
  const users = data?.users || [];
  const pagination = data?.pagination || {
    page: 1,
    perPage: 15,
    totalCount: 0,
    totalPages: 1
  };

  // Lightweight query to always have the "All Students" total count
  const { data: allCountData } = useAllUsersProgress({
    page: 1,
    perPage: 1,
    searchQuery: debouncedSearch,
    tierFilter,
    invitationFilter,
    sortColumn: 'created_at',
    sortDirection: 'desc',
    csmFilter: null,
    onboardingFilter,
    guaranteeFilter
  });

  // Status helpers
  const getStatus = (user: UserProgress) => {
    if (!user.isActive) return 'Refunded';
    if (!user.lastSignInAt) return 'Never Logged In';
    const daysSince = differenceInDays(new Date(), new Date(user.lastSignInAt));
    return daysSince > 14 ? 'At Risk' : 'Active';
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Never Logged In': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'At Risk': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Refunded': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return '';
    }
  };

  const getOnboardingStatus = (user: UserProgress) => {
    const status = user.onboardingBookingStatus;
    if (status === 'completed') return 'Completed';
    if (status === 'missed') return 'Missed';
    if (status === 'rescheduled') return 'Rescheduled';
    return 'Not Started';
  };

  const getOnboardingStyle = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Missed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Rescheduled': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Not Started': return 'bg-muted text-muted-foreground';
      default: return '';
    }
  };

  const getGuaranteeStyle = (status: string) => {
    switch (status) {
      case 'met': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'activated': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'voided': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const showEmailColumn = isMegaAdmin;
  const showCsmColumn = isMegaAdmin || isAdmin;

  // Filter out staff users for non-admin viewers
  const STAFF_ROLES = ['admin', 'csm', 'executive', 'mega_admin'];
  const statusPriority: Record<string, number> = {
    'Refunded': 0,
    'At Risk': 1,
    'Never Logged In': 2,
    'Active': 3,
  };

  const sortedAndFilteredUsers = useMemo(() => {
    const filtered = isAdmin ? users : users.filter(u => !STAFF_ROLES.includes(u.roleKey));
    if (sortColumn === 'status') {
      return [...filtered].sort((a, b) => {
        const valA = statusPriority[getStatus(a)] ?? 99;
        const valB = statusPriority[getStatus(b)] ?? 99;
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      });
    }
    return filtered;
  }, [users, isAdmin, sortColumn, sortDirection]);

  // Precompute status per user once so renderers / CSV export avoid re-running
  // getStatus() on every row render (and every sort comparison).
  const statusById = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of sortedAndFilteredUsers) m.set(u.id, getStatus(u));
    return m;
  }, [sortedAndFilteredUsers]);
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(sortedAndFilteredUsers.map(u => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };
  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };
  const handleApplyBulkChangeTier = async () => {
    if (!bulkActionTier) {
      toast({
        title: "Error",
        description: "Please select a tier",
        variant: "destructive"
      });
      return;
    }
    try {
      const userIds = Array.from(selectedUsers);
      for (const userId of userIds) {
        await supabase.from('user_profiles').update({
          tier_id: bulkActionTier
        }).eq('id', userId);
      }
      toast({
        title: "Success",
        description: `Updated tier for ${userIds.length} user(s)`
      });
      setSelectedUsers(new Set());
      setBulkActionTier("");
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tiers",
        variant: "destructive"
      });
    }
  };
  const handleApplyBulkChangeRole = async () => {
    if (!bulkActionRole) {
      toast({
        title: "Error",
        description: "Please select a role",
        variant: "destructive"
      });
      return;
    }
    try {
      const userIds = Array.from(selectedUsers);

      // Single batched update for efficiency + verification
      const {
        data,
        error
      } = await supabase.from('user_profiles').update({
        role_id: bulkActionRole
      }).in('id', userIds).select('id, role_id');
      if (error) throw error;
      const updatedCount = data?.filter(r => r.role_id === bulkActionRole).length || 0;
      const notUpdated = userIds.length - updatedCount;
      toast({
        title: "Success",
        description: `Updated role for ${updatedCount} user(s)${notUpdated > 0 ? `, ${notUpdated} skipped` : ''}`
      });
      setSelectedUsers(new Set());
      setBulkActionRole("");
      // Invalidate and refetch to ensure fresh data
      await queryClient.invalidateQueries({
        queryKey: ['all-users-progress']
      });
      refetch();
    } catch (error) {
      console.error('Error updating roles:', error);
      toast({
        title: "Error",
        description: "Failed to update roles",
        variant: "destructive"
      });
    }
  };
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteFirstName.trim() || !inviteLastName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter both first and last name.",
        variant: "destructive"
      });
      return;
    }
    if (!inviteEmail) {
      toast({
        title: "Email required",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }
    if (!inviteTier) {
      toast({
        title: "Tier required",
        description: "Please select a tier for the user.",
        variant: "destructive"
      });
      return;
    }
    setInviteLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('invite-user', {
        body: {
          email: inviteEmail.trim(),
          firstName: inviteFirstName.trim() || undefined,
          lastName: inviteLastName.trim() || undefined,
          tierId: inviteTier,
          roleId: inviteRole
        }
      });
      if (error) {
        let realMessage = error.message;
        try {
          const context = (error as any).context;
          if (context && typeof context.json === 'function') {
            const body = await context.json();
            realMessage = body?.error || body?.message || realMessage;
          }
        } catch {}
        throw new Error(realMessage);
      }
      if (!data?.success) throw new Error(data?.error || 'Failed to invite user');
      toast({
        title: "Invitation sent!",
        description: `An invitation email has been sent to ${inviteEmail}`,
      });
      setInviteEmail('');
      setInviteFirstName('');
      setInviteLastName('');
      refetch();
    } catch (error: any) {
      console.error('Invite user error:', error);
      toast({
        title: "Failed to invite user",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setInviteLoading(false);
    }
  };
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFirstName.trim() || !createLastName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter both first and last name.",
        variant: "destructive"
      });
      return;
    }
    if (!createEmail) {
      toast({
        title: "Email required",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }
    setCreateLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('create-user', {
        body: {
          email: createEmail.trim(),
          firstName: createFirstName.trim() || undefined,
          lastName: createLastName.trim() || undefined
        }
      });
      if (error) {
        let realMessage = error.message;
        try {
          const context = (error as any).context;
          if (context && typeof context.json === 'function') {
            const body = await context.json();
            realMessage = body?.error || body?.message || realMessage;
          }
        } catch {}
        throw new Error(realMessage);
      }
      if (data?.error) throw new Error(data.error);

      // Update user profile with tier and role
      if (data?.user?.id) {
        const {
          error: profileError
        } = await supabase.from('user_profiles').update({
          tier_id: createTier,
          role_id: createRole
        }).eq('id', data.user.id);
        if (profileError) {
          console.error('Error updating profile:', profileError);
          toast({
            title: "Warning",
            description: "User created but profile update failed. Please update manually.",
            variant: "destructive"
          });
        }
      }
      if (data?.magicLink) {
        // Copy magic link to clipboard automatically
        try {
          await navigator.clipboard.writeText(data.magicLink);
          toast({
            title: "User created successfully!",
            description: "Password setup link copied to clipboard. Share it with the user so they can set their password.",
          });
        } catch {
          // Fallback: show the link in a prompt if clipboard fails
          toast({
            title: "User created successfully!",
            description: "Copy this password setup link and share it with the user:",
          });
          prompt("Password setup link (copy this):", data.magicLink);
        }
      } else {
        toast({
          title: "User created successfully!",
          description: "User account created but no setup link was generated. Use 'Reset Password' to send them a link.",
        });
      }
      setCreateEmail('');
      setCreateFirstName('');
      setCreateLastName('');
      refetch();
    } catch (error: any) {
      console.error('Create user error:', error);
      toast({
        title: "Failed to create user",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setCreateLoading(false);
    }
  };
  const handleExport = () => {
    if (!sortedAndFilteredUsers.length) return;
    const headers = ['Name', ...(showEmailColumn ? ['Email'] : []), 'Tier', 'Status', 'Onboarding Status', ...(showCsmColumn ? ['CSM'] : []), 'Onboarding Date', 'Offboarding Date', 'Guarantee', 'Progress', 'Last Seen', 'Joined Date'];
    const rows = sortedAndFilteredUsers.map(user => {
      const row = [
        `"${user.firstName} ${user.lastName}"`,
        ...(showEmailColumn ? [user.email] : []),
        user.tier,
        statusById.get(user.id) ?? getStatus(user),
        getOnboardingStatus(user),
        ...(showCsmColumn ? [user.assignedCsmId ? csmList.find(c => c.id === user.assignedCsmId)?.firstName || 'Assigned' : 'Unassigned'] : []),
        user.onboardingDate ? format(new Date(user.onboardingDate), 'MM/dd/yy') : '',
        user.offboardingDate ? format(new Date(user.offboardingDate), 'MM/dd/yy') : '',
        user.guaranteeStatus || 'pending',
        `"${user.completedTasks}/${user.totalTasks} (${user.progressPercentage}%)"`,
        user.lastSignInAt ? format(new Date(user.lastSignInAt), 'MM/dd/yyyy HH:mm') : 'Never',
        format(new Date(user.joinedDate), 'MM/dd/yyyy'),
      ];
      return row.join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], {
      type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-progress-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const handleSaveRevenue = useCallback(async (userId: string, value: string) => {
    const numValue = value.trim() === '' ? null : parseInt(value, 10);
    if (value.trim() !== '' && (isNaN(numValue!) || numValue! < 0)) {
      sonnerToast.error('Invalid revenue amount');
      return;
    }
    try {
      const { error } = await supabase.from('user_profiles').update({ revenue: numValue } as any).eq('id', userId);
      if (error) throw error;
      sonnerToast.success('Revenue updated');
      queryClient.invalidateQueries({ queryKey: ['all-users-progress'] });
      queryClient.invalidateQueries({ queryKey: ['user-details', userId] });
    } catch (err: any) {
      sonnerToast.error(err.message || 'Failed to update revenue');
    } finally {
      setEditingRevenueUserId(null);
    }
  }, [queryClient]);

  const SortableHeader = ({
    column,
    label
  }: {
    column: string;
    label: string;
  }) => <TableHead className="cursor-pointer hover:bg-muted/50 px-2 py-2" onClick={() => handleSort(column)}>
      <div className="flex items-center gap-1">
        {label}
        {sortColumn === column ? sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-30" />}
      </div>
    </TableHead>;
  return <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <CardTitle>Student Management</CardTitle>
          <div className="flex flex-col md:flex-row gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => setBulkInviteOpen(true)}>
              <Users className="h-4 w-4 mr-2" />
              Bulk Invite
            </Button>
            <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add User</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="invite" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="invite" className="text-xs md:text-sm gap-1 md:gap-2 px-2">
                      <Mail className="hidden md:inline-block mr-1 h-4 w-4" />
                      Invite <span className="hidden md:inline">(Recommended)</span>
                    </TabsTrigger>
                    <TabsTrigger value="create" className="text-xs md:text-sm gap-1 md:gap-2 px-2">
                      <UserPlus className="hidden md:inline-block mr-1 h-4 w-4" />
                      Create User
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="invite" className="space-y-4">
                    <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                      <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        <strong>More Secure:</strong> User receives an email invitation to set their own password.
                      </AlertDescription>
                    </Alert>
                    <form onSubmit={handleInviteUser} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="inviteFirstName">First Name *</Label>
                          <Input id="inviteFirstName" value={inviteFirstName} onChange={e => setInviteFirstName(e.target.value)} placeholder="John" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="inviteLastName">Last Name *</Label>
                          <Input id="inviteLastName" value={inviteLastName} onChange={e => setInviteLastName(e.target.value)} placeholder="Doe" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inviteEmail">Email *</Label>
                        <Input id="inviteEmail" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="user@example.com" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inviteTier">Client Tier <span className="text-destructive">*</span></Label>
                        <Select value={inviteTier} onValueChange={setInviteTier} required>
                          <SelectTrigger className={!inviteTier ? "border-destructive" : ""}>
                            <SelectValue placeholder="Select tier (required)" />
                          </SelectTrigger>
                          <SelectContent>
                            {tiers.map(tier => <SelectItem key={tier.id} value={tier.id}>{tier.display_name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      {!isCSM && (
                        <div className="space-y-2">
                          <Label htmlFor="inviteRole">User Role</Label>
                          <Select value={inviteRole} onValueChange={setInviteRole}>
                            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                            <SelectContent>
                              {roles.filter(role => role.is_active).map(role => <SelectItem key={role.id} value={role.id}>{role.display_name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <Button type="submit" disabled={inviteLoading} className="w-full">
                        {inviteLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending Invitation...</> : <><Mail className="mr-2 h-4 w-4" />Send Invitation</>}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="create" className="space-y-4">
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Less Secure:</strong> Password will be generated and emailed. Use "Invite User" instead for better security.
                      </AlertDescription>
                    </Alert>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="createFirstName">First Name *</Label>
                          <Input id="createFirstName" value={createFirstName} onChange={e => setCreateFirstName(e.target.value)} placeholder="John" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="createLastName">Last Name *</Label>
                          <Input id="createLastName" value={createLastName} onChange={e => setCreateLastName(e.target.value)} placeholder="Doe" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="createEmail">Email *</Label>
                        <Input id="createEmail" type="email" value={createEmail} onChange={e => setCreateEmail(e.target.value)} placeholder="user@example.com" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="createTier">Client Tier</Label>
                        <Select value={createTier} onValueChange={setCreateTier}>
                          <SelectTrigger><SelectValue placeholder="Select tier" /></SelectTrigger>
                          <SelectContent>
                            {tiers.map(tier => <SelectItem key={tier.id} value={tier.id}>{tier.display_name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      {!isCSM && (
                        <div className="space-y-2">
                          <Label htmlFor="createRole">User Role</Label>
                          <Select value={createRole} onValueChange={setCreateRole}>
                            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                            <SelectContent>
                              {roles.filter(role => role.is_active).map(role => <SelectItem key={role.id} value={role.id}>{role.display_name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <Button type="submit" disabled={createLoading} className="w-full">
                        {createLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : <><UserPlus className="mr-2 h-4 w-4" />Create User</>}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!sortedAndFilteredUsers.length}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        <CardDescription>
          Manage student accounts and invite new users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* My Students / All Students toggle */}
        {assignedStudentIds && (
          <div className="inline-flex items-center rounded-lg border p-1 bg-muted/60">
            <button
              onClick={() => setMyStudentsOnly(true)}
              className={cn(
                "min-w-[150px] px-5 py-2 text-sm font-medium rounded-md transition-colors",
                myStudentsOnly
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              My Students ({assignedStudentIds.ids.size})
            </button>
            <button
              onClick={() => setMyStudentsOnly(false)}
              className={cn(
                "min-w-[150px] px-5 py-2 text-sm font-medium rounded-md transition-colors",
                !myStudentsOnly
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All Students ({allCountData?.pagination.totalCount ?? '…'})
            </button>
          </div>
        )}


        {/* Group Actions */}
        {selectedUsers.size > 0 && <Alert className="bg-primary/5">
            <AlertDescription>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-medium">{selectedUsers.size} user(s) selected</span>
                <div className="flex gap-2 flex-wrap">
                  <Select value={bulkActionTier} onValueChange={setBulkActionTier}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Change Tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiers.map(tier => <SelectItem key={tier.id} value={tier.id}>
                          {tier.display_name}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                  {bulkActionTier && <Button size="sm" onClick={handleApplyBulkChangeTier}>
                      Apply Tier
                    </Button>}
                  <Select value={bulkActionRole} onValueChange={setBulkActionRole}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Change Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => <SelectItem key={role.id} value={role.id}>
                          {role.display_name}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                  {bulkActionRole && <Button size="sm" onClick={handleApplyBulkChangeRole}>
                      Apply Role
                    </Button>}
                  <Button variant="outline" onClick={() => {
                setSelectedUsers(new Set());
                setBulkActionTier("");
                setBulkActionRole("");
              }}>
                    Clear Selection
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>}

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 pr-9" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>}
              {searchQuery && searchQuery !== debouncedSearch && <span className="absolute right-10 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                </span>}
            </div>
          </div>
          
          {/* Tier Multi-Select */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex h-10 w-[180px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <span className="truncate">{tierFilter.length === 0 ? "All Tiers" : `${tierFilter.length} tier${tierFilter.length > 1 ? 's' : ''} selected`}</span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search tiers..." />
                <CommandList>
                  <CommandEmpty>No tier found.</CommandEmpty>
                  <CommandGroup>
                    {tiers.map(tier => <CommandItem key={tier.id} onSelect={() => {
                    setTierFilter(prev => prev.includes(tier.id) ? prev.filter(id => id !== tier.id) : [...prev, tier.id]);
                  }}>
                        <Check className={cn("mr-2 h-4 w-4", tierFilter.includes(tier.id) ? "opacity-100" : "opacity-0")} />
                        {tier.display_name}
                      </CommandItem>)}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Select value={onboardingFilter} onValueChange={setOnboardingFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Onboarding" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Onboarding</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="rescheduled">Rescheduled</SelectItem>
              <SelectItem value="missed">Missed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={guaranteeFilter} onValueChange={setGuaranteeFilter}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Guarantee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Guarantee</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="met">Met</SelectItem>
              <SelectItem value="activated">Activated</SelectItem>
              <SelectItem value="voided">Voided</SelectItem>
            </SelectContent>
          </Select>
          <Select value={csmFilterValue} onValueChange={setCsmFilterValue}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Assigned CSM" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All CSMs</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {csmList.map(csm => (
                <SelectItem key={csm.id} value={csm.id}>
                  {csm.firstName} {csm.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={invitationFilter} onValueChange={setInvitationFilter}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="logged_in">
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-500" />Logged In</span>
              </SelectItem>
              <SelectItem value="never_logged_in">
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-yellow-500" />Never Logged In</span>
              </SelectItem>
              <SelectItem value="at_risk">
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-orange-500" />At Risk</span>
              </SelectItem>
              <SelectItem value="refunded">
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500" />Refunded</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg text-xs">
          {error && <div className="p-8 text-center">
              <p className="text-destructive">Failed to load users: {error.message}</p>
              <Button onClick={() => refetch()} className="mt-4">
                Retry
              </Button>
            </div>}

          {!error && <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[36px] px-2 py-2">
                    <Checkbox checked={selectedUsers.size === sortedAndFilteredUsers.length && sortedAndFilteredUsers.length > 0} onCheckedChange={handleSelectAll} />
                  </TableHead>
                  <TableHead className="w-[50px] px-2 py-2">Actions</TableHead>
                  <SortableHeader column="name" label="Name" />
                  {showEmailColumn && <SortableHeader column="email" label="Email" />}
                  <SortableHeader column="tier" label="Tier" />
                  <SortableHeader column="status" label="Status" />
                  <TableHead className="px-2 py-2">Onboarding</TableHead>
                  {showCsmColumn && <TableHead className="px-2 py-2">CSM</TableHead>}
                  <SortableHeader column="onboarding_date" label="Onboard Date" />
                  <SortableHeader column="offboarding_date" label="Offboard Date" />
                  <SortableHeader column="guarantee_status" label="Guarantee" />
                  <SortableHeader column="revenue" label="Revenue" />
                  <SortableHeader column="progress" label="Progress" />
                  <SortableHeader column="last_sign_in_at" label="Last Seen" />
                  <SortableHeader column="joinedDate" label="Joined" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? Array.from({ length: 15 }).map((_, i) => <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      {showEmailColumn && <TableCell><Skeleton className="h-4 w-48" /></TableCell>}
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      {showCsmColumn && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>) : sortedAndFilteredUsers.length === 0 ? <TableRow>
                    <TableCell colSpan={13 + (showEmailColumn ? 1 : 0) + (showCsmColumn ? 1 : 0)} className="text-center py-8 text-muted-foreground">
                      {debouncedSearch ? `No users found matching "${debouncedSearch}"` : 'No users found'}
                    </TableCell>
                  </TableRow> : sortedAndFilteredUsers.map(user => <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50" onClick={e => {
              if ((e.target as HTMLElement).closest('button, [role="checkbox"]')) return;
              onViewDetails(user.id);
            }}>
                      <TableCell className="px-2 py-2" onClick={e => e.stopPropagation()}>
                        <Checkbox checked={selectedUsers.has(user.id)} onCheckedChange={checked => {
                  checked = checked as boolean;
                  handleSelectUser(user.id, checked);
                }} onClick={e => e.stopPropagation()} />
                      </TableCell>
                      <TableCell className="px-2 py-2" onClick={e => e.stopPropagation()}>
                        {(isAdmin || isCSM || isExecutive) && <UserActionsMenu userId={user.id} userEmail={user.email} userFirstName={user.firstName || ''} userLastName={user.lastName || ''} userPhone={user.phone || ''} currentRoleId={user.roleId || ''} currentTierId={user.tierId || ''} isActive={user.isActive ?? true} onActionComplete={async () => {
                  await queryClient.invalidateQueries({ queryKey: ['all-users-progress'] });
                  await queryClient.invalidateQueries({ queryKey: ['user-details', user.id], refetchType: 'all' });
                  refetch();
                }} />}
                      </TableCell>
                      <TableCell className="px-2 py-2 font-medium max-w-[140px]">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="truncate">{user.firstName} {user.lastName}</span>
                          {user.roleKey === 'admin' && <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 py-0 shrink-0">Admin</Badge>}
                          {user.roleKey === 'csm' && <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0 shrink-0">CSM</Badge>}
                          {user.roleKey === 'executive' && <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] px-1.5 py-0 shrink-0">Exec</Badge>}
                          {user.roleKey === 'mega_admin' && <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] px-1.5 py-0 shrink-0">Dev</Badge>}
                        </div>
                      </TableCell>
                      {showEmailColumn && <TableCell className="px-2 py-2 text-muted-foreground max-w-[160px] truncate">{user.email}</TableCell>}
                      <TableCell className="px-2 py-2">
                        <Badge variant="outline" className="whitespace-nowrap text-[11px]">{user.tier}</Badge>
                      </TableCell>
                      <TableCell className="px-2 py-2">
                        {(() => {
                          const status = statusById.get(user.id) ?? getStatus(user);
                          return <Badge variant="secondary" className={cn("whitespace-nowrap text-[11px]", getStatusStyle(status))}>{status}</Badge>;
                        })()}
                      </TableCell>
                      <TableCell className="px-2 py-2">
                        {(() => {
                          const obs = getOnboardingStatus(user);
                          return <Badge variant="secondary" className={cn("whitespace-nowrap text-[11px]", getOnboardingStyle(obs))}>{obs}</Badge>;
                        })()}
                      </TableCell>
                      {showCsmColumn && <TableCell className="px-2 py-2" onClick={e => e.stopPropagation()}>
                        <Select
                          value={user.assignedCsmId || 'none'}
                          onValueChange={(val) => {
                            const newCsmId = val === 'none' ? null : val;
                            assignCSM.mutate(
                              { userId: user.id, csmId: newCsmId },
                              {
                                onSuccess: () => {
                                  sonnerToast.success('CSM assigned');
                                  // Fire-and-forget: send welcome DM for eligible tiers
                                  if (newCsmId) {
                                    supabase.functions.invoke('send-assignment-dm', {
                                      body: { user_id: user.id, csm_id: newCsmId },
                                    }).catch((err) => console.error('send-assignment-dm error:', err));
                                  }
                                },
                              }
                            );
                          }}
                        >
                          <SelectTrigger className="w-[120px] h-7 text-[11px]">
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {csmList.map(csm => (
                              <SelectItem key={csm.id} value={csm.id}>
                                {csm.firstName} {csm.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>}
                      <TableCell className="px-2 py-2 text-muted-foreground whitespace-nowrap">
                        {user.onboardingDate ? format(new Date(user.onboardingDate), 'MM/dd/yy') : '—'}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-muted-foreground whitespace-nowrap">
                        {user.offboardingDate ? format(new Date(user.offboardingDate), 'MM/dd/yy') : '—'}
                      </TableCell>
                      <TableCell className="px-2 py-2" onClick={e => e.stopPropagation()}>
                        <Select
                          value={user.guaranteeStatus || 'pending'}
                          onValueChange={async (val) => {
                            // Optimistic patch so the badge updates instantly
                            // instead of waiting on the invalidate/refetch round-trip.
                            const snapshots = queryClient.getQueriesData<any>({ queryKey: ['all-users-progress'] });
                            queryClient.setQueriesData<any>({ queryKey: ['all-users-progress'] }, (old) => {
                              if (!old || !Array.isArray(old.users)) return old;
                              return {
                                ...old,
                                users: old.users.map((u: any) =>
                                  u.id === user.id ? { ...u, guaranteeStatus: val } : u
                                ),
                              };
                            });
                            try {
                              const { error } = await supabase.from('user_profiles').update({ guarantee_status: val } as any).eq('id', user.id);
                              if (error) throw error;
                              sonnerToast.success('Guarantee status updated');
                              queryClient.invalidateQueries({ queryKey: ['user-details', user.id] });
                            } catch (err: any) {
                              // Roll back all patched pages on failure.
                              for (const [key, data] of snapshots) {
                                queryClient.setQueryData(key, data);
                              }
                              sonnerToast.error(err.message || 'Failed to update guarantee status');
                            }
                          }}
                        >
                          <SelectTrigger className="w-[110px] h-7 text-[11px] border-0 bg-transparent p-0 shadow-none focus:ring-0 group/guarantee">
                            <Badge variant="secondary" className={cn("whitespace-nowrap text-[11px] capitalize cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all", getGuaranteeStyle(user.guaranteeStatus || 'pending'))}>
                              {user.guaranteeStatus || 'pending'}
                              <Pencil className="h-2.5 w-2.5 ml-1 text-muted-foreground/0 group-hover/guarantee:text-muted-foreground/70 transition-colors" />
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="met">Met</SelectItem>
                            <SelectItem value="activated">Activated</SelectItem>
                            <SelectItem value="voided">Voided</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="px-2 py-2" onClick={e => e.stopPropagation()}>
                        {editingRevenueUserId === user.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground text-[11px]">$</span>
                            <Input
                              type="number"
                              className="h-7 w-20 text-[11px] px-1.5"
                              value={editingRevenueValue}
                              onChange={e => setEditingRevenueValue(e.target.value)}
                              onBlur={() => handleSaveRevenue(user.id, editingRevenueValue)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveRevenue(user.id, editingRevenueValue);
                                if (e.key === 'Escape') setEditingRevenueUserId(null);
                              }}
                              autoFocus
                              min="0"
                            />
                          </div>
                        ) : (
                          <button
                            className="text-[11px] whitespace-nowrap text-foreground flex items-center gap-1 cursor-pointer group/revenue"
                            onClick={() => {
                              setEditingRevenueUserId(user.id);
                              setEditingRevenueValue(user.revenue != null ? String(user.revenue) : '');
                            }}
                          >
                            {user.revenue != null ? formatCurrency(user.revenue) : '—'}
                            <Pencil className="h-2.5 w-2.5 text-muted-foreground/0 group-hover/revenue:text-muted-foreground/70 transition-colors" />
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="px-2 py-2">
                        <div className="flex items-center gap-1.5">
                          <Progress value={user.progressPercentage} className="h-1.5 w-14" />
                          <span className="font-medium whitespace-nowrap">{user.progressPercentage}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-2 text-muted-foreground whitespace-nowrap">
                        {user.lastSignInAt ? format(new Date(user.lastSignInAt), 'MM/dd/yy') : 'Never'}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-muted-foreground whitespace-nowrap">
                        {format(new Date(user.joinedDate), 'MM/dd/yy')}
                      </TableCell>
                    </TableRow>)}
              </TableBody>
            </Table>}
        </div>

        {/* Pagination Controls */}
        {!error && pagination.totalPages > 0 && <div className="items-center justify-between px-4 py-4 border-t flex flex-col gap-[15px]">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Showing {pagination.totalCount > 0 ? (currentPage - 1) * perPage + 1 : 0} - {Math.min(currentPage * perPage, pagination.totalCount)} of {pagination.totalCount} users</span>
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <Select value={perPage.toString()} onValueChange={(v) => { setPerPage(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[15, 25, 50, 100].map(size => (
                      <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-[5px]">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || isLoading}>
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden md:inline">Previous</span>
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({
              length: Math.min(5, pagination.totalPages)
            }, (_, i) => {
              // Show pages around current page
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" className="w-8 h-8 p-0" onClick={() => setCurrentPage(pageNum)} disabled={isLoading}>
                      {pageNum}
                    </Button>;
            })}
              </div>

              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))} disabled={currentPage === pagination.totalPages || isLoading}>
                <span className="hidden md:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>}
      </CardContent>

      {/* Bulk Invite Dialog */}
      <BulkInviteDialog open={bulkInviteOpen} onOpenChange={setBulkInviteOpen} onComplete={() => refetch()} isCSM={isCSM} />
    </Card>;
};