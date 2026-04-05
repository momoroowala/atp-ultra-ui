import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { APP_VERSION } from "@/config/version";
interface AppVersionUpdateDialogProps {
  onVersionUpdated?: () => void;
}
export const AppVersionUpdateDialog = ({
  onVersionUpdated
}: AppVersionUpdateDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const handleUpdateVersion = async () => {
    setIsUpdating(true);
    try {
      // Use current deployed version
      const newVersion = APP_VERSION;

      // Insert new version into Supabase
      const {
        error
      } = await supabase.from('app_version').insert({
        version: newVersion,
        message: 'Manual update by admin'
      });
      if (error) throw error;
      toast.success(`App version updated to ${newVersion}`, {
        description: "Users will be prompted to refresh on their next version check."
      });
      setOpen(false);
      onVersionUpdated?.();
    } catch (error) {
      console.error('Error updating app version:', error);
      toast.error("Failed to update app version");
    } finally {
      setIsUpdating(false);
    }
  };
  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-sm">
          <RefreshCw className="h-4 w-4" />
          Update App Version
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update App Version</DialogTitle>
          <DialogDescription>
            This will publish the current deployed version to Supabase. Users on older 
            versions will be prompted to refresh on their next version check (within 10 minutes).
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Current deployed version:</strong><br />
            <code className="text-xs bg-muted px-2 py-1 rounded">{APP_VERSION}</code>
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            <strong>Version to publish:</strong><br />
            <code className="text-xs bg-muted px-2 py-1 rounded">{APP_VERSION}</code>
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleUpdateVersion} disabled={isUpdating}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publish New Version
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
};