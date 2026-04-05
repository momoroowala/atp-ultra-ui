import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();
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
        toast.error("Authentication Error: " + (errorDescription || error || "An error occurred during authentication"));

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
            toast.error("Session Error: Failed to establish session. Please try again.");
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
            toast.error("Session Error: Failed to establish session. Please try again.");
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
            toast.error("Session Error: Failed to establish session. Please try again.");
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

        toast.success("Email updated successfully!");

        navigate("/home", { replace: true });
        return;
      }

      // STEP 5: Check for existing session (user already authenticated)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        console.log("User has valid session, redirecting to home");
        navigate("/home", { replace: true });
        return;
      }

      // STEP 6: No valid authentication found
      console.error("No valid authentication found in callback");
      toast.error("Invalid Link: The authentication link is invalid or expired. Please request a new one.");

      setTimeout(() => {
        navigate("/auth");
      }, 2000);
    };

    handleCallback();
  }, [navigate]);

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
