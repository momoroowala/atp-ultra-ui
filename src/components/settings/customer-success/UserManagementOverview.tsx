import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Search, RefreshCw, Download, Mail, UserPlus, Loader2, Shield, AlertTriangle, Users, ArrowUpDown, ArrowUp, ArrowDown, Check, ChevronDown, ChevronLeft, ChevronRight, X, Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BulkInviteDialog } from "../BulkInviteDialog";
import { UserActionsMenu } from "./UserActionsMenu";
import { format } from "date-fns";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { toast as sonnerToast } from "sonner";
import { formatCurrency } from "@/utils/currency";
import { supabase } from "@/integrations/supabase/client";
import { useUserManagement } from "@/hooks/useUserManagement";

interface UserManagementOverviewProps {
  onViewDetails: (userId: string) => void;
}
export const UserManagementOverview = ({
  onViewDetails
}: UserManagementOverviewProps) => {
  const {
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
  } = useUserManagement();

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
          <CardTitle>User Management</CardTitle>
          <div className="flex flex-col md:flex-row gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => setBulkInviteOpen(true)}>
              <Users className="h-4 w-4 mr-2" />
              Bulk Invite
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!sortedAndFilteredUsers.length}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        <CardDescription>
          Invite new users or manage existing accounts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invite/Create User Tabs */}
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
                    {tiers.map(tier => <SelectItem key={tier.id} value={tier.id}>
                        {tier.display_name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {!isCSM && (
                <div className="space-y-2">
                  <Label htmlFor="inviteRole">User Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.filter(role => role.is_active).map(role => <SelectItem key={role.id} value={role.id}>
                            {role.display_name}
                          </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" disabled={inviteLoading} className="w-full">
                {inviteLoading ? <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Invitation...
                  </> : <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invitation
                  </>}
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiers.map(tier => <SelectItem key={tier.id} value={tier.id}>
                        {tier.display_name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {!isCSM && (
                <div className="space-y-2">
                  <Label htmlFor="createRole">User Role</Label>
                  <Select value={createRole} onValueChange={setCreateRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.filter(role => role.is_active).map(role => <SelectItem key={role.id} value={role.id}>
                            {role.display_name}
                          </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" disabled={createLoading} className="w-full">
                {createLoading ? <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </> : <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create User
                  </>}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
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
                        {(isAdmin || isCSM || isExecutive) && <UserActionsMenu userId={user.id} userEmail={user.email} currentRoleId={user.roleId || ''} currentTierId={user.tierId || ''} isActive={user.isActive ?? true} onEditUser={() => onViewDetails(user.id)} onActionComplete={async () => {
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
                          const status = getStatus(user);
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
                            assignCSM.mutate(
                              { userId: user.id, csmId: val === 'none' ? null : val },
                              { onSuccess: () => sonnerToast.success('CSM assigned') }
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
                            try {
                              const { error } = await supabase.from('user_profiles').update({ guarantee_status: val } as any).eq('id', user.id);
                              if (error) throw error;
                              sonnerToast.success('Guarantee status updated');
                              queryClient.invalidateQueries({ queryKey: ['all-users-progress'] });
                              queryClient.invalidateQueries({ queryKey: ['user-details', user.id] });
                            } catch (err: any) {
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
