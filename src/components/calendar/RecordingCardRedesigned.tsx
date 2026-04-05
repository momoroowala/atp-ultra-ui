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
import { Video, MoreVertical, Edit, Trash2, Play, Brain } from 'lucide-react';

interface RecordingCardRedesignedProps {
  recording: CallRecording;
  isAdmin: boolean;
  hasFathomNotes?: boolean;
  onEdit: (recording: CallRecording) => void;
  onDelete: (id: string) => void;
  onClick: (recording: CallRecording) => void;
}

export const RecordingCardRedesigned = ({ 
  recording, 
  isAdmin, 
  hasFathomNotes,
  onEdit, 
  onDelete, 
  onClick 
}: RecordingCardRedesignedProps) => {
  // Get first tier as badge text
  const tierBadgeText = recording.visible_tiers && recording.visible_tiers.length > 0 
    ? recording.visible_tiers[0] 
    : null;

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer bg-card group"
      onClick={() => onClick(recording)}
    >
      <CardContent className="p-0">
        {/* Tier badge + Fathom badge */}
        <div className="px-4 pt-4 flex gap-2">
          {tierBadgeText && (
            <Badge 
              variant="secondary" 
              className="bg-primary/10 text-primary text-xs font-medium uppercase tracking-wider"
            >
              {tierBadgeText}
            </Badge>
          )}
          {hasFathomNotes && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs gap-1">
              <Brain className="h-3 w-3" />
              AI Notes
            </Badge>
          )}
        </div>
        
        {/* Thumbnail */}
        <div className="aspect-video bg-muted relative overflow-hidden mx-4 mt-4 rounded-lg">
          {recording.thumbnail_url ? (
            <img 
              src={recording.thumbnail_url} 
              alt={recording.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <Video className="h-12 w-12 text-primary/40" />
            </div>
          )}
          
          {/* Play overlay on hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-card/90 flex items-center justify-center">
              <Play className="h-6 w-6 text-primary fill-primary ml-1" />
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 text-center">
          <h4 className="font-semibold text-foreground text-base mb-1 line-clamp-2">
            {recording.title}
          </h4>
          
          {recording.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {recording.description}
            </p>
          )}
          
          {/* Admin menu */}
          {isAdmin && (
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 bg-card/80 hover:bg-card">
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
            </div>
          )}
          
          {/* Open button */}
          <Button 
            className="w-full bg-gradient-to-r from-[#2D8F64] to-[#6EDAA6] hover:opacity-90 text-white border-0"
            onClick={(e) => { e.stopPropagation(); onClick(recording); }}
          >
            Open This Module
          </Button>
          
          {/* Recording count subtitle */}
          {recording.duration_minutes && (
            <p className="text-xs text-muted-foreground mt-2">
              {recording.duration_minutes} MINUTES AVAILABLE
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
