import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { validatePassword } from '@/utils/passwordValidation';


const CreateNewPassword = () => {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      console.log('CreateNewPassword: Checking authentication');
      console.log('Full URL:', window.location.href);

      // STEP 1: Check for existing session first (token already consumed)
      const { data: { session } } = await supabase.auth.getSession();

      // If session exists, allow password creation
      if (session) {
        console.log('Session found, allowing password creation');
        setHasToken(true);
        return;
      }

      // STEP 2: Otherwise, check URL for tokens (legacy flow)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);

      const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
      const type = hashParams.get('type') || queryParams.get('type');
      const error = hashParams.get('error') || queryParams.get('error');

      console.log('Parsed parameters:', {
        hasAccessToken: !!accessToken,
        type,
        error,
        hasSession: false
      });

      if (error) {
        console.error('Error in URL:', error);
        toast.error("Authentication Error: " + (error || "The link is invalid or has expired."));

        setTimeout(() => {
          navigate('/auth');
        }, 3000);
        return;
      }

      // Accept invite/signup/recovery tokens
      if (accessToken && (type === 'invite' || type === 'signup' || type === 'recovery')) {
        console.log('Valid token found, allowing password creation');
        setHasToken(true);
      } else {
        console.error('No valid token found and no session');
        toast.error("Invalid or expired link: Please request a new invitation or check your email for the latest link.");

        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validatePassword(password);
    if (!validation.meetsMinimum) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords don't match. Please make sure both passwords are the same.");
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting to set password for user');
      
      // Verify we have a valid session before attempting password update
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('Current session state:', {
        hasSession: !!session,
        userId: session?.user?.id,
        sessionError: sessionError?.message
      });
      
      if (!session) {
        console.error('No active session found');
        throw new Error('Your session has expired. Please request a new invitation link.');
      }
      
      // Update the password using the current session
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      console.log('Password update result:', {
        success: !error,
        error: error?.message,
        data: data ? 'User data present' : 'No data'
      });

      if (error) {
        console.error('Password update error:', error);
        throw error;
      }

      console.log('Password updated successfully');
      
      toast.success("Password created successfully! Redirecting to home...");

      // Wait a moment for the toast to show
      setTimeout(() => {
        navigate('/home');
      }, 1500);
    } catch (error: any) {
      console.error('Failed to create password:', error);
      toast.error("Failed to create password: " + (error.message || "An unexpected error occurred. Please try again."));
      
      // If session is missing, redirect to get a new link
      if (error.message?.toLowerCase().includes('session') || 
          error.message?.toLowerCase().includes('expired')) {
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!hasToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-blue-400/5 flex items-center justify-center p-4 blueprint-grid">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome to Elite E-Commerce</h1>
          <p className="text-muted-foreground">Create a secure password for your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Your Password</CardTitle>
            <CardDescription>
              Choose a strong password to secure your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Enter your password"
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
                <PasswordStrengthIndicator password={password} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Confirm your password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Password & Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateNewPassword;
