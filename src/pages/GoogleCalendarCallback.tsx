import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const GoogleCalendarCallback = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting your Google account...');

  useEffect(() => {
    const exchangeCode = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        setStatus('error');
        setMessage(`Authorization denied: ${error}`);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received.');
        return;
      }

      try {
        const redirectUri = `${window.location.origin}/auth/google-calendar/callback`;
        const { data, error: fnError } = await supabase.functions.invoke('manage-google-calendar', {
          body: { action: 'exchange-code', code, redirect_uri: redirectUri },
        });

        if (fnError) throw fnError;

        if (data?.success) {
          setStatus('success');
          setMessage(`Connected to ${data.email}`);
          // Signal opener and close after short delay
          if (window.opener) {
            window.opener.postMessage({ type: 'google-calendar-connected', email: data.email }, '*');
          }
          setTimeout(() => window.close(), 1500);
        } else {
          throw new Error(data?.error || 'Unknown error');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Failed to connect');
      }
    };

    exchangeCode();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        {status === 'loading' && (
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
        )}
        {status === 'success' && (
          <CheckCircle2 className="h-10 w-10 mx-auto text-green-500" />
        )}
        {status === 'error' && (
          <XCircle className="h-10 w-10 mx-auto text-destructive" />
        )}
        <p className="text-lg font-medium">{message}</p>
        {status === 'error' && (
          <button
            onClick={() => window.close()}
            className="text-sm text-muted-foreground hover:underline"
          >
            Close this window
          </button>
        )}
      </div>
    </div>
  );
};

export default GoogleCalendarCallback;
