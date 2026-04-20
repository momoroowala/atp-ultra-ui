import { useState, useRef } from 'react';
import { Paperclip, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadAttachment } from '@/services/ticketApi';
import { toast } from 'sonner';

export interface UploadedAttachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface ReplyAttachmentInputProps {
  attachments: UploadedAttachment[];
  onAttachmentsChange: (attachments: UploadedAttachment[]) => void;
  disabled?: boolean;
}

export function ReplyAttachmentInput({ attachments, onAttachmentsChange, disabled }: ReplyAttachmentInputProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    const newAttachments: UploadedAttachment[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is too large (max 10MB)`); continue; }
      try {
        const result = await uploadAttachment('', file.name, file.type, file);
        if (result.url) {
          newAttachments.push({ name: file.name, url: result.url, size: file.size, type: file.type });
        }
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    if (newAttachments.length > 0) onAttachmentsChange([...attachments, ...newAttachments]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    onAttachmentsChange(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att, i) => {
            const isImage = att.type?.startsWith('image/');
            return (
              <div key={i} className="flex items-center gap-1.5 text-xs bg-muted/50 border border-border rounded-md px-2 py-1.5">
                {isImage ? <ImageIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                <span className="truncate max-w-[120px]">{att.name}</span>
                <span className="text-muted-foreground shrink-0">{(att.size / 1024).toFixed(0)} KB</span>
                <button onClick={() => removeAttachment(i)} className="text-muted-foreground hover:text-destructive ml-0.5"><X className="w-3.5 h-3.5" /></button>
              </div>
            );
          })}
        </div>
      )}
      <div>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} disabled={disabled || uploading} />
        <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => fileInputRef.current?.click()} disabled={disabled || uploading}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          {uploading ? 'Uploading...' : 'Attach files'}
        </Button>
      </div>
    </div>
  );
}
