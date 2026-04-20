import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserManagementOverview } from "./customer-success/UserManagementOverview";
import { UserDetailsView } from "./customer-success/UserDetailsView";
import { CSMTicketDetail } from "@/components/csm/CSMTicketDetail";

interface CustomerSuccessDashboardProps {
  assignedStudentIds?: { ids: Set<string>; emails: Set<string> };
}

export const CustomerSuccessDashboard = ({ assignedStudentIds }: CustomerSuccessDashboardProps = {}) => {
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const handleViewUserDetails = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleBackToOverview = () => {
    navigate(-1);
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
      <UserManagementOverview onViewDetails={handleViewUserDetails} assignedStudentIds={assignedStudentIds} />
    </div>
  );
};
