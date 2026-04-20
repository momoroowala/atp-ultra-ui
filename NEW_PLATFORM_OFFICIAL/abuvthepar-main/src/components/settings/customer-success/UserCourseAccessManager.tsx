import { useState } from "react";
import { useUserCourseAccess } from "@/hooks/useUserCourseAccess";
import { useAdminCourses } from "@/hooks/useCourses";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, Loader2, Shield, UserCheck } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface UserCourseAccessManagerProps {
  userId: string;
  userTierId?: string;
}

export const UserCourseAccessManager = ({ userId, userTierId }: UserCourseAccessManagerProps) => {
  const { userAccess, isLoading: accessLoading, grantAccess, revokeAccess } = useUserCourseAccess(userId);
  const { courses, isLoading: coursesLoading } = useAdminCourses();
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [revokeTargetCourseId, setRevokeTargetCourseId] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [notes, setNotes] = useState('');

  const hasManualAccess = (courseId: string) => {
    return userAccess?.some((access: any) => access.course_id === courseId && access.access_type === 'granted');
  };

  const hasTierAccess = (courseId: string) => {
    const course = courses?.find(c => c.id === courseId);
    if (!course || !userTierId) return false;
    
    // Check if course is available to all tiers
    if (course.visible_tier_ids?.length === 0 || !course.visible_tier_ids) return true;
    
    // Check if user's tier is in the course's visible tiers
    return course.visible_tier_ids.includes(userTierId);
  };

  const getAccessDetails = (courseId: string) => {
    return userAccess?.find((a: any) => a.course_id === courseId && a.access_type === 'granted');
  };

  const handleGrantAccess = () => {
    if (selectedCourse) {
      grantAccess.mutate(
        { courseId: selectedCourse.id, notes },
        {
          onSuccess: () => {
            setGrantDialogOpen(false);
            setSelectedCourse(null);
            setNotes('');
          },
        }
      );
    }
  };

  const handleRevokeAccess = (courseId: string) => {
    setRevokeTargetCourseId(courseId);
  };

  const confirmRevoke = () => {
    if (revokeTargetCourseId) {
      revokeAccess.mutate(revokeTargetCourseId);
      setRevokeTargetCourseId(null);
    }
  };

  const revokeCourseName = revokeTargetCourseId
    ? courses?.find(c => c.id === revokeTargetCourseId)?.title || 'this course'
    : '';

  if (accessLoading || coursesLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Access Status</TableHead>
              <TableHead>Access Type</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses?.map((course) => {
              const manualAccess = hasManualAccess(course.id);
              const tierAccess = hasTierAccess(course.id);
              const accessDetails = getAccessDetails(course.id);
              const hasAnyAccess = manualAccess || tierAccess;

              return (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell>
                    {manualAccess ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="default" className="gap-1 cursor-help">
                            <UserCheck className="h-3 w-3" />
                            Manual Access
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-2">
                            <div>
                              <p className="font-semibold text-xs">Granted by:</p>
                              <p className="text-sm">
                                {accessDetails?.granted_by_profile?.user_email || 
                                 `${accessDetails?.granted_by_profile?.first_name} ${accessDetails?.granted_by_profile?.last_name}`.trim() ||
                                 'Unknown'}
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-xs">Date:</p>
                              <p className="text-sm">
                                {accessDetails?.granted_at 
                                  ? format(new Date(accessDetails.granted_at), 'MM/dd/yyyy')
                                  : 'Unknown'}
                              </p>
                            </div>
                            {(accessDetails as any)?.notes && (
                              <div>
                                <p className="font-semibold text-xs">Notes:</p>
                                <p className="text-sm">{(accessDetails as any).notes}</p>
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : tierAccess ? (
                      <Badge variant="default" className="gap-1">
                        <Shield className="h-3 w-3" />
                        Tier Access
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <Lock className="h-3 w-3" />
                        No Access
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {manualAccess ? (
                      <Badge variant="outline">Individually Granted</Badge>
                    ) : tierAccess ? (
                      <Badge variant="outline">Tier Based</Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {manualAccess ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRevokeAccess(course.id)}
                        disabled={revokeAccess.isPending}
                      >
                        Revoke Access
                      </Button>
                    ) : hasAnyAccess ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                      >
                        Tier-Based
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedCourse(course);
                          setGrantDialogOpen(true);
                        }}
                      >
                        Grant Access
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TooltipProvider>

      <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Course Access</DialogTitle>
            <DialogDescription>
              Grant access to {selectedCourse?.title} for this user
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Why are you granting access to this course?"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGrantAccess} disabled={grantAccess.isPending}>
              {grantAccess.isPending ? 'Granting...' : 'Grant Access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!revokeTargetCourseId} onOpenChange={(open) => !open && setRevokeTargetCourseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Course Access</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove manual access to <span className="font-semibold">{revokeCourseName}</span>. The user will no longer be able to view this course unless they have tier-based access. You can grant access again at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
