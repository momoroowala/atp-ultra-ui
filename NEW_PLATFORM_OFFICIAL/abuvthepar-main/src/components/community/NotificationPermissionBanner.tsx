import { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const NotificationPermissionBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const { isSupported, permission, requestPermission, subscribe, isSubscribed } = usePushNotifications();
  
  // Check if we should show the banner
  const shouldShow = isSupported && !dismissed && !isSubscribed && permission !== 'denied';
  
  // Check localStorage for previous dismissal
  useEffect(() => {
    const wasDismissed = localStorage.getItem('notification_banner_dismissed');
    if (wasDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  if (!shouldShow) return null;

  const handleEnable = async () => {
    console.log('[Notifications] Current permission:', permission);
    
    if (permission === 'default') {
      // Need to request permission first
      console.log('[Notifications] Requesting permission...');
      const granted = await requestPermission();
      console.log('[Notifications] Permission result:', granted);
      
      if (granted) {
        subscribe.mutate();
      }
    } else if (permission === 'granted') {
      // Already have permission, just subscribe
      subscribe.mutate();
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('notification_banner_dismissed', 'true');
  };

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mx-4 mt-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Bell className="h-5 w-5 text-primary shrink-0" />
        <div className="text-sm">
          <span className="font-medium">Enable notifications</span>
          <span className="text-muted-foreground ml-1">
            to get alerts when you receive new messages
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          onClick={handleEnable}
          disabled={subscribe.isPending}
        >
          {subscribe.isPending ? 'Enabling...' : 'Enable'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDismiss}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export const NotificationBlockedBanner = () => {
  const { isSupported, permission } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  // Only show if notifications are blocked
  if (!isSupported || permission !== 'denied' || dismissed) return null;

  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mx-4 mt-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
        <div className="text-sm">
          <span className="font-medium">Notifications are blocked</span>
          <span className="text-muted-foreground ml-1">
            - click the lock icon in your browser's address bar to enable them
          </span>
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setDismissed(true)}
        className="h-8 w-8 p-0 shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};