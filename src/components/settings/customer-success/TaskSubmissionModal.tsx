import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CheckCircle } from "lucide-react";

interface TaskSubmissionModalProps {
  task: any;
  onClose: () => void;
}

export const TaskSubmissionModal = ({ task, onClose }: TaskSubmissionModalProps) => {
  const response = task.response;

  if (!response) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Task Submission Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">{task.title}</h3>
            <p className="text-sm text-muted-foreground">{task.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge className="bg-green-600 mt-1">Completed</Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Completed At</div>
              <div className="font-medium mt-1">
                {response.completed_at 
                  ? format(new Date(response.completed_at), 'MM/dd/yyyy HH:mm')
                  : '-'}
              </div>
            </div>
          </div>

          {response.response && typeof response.response === 'object' && (
            <div>
              <h4 className="font-semibold mb-3">Submission Data</h4>
              <div className="bg-muted rounded-lg p-4 space-y-3">
                {Object.entries(response.response).map(([key, value]) => (
                  <div key={key} className="border-b border-border last:border-0 pb-3 last:pb-0">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-sm">
                      {typeof value === 'object' 
                        ? JSON.stringify(value, null, 2)
                        : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {response.response?.admin_marked && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-sm text-blue-400">
                This task was marked as complete by an administrator
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
