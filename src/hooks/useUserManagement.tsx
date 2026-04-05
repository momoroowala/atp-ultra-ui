import { useState, useMemo, useEffect, useCallback } from "react";
import { useAllUsersProgress, type UserProgress } from "@/hooks/useAllUsersProgress";
import { useTiers } from "@/hooks/useTiers";
import { useRoles } from "@/hooks/useRoles";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useQueryClient } from "@tanstack/react-query";
import { useCSMList, useAssignCSM } from "@/hooks/useCSMStudents";
import { toast } from "sonner";
import { toast as sonnerToast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays } from "date-fns";
import { formatCurrency } from "@/utils/currency";

export function useUserManagement() {
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
      setCurrentPage(1);
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
    csmFilter: csmFilterValue === 'all' ? null : csmFilterValue,
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
      toast.error("Error: Please select a tier");
      return;
    }
    try {
      const userIds = Array.from(selectedUsers);
      for (const userId of userIds) {
        await supabase.from('user_profiles').update({
          tier_id: bulkActionTier
        }).eq('id', userId);
      }
      toast.success(`Updated tier for ${userIds.length} user(s)`);
      setSelectedUsers(new Set());
      setBulkActionTier("");
      refetch();
    } catch (error) {
      toast.error("Error: Failed to update tiers");
    }
  };

  const handleApplyBulkChangeRole = async () => {
    if (!bulkActionRole) {
      toast.error("Error: Please select a role");
      return;
    }
    try {
      const userIds = Array.from(selectedUsers);
      const {
        data,
        error
      } = await supabase.from('user_profiles').update({
        role_id: bulkActionRole
      }).in('id', userIds).select('id, role_id');
      if (error) throw error;
      const updatedCount = data?.filter(r => r.role_id === bulkActionRole).length || 0;
      const notUpdated = userIds.length - updatedCount;
      toast.success(`Updated role for ${updatedCount} user(s)${notUpdated > 0 ? `, ${notUpdated} skipped` : ''}`);
      setSelectedUsers(new Set());
      setBulkActionRole("");
      await queryClient.invalidateQueries({
        queryKey: ['all-users-progress']
      });
      refetch();
    } catch (error) {
      console.error('Error updating roles:', error);
      toast.error("Error: Failed to update roles");
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteFirstName.trim() || !inviteLastName.trim()) {
      toast.error("Name required: Please enter both first and last name.");
      return;
    }
    if (!inviteEmail) {
      toast.error("Email required: Please enter a valid email address.");
      return;
    }
    if (!inviteTier) {
      toast.error("Tier required: Please select a tier for the user.");
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
      toast.success(`An invitation email has been sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteFirstName('');
      setInviteLastName('');
      refetch();
    } catch (error: any) {
      console.error('Invite user error:', error);
      toast.error(error.message || "An unexpected error occurred.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFirstName.trim() || !createLastName.trim()) {
      toast.error("Name required: Please enter both first and last name.");
      return;
    }
    if (!createEmail) {
      toast.error("Email required: Please enter a valid email address.");
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
          toast.error("Warning: User created but profile update failed. Please update manually.");
        }
      }
      if (data?.magicLink) {
        try {
          await navigator.clipboard.writeText(data.magicLink);
          toast.success("User created successfully!: Password setup link copied to clipboard. Share it with the user so they can set their password.");
        } catch {
          toast.success("User created successfully!: Copy this password setup link and share it with the user:");
          prompt("Password setup link (copy this):", data.magicLink);
        }
      } else {
        toast.success("User created successfully!: User account created but no setup link was generated. Use 'Reset Password' to send them a link.");
      }
      setCreateEmail('');
      setCreateFirstName('');
      setCreateLastName('');
      refetch();
    } catch (error: any) {
      console.error('Create user error:', error);
      toast.error(error.message || "An unexpected error occurred.");
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
        getStatus(user),
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

  return {
    // Role checks
    isAdmin, isCSM, isExecutive, isMegaAdmin,

    // Data
    tiers, tiersLoading, roles, csmList, assignCSM,
    users, pagination, isLoading, error, refetch,
    sortedAndFilteredUsers,

    // Pagination
    currentPage, setCurrentPage, perPage, setPerPage,

    // Search
    searchQuery, setSearchQuery, debouncedSearch,

    // Filters
    levelFilter, setLevelFilter,
    statusFilter, setStatusFilter,
    tierFilter, setTierFilter,
    onboardingFilter, setOnboardingFilter,
    guaranteeFilter, setGuaranteeFilter,
    csmFilterValue, setCsmFilterValue,
    invitationFilter, setInvitationFilter,

    // Selection
    selectedUsers, setSelectedUsers,
    bulkInviteOpen, setBulkInviteOpen,

    // Sort
    sortColumn, sortDirection, handleSort,

    // Inline editing
    editingRevenueUserId, setEditingRevenueUserId,
    editingRevenueValue, setEditingRevenueValue,

    // Bulk actions
    bulkActionTier, setBulkActionTier,
    bulkActionRole, setBulkActionRole,
    handleApplyBulkChangeTier, handleApplyBulkChangeRole,

    // Invite form
    inviteLoading, inviteEmail, setInviteEmail,
    inviteFirstName, setInviteFirstName,
    inviteLastName, setInviteLastName,
    inviteTier, setInviteTier,
    inviteRole, setInviteRole,
    handleInviteUser,

    // Create form
    createLoading, createEmail, setCreateEmail,
    createFirstName, setCreateFirstName,
    createLastName, setCreateLastName,
    createTier, setCreateTier,
    createRole, setCreateRole,
    handleCreateUser,

    // Other handlers
    handleExport, handleSaveRevenue,
    handleSelectAll, handleSelectUser,

    // Status helpers
    getStatus, getStatusStyle,
    getOnboardingStatus, getOnboardingStyle,
    getGuaranteeStyle,

    // Column visibility
    showEmailColumn, showCsmColumn,

    // Query client for inline operations
    queryClient,
  };
}
