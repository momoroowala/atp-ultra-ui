import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TicketList } from '@/components/support/TicketList';
import { TicketDetail } from '@/components/support/TicketDetail';
import { NewTicketForm } from '@/components/support/NewTicketForm';
import { useTickets } from '@/hooks/useTickets';
import { useMarkSupportNotificationsRead } from '@/hooks/useSupportNotifications';

export default function Support() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('new');
  const { data, isLoading } = useTickets();
  const markRead = useMarkSupportNotificationsRead();

  // Deep-link from notification bell
  useEffect(() => {
    const ticketFromUrl = searchParams.get('ticket');
    if (ticketFromUrl) {
      setSelectedTicketId(ticketFromUrl);
      setActiveTab('tickets');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]); // re-run when query params change

  useEffect(() => { markRead.mutate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (selectedTicketId) {
    return (
      <div className="w-full p-4 md:p-6 overflow-y-auto flex-1">
        <TicketDetail ticketId={selectedTicketId} onBack={() => setSelectedTicketId(null)} />
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">Support</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="tickets">My Tickets</TabsTrigger>
          <TabsTrigger value="new">New Ticket</TabsTrigger>
        </TabsList>
        <TabsContent value="tickets">
          <TicketList tickets={data?.tickets || []} loading={isLoading} onSelect={setSelectedTicketId} />
        </TabsContent>
        <TabsContent value="new">
          <NewTicketForm onCreated={() => setActiveTab('tickets')} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
