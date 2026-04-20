import { useState, useMemo } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragOverlay, useDroppable,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Globe, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BrandLead } from '@/hooks/useBrandLeads';
import { LEAD_STATUSES } from '@/hooks/useBrandLeads';

// Pipeline stage order (left to right)
const PIPELINE_STAGES = [
  { value: 'Email Sent', color: 'border-blue-500/50', headerColor: 'text-blue-600 dark:text-blue-400', dotColor: 'bg-blue-500' },
  { value: '2 Email Sent', color: 'border-amber-500/50', headerColor: 'text-amber-600 dark:text-amber-400', dotColor: 'bg-amber-500' },
  { value: 'Phone Call', color: 'border-purple-500/50', headerColor: 'text-purple-600 dark:text-purple-400', dotColor: 'bg-purple-500' },
  { value: 'Approved', color: 'border-green-500/50', headerColor: 'text-green-600 dark:text-green-400', dotColor: 'bg-green-500' },
  { value: 'Not Approved', color: 'border-red-500/50', headerColor: 'text-red-600 dark:text-red-400', dotColor: 'bg-red-500' },
];

interface LeadPipelineProps {
  leads: BrandLead[];
  onSelectLead: (lead: BrandLead) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

// ── Drop zone column ──
function PipelineColumn({ stage, count, children }: {
  stage: typeof PIPELINE_STAGES[number];
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${stage.value}` });

  return (
    <div className="flex flex-col min-w-[220px] w-[220px] shrink-0">
      <div className="flex items-center gap-2 px-3 py-2 mb-2">
        <span className={cn("w-2 h-2 rounded-full shrink-0", stage.dotColor)} />
        <h3 className={cn("text-xs font-bold uppercase tracking-wider", stage.headerColor)}>
          {stage.value}
        </h3>
        <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 ml-auto">
          {count}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 rounded-lg p-2 min-h-[200px] transition-colors border border-transparent",
          isOver && "bg-primary/5 border-primary/20"
        )}
      >
        {count === 0 && !isOver && (
          <div className="rounded-lg border border-dashed border-border/40 bg-muted/10 p-6 text-center">
            <span className="text-[11px] text-muted-foreground/50">Drop leads here</span>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ── Draggable lead card ──
function DraggablePipelineCard({ lead, onSelect }: {
  lead: BrandLead;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const statusConfig = LEAD_STATUSES.find(s => s.value === lead.status);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-lg border bg-card p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow touch-none"
    >
      <div className="flex items-start justify-between gap-1.5 mb-1.5">
        <h4 className="text-sm font-semibold text-foreground line-clamp-1 flex-1">{lead.company_brand_name}</h4>
      </div>

      {lead.category && (
        <Badge variant="secondary" className="text-[9px] mb-1.5">{lead.category}</Badge>
      )}

      <div className="space-y-0.5 text-[11px] text-muted-foreground">
        {lead.contact_name && (
          <div className="flex items-center gap-1">
            <User className="h-2.5 w-2.5" /> <span className="truncate">{lead.contact_name}</span>
          </div>
        )}
        {lead.email && (
          <div className="flex items-center gap-1">
            <Mail className="h-2.5 w-2.5" /> <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-1">
            <Phone className="h-2.5 w-2.5" /> <span>{lead.phone}</span>
          </div>
        )}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className="mt-2 text-[10px] text-primary hover:underline"
      >
        View details
      </button>
    </div>
  );
}

// ── Main Pipeline Component ──
export function LeadPipeline({ leads, onSelectLead, onUpdateStatus }: LeadPipelineProps) {
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Group leads by status
  const stageGroups = useMemo(() => {
    const groups: Record<string, BrandLead[]> = {};
    PIPELINE_STAGES.forEach(s => { groups[s.value] = []; });
    leads.forEach(lead => {
      const stage = groups[lead.status] ? lead.status : 'Email Sent';
      groups[stage].push(lead);
    });
    return groups;
  }, [leads]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveLeadId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveLeadId(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const overId = over.id as string;

    // Determine target stage
    let targetStatus: string | null = null;

    if (overId.startsWith('stage-')) {
      targetStatus = overId.replace('stage-', '');
    } else {
      // Dropped on another card -- find that card's stage
      const overLead = leads.find(l => l.id === overId);
      if (overLead) targetStatus = overLead.status;
    }

    if (!targetStatus) return;

    // Check if status actually changed
    const currentLead = leads.find(l => l.id === leadId);
    if (!currentLead || currentLead.status === targetStatus) return;

    onUpdateStatus(leadId, targetStatus);
  };

  const activeLead = activeLeadId ? leads.find(l => l.id === activeLeadId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {PIPELINE_STAGES.map((stage) => {
            const stageLeads = stageGroups[stage.value] || [];
            return (
              <PipelineColumn key={stage.value} stage={stage} count={stageLeads.length}>
                <SortableContext items={stageLeads.map(l => l.id)} strategy={verticalListSortingStrategy}>
                  {stageLeads.map((lead) => (
                    <DraggablePipelineCard
                      key={lead.id}
                      lead={lead}
                      onSelect={() => onSelectLead(lead)}
                    />
                  ))}
                </SortableContext>
              </PipelineColumn>
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeLead && (
          <div className="rounded-lg border bg-card p-3 shadow-xl opacity-90 w-[200px]">
            <h4 className="text-sm font-semibold text-foreground line-clamp-1">{activeLead.company_brand_name}</h4>
            {activeLead.category && (
              <Badge variant="secondary" className="text-[9px] mt-1">{activeLead.category}</Badge>
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
