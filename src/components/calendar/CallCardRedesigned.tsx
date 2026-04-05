import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CalendarCall } from '@/hooks/useCalendarCalls';
import { formatTimeInUserTZ, formatDateLabelInUserTZ, getDateInUserTimezone } from '@/utils/timezoneHelpers';
import { TierBadges } from './TierBadge';
import { ExternalLink, MoreVertical, Edit, Trash2, Lock, CalendarPlus, Flame } from 'lucide-react';
import { format } from 'date-fns';

interface CallCardRedesignedProps {
  call: CalendarCall;
  isAdmin: boolean;
  userTierId: string | null;
  upsellUrl: string | null | undefined;
  onEdit: (call: CalendarCall) => void;
  onDelete: (id: string) => void;
  onDeleteSeries?: (seriesId: string) => void;
  onViewDetails: (call: CalendarCall) => void;
}

export const CallCardRedesigned = ({ 
  call, 
  isAdmin, 
  userTierId, 
  upsellUrl, 
  onEdit, 
  onDelete, 
  onDeleteSeries, 
  onViewDetails 
}: CallCardRedesignedProps) => {
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

  // Access rules
  const hasAccess =
    isAdmin ||
    normalizedTierIds.length === 0 ||
    normalizedVisibleTiers.includes("all") ||
    (userTierId && normalizedTierIds.some((id) => String(id) === String(userTierId)));
  
  const isHot = getDateInUserTimezone(call.call_date, call.call_time, call.timezone) === format(new Date(), 'yyyy-MM-dd');
  
  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasAccess) {
      window.open(call.call_link, '_blank');
    } else if (upsellUrl) {
      window.open(upsellUrl, '_blank');
    }
  };

  const handleAddToCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Create Google Calendar link
    const startDate = new Date(`${call.call_date}T${call.call_time}`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
    
    const formatForCalendar = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(call.title)}&dates=${formatForCalendar(startDate)}/${formatForCalendar(endDate)}&details=${encodeURIComponent(call.description || '')}&location=${encodeURIComponent(call.call_link)}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer bg-card"
      onClick={() => onViewDetails(call)}
    >
      <div className="flex flex-col md:flex-row">
        {/* Thumbnail */}
        <div className="w-full md:w-48 h-32 md:h-auto bg-muted flex-shrink-0">
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <CalendarPlus className="h-8 w-8 text-primary/40" />
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 p-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 min-w-0">
            {/* Hot badge */}
            {isHot && (
              <Badge className="mb-2 bg-gradient-to-r from-[#2D8F64] to-[#6EDAA6] text-white border-0">
                <Flame className="h-3 w-3 mr-1" />
                HOT
              </Badge>
            )}
            
            <h4 className="font-semibold text-foreground text-base md:text-lg mb-1 line-clamp-1">
              {call.title}
            </h4>
            <p className="text-sm text-muted-foreground mb-2">
              {formatDateLabelInUserTZ(call.call_date, call.call_time, call.timezone)} at {formatTimeInUserTZ(call.call_date, call.call_time, call.timezone)}
            </p>
            
            {call.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 hidden md:block">
                {call.description}
              </p>
            )}
            
            {isAdmin && call.visible_tiers && call.visible_tiers.length > 0 && (
              <div className="mt-2">
                <TierBadges tiers={call.visible_tiers} />
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2 flex-shrink-0">
            <Button 
              size="sm"
              onClick={handleAddToCalendar}
              className="bg-gradient-to-r from-[#2D8F64] to-[#6EDAA6] hover:opacity-90 text-white border-0"
            >
              <CalendarPlus className="h-4 w-4 mr-2" />
              Add to Calendar →
            </Button>
            
            {hasAccess ? (
              call.call_link ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleJoin}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Join via Zoom
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground italic px-1">
                  Meeting link not added yet
                </p>
              )
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleJoin}
                disabled={!upsellUrl}
              >
                <Lock className="h-4 w-4 mr-2" />
                Unlock Access
              </Button>
            )}
          </div>
          
          {/* Admin actions */}
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="flex-shrink-0">
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
                      onClick={(e) => { e.stopPropagation(); onDelete(call.id); }}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete this event
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); onDeleteSeries(call.series_id); }}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete all in series
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); onDelete(call.id); }}
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
        <div className="px-4 pb-4 text-xs text-muted-foreground border-t pt-3 mt-2">
          Contact the EEC team to upgrade your tier and access this call
        </div>
      )}
    </Card>
  );
};
