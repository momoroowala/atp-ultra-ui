import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LEAD_STATUSES } from '@/hooks/useBrandLeads';
import type { BrandLead } from '@/hooks/useBrandLeads';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpDown } from 'lucide-react';

type SortKey = 'company_brand_name' | 'contact_name' | 'email' | 'phone' | 'category' | 'status' | 'last_email_sent_date';

interface LeadTableViewProps {
  leads: BrandLead[];
  onSelect: (lead: BrandLead) => void;
}

export const LeadTableView = ({ leads, onSelect }: LeadTableViewProps) => {
  const [sortKey, setSortKey] = useState<SortKey>('company_brand_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    return [...leads].sort((a, b) => {
      const aVal = (a[sortKey] || '') as string;
      const bVal = (b[sortKey] || '') as string;
      const cmp = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [leads, sortKey, sortDir]);

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <TableHead
      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
      </div>
    </TableHead>
  );

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <SortHeader label="Brand" field="company_brand_name" />
            <SortHeader label="Contact" field="contact_name" />
            <SortHeader label="Email" field="email" />
            <SortHeader label="Phone" field="phone" />
            <SortHeader label="Category" field="category" />
            <SortHeader label="Status" field="status" />
            <SortHeader label="Last Email" field="last_email_sent_date" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No leads match your filters
              </TableCell>
            </TableRow>
          ) : (
            sorted.map(lead => {
              const statusConfig = LEAD_STATUSES.find(s => s.value === lead.status);
              return (
                <TableRow
                  key={lead.id}
                  onClick={() => onSelect(lead)}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium">{lead.company_brand_name}</TableCell>
                  <TableCell>{lead.contact_name || '—'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{lead.email || '—'}</TableCell>
                  <TableCell>{lead.phone || '—'}</TableCell>
                  <TableCell>
                    {lead.category ? (
                      <Badge variant="secondary" className="text-[10px]">{lead.category}</Badge>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${statusConfig?.color || ''}`}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {lead.last_email_sent_date
                      ? formatDistanceToNow(new Date(lead.last_email_sent_date), { addSuffix: true })
                      : '—'}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
