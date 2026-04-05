import { useState, useRef } from 'react';
import { Loader2, Paperclip, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useCreateTicket } from '@/hooks/useTickets';
import { uploadAttachment } from '@/services/ticketApi';
import { toast } from 'sonner';
import { useUserTier } from '@/hooks/useUserTier';

const TOPICS = [
  { value: 'program_content', label: 'Program Content Issue' },
  { value: 'platform_question', label: 'Platform Question' },
  { value: 'community', label: 'Community & Communication' },
  { value: 'billing_account', label: 'Billing & Account Request' },
  { value: 'bug_report', label: 'Bug Report' },
] as const;

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

interface AttachmentFile {
  file: File;
  uploading: boolean;
  uploaded?: { name: string; url: string; size: number; type: string };
  error?: string;
}

interface NewTicketFormProps {
  onCreated?: () => void;
}

export function NewTicketForm({ onCreated }: NewTicketFormProps) {
  const { tierKey } = useUserTier();
  const isRestrictedTier = tierKey === 'diamond' || tierKey === 'platinum';
  const availableTopics = isRestrictedTier ? TOPICS.filter(t => t.value === 'bug_report') : TOPICS;

  const [topic, setTopic] = useState(isRestrictedTier ? 'bug_report' : '');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createMutation = useCreateTicket();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const remaining = MAX_FILES - attachments.length;
    const toAdd = files.slice(0, remaining);

    for (const file of toAdd) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: Only images and PDFs are allowed`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: File must be under 5MB`);
        continue;
      }

      const entry: AttachmentFile = { file, uploading: true };
      setAttachments(prev => [...prev, entry]);

      try {
        const result = await uploadAttachment('', file.name, file.type, file);
        setAttachments(prev =>
          prev.map(a =>
            a.file === file
              ? { ...a, uploading: false, uploaded: { name: file.name, url: result.url, size: file.size, type: file.type } }
              : a
          )
        );
      } catch {
        setAttachments(prev =>
          prev.map(a => (a.file === file ? { ...a, uploading: false, error: 'Upload failed' } : a))
        );
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) { toast.error('Please select a topic'); return; }
    if (!subject.trim() || !description.trim()) { toast.error('Please fill in all required fields'); return; }

    const uploadedAttachments = attachments.filter(a => a.uploaded).map(a => a.uploaded!);

    try {
      const topicLabel = TOPICS.find(t => t.value === topic)?.label || topic;
      const result = await createMutation.mutateAsync({
        subject: subject.trim(),
        description: description.trim(),
        priority,
        ticketType: 'support',
        topic: topicLabel,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      });
      toast.success(`Ticket created: #${result.ticket?.ticket_number || 'Success'}`);
      setTopic(isRestrictedTier ? 'bug_report' : ''); setSubject(''); setDescription(''); setPriority('medium'); setAttachments([]);
      onCreated?.();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create ticket');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Topic + Priority on one row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="topic" className="text-sm">Topic *</Label>
          {isRestrictedTier ? (
            <p className="text-sm text-muted-foreground py-1.5">Bug Report</p>
          ) : (
            <Select value={topic} onValueChange={setTopic}>
              <SelectTrigger><SelectValue placeholder="Select topic..." /></SelectTrigger>
              <SelectContent>
                {availableTopics.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="priority" className="text-sm">Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Subject full width */}
      <div className="space-y-1.5">
        <Label htmlFor="subject" className="text-sm">Subject *</Label>
        <Input id="subject" placeholder="Brief summary of your issue" value={subject} onChange={e => setSubject(e.target.value)} required />
      </div>

      {/* Description - compact 3 rows */}
      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-sm">Description *</Label>
        <Textarea id="description" placeholder="Describe your issue in detail..." value={description} onChange={e => setDescription(e.target.value)} rows={3} required />
      </div>

      {/* Attachments - compact */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          {attachments.length < MAX_FILES && (
            <Button type="button" variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="w-3.5 h-3.5" /> Attach ({attachments.length}/{MAX_FILES})
            </Button>
          )}
          <span className="text-[11px] text-muted-foreground">Images & PDFs, max 5MB</span>
        </div>
        {attachments.length > 0 && (
          <div className="space-y-1">
            {attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-2 bg-accent/50 rounded px-2 py-1 text-xs">
                {att.uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /> : att.error ? <X className="w-3.5 h-3.5 text-destructive" /> : <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                <span className="truncate flex-1">{att.file.name}</span>
                <Badge variant="outline" className="text-[10px] px-1 py-0">{(att.file.size / 1024).toFixed(0)} KB</Badge>
                <Button type="button" variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => removeAttachment(i)}><X className="w-3 h-3" /></Button>
              </div>
            ))}
          </div>
        )}
        <input ref={fileInputRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.gif,.webp,.pdf" onChange={handleFileSelect} />
      </div>

      {/* Submit - full width */}
      <Button type="submit" disabled={createMutation.isPending || !topic} className="w-full gap-2">
        {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        Submit Ticket
      </Button>
    </form>
  );
}
