import { useState, useRef } from 'react';
import { ArrowLeft, Loader2, Paperclip, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateInternalTicket } from '@/hooks/useCSMTickets';
import { uploadAttachment } from '@/services/ticketApi';
import { toast } from 'sonner';

const INTERNAL_TYPES = [
  { value: 'bug_report', label: 'Bug Report' },
  { value: 'app_issue', label: 'App Issue' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'other', label: 'Other' },
];

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

interface AttachmentFile { file: File; uploading: boolean; uploaded?: { name: string; url: string; size: number; type: string }; error?: string; }

interface CSMInternalTicketFormProps { onBack: () => void; onCreated: () => void; }

export function CSMInternalTicketForm({ onBack, onCreated }: CSMInternalTicketFormProps) {
  const [internalType, setInternalType] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createMutation = useCreateInternalTicket();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = '';
    const remaining = MAX_FILES - attachments.length;
    for (const file of files.slice(0, remaining)) {
      if (!ALLOWED_TYPES.includes(file.type)) { toast.error(`${file.name}: Only images and PDFs`); continue; }
      if (file.size > MAX_FILE_SIZE) { toast.error(`${file.name}: Max 5MB`); continue; }
      const entry: AttachmentFile = { file, uploading: true };
      setAttachments(prev => [...prev, entry]);
      try {
        const result = await uploadAttachment('', file.name, file.type, file);
        setAttachments(prev => prev.map(a => a.file === file ? { ...a, uploading: false, uploaded: { name: file.name, url: result.url, size: file.size, type: file.type } } : a));
      } catch { setAttachments(prev => prev.map(a => a.file === file ? { ...a, uploading: false, error: 'Upload failed' } : a)); }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalType || !subject.trim() || !description.trim()) { toast.error('Please fill in all required fields'); return; }
    const uploaded = attachments.filter(a => a.uploaded).map(a => a.uploaded!);
    try {
      await createMutation.mutateAsync({ subject: subject.trim(), description: description.trim(), priority, internalType: INTERNAL_TYPES.find(t => t.value === internalType)?.label || internalType, attachments: uploaded.length > 0 ? uploaded : undefined });
      toast.success('Internal ticket created');
      onCreated();
    } catch { toast.error('Failed to create internal ticket'); }
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back to inbox</Button>
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Create Internal Ticket</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Type *</Label><Select value={internalType} onValueChange={setInternalType}><SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger><SelectContent>{INTERNAL_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Subject *</Label><Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief summary" required /></div>
          <div className="space-y-2"><Label>Description *</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the issue..." rows={5} required /></div>
          <div className="space-y-2"><Label>Priority</Label><Select value={priority} onValueChange={setPriority}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent></Select></div>
          <div className="space-y-2">
            <Label>Attachments (optional)</Label>
            {attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-2 bg-accent/50 rounded-md px-3 py-2 text-sm">
                {att.uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : att.error ? <X className="w-4 h-4 text-destructive" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                <span className="truncate flex-1">{att.file.name}</span>
                <Badge variant="outline" className="text-xs">{(att.file.size / 1024).toFixed(0)} KB</Badge>
                <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}><X className="w-3 h-3" /></Button>
              </div>
            ))}
            {attachments.length < MAX_FILES && <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()}><Paperclip className="w-4 h-4" /> Add File ({attachments.length}/{MAX_FILES})</Button>}
            <input ref={fileInputRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.gif,.webp,.pdf" onChange={handleFileSelect} />
          </div>
          <div className="flex justify-end"><Button type="submit" disabled={createMutation.isPending || !internalType} className="gap-2">{createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}Create Internal Ticket</Button></div>
        </form>
      </Card>
    </div>
  );
}
