import { format } from 'date-fns';
import { Download, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Attachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

interface Message {
  id: string;
  message?: string;
  response_text?: string;
  created_at: string;
  is_staff: boolean;
  sender_name?: string;
  responder_name?: string;
  attachments?: Attachment[];
  _optimistic?: boolean;
}

interface TicketConversationProps {
  description: string;
  createdAt: string;
  responses: Message[];
  attachments?: Attachment[];
}

function extractStoragePath(url: string): string | null {
  const match = url.match(/\/object\/public\/ticket-attachments\/(.+)$/);
  return match ? match[1] : null;
}

function AttachmentItem({ att }: { att: Attachment }) {
  const [downloading, setDownloading] = useState(false);
  const isImage = att.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(att.name);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    setDownloading(true);
    try {
      const storagePath = extractStoragePath(att.url);
      if (storagePath) {
        const { data, error } = await supabase.storage.from('ticket-attachments').download(storagePath);
        if (error) throw error;
        const blobUrl = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = blobUrl; a.download = att.name;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } else {
        window.open(att.url, '_blank');
      }
    } catch {
      window.open(att.url, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      {isImage && (
        <button onClick={handleDownload} disabled={downloading} className="block overflow-hidden rounded-md border border-border bg-muted/30 hover:opacity-90 transition-opacity cursor-pointer">
          <img src={att.url} alt={att.name} className="max-w-[200px] h-auto object-contain" loading="lazy" />
        </button>
      )}
      <button onClick={handleDownload} disabled={downloading} className="flex items-center gap-2 text-xs bg-background/50 border border-border rounded-md px-2.5 py-1.5 hover:bg-accent/50 transition-colors group w-full text-left">
        {isImage ? <ImageIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
        <span className="truncate flex-1">{att.name}</span>
        {att.size && <span className="text-muted-foreground shrink-0">{(att.size / 1024).toFixed(0)} KB</span>}
        {downloading ? <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin shrink-0" /> : <Download className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />}
      </button>
    </div>
  );
}

function AttachmentList({ attachments }: { attachments: Attachment[] }) {
  if (!attachments?.length) return null;
  return (
    <div className="mt-2 space-y-1.5">
      {attachments.map((att, i) => <AttachmentItem key={i} att={att} />)}
    </div>
  );
}

export function TicketConversation({ description, createdAt, responses, attachments }: TicketConversationProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-primary/15 border border-primary/30 rounded-lg p-3">
          <p className="text-sm whitespace-pre-wrap break-all">{description}</p>
          {attachments && attachments.length > 0 && <AttachmentList attachments={attachments} />}
          <p className="text-xs text-muted-foreground mt-2">{format(new Date(createdAt), 'MMM d, yyyy h:mm a')}</p>
        </div>
      </div>

      {responses.map(msg => (
        <div key={msg.id} className={`flex ${msg.is_staff ? 'justify-start' : 'justify-end'} ${msg._optimistic ? 'opacity-60' : ''}`}>
          <div className={`max-w-[80%] rounded-lg p-3 ${msg.is_staff ? 'bg-accent border border-border' : 'bg-primary/15 border border-primary/30'}`}>
            {msg.is_staff && (msg.sender_name || msg.responder_name) && (
              <p className="text-xs font-medium text-muted-foreground mb-1">{msg.sender_name || msg.responder_name} · Support</p>
            )}
            <p className="text-sm whitespace-pre-wrap break-all">{msg.message || msg.response_text || ''}</p>
            {msg.attachments && msg.attachments.length > 0 && <AttachmentList attachments={msg.attachments} />}
            <p className="text-xs text-muted-foreground mt-2">{format(new Date(msg.created_at), 'MMM d, yyyy h:mm a')}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
