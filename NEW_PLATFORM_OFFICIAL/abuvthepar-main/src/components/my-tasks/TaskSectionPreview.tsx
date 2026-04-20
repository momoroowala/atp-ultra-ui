import { Video, FileText, ClipboardList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TaskSectionPreviewProps {
  sections: any[];
  formFields: any[];
}

export const TaskSectionPreview = ({ sections, formFields }: TaskSectionPreviewProps) => {
  const videoSections = sections.filter((s) => s.section_type === 'video');
  const readoutSections = sections.filter((s) => s.section_type === 'readout');
  const formSections = sections.filter((s) => s.section_type === 'form');

  return (
    <div className="flex flex-wrap gap-2">
      {videoSections.length > 0 && (
        <Badge variant="secondary" className="gap-1">
          <Video className="h-3 w-3" />
          {videoSections.length} {videoSections.length === 1 ? 'video' : 'videos'}
        </Badge>
      )}
      {readoutSections.length > 0 && (
        <Badge variant="secondary" className="gap-1">
          <FileText className="h-3 w-3" />
          Reading
        </Badge>
      )}
      {formSections.length > 0 && (
        <Badge variant="secondary" className="gap-1">
          <ClipboardList className="h-3 w-3" />
          Form ({formFields.length} fields)
        </Badge>
      )}
    </div>
  );
};
