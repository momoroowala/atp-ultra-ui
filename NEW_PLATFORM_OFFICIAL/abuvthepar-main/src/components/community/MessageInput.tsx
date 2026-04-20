import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Image, X, Reply, AlertTriangle, Clock } from 'lucide-react';
import { CommunityMessage, SendMessageInput } from '@/hooks/useCommunityMessages';
import { useChatModeration } from '@/hooks/useChatModeration';
import { MentionAutocomplete } from './MentionAutocomplete';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { ScheduleMessageModal } from './ScheduleMessageModal';
import { ScheduledMessagesPanel } from './ScheduledMessagesPanel';
import { useScheduledMessages } from '@/hooks/useScheduledMessages';
import { format, parseISO } from 'date-fns';

interface MessageInputProps {
  channelId?: string;
  conversationId?: string;
  channelName?: string;
  replyingTo?: CommunityMessage | null;
  onCancelReply?: () => void;
  sendMessage: { mutate: (input: SendMessageInput) => void };
  onAfterSend?: (content: string, attachments: { url: string; type: string; name: string }[], mentionUserIds: string[]) => void;
}

interface MentionData {
  id: string;
  userId: string;
  userName: string;
}

export const MessageInput = ({ channelId, conversationId, channelName, replyingTo, onCancelReply, sendMessage, onAfterSend }: MessageInputProps) => {
  const { user } = useAuth();
  const { isBlocked, isBlockedLoading } = useChatModeration();
  const { createScheduledMessage } = useScheduledMessages(channelId, conversationId);
  const [textValue, setTextValue] = useState('');
  const [mentions, setMentions] = useState<MentionData[]>([]);
  const [attachments, setAttachments] = useState<{ url: string; type: string; name: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Focus on input when replying
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  const handleSend = () => {
    // Check if user is blocked
    if (isBlocked) {
      toast.error('You are blocked from sending messages');
      return;
    }

    const trimmedText = textValue.trim();
    if (!trimmedText && mentions.length === 0 && attachments.length === 0) return;

    // Build final content with mentions as @UserName
    let content = '';
    const mentionUserIds: string[] = [];
    
    // Interleave mentions and text
    mentions.forEach((m, idx) => {
      content += `@${m.userName}`;
      mentionUserIds.push(m.userId);
      if (idx < mentions.length - 1 || trimmedText) {
        content += ' ';
      }
    });
    content += trimmedText;

    const finalContent = content.trim();
    const mappedAttachments = attachments.length > 0 ? attachments.map(a => ({
      ...a,
      type: a.type.startsWith('image/') ? 'image' as const : 'file' as const
    })) : undefined;

    sendMessage.mutate({
      content: finalContent,
      channel_id: channelId,
      dm_conversation_id: conversationId,
      parent_message_id: replyingTo?.id,
      attachments: mappedAttachments,
      mentions: mentionUserIds.length > 0 ? mentionUserIds : undefined,
    });

    const sentAttachments = [...attachments];
    const sentMentionUserIds = [...mentionUserIds];

    setTextValue('');
    setMentions([]);
    setAttachments([]);
    onCancelReply?.();
    onAfterSend?.(finalContent, sentAttachments, sentMentionUserIds);
  };

  const buildMessageContent = () => {
    const trimmedText = textValue.trim();
    let content = '';
    const mentionUserIds: string[] = [];
    mentions.forEach((m, idx) => {
      content += `@${m.userName}`;
      mentionUserIds.push(m.userId);
      if (idx < mentions.length - 1 || trimmedText) content += ' ';
    });
    content += trimmedText;
    return { content: content.trim(), mentionUserIds };
  };

  const handleScheduleConfirm = (data: {
    scheduled_at: string;
    timezone: string;
    is_recurring: boolean;
    recurrence_pattern?: string;
    recurrence_end_date?: string;
  }) => {
    const { content, mentionUserIds } = buildMessageContent();
    if (!content && attachments.length === 0) return;

    const mappedAttachments = attachments.map(a => ({
      ...a,
      type: a.type.startsWith('image/') ? 'image' as const : 'file' as const,
    }));

    createScheduledMessage.mutate({
      content,
      channel_id: channelId,
      dm_conversation_id: conversationId,
      attachments: mappedAttachments.length > 0 ? mappedAttachments : undefined,
      mentions: mentionUserIds.length > 0 ? mentionUserIds : undefined,
      scheduled_at: data.scheduled_at,
      timezone: data.timezone,
      is_recurring: data.is_recurring,
      recurrence_pattern: data.recurrence_pattern,
      recurrence_end_date: data.recurrence_end_date,
    }, {
      onSuccess: () => {
        const scheduledDate = parseISO(data.scheduled_at);
        toast.success(`Message scheduled for ${format(scheduledDate, 'MMM d, h:mm a')}`);
        setTextValue('');
        setMentions([]);
        setAttachments([]);
        setShowScheduleModal(false);
      },
    });
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {

    if (e.key === 'Enter' && !e.shiftKey) {
      if (showMentions) return;
      e.preventDefault();
      handleSend();
    }
    
    // Handle backspace on empty input to remove last mention
    if (e.key === 'Backspace' && textValue === '' && mentions.length > 0) {
      e.preventDefault();
      setMentions(prev => prev.slice(0, -1));
    }
  };

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  };

  const handleInputChange = (value: string) => {
    setTextValue(value);

    // Check for @ mention trigger
    const atIndex = value.lastIndexOf('@');
    if (atIndex !== -1) {
      const textAfterAt = value.slice(atIndex + 1);
      const charBeforeAt = atIndex > 0 ? value[atIndex - 1] : ' ';
      if ((charBeforeAt === ' ' || charBeforeAt === '\n' || atIndex === 0) && !textAfterAt.includes(' ')) {
        setShowMentions(true);
        setMentionSearch(textAfterAt);
        return;
      }
    }
    setShowMentions(false);
  };

  const handleMentionSelect = (userId: string, userName: string) => {
    const atIndex = textValue.lastIndexOf('@');
    const newTextValue = atIndex > 0 ? textValue.slice(0, atIndex) : '';
    setTextValue(newTextValue);
    
    const newMention: MentionData = {
      id: crypto.randomUUID(),
      userId,
      userName,
    };
    setMentions(prev => [...prev, newMention]);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const removeMention = (mentionId: string) => {
    setMentions(prev => prev.filter(m => m.id !== mentionId));
    inputRef.current?.focus();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('chat-attachments')
          .upload(fileName, file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(data.path);

        setAttachments(prev => [...prev, {
          url: urlData.publicUrl,
          type: file.type,
          name: file.name,
        }]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const placeholderText = channelName 
    ? `Message #${channelName}` 
    : mentions.length === 0 
      ? "Type a message... (@ to mention)" 
      : "";

  // Show blocked message if user is blocked
  if (isBlocked) {
    return (
      <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">
        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-destructive">You are blocked from sending messages</p>
          <p className="text-xs text-muted-foreground">Reason: {isBlocked.reason}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Reply Preview */}
      {replyingTo && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-lg">
          <Reply className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <span className="text-xs text-muted-foreground">Replying to </span>
            <span className="text-xs font-medium">
              {replyingTo.sender?.first_name || 'Unknown'}
            </span>
            <p className="text-sm text-muted-foreground truncate">
              {replyingTo.content}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Mention Autocomplete */}
      {showMentions && (
        <MentionAutocomplete
          search={mentionSearch}
          onSelect={handleMentionSelect}
          onClose={() => setShowMentions(false)}
        />
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((attachment, index) => (
            <div key={index} className="relative group">
              {attachment.type.startsWith('image/') ? (
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="h-20 w-20 object-cover rounded-lg border border-border"
                />
              ) : (
                <div className="h-20 px-4 flex items-center bg-muted rounded-lg border border-border">
                  <span className="text-sm truncate max-w-[100px]">{attachment.name}</span>
                </div>
              )}
              <button
                onClick={() => removeAttachment(index)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Simplified Input Area */}
      <div className="flex items-center gap-3 bg-card rounded-xl border border-border px-3 py-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={handleFileSelect}
        />
        
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 flex-shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Image className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 flex-shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => setShowScheduleModal(true)}
          title="Schedule message"
        >
          <Clock className="h-5 w-5" />
        </Button>

        <div className="flex-1 flex items-center flex-wrap gap-1">
          {/* Mention Chips */}
          {mentions.map((mention) => (
            <span
              key={mention.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-sm"
            >
              @{mention.userName}
              <button
                onClick={() => removeMention(mention.id)}
                className="hover:bg-primary/20 rounded-full w-4 h-4 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </span>
          ))}
          
          {/* Text Input */}
          <textarea
            ref={inputRef}
            value={textValue}
            onChange={(e) => {
              handleInputChange(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            rows={1}
            className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground py-2 resize-none max-h-[150px]"
          />
        </div>
      </div>

      {/* Scheduled Messages Panel */}
      <div className="flex justify-end mt-1">
        <ScheduledMessagesPanel channelId={channelId} dmConversationId={conversationId} />
      </div>

      {/* Schedule Modal */}
      <ScheduleMessageModal
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onConfirm={handleScheduleConfirm}
        messagePreview={textValue}
      />
    </div>
  );
};
