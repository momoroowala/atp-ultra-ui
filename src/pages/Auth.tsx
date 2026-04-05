import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
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
      toast.error("Account not found. Please contact your administrator.");
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
      toast.error("Failed to send magic link: " + error.message);
    } else {
      toast.success("Magic link sent! Check your email for the login link.");
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
      toast.error("Sign in failed: " + error.message);
    } else {
      toast.success("Welcome back!");
      navigate("/home");
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
