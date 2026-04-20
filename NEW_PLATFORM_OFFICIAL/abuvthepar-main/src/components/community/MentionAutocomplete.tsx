import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

interface MentionAutocompleteProps {
  search: string;
  onSelect: (userId: string, userName: string) => void;
  onClose: () => void;
}

export const MentionAutocomplete = ({ search, onSelect, onClose }: MentionAutocompleteProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('user_public_profiles')
          .select('id, first_name, last_name, avatar_url')
          .eq('is_active', true)
          .order('first_name', { ascending: true })
          .order('last_name', { ascending: true })
          .limit(20);

        if (search) {
          query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        setUsers(data || []);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 200);
    return () => clearTimeout(debounce);
  }, [search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, users.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && users.length > 0) {
        e.preventDefault();
        const user = users[selectedIndex];
        const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown';
        onSelect(user.id, name);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [users, selectedIndex, onSelect, onClose]);

  if (users.length === 0 && !isLoading) {
    return (
      <div className="absolute bottom-full left-0 mb-2 w-64 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
        <div className="px-3 py-2 text-sm text-muted-foreground">No users found</div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-full left-0 mb-2 w-64 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
      <ScrollArea className="max-h-80">
        <div className="p-1">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>
          ) : (
            users.map((user, index) => {
              const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User';
              const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

              return (
                <div
                  key={user.id}
                  className={`
                    flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md
                    ${index === selectedIndex ? 'bg-primary/10' : 'hover:bg-muted'}
                  `}
                  onClick={() => onSelect(user.id, name)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium truncate">{name}</span>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
