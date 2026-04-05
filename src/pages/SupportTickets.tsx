import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { CSMTicketInbox } from '@/components/csm/CSMTicketInbox';
import { useMarkSupportNotificationsRead } from '@/hooks/useSupportNotifications';
import { useRoleCheck } from '@/hooks/useRoleCheck';

export default function SupportTickets() {
  const navigate = useNavigate();
  const markRead = useMarkSupportNotificationsRead();
  const { isMegaAdmin } = useRoleCheck();

  useEffect(() => { markRead.mutate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ticketViewMode = isMegaAdmin ? 'mega_admin' as const : 'admin' as const;

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="flex-shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold truncate">Support Tickets</h1>
                  <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">Manage and respond to support tickets</p>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {isMegaAdmin ? 'Developer' : 'Administrator'}
            </Badge>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 sm:px-6 py-6">
        <CSMTicketInbox viewMode={ticketViewMode} />
      </div>
    </div>
  );
}
