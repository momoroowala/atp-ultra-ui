import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { X, UserPlus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAllUsers } from "@/hooks/useAllUsers";

interface UserCourseAccessManagerProps {
  courseId: string;
}

export const UserCourseAccessManager = ({ courseId }: UserCourseAccessManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all users
  const { data: allUsers, isLoading: isLoadingUsers } = useAllUsers();

  // Fetch users with access to this course
  const { data: usersWithAccess, isLoading: isLoadingAccess } = useQuery({
    queryKey: ['user-course-access', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_course_access')
        .select('user_id')
        .eq('course_id', courseId);

      if (error) throw error;
      return (data || []).map(d => d.user_id);
    },
  });

  // Filter and sort users
  const displayedUsers = useMemo(() => {
    if (!allUsers) return [];
    
    const accessSet = new Set(usersWithAccess || []);
    
    // Filter by search term
    let filtered = allUsers.filter(user => {
      if (!searchTerm.trim()) return true;
      const search = searchTerm.toLowerCase();
      const email = user.user_email?.toLowerCase() || '';
      const firstName = user.first_name?.toLowerCase() || '';
      const lastName = user.last_name?.toLowerCase() || '';
      return email.includes(search) || firstName.includes(search) || lastName.includes(search);
    });

    // Sort: users with access first, then by name
    return filtered.sort((a, b) => {
      const aHasAccess = accessSet.has(a.id);
      const bHasAccess = accessSet.has(b.id);
      
      if (aHasAccess !== bHasAccess) {
        return aHasAccess ? -1 : 1;
      }
      
      // Sort by name
      const aName = `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.user_email;
      const bName = `${b.first_name || ''} ${b.last_name || ''}`.trim() || b.user_email;
      return aName.localeCompare(bName);
    });
  }, [allUsers, usersWithAccess, searchTerm]);

  const getUserName = (user: typeof allUsers[0]) => {
    if (!user) return '';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    return `${firstName} ${lastName}`.trim() || user.user_email;
  };

  // Grant access mutation
  const grantAccess = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('user_course_access')
        .insert({
          user_id: userId,
          course_id: courseId,
          granted_by: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-course-access', courseId] });
      toast({ title: "Access granted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to grant access",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Revoke access mutation
  const revokeAccess = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_course_access')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-course-access', courseId] });
      toast({ title: "Access revoked successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to revoke access",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading = isLoadingUsers || isLoadingAccess;
  const accessSet = new Set(usersWithAccess || []);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2">Manage User Access</h3>
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-3"
        />

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading users...</p>
        ) : (
          <ScrollArea className="h-[400px] border rounded-md">
            <div className="p-2 space-y-1">
              {displayedUsers.map((user) => {
                const hasAccess = accessSet.has(user.id);
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{getUserName(user)}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.user_email}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={hasAccess ? "destructive" : "default"}
                      onClick={() => hasAccess ? revokeAccess.mutate(user.id) : grantAccess.mutate(user.id)}
                      disabled={grantAccess.isPending || revokeAccess.isPending}
                    >
                      {hasAccess ? (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          Revoke
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3 w-3 mr-1" />
                          Grant
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
              {displayedUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No users found
                </p>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};