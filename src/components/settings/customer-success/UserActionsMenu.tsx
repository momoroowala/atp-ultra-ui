import { useState } from "react";
import { MoreVertical, Shield, Award, Mail, Key, Link2, UserX, Trash2, RotateCw, Phone, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRoles } from "@/hooks/useRoles";
import { useTiers } from "@/hooks/useTiers";

interface UserActionsMenuProps {
  userId: string;
  userEmail: string;
  currentRoleId: string;
  currentTierId: string;
  isActive: boolean;
  onActionComplete: () => void;
  onEditUser?: () => void;
}

export const UserActionsMenu = ({
  userId,
  userEmail,
  currentRoleId,
  currentTierId,
  isActive,
  onActionComplete,
  onEditUser,
}: UserActionsMenuProps) => {
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [changeTierOpen, setChangeTierOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [onboardingStatusOpen, setOnboardingStatusOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [selectedRoleId, setSelectedRoleId] = useState(currentRoleId);
  const [selectedTierId, setSelectedTierId] = useState(currentTierId);
  const [newPassword, setNewPassword] = useState("");
  const [selectedOnboardingStatus, setSelectedOnboardingStatus] = useState("completed");
  const [rescheduledDate, setRescheduledDate] = useState("");

  const { data: roles } = useRoles();
  const { data: tiers } = useTiers();

  const handleChangeRole = async () => {
    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ role_id: selectedRoleId })
        .eq('id', userId);

      if (updateError) throw updateError;

      const { data: verify, error: verifyError } = await supabase
        .from('user_profiles')
        .select('role_id')
        .eq('id', userId)
        .single();

      if (verifyError) console.warn('Role verify error:', verifyError);

      if (verify?.role_id !== selectedRoleId) {
        toast.error('Role update did not persist. Please try again.');
        return;
      }
      
      toast.success('Role updated successfully');
      setChangeRoleOpen(false);
      onActionComplete();
    } catch (error: any) {
      console.error('Error changing role:', error);
      toast.error(error?.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeTier = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ tier_id: selectedTierId })
        .eq('id', userId);

      if (error) throw error;
      toast.success('Tier updated successfully');
      setChangeTierOpen(false);
      onActionComplete();
    } catch (error) {
      console.error('Error changing tier:', error);
      toast.error('Failed to update tier');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPasswordReset = async () => {
    setLoading(true);
    try {
      const baseUrl = window.location.origin || 'https://app.abuvthepar.com';
      const { error } = await supabase.auth.resetPasswordForEmail(
        userEmail,
        { redirectTo: `${baseUrl}/create-new-password` }
      );
      if (error) throw error;
      toast.success('Password reset email sent via Supabase SMTP');
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error('Failed to send password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMagicLink = async () => {
    setLoading(true);
    try {
      const baseUrl = window.location.origin || 'https://app.abuvthepar.com';
      const { error } = await supabase.auth.signInWithOtp({
        email: userEmail,
        options: { emailRedirectTo: `${baseUrl}/auth/callback` },
      });
      if (error) throw error;
      toast.success('Magic link sent via Supabase SMTP');
    } catch (error) {
      console.error('Error sending magic link:', error);
      toast.error('Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMagicLink = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'generate-impersonation-link',
        { body: { targetUserId: userId, appOrigin: window.location.origin } }
      );
      if (error) throw error;
      if (!data?.link) throw new Error('No link returned from server');
      await navigator.clipboard.writeText(data.link);
      toast.success('Impersonation link copied! Link expires in 1 hour.');
    } catch (error: any) {
      console.error('Error generating impersonation link:', error);
      toast.error(error?.message || 'Failed to generate impersonation link');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-user-password', {
        body: { userId, newPassword }
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to update password');
      toast.success('Password updated successfully');
      setChangePasswordOpen(false);
      setNewPassword("");
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOnboarding = async () => {
    setLoading(true);
    try {
      const updateData: Record<string, any> = {
        onboarding_booking_status: selectedOnboardingStatus,
      };
      if (selectedOnboardingStatus === 'rescheduled' && rescheduledDate) {
        updateData.onboarding_date = rescheduledDate;
      }
      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId);
      if (error) throw error;

      if (selectedOnboardingStatus === 'rescheduled' && !rescheduledDate) {
        toast.warning('Onboarding set to rescheduled. Remember to get the rescheduled date and time from the client.');
      } else {
        toast.success(`Onboarding status set to "${selectedOnboardingStatus}"`);
      }
      setOnboardingStatusOpen(false);
      setSelectedOnboardingStatus("completed");
      setRescheduledDate("");
      onActionComplete();
    } catch (error: any) {
      console.error('Error updating onboarding status:', error);
      toast.error(error?.message || 'Failed to update onboarding status');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActiveStatus = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: !isActive })
        .eq('id', userId);
      if (error) throw error;
      toast.success(isActive ? 'User deactivated' : 'User activated');
      onActionComplete();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to delete user');
      toast.success('User and all associated data deleted successfully');
      setDeleteUserOpen(false);
      onActionComplete();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {onEditUser && (
            <DropdownMenuItem onClick={onEditUser}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit User
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setChangeRoleOpen(true)}>
            <Shield className="mr-2 h-4 w-4" />
            Change Role
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setChangeTierOpen(true)}>
            <Award className="mr-2 h-4 w-4" />
            Change Tier
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOnboardingStatusOpen(true)}>
            <Phone className="mr-2 h-4 w-4" />
            Confirm Onboarding
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSendPasswordReset} disabled={loading}>
            <Mail className="mr-2 h-4 w-4" />
            Send Password Reset
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSendMagicLink} disabled={loading}>
            <Link2 className="mr-2 h-4 w-4" />
            Send Magic Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyMagicLink} disabled={loading}>
            <Link2 className="mr-2 h-4 w-4" />
            Copy Magic Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setChangePasswordOpen(true)}>
            <Key className="mr-2 h-4 w-4" />
            Change Password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleToggleActiveStatus} disabled={loading}>
            {isActive ? (
              <>
                <UserX className="mr-2 h-4 w-4" />
                Deactivate User
              </>
            ) : (
              <>
                <RotateCw className="mr-2 h-4 w-4" />
                Activate User
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setDeleteUserOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Change Role Dialog */}
      <Dialog open={changeRoleOpen} onOpenChange={setChangeRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>Select a new role for this user.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Role</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role.id} value={role.id}>{role.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeRoleOpen(false)}>Cancel</Button>
            <Button onClick={handleChangeRole} disabled={loading}>Update Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Tier Dialog */}
      <Dialog open={changeTierOpen} onOpenChange={setChangeTierOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Tier</DialogTitle>
            <DialogDescription>Select a new tier for this user.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tier</Label>
              <Select value={selectedTierId} onValueChange={setSelectedTierId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tiers?.map((tier) => (
                    <SelectItem key={tier.id} value={tier.id}>{tier.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeTierOpen(false)}>Cancel</Button>
            <Button onClick={handleChangeTier} disabled={loading}>Update Tier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Password</DialogTitle>
            <DialogDescription>Set a new password for this user.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePasswordOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} disabled={loading}>Update Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteUserOpen} onOpenChange={setDeleteUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={loading}>Delete User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Onboarding Dialog */}
      <Dialog open={onboardingStatusOpen} onOpenChange={setOnboardingStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Onboarding Status</DialogTitle>
            <DialogDescription>Set the onboarding call status for this user.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select value={selectedOnboardingStatus} onValueChange={setSelectedOnboardingStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedOnboardingStatus === 'rescheduled' && (
              <div>
                <Label>Rescheduled Date & Time (optional)</Label>
                <Input
                  type="datetime-local"
                  value={rescheduledDate}
                  onChange={(e) => setRescheduledDate(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOnboardingStatusOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmOnboarding} disabled={loading}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
