import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CallRecording } from '@/hooks/useCallRecordings';
import { formatDateLabel } from '@/utils/dateHelpers';
import { TierBadges } from './TierBadge';
import { Video, MoreVertical, Edit, Trash2, ExternalLink } from 'lucide-react';

interface RecordingCardProps {
  recording: CallRecording;
  isAdmin: boolean;
  onEdit: (recording: CallRecording) => void;
  onDelete: (id: string) => void;
  onClick: (recording: CallRecording) => void;
}

export const RecordingCard = ({ recording, isAdmin, onEdit, onDelete, onClick }: RecordingCardProps) => {
  return (
    <Card 
      className="hover:bg-accent/50 transition-colors cursor-pointer group"
      onClick={() => onClick(recording)}
    >
      <div className="aspect-video bg-muted relative overflow-hidden">
        {recording.thumbnail_url ? (
          <img 
            src={recording.thumbnail_url} 
            alt={recording.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button size="sm" variant="secondary">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-medium line-clamp-2 flex-1">{recording.title}</h4>
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(recording); }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDelete(recording.id); }}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mb-2">
          {formatDateLabel(recording.recorded_date)}
          {recording.duration_minutes && ` • ${recording.duration_minutes} min`}
        </p>
        
        {recording.tags && recording.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {recording.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {recording.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{recording.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
        
        {recording.visible_tiers && recording.visible_tiers.length > 0 && (
          <TierBadges tiers={recording.visible_tiers} />
        )}
      </CardContent>
    </Card>
  );
};
