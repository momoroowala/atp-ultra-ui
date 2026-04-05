import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, RefreshCw, Unlink, Brain, Search, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const FathomConfigCard = () => {
  const [status, setStatus] = useState<{
    connected: boolean;
    webhook_active: boolean;
    has_webhook_secret: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [recreating, setRecreating] = useState(false);
  const [webhookDiag, setWebhookDiag] = useState<any[] | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-fathom', {
        body: { action: 'get-status' },
      });
      if (error) throw error;
      setStatus({
        connected: data.connected,
        webhook_active: data.webhook_active,
        has_webhook_secret: data.has_webhook_secret,
      });
    } catch (err) {
      console.error('Failed to fetch Fathom status:', err);
      setStatus({ connected: false, webhook_active: false, has_webhook_secret: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-fathom', {
        body: { action: 'test-connection' },
      });
      if (error) throw error;
      if (data.success) {
        toast.success('Fathom API connection verified!');
        fetchStatus();
      } else {
        toast.error(data.error || 'Connection test failed');
      }
    } catch (err: any) {
      toast.error(`Test failed: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'ygopchrmoshctzhzvzte';
      const webhookUrl = `https://${projectId}.supabase.co/functions/v1/fathom-webhook`;

      const { data, error } = await supabase.functions.invoke('manage-fathom', {
        body: { action: 'create-webhook', webhook_url: webhookUrl },
      });
      if (error) throw error;

      if (data.secret) {
        toast.success('Webhook created! Save this secret as FATHOM_WEBHOOK_SECRET: ' + data.secret, {
          duration: 15000,
        });
      } else {
        toast.success('Fathom webhook connected!');
      }
      fetchStatus();
    } catch (err: any) {
      toast.error(`Failed to create webhook: ${err.message}`);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const { error } = await supabase.functions.invoke('manage-fathom', {
        body: { action: 'delete-webhook' },
      });
      if (error) throw error;
      toast.success('Fathom webhook disconnected');
      setWebhookDiag(null);
      fetchStatus();
    } catch (err: any) {
      toast.error(`Disconnect failed: ${err.message}`);
    } finally {
      setDisconnecting(false);
    }
  };

  const handleVerifyWebhooks = async () => {
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-fathom', {
        body: { action: 'list-webhooks' },
      });
      if (error) throw error;
      const webhooks = data.webhooks || [];
      setWebhookDiag(webhooks);
      if (webhooks.length === 0) {
        toast.warning('No webhooks registered in Fathom. The webhook may have been deleted.');
      } else {
        toast.success(`Found ${webhooks.length} webhook(s) in Fathom`);
      }
    } catch (err: any) {
      toast.error(`Verify failed: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const handleRecreateWebhook = async () => {
    setRecreating(true);
    try {
      // Delete existing
      await supabase.functions.invoke('manage-fathom', {
        body: { action: 'delete-webhook' },
      });
      // Create new
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'ygopchrmoshctzhzvzte';
      const webhookUrl = `https://${projectId}.supabase.co/functions/v1/fathom-webhook`;
      const { data, error } = await supabase.functions.invoke('manage-fathom', {
        body: { action: 'create-webhook', webhook_url: webhookUrl },
      });
      if (error) throw error;

      if (data.secret) {
        toast.success('Webhook recreated! Update FATHOM_WEBHOOK_SECRET: ' + data.secret, {
          duration: 15000,
        });
      } else {
        toast.success('Fathom webhook recreated successfully!');
      }
      setWebhookDiag(null);
      fetchStatus();
    } catch (err: any) {
      toast.error(`Recreate failed: ${err.message}`);
    } finally {
      setRecreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Fathom AI Meeting Notes</CardTitle>
            <CardDescription>
              Automatically capture meeting summaries, transcripts, and action items
            </CardDescription>
          </div>
          {!loading && (
            <Badge variant={status?.connected && status?.webhook_active ? 'default' : 'secondary'} className="gap-1.5">
              {status?.connected && status?.webhook_active ? (
                <><CheckCircle2 className="h-3 w-3" /> Active</>
              ) : status?.connected ? (
                <><Brain className="h-3 w-3" /> API Key Set</>
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
            Checking Fathom connection...
          </div>
        ) : (
          <>
            {status?.connected && (
              <div className="rounded-md bg-muted p-3 space-y-1">
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm text-muted-foreground">
                  API Key: ✅ Configured
                </p>
                <p className="text-sm text-muted-foreground">
                  Webhook: {status.webhook_active ? '✅ Active' : '❌ Not configured'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Webhook Secret: {status.has_webhook_secret ? '✅ Set' : '⚠️ Not set'}
                </p>
              </div>
            )}

            {!status?.connected && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm text-muted-foreground">
                  Add your <code className="text-xs bg-background px-1 py-0.5 rounded">FATHOM_API_KEY</code> as a Supabase secret to get started.
                </p>
              </div>
            )}

            {/* Webhook diagnostic results */}
            {webhookDiag && (
              <div className="rounded-md border p-3 space-y-2">
                <p className="text-sm font-medium">Fathom Webhooks ({webhookDiag.length})</p>
                {webhookDiag.length === 0 ? (
                  <p className="text-sm text-destructive">No webhooks found — the webhook was likely deleted on Fathom's side.</p>
                ) : (
                  webhookDiag.map((wh: any, i: number) => (
                    <div key={i} className="text-xs text-muted-foreground space-y-0.5">
                      <p><strong>ID:</strong> {wh.id}</p>
                      <p><strong>URL:</strong> {wh.destination_url}</p>
                      <p><strong>Triggers:</strong> {JSON.stringify(wh.triggered_for)}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {status?.connected && !status.webhook_active && (
                <Button
                  size="sm"
                  onClick={handleConnect}
                  disabled={connecting}
                >
                  {connecting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Brain className="h-4 w-4 mr-2" />
                  )}
                  Enable Webhook
                </Button>
              )}

              {status?.connected && (
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
              )}

              {status?.connected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVerifyWebhooks}
                  disabled={verifying}
                >
                  {verifying ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Verify Webhooks
                </Button>
              )}

              {status?.webhook_active && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRecreateWebhook}
                  disabled={recreating}
                >
                  {recreating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  Recreate Webhook
                </Button>
              )}

              {status?.webhook_active && (
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
                  Disconnect Webhook
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
