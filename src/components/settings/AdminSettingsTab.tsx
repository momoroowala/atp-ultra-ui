import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, BookOpen, Calendar, Trophy } from 'lucide-react';

export const AdminSettingsTab = () => {
  const queryClient = useQueryClient();

  const { data: announcements, isLoading: announcementsLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: homework, isLoading: homeworkLoading } = useQuery({
    queryKey: ['homework'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homework_assignments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('event_date', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leaderboard_cache')
        .select('*')
        .order('rank', { ascending: true })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const createAnnouncement = useMutation({
    mutationFn: async (data: { title: string; content: string; is_pinned: boolean }) => {
      const { error } = await supabase
        .from('announcements')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Announcement created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Announcement deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="space-y-6">
      {/* Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Announcements
          </CardTitle>
          <CardDescription>
            Create and manage platform-wide announcements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {announcementsLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-3">
              {announcements?.map((announcement) => (
                <div
                  key={announcement.id}
                  className="flex items-start justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{announcement.title}</h4>
                      {announcement.is_pinned && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          Pinned
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {announcement.content}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAnnouncement.mutate(announcement.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createAnnouncement.mutate({
                title: formData.get('title') as string,
                content: formData.get('content') as string,
                is_pinned: formData.get('is_pinned') === 'on',
              });
              e.currentTarget.reset();
            }}
            className="space-y-4 pt-4 border-t"
          >
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" name="content" required />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is_pinned" name="is_pinned" />
              <Label htmlFor="is_pinned">Pin this announcement</Label>
            </div>
            <Button type="submit">Create Announcement</Button>
          </form>
        </CardContent>
      </Card>

      {/* Homework Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Homework Assignments
          </CardTitle>
          <CardDescription>
            Manage homework and exam assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {homeworkLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-3">
              {homework?.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border bg-card space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{item.title}</h4>
                    <div className="flex items-center gap-2">
                      {item.is_exam && (
                        <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">
                          Exam
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {item.points_value} pts
                      </span>
                    </div>
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                  {item.due_date && (
                    <p className="text-xs text-muted-foreground">
                      Due: {new Date(item.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Events
          </CardTitle>
          <CardDescription>
            Manage upcoming community calls and events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-3">
              {events?.map((event) => (
                <div
                  key={event.id}
                  className="p-4 rounded-lg border bg-card space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{event.title}</h4>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      {event.event_type}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-muted-foreground">
                      {event.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.event_date).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gamification Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Leaderboard
          </CardTitle>
          <CardDescription>
            Top performing users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboard?.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg w-8">#{entry.rank}</span>
                  <span className="text-sm">User {entry.user_id.slice(0, 8)}...</span>
                </div>
                <span className="font-semibold text-primary">{entry.total_points} pts</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
