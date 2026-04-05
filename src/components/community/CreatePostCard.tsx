import { useState, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Image, X, Send, Loader2, Bold, Italic, List, ListOrdered, Heading2, Quote, Code, Link2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useChatModeration } from '@/hooks/useChatModeration';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { SendMessageInput } from '@/hooks/useCommunityMessages';
import { useQuery } from '@tanstack/react-query';

interface CreatePostCardProps {
  channelId: string;
  sendMessage: { mutate: (input: SendMessageInput) => void };
}

export const CreatePostCard = ({ channelId, sendMessage }: CreatePostCardProps) => {
  const { user } = useAuth();
  const { isBlocked } = useChatModeration();
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<{ url: string; type: string; name: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-cache the current user's profile for avatar display
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile-sender', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_public_profiles')
        .select('id, first_name, last_name, user_email, avatar_url')
        .eq('id', user?.id!)
        .single();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const userName = userProfile
    ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
    : '';
  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email || '').slice(0, 2).toUpperCase();

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleCollapse = () => {
    if (!content.trim() && attachments.length === 0) {
      setIsExpanded(false);
    }
  };

  const handlePost = () => {
    if (isBlocked) {
      toast.error('You are blocked from posting');
      return;
    }

    const trimmed = content.trim();
    if (!trimmed && attachments.length === 0) return;

    const mappedAttachments = attachments.length > 0
      ? attachments.map(a => ({
          ...a,
          type: a.type.startsWith('image/') ? 'image' as const : 'file' as const,
        }))
      : undefined;

    sendMessage.mutate({
      content: trimmed,
      channel_id: channelId,
      attachments: mappedAttachments,
    });

    setContent('');
    setAttachments([]);
    setIsExpanded(false);
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

  const handleTextareaAutoGrow = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
    }
  };

  // Text formatting helpers -- wrap selected text or insert at cursor
  const applyFormat = useCallback((prefix: string, suffix: string = prefix, placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const text = selected || placeholder;
    const before = content.substring(0, start);
    const after = content.substring(end);
    const newContent = before + prefix + text + suffix + after;
    setContent(newContent);
    // Focus and place cursor after the inserted text
    setTimeout(() => {
      textarea.focus();
      const cursorPos = start + prefix.length + text.length + suffix.length;
      textarea.setSelectionRange(
        selected ? cursorPos : start + prefix.length,
        selected ? cursorPos : start + prefix.length + text.length
      );
    }, 0);
  }, [content]);

  const formatBold = () => applyFormat('**', '**', 'bold text');
  const formatItalic = () => applyFormat('*', '*', 'italic text');
  const formatHeading = () => applyFormat('\n## ', '\n', 'heading');
  const formatBulletList = () => applyFormat('\n- ', '\n', 'list item');
  const formatNumberList = () => applyFormat('\n1. ', '\n', 'list item');
  const formatQuote = () => applyFormat('\n> ', '\n', 'quote');
  const formatCode = () => applyFormat('`', '`', 'code');
  const formatLink = () => applyFormat('[', '](url)', 'link text');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handlePost();
    }
  };

  if (isBlocked) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        {!isExpanded ? (
          /* Collapsed state */
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleExpand}>
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={userProfile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-muted/50 hover:bg-muted transition-colors rounded-full px-4 py-2.5">
              <span className="text-sm text-muted-foreground">What's on your mind?</span>
            </div>
          </div>
        ) : (
          /* Expanded state */
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={userProfile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-foreground">{userName || user?.email || 'You'}</span>
                {/* Formatting toolbar */}
                <TooltipProvider delayDuration={300}>
                  <div className="flex items-center gap-0.5 mt-2 mb-1 border-b border-border/50 pb-1.5">
                    {[
                      { icon: Bold, action: formatBold, label: 'Bold (Ctrl+B)' },
                      { icon: Italic, action: formatItalic, label: 'Italic (Ctrl+I)' },
                      { icon: Heading2, action: formatHeading, label: 'Heading' },
                      { icon: List, action: formatBulletList, label: 'Bullet list' },
                      { icon: ListOrdered, action: formatNumberList, label: 'Numbered list' },
                      { icon: Quote, action: formatQuote, label: 'Quote' },
                      { icon: Code, action: formatCode, label: 'Code' },
                      { icon: Link2, action: formatLink, label: 'Link' },
                    ].map(({ icon: Icon, action, label }) => (
                      <Tooltip key={label}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); action(); }}
                            className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">{label}</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    handleTextareaAutoGrow();
                  }}
                  onKeyDown={(e) => {
                    // Ctrl+B / Ctrl+I shortcuts
                    if (e.ctrlKey || e.metaKey) {
                      if (e.key === 'b') { e.preventDefault(); formatBold(); return; }
                      if (e.key === 'i') { e.preventDefault(); formatItalic(); return; }
                    }
                    handleKeyDown(e);
                  }}
                  onBlur={handleCollapse}
                  placeholder="Share something with the community... (supports **bold**, *italic*, lists, and more)"
                  className="w-full bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground resize-none"
                  style={{ minHeight: '80px', maxHeight: '300px' }}
                  rows={3}
                />
              </div>
            </div>

            {/* Attachment previews */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pl-[52px]">
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
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Actions row */}
            <div className="flex items-center justify-between pl-[52px] pt-2 border-t border-border/50">
              <div className="flex items-center gap-1">
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
                  size="sm"
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Image className="h-4 w-4" />
                  )}
                  <span className="ml-1.5 text-xs">Photo</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    setContent('');
                    setAttachments([]);
                    setIsExpanded(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-8 px-4 text-xs"
                  onClick={handlePost}
                  disabled={!content.trim() && attachments.length === 0}
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Post
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground pl-[52px]">Ctrl+Enter to post</p>
          </div>
        )}
      </div>
    </Card>
  );
};
