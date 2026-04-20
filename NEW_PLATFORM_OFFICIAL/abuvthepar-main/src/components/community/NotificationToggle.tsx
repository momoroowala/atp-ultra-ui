import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const NotificationToggle = () => {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  const handleClick = async () => {
    if (isSubscribed) {
      unsubscribe.mutate();
    } else {
      // First request permission if not granted
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return;
      }
      subscribe.mutate();
    }
  };

  const isProcessing = subscribe.isPending || unsubscribe.isPending || isLoading;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            disabled={isProcessing || permission === 'denied'}
            className={isSubscribed ? 'text-primary' : 'text-muted-foreground'}
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isSubscribed ? (
              <Bell className="h-5 w-5" />
            ) : (
              <BellOff className="h-5 w-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {permission === 'denied' 
            ? 'Notifications blocked - enable in browser settings'
            : isSubscribed 
              ? 'Notifications enabled - click to disable' 
              : 'Enable push notifications'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
