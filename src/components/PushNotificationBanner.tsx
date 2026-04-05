import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';
import { initializeAudio } from '@/utils/notificationSound';

const DISMISSED_KEY = 'push_notification_banner_dismissed';

export const PushNotificationBanner = () => {
  const { user } = useAuth();
  const { isSupported, permission, isSubscribed, isLoading, requestPermission, subscribe } = usePushNotifications();
  const [isDismissed, setIsDismissed] = useState(true);
  const [isEnabling, setIsEnabling] = useState(false);

  useEffect(() => {
    // Wait until loading is complete before deciding to show
    if (isLoading) return;
    
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    // Show banner if: user is logged in, notifications supported, not already subscribed, and not dismissed
    if (user && isSupported && !isSubscribed && permission !== 'denied' && !dismissed) {
      setIsDismissed(false);
    }
  }, [user, isSupported, isSubscribed, permission, isLoading]);

  const handleEnable = async () => {
    setIsEnabling(true);
    // Initialize audio context on this user gesture so notification sounds work
    initializeAudio();
    try {
      const granted = await requestPermission();
      if (granted) {
        await subscribe.mutateAsync();
        setIsDismissed(true);
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setIsDismissed(true);
  };

  // Don't show while loading or if dismissed, no user, not supported, already subscribed
  if (isLoading || isDismissed || !user || !isSupported || isSubscribed) {
    return null;
  }

  // Show different message if permission was denied
  if (permission === 'denied') {
    return (
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-amber-200">
              Push notifications are blocked. Enable them in your browser settings to stay updated.
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-7 w-7 p-0 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2.5">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Bell className="h-4 w-4 text-primary" />
          <span className="text-sm text-foreground">
            Enable push notifications to stay updated on new messages
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleEnable}
            disabled={isEnabling}
            className="h-7 text-xs"
          >
            {isEnabling ? 'Enabling...' : 'Enable'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
