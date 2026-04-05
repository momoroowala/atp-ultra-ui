import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { BrandLead, BrandLeadUpdate, LEAD_STATUSES } from '@/hooks/useBrandLeads';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNowStrict } from 'date-fns';
import type { UseMutationResult } from '@tanstack/react-query';
import { useTheme } from 'next-themes';

import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef, ICellRendererParams, CellClickedEvent } from 'ag-grid-community';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register all community modules once
ModuleRegistry.registerModules([AllCommunityModule]);

// Status sort order for logical pipeline ordering
const STATUS_ORDER: Record<string, number> = {
  'Email Sent': 0,
  '2 Email Sent': 1,
  'Phone Call': 2,
  'Approved': 3,
  'Not Approved': 4,
};

const statusColorMap: Record<string, string> = {
  'Email Sent': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  '2 Email Sent': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'Phone Call': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Approved': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'Not Approved': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

function relativeDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return formatDistanceToNowStrict(new Date(dateStr), { addSuffix: true });
  } catch {
    return '';
  }
}

interface LeadTableProps {
  leads: BrandLead[];
  onSelectLead: (lead: BrandLead) => void;
  onUpdateLead: (id: string, updates: BrandLeadUpdate) => void;
  onDeleteLead: (id: string) => void;
  createLead: UseMutationResult<BrandLead, any, any, any>;
  showClientActions: boolean;
}

// --- StatusPill with inline popover for editing ---
const StatusPill = ({ status, onChangeStatus }: { status: string; onChangeStatus: (s: string) => void }) => {
  const [open, setOpen] = useState(false);
  const colorClass = statusColorMap[status] || 'bg-muted text-muted-foreground';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-opacity hover:opacity-80',
            colorClass
          )}
        >
          {status}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="start" sideOffset={4}>
        <div className="flex flex-col">
          {LEAD_STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => { onChangeStatus(s.value); setOpen(false); }}
              className={cn(
                'flex items-center gap-2 w-full px-2.5 py-1.5 text-xs rounded-sm text-left transition-colors hover:bg-muted',
                s.value === status && 'bg-muted font-semibold'
              )}
            >
              <span className={cn('inline-block w-2 h-2 rounded-full', statusColorMap[s.value]?.split(' ')[0] || 'bg-muted')} />
              {s.value}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// --- Custom cell renderer: Status ---
const StatusCellRenderer = (props: ICellRendererParams<BrandLead>) => {
  const lead = props.data;
  if (!lead) return null;
  const onUpdateLead = props.context?.onUpdateLead as (id: string, updates: BrandLeadUpdate) => void;
  return (
    <StatusPill
      status={lead.status}
      onChangeStatus={(newStatus) => onUpdateLead?.(lead.id, { status: newStatus })}
    />
  );
};

// --- Custom cell renderer: Actions ---
const ActionsCellRenderer = (props: ICellRendererParams<BrandLead>) => {
  const lead = props.data;
  if (!lead) return null;
  const onSelectLead = props.context?.onSelectLead as (lead: BrandLead) => void;
  const onDeleteLead = props.context?.onDeleteLead as (id: string) => void;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem onClick={() => onSelectLead?.(lead)} className="gap-2 cursor-pointer">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDeleteLead?.(lead.id)} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// --- Custom cell renderer: Last Email (relative date) ---
const LastEmailCellRenderer = (props: ICellRendererParams<BrandLead>) => {
  const val = props.value as string | null;
  return <span className="text-sm text-muted-foreground">{relativeDate(val)}</span>;
};

export const LeadTable = ({ leads, onSelectLead, onUpdateLead, onDeleteLead, createLead, showClientActions }: LeadTableProps) => {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const gridRef = useRef<AgGridReact<BrandLead>>(null);

  const [addingRow, setAddingRow] = useState(false);
  const [newLead, setNewLead] = useState({ company_brand_name: '', contact_name: '', email: '' });
  const companyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingRow && companyInputRef.current) {
      companyInputRef.current.focus();
    }
  }, [addingRow]);

  const isDark = resolvedTheme === 'dark';

  // Pass callbacks through AG Grid context so cell renderers can access them
  const gridContext = useMemo(() => ({
    onSelectLead,
    onUpdateLead,
    onDeleteLead,
  }), [onSelectLead, onUpdateLead, onDeleteLead]);

  const columnDefs = useMemo<ColDef<BrandLead>[]>(() => [
    {
      headerName: 'Brand',
      field: 'company_brand_name',
      minWidth: 160,
      flex: 2,
      sort: 'asc',
      cellStyle: { fontWeight: 500 },
    },
    {
      headerName: 'Contact',
      field: 'contact_name',
      minWidth: 130,
      flex: 1.5,
      valueFormatter: (params) => params.value || '',
    },
    {
      headerName: 'Email',
      field: 'email',
      minWidth: 180,
      flex: 2,
      valueFormatter: (params) => params.value || '',
    },
    {
      headerName: 'Phone',
      field: 'phone',
      minWidth: 120,
      flex: 1,
      valueFormatter: (params) => params.value || '',
    },
    {
      headerName: 'Category',
      field: 'category',
      minWidth: 130,
      flex: 1.5,
      valueFormatter: (params) => params.value || '',
    },
    {
      headerName: 'Status',
      field: 'status',
      minWidth: 140,
      flex: 1,
      cellRenderer: StatusCellRenderer,
      comparator: (valueA: string, valueB: string) => {
        const a = STATUS_ORDER[valueA] ?? 99;
        const b = STATUS_ORDER[valueB] ?? 99;
        return a - b;
      },
    },
    {
      headerName: 'Last Email',
      field: 'last_email_sent_date',
      minWidth: 120,
      flex: 1,
      cellRenderer: LastEmailCellRenderer,
      comparator: (valueA: string | null, valueB: string | null) => {
        const a = valueA ? new Date(valueA).getTime() : 0;
        const b = valueB ? new Date(valueB).getTime() : 0;
        return a - b;
      },
    },
    {
      headerName: '',
      field: 'id',
      minWidth: 50,
      maxWidth: 50,
      sortable: false,
      resizable: false,
      cellRenderer: ActionsCellRenderer,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
    },
  ], []);

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    resizable: true,
  }), []);

  // Row click handler -- skip clicks on Status and Actions columns
  const onCellClicked = useCallback((event: CellClickedEvent<BrandLead>) => {
    const field = event.colDef.field;
    // Don't trigger row selection on status or actions columns
    if (field === 'status' || field === 'id') return;
    if (event.data) {
      onSelectLead(event.data);
    }
  }, [onSelectLead]);

  // Inline add handlers
  const handleInlineAdd = () => {
    if (!newLead.company_brand_name.trim() || !user?.id) return;
    createLead.mutate({
      user_id: user.id,
      company_brand_name: newLead.company_brand_name.trim(),
      contact_name: newLead.contact_name || null,
      email: newLead.email || null,
      phone: null,
      category: null,
      status: 'Email Sent',
      business_model: 'Brand',
      website: null,
      state: null,
      amazon_lead_product_url: null,
      notes: null,
      last_email_sent_date: null,
    });
    setNewLead({ company_brand_name: '', contact_name: '', email: '' });
    setAddingRow(false);
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInlineAdd();
    }
    if (e.key === 'Escape') {
      setAddingRow(false);
      setNewLead({ company_brand_name: '', contact_name: '', email: '' });
    }
  };

  return (
    <div className="w-full rounded-lg border border-border/50 overflow-hidden">
      <div
        className={cn(
          'w-full',
          isDark ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'
        )}
      >
        <AgGridReact<BrandLead>
          ref={gridRef}
          rowData={leads}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          context={gridContext}
          domLayout="autoHeight"
          onCellClicked={onCellClicked}
          rowHeight={48}
          headerHeight={40}
          getRowId={(params) => params.data.id}
          suppressCellFocus
          animateRows={false}
        />
      </div>

      {/* Inline add row below the grid */}
      {showClientActions && (
        addingRow ? (
          <div className="flex items-center h-12 border-t border-border/50 bg-muted/20 px-3 gap-2">
            <div className="flex-[2] min-w-[160px]">
              <Input
                ref={companyInputRef}
                value={newLead.company_brand_name}
                onChange={e => setNewLead(p => ({ ...p, company_brand_name: e.target.value }))}
                onKeyDown={handleInlineKeyDown}
                placeholder="Company / Brand Name *"
                className="h-8 text-sm"
              />
            </div>
            <div className="flex-[1.5] min-w-[130px]">
              <Input
                value={newLead.contact_name}
                onChange={e => setNewLead(p => ({ ...p, contact_name: e.target.value }))}
                onKeyDown={handleInlineKeyDown}
                placeholder="Contact name"
                className="h-8 text-sm"
              />
            </div>
            <div className="flex-[2] min-w-[180px]">
              <Input
                value={newLead.email}
                onChange={e => setNewLead(p => ({ ...p, email: e.target.value }))}
                onKeyDown={handleInlineKeyDown}
                placeholder="Email"
                className="h-8 text-sm"
              />
            </div>
            <div className="flex-[4] min-w-0 text-xs text-muted-foreground px-2">
              Press Enter to save, Esc to cancel
            </div>
            <button
              onClick={handleInlineAdd}
              disabled={!newLead.company_brand_name.trim() || createLead.isPending}
              className="text-xs text-primary font-medium hover:underline disabled:opacity-50 whitespace-nowrap"
            >
              {createLead.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        ) : (
          <div
            className="flex items-center h-12 border-t border-border/50 px-3 cursor-pointer hover:bg-muted/30 transition-colors group"
            onClick={() => setAddingRow(true)}
          >
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              <Plus className="h-4 w-4" />
              Add a lead...
            </span>
          </div>
        )
      )}
    </div>
  );
};
