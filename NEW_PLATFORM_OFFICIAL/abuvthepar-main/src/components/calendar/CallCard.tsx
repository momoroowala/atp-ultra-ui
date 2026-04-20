import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CalendarCall } from '@/hooks/useCalendarCalls';
import { formatTimeInUserTZ, formatDateLabelInUserTZ } from '@/utils/timezoneHelpers';
import { TierBadges } from './TierBadge';
import { ExternalLink, MoreVertical, Edit, Trash2, Lock } from 'lucide-react';

interface CallCardProps {
  call: CalendarCall;
  isAdmin: boolean;
  userTierId: string | null;
  upsellUrl: string | null | undefined;
  onEdit: (call: CalendarCall) => void;
  onDelete: (id: string) => void;
  onDeleteSeries?: (seriesId: string) => void;
  onViewDetails: (call: CalendarCall) => void;
}

export const CallCard = ({ call, isAdmin, userTierId, upsellUrl, onEdit, onDelete, onDeleteSeries, onViewDetails }: CallCardProps) => {
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

  // Access rules:
  // - Admins always have access
  // - If no specific tier IDs are set OR empty array, it's open to everyone
  // - If 'all' is specified in visible_tiers, it's open to everyone
  // - Otherwise, user must have a matching tier_id
  const hasAccess =
    isAdmin ||
    normalizedTierIds.length === 0 ||
    normalizedVisibleTiers.includes("all") ||
    (userTierId && normalizedTierIds.some((id) => String(id) === String(userTierId)));
  
  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasAccess) {
      window.open(call.call_link, '_blank');
    } else if (upsellUrl) {
      window.open(upsellUrl, '_blank');
    }
  };

  return (
    <Card 
      className="hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={() => onViewDetails(call)}
    >
      <CardContent className="p-3 md:p-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm md:text-base mb-1">{call.title}</h4>
            <p className="text-xs md:text-sm text-muted-foreground mb-2">
              {formatDateLabelInUserTZ(call.call_date, call.call_time, call.timezone)} at {formatTimeInUserTZ(call.call_date, call.call_time, call.timezone)}
            </p>
            {isAdmin && call.visible_tiers && call.visible_tiers.length > 0 && (
              <div className="mt-2">
                <TierBadges tiers={call.visible_tiers} />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {hasAccess ? (
              <Button 
                size="sm" 
                onClick={handleJoin}
                className="hover-lift flex-shrink-0"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                <span>Join</span>
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleJoin}
                disabled={!upsellUrl}
                className="flex-shrink-0"
              >
                <Lock className="h-3 w-3 mr-1" />
                <span className="text-xs">Unlock</span>
              </Button>
            )}
            
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="flex-shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(call); }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  
                  {call.series_id && onDeleteSeries ? (
                    <>
                      <DropdownMenuItem 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onDelete(call.id);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete this event
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onDeleteSeries(call.series_id);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete all events in series
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        onDelete(call.id);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        {!hasAccess && !isAdmin && !upsellUrl && (
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            Contact the AIPS team to upgrade your tier and access this call
          </div>
        )}
      </CardContent>
    </Card>
  );
};