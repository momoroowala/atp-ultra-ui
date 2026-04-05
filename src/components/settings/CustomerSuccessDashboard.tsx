import { useState } from "react";
import { UserManagementOverview } from "./customer-success/UserManagementOverview";
import { UserDetailsView } from "./customer-success/UserDetailsView";
import { CSMTicketDetail } from "@/components/csm/CSMTicketDetail";

export const CustomerSuccessDashboard = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const handleViewUserDetails = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleBackToOverview = () => {
    setSelectedUserId(null);
    setSelectedTicketId(null);
  };

  if (selectedTicketId) {
    return (
      <CSMTicketDetail
        ticketId={selectedTicketId}
        onBack={() => setSelectedTicketId(null)}
      />
    );
  }

  if (selectedUserId) {
    return (
      <UserDetailsView 
        userId={selectedUserId} 
        onBack={handleBackToOverview}
        onViewTicket={(id) => setSelectedTicketId(id)}
      />
    );
  }

  return (
    <div className="space-y-2">
      <UserManagementOverview onViewDetails={handleViewUserDetails} />
    </div>
  );
};
