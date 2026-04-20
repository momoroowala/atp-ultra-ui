import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import logoIcon from "@/assets/eec-logo.png";
import AuthHeroSection from "@/components/auth/AuthHeroSection";

type AuthMode = "magic-link" | "password";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>("magic-link");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        navigate("/home");
      }
    };
    checkUser();
  }, [navigate]);

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: exists } = await supabase.rpc('check_email_exists' as any, {
      lookup_email: email
    });

    if (!exists) {
      toast({
        title: "Account not found",
        description: "No account found with this email. Please contact your administrator.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast({
        title: "Failed to send magic link",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Magic link sent!",
        description: "Check your email for the login link.",
      });
    }
    setLoading(false);
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      navigate("/home");
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
    if (error) {
      toast({
        title: "Google sign in failed",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row relative">
      {/* Form Section - Left on desktop, top on mobile */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-16">
        <div className="w-full max-w-md">
          {/* Header with logo */}
          <div className="flex items-center gap-3 mb-8">
            <img src={logoIcon} alt="EEC" className="h-12 w-12" />
            <h1 className="text-xl font-semibold text-foreground">
              Log In To Your EEC Account
            </h1>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>

          {authMode === "magic-link" ? (
            /* Magic Link Form */
            <form onSubmit={handleMagicLinkSignIn} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-semibold">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 bg-background border-border focus:border-primary focus:ring-primary rounded-lg"
                  placeholder="Enter your email"
                />
              </div>

              <p className="text-sm text-muted-foreground">
                You'll Receive A Secure Link By Email—Click It To Log In Instantly.
              </p>

              <Button
                type="submit"
                className="w-full h-12 font-semibold rounded-lg"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {loading ? "Sending..." : "Send Magic Link To Email"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 font-medium rounded-lg"
                onClick={() => setAuthMode("password")}
                disabled={loading}
              >
                Login With Password Instead
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          ) : (
            /* Password Form */
            <form onSubmit={handlePasswordSignIn} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-semibold">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 bg-background border-border focus:border-primary focus:ring-primary rounded-lg"
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-semibold">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="h-12 bg-background border-border focus:border-primary focus:ring-primary rounded-lg"
                  placeholder="Enter your password"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 font-semibold rounded-lg"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {loading ? "Logging In..." : "Log In"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 font-medium rounded-lg text-sm"
                  onClick={() => setAuthMode("magic-link")}
                  disabled={loading}
                >
                  Login With Magic Link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 font-medium rounded-lg text-sm"
                  onClick={() => navigate("/reset-password")}
                  disabled={loading}
                >
                  Forgot Password?
                </Button>
              </div>
            </form>
          )}

          {/* Google Sign-In Section */}
          <div className="mt-6">
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-border" />
              <span className="mx-4 flex-shrink text-sm text-muted-foreground">Or continue with</span>
              <div className="flex-grow border-t border-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 font-medium rounded-lg bg-background"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section - Right on desktop, bottom on mobile */}
      <div className="w-full md:w-1/2 md:min-h-screen p-4 md:p-0">
        <AuthHeroSection />
      </div>
    </div>
  );
};

export default Auth;
