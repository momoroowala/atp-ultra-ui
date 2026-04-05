import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LEAD_CATEGORIES, LEAD_STATUSES } from '@/hooks/useBrandLeads';
import { Search } from 'lucide-react';

export interface FilterUser {
  id: string;
  label: string;
}

interface LeadFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (v: string) => void;
  // CSM filter (admin only)
  showCsmFilter?: boolean;
  csmFilter?: string;
  onCsmFilterChange?: (v: string) => void;
  csmList?: FilterUser[];
  // Student filter (admin + CSM)
  showStudentFilter?: boolean;
  studentFilter?: string;
  onStudentFilterChange?: (v: string) => void;
  studentList?: FilterUser[];
}

export const LeadFilters = ({
  search, onSearchChange,
  statusFilter, onStatusFilterChange,
  categoryFilter, onCategoryFilterChange,
  showCsmFilter, csmFilter, onCsmFilterChange, csmList = [],
  showStudentFilter, studentFilter, onStudentFilterChange, studentList = [],
}: LeadFiltersProps) => {
  return (
    <div className="flex flex-col gap-2">
      {/* Row 1: CSM + Student filters (staff only) */}
      {(showCsmFilter || showStudentFilter) && (
        <div className="flex flex-col sm:flex-row gap-2">
          {showCsmFilter && (
            <Select value={csmFilter || 'all'} onValueChange={onCsmFilterChange!}>
              <SelectTrigger className="w-full sm:w-[200px] h-10">
                <SelectValue placeholder="All CSMs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All CSMs</SelectItem>
                {csmList.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {showStudentFilter && (
            <Select value={studentFilter || 'all'} onValueChange={onStudentFilterChange!}>
              <SelectTrigger className="w-full sm:w-[220px] h-10">
                <SelectValue placeholder="All Students" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {studentList.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Row 2: Search + Status + Category */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-[160px] h-10">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {LEAD_STATUSES.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.value}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
          <SelectTrigger className="w-full sm:w-[200px] h-10">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {LEAD_CATEGORIES.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
