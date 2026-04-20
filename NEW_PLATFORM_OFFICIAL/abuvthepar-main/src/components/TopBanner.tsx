import { useAuth } from '@/hooks/useAuth';
import { useCourses } from '@/hooks/useCourses';
import { useCourseTaskProgress } from '@/hooks/useCourseTaskProgress';
import { useLoginStreak } from '@/hooks/useLoginStreak';
import { useUserTier } from '@/hooks/useUserTier';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Bell, User, Settings, LogOut, AlertTriangle, MessageSquare, AtSign, MessageCircle, Users, ClipboardList } from 'lucide-react';
import { useChatModeration } from '@/hooks/useChatModeration';
import { useSupportNotificationCount, useMarkSupportNotificationsRead } from '@/hooks/useSupportNotifications';
import { useSupportNotificationItems } from '@/hooks/useSupportNotificationItems';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ThemeToggle } from './ThemeToggle';
import { useNavigate } from 'react-router-dom';
import eecLogo from '@/assets/eec-logo-new.png';
import { formatDistanceToNow } from 'date-fns';
import { useBellNotifications } from '@/hooks/useBellNotifications';

const useCourseProgress = (courseId: string | undefined) => {
  return useCourseTaskProgress(courseId);
};

export const TopBanner = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { isCSM } = useRoleCheck();
  const navigate = useNavigate();
  const { data: courses } = useCourses();
  const { currentStreak } = useLoginStreak();
  const { tierName } = useUserTier();
  const { flaggedMessages } = useChatModeration();
  const { count: supportCount } = useSupportNotificationCount();
  const { data: supportItems } = useSupportNotificationItems();
  const markRead = useMarkSupportNotificationsRead();
  const { mentions, unreadDMs, totalCount: bellNotifCount, markBellRead, csmDigest, actionItemReminders } = useBellNotifications();

  const canSeeFlagged = isAdmin || isCSM;
  const flaggedCount = canSeeFlagged ? (flaggedMessages?.length || 0) : 0;
  const totalBadgeCount = flaggedCount + (supportCount || 0) + bellNotifCount;

  // Merge all notification types into a single sorted list (newest first)
  const allNotifications = [
    ...mentions.map((m) => ({ ...m, _type: 'mention' as const })),
    ...unreadDMs.map((dm) => ({ ...dm, _type: 'dm' as const })),
    ...(supportItems || []).map((s) => ({ ...s, _type: 'support' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const accessibleCourses = courses?.filter((c) => c.hasAccess) || [];

  // Parallel progress hooks (same pattern as OverallProgress)
  const c1 = useCourseProgress(accessibleCourses[0]?.id);
  const c2 = useCourseProgress(accessibleCourses[1]?.id);
  const c3 = useCourseProgress(accessibleCourses[2]?.id);
  const c4 = useCourseProgress(accessibleCourses[3]?.id);
  const c5 = useCourseProgress(accessibleCourses[4]?.id);

  const progressResults = [c1, c2, c3, c4, c5].slice(0, accessibleCourses.length);

  let totalCompletedPhases = 0;
  let totalPhases = 0;

  progressResults.forEach((r) => {
    if (r.data) {
      const completed = r.data.tasksByPhase?.filter(
        (p) => p.totalTasks > 0 && p.completedTasks === p.totalTasks
      ).length || 0;
      const phases = r.data.phases?.length || 0;
      totalCompletedPhases += completed;
      totalPhases += phases;
    }
  });

  const progressPercent = totalPhases > 0 ? Math.round((totalCompletedPhases / totalPhases) * 100) : 0;

  // User profile
  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, avatar_url')
        .eq('id', user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user,
  });

  const displayName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User'
    : 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleBellOpen = (open: boolean) => {
    if (!open) {
      // Mark as read on close so user can see items while popover is open
      if (supportCount > 0) markRead.mutate();
      if (bellNotifCount > 0) markBellRead();
    }
  };

  return (
    <div className="hidden md:flex items-center justify-between px-4 py-1.5 bg-sidebar text-sidebar-foreground h-11 shrink-0 fixed top-0 left-0 w-full z-50">
      {/* Left: Logo + Brand */}
      <div className="flex items-center gap-2.5 min-w-0">
        <img src={eecLogo} alt="EEC Logo" className="h-7 w-7 rounded-md object-contain" />
        <span className="text-sm font-bold tracking-wider uppercase whitespace-nowrap">
          Elite E-Commerce
        </span>
      </div>

      {/* Center: Module progress */}
      <div className="flex items-center gap-4 flex-1 max-w-md mx-8">
        <span className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap opacity-80">
          Module {totalCompletedPhases} of {totalPhases}
        </span>
        <div className="flex items-center gap-2.5 flex-1">
          <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 relative overflow-hidden"
              style={{
                width: `${progressPercent}%`,
                background: 'radial-gradient(160.59% 161.46% at 50% 0%, #2D8F64 0%, #6EDAA6 100%), #55BD8A',
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(288deg, rgb(0 0 0 / 0%), #0f172a00 6px, rgba(255, 255, 255, 0.15) 6px, rgba(255, 255, 255, 0.15) 9px)',
                }}
              />
            </div>
          </div>
          <span className="text-xs font-bold min-w-[2.5rem] text-right">{progressPercent}%</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Days active pill */}
        <div className="flex items-center gap-1.5 bg-primary/20 text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span>{currentStreak} days active</span>
        </div>

        {/* Theme toggle */}
        <ThemeToggle className="h-7 w-7 text-sidebar-foreground" />

        {/* Bell notifications popover */}
        <Popover onOpenChange={handleBellOpen}>
          <PopoverTrigger asChild>
            <button className="relative p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <Bell className="h-4 w-4 opacity-70" />
              {totalBadgeCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                  {totalBadgeCount > 9 ? '9+' : totalBadgeCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 z-[60]">
            <div className="px-4 py-3 border-b border-border">
              <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {/* Flagged messages (admin + CSM) */}
              {flaggedCount > 0 && (
                <button
                  onClick={() => navigate('/settings?tab=chat-moderation')}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50"
                >
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {flaggedCount} flagged message{flaggedCount > 1 ? 's' : ''} to review
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Open Chat Moderation
                    </p>
                  </div>
                </button>
              )}

              {/* CSM Daily Digest */}
              {csmDigest && csmDigest.totalCount > 0 && (
                <button
                  onClick={() => navigate('/csm-panel')}
                  className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50 ${csmDigest.isRead ? 'opacity-50' : ''}`}
                >
                  <Users className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      Daily Student Summary
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {csmDigest.neverLoggedInCount > 0 && `${csmDigest.neverLoggedInCount} Never Logged In`}
                      {csmDigest.neverLoggedInCount > 0 && (csmDigest.doaCount > 0 || csmDigest.atRiskCount > 0) && ' · '}
                      {csmDigest.doaCount > 0 && `${csmDigest.doaCount} DOA`}
                      {csmDigest.doaCount > 0 && csmDigest.atRiskCount > 0 && ' · '}
                      {csmDigest.atRiskCount > 0 && `${csmDigest.atRiskCount} At Risk`}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {csmDigest.totalCount} student{csmDigest.totalCount !== 1 ? 's' : ''} need attention
                    </p>
                  </div>
                </button>
              )}

              {/* All notifications sorted by newest */}
              {allNotifications.map((item) => {
                if (item._type === 'mention') {
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/community/${item.channel_id}`)}
                      className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50 ${item.isRead ? 'opacity-50' : ''}`}
                    >
                      <AtSign className="h-5 w-5 text-accent-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.sender_name} mentioned you in #{item.channel_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {item.content}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </button>
                  );
                }
                if (item._type === 'dm') {
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/1on1s/${item.dm_conversation_id}`)}
                      className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50 ${item.isRead ? 'opacity-50' : ''}`}
                    >
                      <MessageCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.sender_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {item.content}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </button>
                  );
                }
                // support
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/support?ticket=${item.ticket_id}`)}
                    className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50 ${item.is_read ? 'opacity-50' : ''}`}
                  >
                    <MessageSquare className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.message || item.notification_type}
                      </p>
                      {item.ticket_subject && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {item.ticket_subject}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                );
              })}

              {/* Action item reminders */}
              {actionItemReminders.length > 0 && actionItemReminders.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate('/csm-panel')}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50"
                >
                  <ClipboardList className={`h-5 w-5 shrink-0 mt-0.5 ${item.urgency === 'overdue' ? 'text-destructive' : 'text-amber-500'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.urgency === 'overdue' ? 'Overdue' : item.urgency === 'due_today' ? 'Due today' : 'Due tomorrow'}: {item.text}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      Student: {item.student_name}
                    </p>
                  </div>
                </button>
              ))}

              {/* Empty state */}
              {flaggedCount === 0 && allNotifications.length === 0 && (!csmDigest || csmDigest.totalCount === 0) && actionItemReminders.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* User avatar + dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
              <Avatar className="h-7 w-7 border border-white/20">
                <AvatarImage src={profile?.avatar_url || ''} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-semibold">{displayName}</span>
                {tierName && (
                  <span className="text-[10px] opacity-60 uppercase tracking-wider">{tierName}</span>
                )}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 z-[60]">
            <DropdownMenuItem onClick={() => navigate('/my-profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Admin Settings
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={async () => { await signOut(); navigate('/auth'); }}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
