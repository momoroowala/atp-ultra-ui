import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import Papa from 'papaparse';

export interface UserListItem {
  id: string;
  email: string | null;
  name: string;
  created_at: string;
  last_login?: string | null;
  progress?: number;
  [key: string]: any;
}

export interface ColumnDef {
  key: string;
  label: string;
  format?: (value: any) => string;
}

interface UserListModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  users: UserListItem[];
  columns?: ColumnDef[];
}

const DEFAULT_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { 
    key: 'created_at', 
    label: 'Joined',
    format: (value) => value ? format(new Date(value), 'MMM d, yyyy') : '-'
  },
  { 
    key: 'last_login', 
    label: 'Last Login',
    format: (value) => value ? format(new Date(value), 'MMM d, yyyy') : 'Never'
  },
];

const ITEMS_PER_PAGE = 20;

export const UserListModal = ({
  open,
  onClose,
  title,
  users,
  columns = DEFAULT_COLUMNS,
}: UserListModalProps) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const lowerSearch = search.toLowerCase();
    return users.filter(user => 
      user.name.toLowerCase().includes(lowerSearch) ||
      (user.email?.toLowerCase().includes(lowerSearch))
    );
  }, [users, search]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const handleExport = () => {
    const exportData = filteredUsers.map(user => {
      const row: Record<string, any> = {};
      columns.forEach(col => {
        const value = user[col.key];
        row[col.label] = col.format ? col.format(value) : (value ?? '');
      });
      return row;
    });

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderCellValue = (user: UserListItem, column: ColumnDef) => {
    const value = user[column.key];
    if (column.format) {
      return column.format(value);
    }
    return value ?? '-';
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title} ({filteredUsers.length})</span>
            <Button variant="outline" size="sm" onClick={handleExport} className="mr-8">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(col => (
                  <TableHead key={col.key}>{col.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map(user => (
                  <TableRow key={user.id}>
                    {columns.map(col => (
                      <TableCell key={col.key}>
                        {renderCellValue(user, col)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
