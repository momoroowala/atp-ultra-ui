import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Image, Video, Calendar, Megaphone, X, Clock, MapPin, Send, Link2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { SendMessageInput } from '@/hooks/useCommunityMessages';
import { ScheduleMessageModal } from './ScheduleMessageModal';
import { useScheduledMessages } from '@/hooks/useScheduledMessages';
import { format, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import { useCalendarCalls, CalendarCall } from '@/hooks/useCalendarCalls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PostComposerProps {
  channelId: string;
  sendMessage: { mutate: (input: SendMessageInput & { post_type?: string }) => void };
}

export const PostComposer = ({ channelId, sendMessage }: PostComposerProps) => {
  const { user } = useAuth();
  const { isAdmin, isCSM, isExecutive } = useRoleCheck();
  const isStaff = isAdmin || isCSM || isExecutive;
  const { createScheduledMessage } = useScheduledMessages(channelId);

  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'text' | 'event' | 'announcement'>('text');
  const [attachments, setAttachments] = useState<{ url: string; type: string; name: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [selectedCalendarCallId, setSelectedCalendarCallId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { calls: calendarCalls } = useCalendarCalls();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const name = userProfile
    ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || userProfile.user_email || 'You'
    : 'You';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, acceptVideo = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        // Video size limit: 50MB
        if (file.type.startsWith('video/') && file.size > 50 * 1024 * 1024) {
          toast.error('Video files must be under 50MB');
          continue;
        }
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data, error } = await supabase.storage.from('chat-attachments').upload(fileName, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(data.path);
        setAttachments(prev => [...prev, { url: urlData.publicUrl, type: file.type, name: file.name }]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePost = () => {
    const trimmed = content.trim();
    if (!trimmed && attachments.length === 0) return;

    const mappedAttachments = attachments.map(a => ({
      ...a,
      type: a.type.startsWith('image/') ? 'image' as const : a.type.startsWith('video/') ? 'file' as const : 'file' as const,
    }));

    // For events, store event metadata in attachments JSON
    let finalAttachments = mappedAttachments;
    if (postType === 'event' && (eventDate || eventLocation || selectedCalendarCallId)) {
      const eventMetaObj: any = { date: eventDate, time: eventTime, location: eventLocation };
      if (selectedCalendarCallId) eventMetaObj.calendar_call_id = selectedCalendarCallId;
      finalAttachments = [
        ...mappedAttachments,
        { url: '', type: 'event_meta' as any, name: JSON.stringify(eventMetaObj) },
      ];
    }

    sendMessage.mutate({
      content: trimmed,
      channel_id: channelId,
      attachments: finalAttachments.length > 0 ? finalAttachments : undefined,
      post_type: postType,
    });

    setContent('');
    setAttachments([]);
    setPostType('text');
    setEventDate('');
    setEventTime('');
    setEventLocation('');
    setSelectedCalendarCallId(null);
    setIsExpanded(false);
  };

  const handleScheduleConfirm = (data: {
    scheduled_at: string;
    timezone: string;
    is_recurring: boolean;
    recurrence_pattern?: string;
    recurrence_end_date?: string;
  }) => {
    if (!content.trim() && attachments.length === 0) return;
    const mappedAttachments = attachments.map(a => ({
      ...a,
      type: a.type.startsWith('image/') ? 'image' as const : 'file' as const,
    }));
    createScheduledMessage.mutate({
      content: content.trim(),
      channel_id: channelId,
      attachments: mappedAttachments.length > 0 ? mappedAttachments : undefined,
      scheduled_at: data.scheduled_at,
      timezone: data.timezone,
      is_recurring: data.is_recurring,
      recurrence_pattern: data.recurrence_pattern,
      recurrence_end_date: data.recurrence_end_date,
    }, {
      onSuccess: () => {
        toast.success(`Post scheduled for ${format(parseISO(data.scheduled_at), 'MMM d, h:mm a')}`);
        setContent('');
        setAttachments([]);
        setIsExpanded(false);
        setShowScheduleModal(false);
      },
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      {/* Collapsed state */}
      {!isExpanded ? (
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setIsExpanded(true); setTimeout(() => textareaRef.current?.focus(), 100); }}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={userProfile?.avatar_url || undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/80 transition-colors">
            What's on your mind?
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Author row */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userProfile?.avatar_url || undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground">{name}</p>
              {isStaff && (
                <div className="flex gap-1 mt-1">
                  {(['text', 'event', 'announcement'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setPostType(t)}
                      className={`text-xs px-2 py-0.5 rounded-full border transition-colors capitalize ${
                        postType === t
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Text area */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={
              postType === 'event' ? "What's the event about?" :
              postType === 'announcement' ? "Write your announcement..." :
              "What's on your mind?"
            }
            rows={3}
            className="w-full bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground resize-none"
          />

          {/* Event fields */}
          {postType === 'event' && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg border border-border">
              {/* Calendar event selector */}
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select
                  value={selectedCalendarCallId || 'manual'}
                  onValueChange={(val) => {
                    if (val === 'manual') {
                      setSelectedCalendarCallId(null);
                      return;
                    }
                    const call = calendarCalls.find(c => c.id === val);
                    if (call) {
                      setSelectedCalendarCallId(call.id);
                      setEventDate(call.call_date);
                      setEventTime(call.call_time);
                      setEventLocation(call.call_link || '');
                      if (!content.trim()) setContent(call.title);
                    }
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Link a calendar event (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual entry</SelectItem>
                    {calendarCalls.map(call => (
                      <SelectItem key={call.id} value={call.id}>
                        {call.title} — {format(new Date(call.call_date + 'T00:00:00'), 'MMM d')} at {call.call_time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Location / Link" value={eventLocation} onChange={e => setEventLocation(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
            </div>
          )}

          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((att, i) => (
                <div key={i} className="relative group">
                  {att.type.startsWith('image/') ? (
                    <img src={att.url} alt={att.name} className="h-20 w-20 object-cover rounded-lg border border-border" />
                  ) : att.type.startsWith('video/') ? (
                    <video src={att.url} className="h-20 w-32 object-cover rounded-lg border border-border" />
                  ) : (
                    <div className="h-20 px-3 flex items-center bg-muted rounded-lg border border-border">
                      <span className="text-xs truncate max-w-[80px]">{att.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="flex gap-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/mp4,video/mov,video/webm,.pdf,.doc,.docx"
                className="hidden"
                onChange={e => handleFileSelect(e, true)}
              />
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5" onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = 'image/*'; fileInputRef.current.click(); } }} disabled={isUploading}>
                <Image className="h-4 w-4 text-green-500" />
                <span className="text-xs">Photo</span>
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5" onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = 'video/mp4,video/mov,video/webm'; fileInputRef.current.click(); } }} disabled={isUploading}>
                <Video className="h-4 w-4 text-red-500" />
                <span className="text-xs">Video</span>
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5" onClick={() => setShowScheduleModal(true)}>
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-xs">Schedule</span>
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setIsExpanded(false); setContent(''); setAttachments([]); setPostType('text'); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handlePost} disabled={(!content.trim() && attachments.length === 0) || isUploading} className="gap-1.5">
                <Send className="h-4 w-4" />
                Post
              </Button>
            </div>
          </div>
        </div>
      )}

      <ScheduleMessageModal
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onConfirm={handleScheduleConfirm}
        messagePreview={content}
      />
    </div>
  );
};
