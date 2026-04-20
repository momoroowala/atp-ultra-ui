import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { LEAD_STATUSES } from '@/hooks/useBrandLeads';
import type { BrandLead } from '@/hooks/useBrandLeads';
import { Card } from '@/components/ui/card';

interface LeadPipelineViewProps {
  leads: BrandLead[];
  onSelect: (lead: BrandLead) => void;
  onStatusChange: (id: string, newStatus: string, newSortOrder: number) => void;
  canDrag: boolean;
}

const COLUMN_DOT_COLORS: Record<string, string> = {
  'Email Sent': 'bg-blue-500',
  'Approved': 'bg-green-500',
  'Not Approved': 'bg-red-500',
  '2 Email Sent': 'bg-yellow-500',
  'Phone Call': 'bg-purple-500',
};

const COLUMN_BG_COLORS: Record<string, string> = {
  'Email Sent': 'bg-blue-50 dark:bg-blue-950/20',
  'Approved': 'bg-green-50 dark:bg-green-950/20',
  'Not Approved': 'bg-red-50 dark:bg-red-950/20',
  '2 Email Sent': 'bg-yellow-50 dark:bg-yellow-950/20',
  'Phone Call': 'bg-purple-50 dark:bg-purple-950/20',
};

// Sortable card
const SortableCard = ({ lead, onSelect, canDrag }: { lead: BrandLead; onSelect: () => void; canDrag: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    disabled: !canDrag,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...(canDrag ? listeners : {})}>
      <Card className="p-3 cursor-pointer hover:shadow-md transition-shadow bg-card">
        <p className="text-sm font-medium text-foreground truncate">{lead.company_brand_name}</p>
        {lead.contact_name && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{lead.contact_name}</p>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className="text-[10px] text-primary hover:underline mt-1.5 block"
        >
          View details
        </button>
      </Card>
    </div>
  );
};

// Droppable column
const Column = ({ status, leads, onSelect, canDrag }: {
  status: typeof LEAD_STATUSES[number];
  leads: BrandLead[];
  onSelect: (lead: BrandLead) => void;
  canDrag: boolean;
}) => {
  const { setNodeRef } = useDroppable({ id: status.value });

  return (
    <div className={`flex flex-col rounded-lg flex-1 min-w-[180px] ${COLUMN_BG_COLORS[status.value] || 'bg-muted/30'}`}>
      <div className="px-3 py-2.5 flex items-center gap-2 border-b border-border/30">
        <div className={`h-2.5 w-2.5 rounded-full ${COLUMN_DOT_COLORS[status.value] || 'bg-muted-foreground'}`} />
        <span className="text-xs font-semibold text-foreground">{status.value}</span>
        <span className="text-[10px] text-muted-foreground font-medium ml-auto">{leads.length}</span>
      </div>
      <div ref={setNodeRef} className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[100px]">
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map(lead => (
            <SortableCard key={lead.id} lead={lead} onSelect={() => onSelect(lead)} canDrag={canDrag} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

export const LeadPipelineView = ({ leads, onSelect, onStatusChange, canDrag }: LeadPipelineViewProps) => {
  // Local state for optimistic reordering
  const [localLeads, setLocalLeads] = useState<BrandLead[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const effectiveLeads = localLeads ?? leads;

  // Reset local state when leads change from server
  useMemo(() => { setLocalLeads(null); }, [leads]);

  const columnLeads = useMemo(() => {
    const map: Record<string, BrandLead[]> = {};
    for (const s of LEAD_STATUSES) {
      map[s.value] = effectiveLeads
        .filter(l => l.status === s.value)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }
    return map;
  }, [effectiveLeads]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const activeLead = activeId ? effectiveLeads.find(l => l.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    if (!localLeads) setLocalLeads([...leads]);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !localLeads) return;

    const activeLeadObj = localLeads.find(l => l.id === active.id);
    if (!activeLeadObj) return;

    // Determine target status
    let targetStatus: string;
    const overLead = localLeads.find(l => l.id === over.id);
    if (overLead) {
      targetStatus = overLead.status;
    } else {
      // over.id is a column droppable id (status value)
      targetStatus = over.id as string;
    }

    if (activeLeadObj.status !== targetStatus) {
      setLocalLeads(prev => {
        if (!prev) return prev;
        return prev.map(l => l.id === active.id ? { ...l, status: targetStatus } : l);
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !localLeads) {
      setLocalLeads(null);
      return;
    }

    const activeLeadObj = localLeads.find(l => l.id === active.id);
    if (!activeLeadObj) { setLocalLeads(null); return; }

    // Determine target status
    let targetStatus = activeLeadObj.status;
    const overLead = localLeads.find(l => l.id === over.id);
    if (overLead) {
      targetStatus = overLead.status;
    } else if (LEAD_STATUSES.some(s => s.value === over.id)) {
      targetStatus = over.id as string;
    }

    // Get column items in current order
    let columnItems = localLeads
      .filter(l => l.status === targetStatus)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    // If reordering within same column
    const oldIdx = columnItems.findIndex(l => l.id === active.id);
    const newIdx = overLead ? columnItems.findIndex(l => l.id === over.id) : columnItems.length - 1;

    if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
      columnItems = arrayMove(columnItems, oldIdx, newIdx);
    }

    // Compute sort_order for the active lead
    const finalIdx = columnItems.findIndex(l => l.id === active.id);
    const newSortOrder = finalIdx >= 0 ? finalIdx : 0;

    // Update local state with new sort orders
    const updatedLeads = localLeads.map(l => {
      const idxInCol = columnItems.findIndex(c => c.id === l.id);
      if (idxInCol >= 0) {
        return { ...l, status: targetStatus, sort_order: idxInCol };
      }
      return l;
    });
    setLocalLeads(updatedLeads);

    // Persist the change
    onStatusChange(active.id as string, targetStatus, newSortOrder);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 340px)' }}>
        {LEAD_STATUSES.map(s => (
          <Column
            key={s.value}
            status={s}
            leads={columnLeads[s.value] || []}
            onSelect={onSelect}
            canDrag={canDrag}
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? (
          <Card className="p-3 shadow-xl bg-card w-[200px]">
            <p className="text-sm font-medium text-foreground truncate">{activeLead.company_brand_name}</p>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
