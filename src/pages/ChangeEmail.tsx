import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ArrowLeft, Eye, EyeOff, Mail } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');

const ChangeEmail = () => {
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate new email format
    const emailValidation = emailSchema.safeParse(newEmail);
    if (!emailValidation.success) {
      toast.error("Please enter a valid email address.");
      return;
    }

    // Check emails match
    if (newEmail !== confirmEmail) {
      toast.error("Emails don't match. Please make sure both email addresses are the same.");
      return;
    }

    // Check if same as current
    if (newEmail === user?.email) {
      toast.error("New email must be different from your current email.");
      return;
    }

    setLoading(true);

    try {
      // First verify current password
      if (!user?.email) throw new Error('No user session found');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update email - Supabase will send confirmation to both old and new email
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      }, {
        emailRedirectTo: redirectUrl,
      });

      if (error) throw error;

      toast.success(`Confirmation email sent! Please check ${newEmail} and click the confirmation link.`);

      // Clear form
      setCurrentPassword('');
      setNewEmail('');
      setConfirmEmail('');

      // Navigate back after short delay
      setTimeout(() => navigate('/settings'), 2000);
    } catch (error: any) {
      toast.error("Failed to update email: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-blue-400/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Change Email</h1>
          <p className="text-muted-foreground">
            Update your login email address
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Email Update</CardTitle>
            <CardDescription>
              Current email: <span className="font-medium text-foreground">{user?.email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangeEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/reset-password")}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newEmail">New Email Address</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Enter new email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmEmail">Confirm New Email</Label>
                <Input
                  id="confirmEmail"
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Confirm new email address"
                />
              </div>

              <div className="space-y-2 pt-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Email Address
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          A confirmation email will be sent to your new email address. 
          You must click the link in that email to complete the change.
        </p>
      </div>
    </div>
  );
};

export default ChangeEmail;