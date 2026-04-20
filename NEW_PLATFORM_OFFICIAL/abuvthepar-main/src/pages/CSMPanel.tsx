import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

import { Headphones, GraduationCap, LayoutDashboard, UserCheck } from 'lucide-react';
import { CSMTicketInbox } from '@/components/csm/CSMTicketInbox';
import { CustomerSuccessDashboard } from '@/components/settings/CustomerSuccessDashboard';

import { CSMDelegationPanel } from '@/components/csm/CSMDelegationPanel';
import { CSMDashboardTab } from '@/components/csm/CSMDashboardTab';
import { CSMTicketDetail } from '@/components/csm/CSMTicketDetail';
import { CSMMyChats } from '@/components/csm/CSMMyChats';
import { useMarkSupportNotificationsRead } from '@/hooks/useSupportNotifications';
import { useAuth } from '@/hooks/useAuth';

import { useMyAssignedStudentIds } from '@/hooks/useMyAssignedStudentIds';
import { useMyDelegation } from '@/hooks/useCSMDelegations';
import { format } from 'date-fns';
import { useUnreadDMCount } from '@/hooks/useUnreadDMCount';

export default function CSMPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const markRead = useMarkSupportNotificationsRead();
  const { user } = useAuth();

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const { data: assignedStudents } = useMyAssignedStudentIds();
  const { data: delegation } = useMyDelegation();
  const coveringFor = delegation?.asDelegate;
  const unreadChatCount = useUnreadDMCount();

  useEffect(() => { markRead.mutate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (selectedTicketId) {
    return (
      <main className="flex-1 overflow-auto bg-content">
        <div className="container mx-auto px-4 md:px-6 py-5">
          <CSMTicketDetail
            ticketId={selectedTicketId}
            onBack={() => setSelectedTicketId(null)}
            viewMode="csm"
          />
        </div>
      </main>
    );
  }

  const isStudentRelatedTab = ['students'].includes(activeTab);

  return (
    <main className="flex-1 overflow-auto bg-content">
      <div className="container mx-auto px-4 md:px-6 py-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Headphones className="w-6 h-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">CSM Panel</h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary">CSM</Badge>
          </div>
          <CSMDelegationPanel />
        </div>

        {isStudentRelatedTab && coveringFor && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary shrink-0" />
            Covering for <strong>{coveringFor.original_csm?.first_name} {coveringFor.original_csm?.last_name}</strong> until{' '}
            <strong>{coveringFor.end_date ? format(new Date(coveringFor.end_date), 'MMM d, yyyy') : ''}</strong>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 justify-start overflow-x-auto overflow-y-hidden flex-nowrap">
            <TabsTrigger value="dashboard" className="gap-1.5 shrink-0">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-1.5 shrink-0">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Students</span>
            </TabsTrigger>
            <TabsTrigger value="communications" className="gap-1.5 relative shrink-0">
              <Headphones className="h-4 w-4" />
              <span className="hidden sm:inline">Communications</span>
              {unreadChatCount > 0 && (
                <span className="absolute -top-1.5 -right-1 z-20 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {unreadChatCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <CSMDashboardTab onNavigateToStudents={() => setActiveTab('my-students')} />
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <CustomerSuccessDashboard assignedStudentIds={assignedStudents} />
          </TabsContent>

          <TabsContent value="communications" className="space-y-4">
            <Tabs defaultValue="chats" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="chats" className="gap-1.5 relative">
                  <Headphones className="h-4 w-4" />
                  Chats
                  {unreadChatCount > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                      {unreadChatCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="support-inbox" className="gap-1.5">
                  <Headphones className="h-4 w-4" />
                  Support Inbox
                </TabsTrigger>
              </TabsList>
              <TabsContent value="chats" className="space-y-4">
                <CSMMyChats />
              </TabsContent>
              <TabsContent value="support-inbox" className="space-y-4">
                <CSMTicketInbox viewMode="csm" assignedStudentIds={assignedStudents} />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}