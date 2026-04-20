import { BrandLead, LEAD_STATUSES } from '@/hooks/useBrandLeads';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Globe, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

interface LeadCardProps {
  lead: BrandLead;
  onClick: () => void;
}

export const LeadCard = ({ lead, onClick }: LeadCardProps) => {
  const statusConfig = LEAD_STATUSES.find(s => s.value === lead.status);

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer p-4 hover:shadow-lg transition-all duration-200 border-border/50"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-foreground text-sm line-clamp-1">{lead.company_brand_name}</h3>
        <Badge variant="outline" className={`text-[10px] shrink-0 ${statusConfig?.color || ''}`}>
          {lead.status}
        </Badge>
      </div>

      {lead.owner_name && (
        <div className="flex items-center gap-1.5 mb-2">
          <User className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-medium text-primary">{lead.owner_name}</span>
        </div>
      )}

      {lead.category && (
        <Badge variant="secondary" className="text-[10px] mb-2">{lead.category}</Badge>
      )}

      <div className="space-y-1 text-xs text-muted-foreground">
        {lead.contact_name && <p className="font-medium text-foreground/80">{lead.contact_name}</p>}
        {lead.email && (
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3" /> <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3" /> <span>{lead.phone}</span>
          </div>
        )}
        {lead.website && (
          <div className="flex items-center gap-1.5">
            <Globe className="h-3 w-3" /> <span className="truncate">{lead.website}</span>
          </div>
        )}
        {lead.last_email_sent_date && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" /> <span>Last email: {format(new Date(lead.last_email_sent_date), 'MMM d, yyyy')}</span>
          </div>
        )}
      </div>
    </Card>
  );
};
