import { Rocket, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AppUpdateModalProps {
  open: boolean;
  onClose: () => void;
}

export const AppUpdateModal = ({ open, onClose }: AppUpdateModalProps) => {
  const handleHardRefresh = async () => {
    try {
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }
    } catch (error) {
      console.error('Error clearing caches:', error);
    }
    
    // Force hard reload
    window.location.reload();
  };

  const handleSkipForNow = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle>Update Available</DialogTitle>
          </div>
          <DialogDescription className="space-y-3">
            <p>
              A new version of the app is available with the latest features and improvements.
            </p>
            <p className="text-sm">
              <strong>To see the changes:</strong> Click "Reload Now" to clear your browser cache and load the new version.
            </p>
            <p className="text-xs text-muted-foreground">
              If you experience issues, try clearing your browser cache manually (Ctrl+Shift+Delete or Cmd+Shift+Delete).
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={handleHardRefresh} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Now & Clear Cache
          </Button>
          <Button onClick={handleSkipForNow} variant="ghost" className="w-full">
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
