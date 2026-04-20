import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarCall } from "@/hooks/useCalendarCalls";
import { formatTimeInUserTZ, getUserTimezone, formatDateLabelInUserTZ } from "@/utils/timezoneHelpers";
import { TierBadges } from "./TierBadge";
import { ExternalLink, Edit, Calendar, Clock, Globe, Lock, Check, X, Users } from "lucide-react";
import { useCallRsvps, useUpsertRsvp } from "@/hooks/useCallRsvp";

interface CalendarCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  call: CalendarCall;
  isAdmin: boolean;
  userTierId: string | null;
  upsellUrl: string | null | undefined;
  onEdit: (call: CalendarCall) => void;
}

export const CalendarCallModal = ({ open, onOpenChange, call, isAdmin, userTierId, upsellUrl, onEdit }: CalendarCallModalProps) => {
  const { yesCount, noCount, currentUserRsvp, isLoading: rsvpLoading } = useCallRsvps(open ? call?.id : undefined);
  const upsertRsvp = useUpsertRsvp();

  // Normalize visible_tier_ids to always be an array
  const normalizedTierIds = call?.visible_tier_ids
    ? Array.isArray(call.visible_tier_ids)
      ? call.visible_tier_ids
      : [call.visible_tier_ids]
    : [];

  // Normalize visible_tiers to always be an array
  const normalizedVisibleTiers = call?.visible_tiers
    ? Array.isArray(call.visible_tiers)
      ? call.visible_tiers
      : [call.visible_tiers]
    : [];

  const hasAccess =
    isAdmin ||
    normalizedTierIds.length === 0 ||
    normalizedVisibleTiers.includes("all") ||
    (userTierId && normalizedTierIds.some((id) => String(id) === String(userTierId)));

  const handleJoin = () => {
    if (hasAccess) {
      window.open(call.call_link, "_blank");
    } else if (upsellUrl) {
      window.open(upsellUrl, "_blank");
    }
  };

  const handleEdit = () => {
    onOpenChange(false);
    onEdit(call);
  };

  const handleRsvp = (status: 'yes' | 'no') => {
    upsertRsvp.mutate({ callId: call.id, status });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{call.title}</DialogTitle>
          <DialogDescription className="sr-only">Details for {call.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {call.description && (
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-muted-foreground whitespace-pre-wrap">{call.description}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatDateLabelInUserTZ(call.call_date, call.call_time, call.timezone)}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formatTimeInUserTZ(call.call_date, call.call_time, call.timezone)}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span>Your timezone: {getUserTimezone()}</span>
            </div>
          </div>

          {isAdmin && normalizedVisibleTiers.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Visible to</h4>
              <TierBadges tiers={normalizedVisibleTiers} />
            </div>
          )}

          {/* RSVP Section */}
          {hasAccess && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium text-sm">RSVP</h4>
                {!rsvpLoading && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {yesCount} attending · {noCount} not attending
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant={currentUserRsvp === 'yes' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleRsvp('yes')}
                  disabled={upsertRsvp.isPending}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Yes, I'm joining
                </Button>
                <Button
                  variant={currentUserRsvp === 'no' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => handleRsvp('no')}
                  disabled={upsertRsvp.isPending}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-1" />
                  Can't make it
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            {hasAccess ? (
              <Button onClick={handleJoin} className="flex-1">
                <ExternalLink className="mr-2 h-4 w-4" />
                Join Call
              </Button>
            ) : (
              <Button variant="outline" onClick={handleJoin} disabled={!upsellUrl} className="flex-1">
                <Lock className="mr-2 h-4 w-4" />
                Unlock
              </Button>
            )}

            {isAdmin && (
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
