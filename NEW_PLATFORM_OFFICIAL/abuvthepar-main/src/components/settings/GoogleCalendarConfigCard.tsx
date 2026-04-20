import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, RefreshCw, Unlink, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const GoogleCalendarConfigCard = () => {
  const [status, setStatus] = useState<{ connected: boolean; email: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-google-calendar', {
        body: { action: 'get-status' },
      });
      if (error) throw error;
      setStatus({ connected: data.connected, email: data.email });
    } catch (err) {
      console.error('Failed to fetch Google Calendar status:', err);
      setStatus({ connected: false, email: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Listen for messages from the OAuth popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'google-calendar-connected') {
        setStatus({ connected: true, email: event.data.email });
        toast.success(`Connected to ${event.data.email}`);
        setConnecting(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/auth/google-calendar/callback`;
      const { data, error } = await supabase.functions.invoke('manage-google-calendar', {
        body: { action: 'get-auth-url', redirect_uri: redirectUri },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('No auth URL returned');

      const popup = window.open(data.url, 'google-calendar-auth', 'width=500,height=700,left=200,top=100');

      // Poll for popup close (fallback if postMessage doesn't fire)
      const interval = setInterval(() => {
        if (popup?.closed) {
          clearInterval(interval);
          // Re-fetch status after popup closes
          setTimeout(() => {
            fetchStatus();
            setConnecting(false);
          }, 1000);
        }
      }, 500);
    } catch (err: any) {
      toast.error(`Failed to start OAuth: ${err.message}`);
      setConnecting(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-google-calendar', {
        body: { action: 'test-connection' },
      });
      if (error) throw error;
      if (data.success && data.connected) {
        setStatus({ connected: true, email: data.email });
        toast.success(`Connected to ${data.email}`);
      } else {
        toast.error(data.error || 'Connection test failed');
        setStatus({ connected: false, email: null });
      }
    } catch (err: any) {
      toast.error(`Test failed: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-google-calendar', {
        body: { action: 'disconnect' },
      });
      if (error) throw error;
      setStatus({ connected: false, email: null });
      toast.success('Google Calendar disconnected');
    } catch (err: any) {
      toast.error(`Disconnect failed: ${err.message}`);
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Google Calendar Sync</CardTitle>
            <CardDescription>
              Automatically sync calendar calls to a Gmail account's Google Calendar
            </CardDescription>
          </div>
          {!loading && (
            <Badge variant={status?.connected ? 'default' : 'secondary'} className="gap-1.5">
              {status?.connected ? (
                <><CheckCircle2 className="h-3 w-3" /> Connected</>
              ) : (
                <><XCircle className="h-3 w-3" /> Not Connected</>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking connection status...
          </div>
        ) : (
          <>
            {status?.connected && status.email && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm font-medium">Connected Account</p>
                <p className="text-sm text-muted-foreground">{status.email}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {!status?.connected && (
                <Button
                  size="sm"
                  onClick={handleConnect}
                  disabled={connecting}
                >
                  {connecting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Connect Gmail Account
                </Button>
              )}

              {status?.connected && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnect}
                    disabled={connecting}
                  >
                    {connecting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    Switch Account
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestConnection}
                    disabled={testing}
                  >
                    {testing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Test Connection
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                  >
                    {disconnecting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Unlink className="h-4 w-4 mr-2" />
                    )}
                    Disconnect
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
