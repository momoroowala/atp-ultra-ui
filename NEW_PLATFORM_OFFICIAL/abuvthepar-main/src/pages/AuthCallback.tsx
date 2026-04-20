import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      console.log("AuthCallback: Processing authentication callback");
      console.log("Full URL:", window.location.href);

      // STEP 1: Parse URL parameters first
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);

      const accessToken = hashParams.get("access_token") || queryParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token") || queryParams.get("refresh_token");
      const type = hashParams.get("type") || queryParams.get("type");
      const error = hashParams.get("error") || queryParams.get("error");
      const errorDescription = hashParams.get("error_description") || queryParams.get("error_description");

      console.log("Parsed tokens:", {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        type,
        error,
        errorDescription,
      });

      // STEP 2: Handle errors first
      if (error) {
        console.error("Auth callback error:", error, errorDescription);
        toast({
          title: "Authentication Error",
          description: errorDescription || error || "An error occurred during authentication",
          variant: "destructive",
        });

        setTimeout(() => {
          navigate("/auth?error=" + encodeURIComponent(errorDescription || error));
        }, 2000);
        return;
      }

      // STEP 3: Prioritize type parameter - if type=invite, always redirect to password creation
      if (type === "invite" || type === "signup") {
        console.log(`${type} flow detected, setting session and redirecting to create password`);

        // NEW: Establish session with the tokens first
        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error("Failed to set session:", sessionError);
            toast({
              title: "Session Error",
              description: "Failed to establish session. Please try again.",
              variant: "destructive",
            });
            navigate("/auth");
            return;
          }

          console.log("Session established successfully");
        }

        // Now redirect - no need to pass tokens since session is established
        navigate("/create-new-password", { replace: true });
        return;
      }

      // STEP 4: Handle recovery type
      if (type === "recovery") {
        console.log("Recovery flow detected, setting session and redirecting to create new password");

        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error("Failed to set session:", sessionError);
            toast({
              title: "Session Error",
              description: "Failed to establish session. Please try again.",
              variant: "destructive",
            });
            navigate("/auth");
            return;
          }
        }

        navigate("/create-new-password", { replace: true });
        return;
      }

      // STEP 4.5: Handle email_change type
      if (type === "email_change") {
        console.log("Email change flow detected, setting session and syncing profile");

        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error("Failed to set session:", sessionError);
            toast({
              title: "Session Error",
              description: "Failed to establish session. Please try again.",
              variant: "destructive",
            });
            navigate("/auth");
            return;
          }

          // Sync the new email to user_profiles
          if (data?.user?.email && data?.user?.id) {
            const { error: updateError } = await supabase
              .from('user_profiles')
              .update({ user_email: data.user.email })
              .eq('id', data.user.id);

            if (updateError) {
              console.error("Failed to sync email to profile:", updateError);
            }
          }
        }

        toast({
          title: "Email updated successfully!",
          description: "Your login email has been changed.",
        });

        navigate("/home", { replace: true });
        return;
      }

      // STEP 4.9: If we have tokens but no recognized type, establish session explicitly
      // This handles OAuth flows (e.g. Google) where tokens are in the hash but type is absent
      if (accessToken && refreshToken && !type) {
        console.log("OAuth flow detected (tokens present, no type). Setting session explicitly.");
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          console.error("Failed to set OAuth session:", sessionError);
          toast({
            title: "Authentication Error",
            description: "Failed to establish session. Please try again.",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        // Session established — fall through to STEP 5
      }

      // STEP 5: Check for existing session (user already authenticated)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const user = session.user;
        const provider = user.app_metadata?.provider;

        // Check if this is a brand-new Google sign-up (not a returning user)
        if (provider === 'google') {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

          if (!profile) {
            console.log("Google user has no profile — rejecting unregistered user");

            await supabase.auth.signOut();

            toast({
              title: "Access Denied",
              description: "This email is not registered. Please contact your administrator for access.",
              variant: "destructive",
            });

            setTimeout(() => navigate("/auth"), 2000);
            return;
          }
        }

        console.log("User has valid session, redirecting to home");
        navigate("/home", { replace: true });
        return;
      }

      // STEP 6: No valid authentication found
      console.error("No valid authentication found in callback");
      toast({
        title: "Invalid Link",
        description: "The authentication link is invalid or expired. Please request a new one.",
        variant: "destructive",
      });

      setTimeout(() => {
        navigate("/auth");
      }, 2000);
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-blue-400/5 flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <h2 className="text-xl font-semibold">Processing your invitation...</h2>
        <p className="text-muted-foreground">Please wait while we verify your link.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
