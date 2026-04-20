import { useState, useMemo } from 'react';
import { useBrandLeads } from '@/hooks/useBrandLeads';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { useCSMList } from '@/hooks/useCSMStudents';
import { useBrandLeadStudents } from '@/hooks/useBrandLeadStudents';
import { LeadCard } from '@/components/brand-leads/LeadCard';
import { LeadFilters, FilterUser } from '@/components/brand-leads/LeadFilters';
import { LeadStatusSummary } from '@/components/brand-leads/LeadStatusSummary';
import { LeadTableView } from '@/components/brand-leads/LeadTableView';
import { LeadPipelineView } from '@/components/brand-leads/LeadPipelineView';
import { AddLeadDialog } from '@/components/brand-leads/AddLeadDialog';
import { LeadDetailSheet } from '@/components/brand-leads/LeadDetailSheet';
import { BrandLeadsInstructions } from '@/components/brand-leads/BrandLeadsInstructions';
import { BulkImportDialog } from '@/components/brand-leads/BulkImportDialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, Info, Target, Lightbulb, X, Trophy, Upload, LayoutGrid, Table2, Columns3 } from 'lucide-react';
import { MobileLogoHeader } from '@/components/MobileLogoHeader';
import type { BrandLead } from '@/hooks/useBrandLeads';

const LEAD_GOAL = 100;
const TIP_DISMISSED_KEY = 'brand_leads_tip_dismissed';

type ViewMode = 'cards' | 'table' | 'pipeline';

const BrandLeads = () => {
  const { isAdmin, isMegaAdmin, isCSM, isClient } = useRoleCheck();
  const isStaff = isAdmin || isMegaAdmin || isCSM;
  const isCsmOnly = isCSM && !isAdmin && !isMegaAdmin;

  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [csmFilter, setCsmFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('all');

  // --- Lightweight student list (replaces 2x useCSMStudents + useMyAssignedStudentIds) ---
  const studentCsmId = useMemo(() => {
    if (isCsmOnly) return undefined; // hook will use current user
    if ((isAdmin || isMegaAdmin) && csmFilter !== 'all') return csmFilter;
    return undefined;
  }, [isCsmOnly, isAdmin, isMegaAdmin, csmFilter]);

  const shouldFetchStudents = isCsmOnly || ((isAdmin || isMegaAdmin) && csmFilter !== 'all');

  const { students, studentIds, profileMap, isLoading: studentsLoading } = useBrandLeadStudents({
    csmId: studentCsmId,
    enabled: shouldFetchStudents,
  });

  // CSM list for admin filter dropdown (already optimized with server-side role filter)
  const { data: csmListData = [] } = useCSMList();

  const effectiveStudentList = useMemo<FilterUser[]>(() => {
    if (!shouldFetchStudents) return [];
    return students.map(s => ({ id: s.id, label: `${s.firstName} ${s.lastName}`.trim() || s.email }));
  }, [shouldFetchStudents, students]);

  const csmList = useMemo<FilterUser[]>(() => {
    return csmListData.map(c => ({ id: c.id, label: `${c.firstName} ${c.lastName}`.trim() || c.email }));
  }, [csmListData]);

  const userIds = useMemo<string[] | undefined>(() => {
    if (isClient && !isStaff) return undefined;
    if (isCsmOnly) {
      if (studentFilter !== 'all') return [studentFilter];
      if (studentIds.size > 0) return Array.from(studentIds);
      return [];
    }
    if (isAdmin || isMegaAdmin) {
      if (studentFilter !== 'all') return [studentFilter];
      if (csmFilter !== 'all') return students.map(s => s.id);
      return undefined;
    }
    return undefined;
  }, [isClient, isStaff, isCsmOnly, isAdmin, isMegaAdmin, studentFilter, csmFilter, studentIds, students]);

  const { leads, isLoading, createLead, updateLead, deleteLead, bulkCreateLeads, reorderLead } = useBrandLeads(userIds, profileMap);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<BrandLead | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tipDismissed, setTipDismissed] = useState(() => localStorage.getItem(TIP_DISMISSED_KEY) === 'true');

  const handleCsmFilterChange = (v: string) => { setCsmFilter(v); setStudentFilter('all'); };

  const filtered = useMemo(() => {
    return leads.filter(l => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !l.company_brand_name.toLowerCase().includes(q) &&
          !(l.contact_name || '').toLowerCase().includes(q) &&
          !(l.email || '').toLowerCase().includes(q) &&
          !(l.owner_name || '').toLowerCase().includes(q)
        ) return false;
      }
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && l.category !== categoryFilter) return false;
      return true;
    });
  }, [leads, search, statusFilter, categoryFilter]);

  const showClientActions = !isStaff;
  const showProgressAndTips = showClientActions || (isStaff && studentFilter !== 'all');

  const viewButtons: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
    { mode: 'cards', icon: LayoutGrid, label: 'Cards' },
    { mode: 'table', icon: Table2, label: 'Table' },
    { mode: 'pipeline', icon: Columns3, label: 'Pipeline' },
  ];

  return (
    <div className="flex flex-col h-full">
      <MobileLogoHeader />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Brand Leads</h1>
              <button onClick={() => setInfoOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {/* View Switcher */}
              <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
                {viewButtons.map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      viewMode === mode
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
              {showClientActions && (
                <>
                  <Button onClick={() => setImportOpen(true)} size="sm" variant="outline" className="gap-1.5">
                    <Upload className="h-4 w-4" /> <span className="hidden sm:inline">Import CSV</span>
                  </Button>
                  <Button onClick={() => setAddOpen(true)} size="sm" className="gap-1.5">
                    <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add Lead</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Progress Tracker */}
          {!isLoading && showProgressAndTips && (
            <div className="rounded-xl border border-primary/30 bg-card shadow-[0_0_16px_rgba(85,189,138,0.1)] overflow-hidden">
              <div className="bg-gradient-to-r from-primary/35 via-primary/15 to-transparent px-4 py-2.5 flex items-center gap-2">
                <div className="rounded-lg bg-primary/30 p-1.5">
                  {leads.length >= LEAD_GOAL ? <Trophy className="h-4 w-4 text-primary" /> : <Target className="h-4 w-4 text-primary" />}
                </div>
                <span className="text-sm font-semibold text-foreground">Lead Goal</span>
              </div>
              <div className="px-4 py-4 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-foreground">{leads.length}</span>
                    <span className="text-base text-muted-foreground font-medium">/ {LEAD_GOAL}</span>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {leads.length >= LEAD_GOAL ? '🎉 Goal reached!' : `${Math.round((leads.length / LEAD_GOAL) * 100)}% to goal`}
                  </span>
                </div>
                <Progress value={(leads.length / LEAD_GOAL) * 100} className="h-3" />
              </div>
            </div>
          )}

          {/* SmartScout Tip */}
          {!tipDismissed && showProgressAndTips && (
            <div className="relative rounded-lg border border-primary/20 bg-primary/5 p-4 pr-10">
              <button onClick={() => { localStorage.setItem(TIP_DISMISSED_KEY, 'true'); setTipDismissed(true); }} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="space-y-1.5 text-sm">
                  <p className="font-semibold text-foreground">Pro Tip: Use SmartScout to find brands with these filters:</p>
                  <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground">
                    <li>Amazon in stock rate 30-50%</li>
                    <li>3+ Amazon FBA Sellers</li>
                    <li>Brand: Less than $500,000 MRR (Monthly Recurring Revenue)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <LeadFilters
            search={search} onSearchChange={setSearch}
            statusFilter={statusFilter} onStatusFilterChange={setStatusFilter}
            categoryFilter={categoryFilter} onCategoryFilterChange={setCategoryFilter}
            showCsmFilter={isAdmin || isMegaAdmin}
            csmFilter={csmFilter} onCsmFilterChange={handleCsmFilterChange} csmList={csmList}
            showStudentFilter={isStaff}
            studentFilter={studentFilter} onStudentFilterChange={setStudentFilter} studentList={effectiveStudentList}
          />

          {/* Status Summary */}
          {!isLoading && leads.length > 0 && (
            <LeadStatusSummary leads={leads} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} />
          )}

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : filtered.length === 0 && viewMode !== 'pipeline' ? (
            <div className="text-center py-16 space-y-3">
              <Target className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">
                {leads.length === 0 ? 'No leads yet' : 'No leads match your filters'}
              </p>
              {leads.length === 0 && showClientActions && (
                <Button onClick={() => setAddOpen(true)} variant="outline" size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" /> Add your first lead
                </Button>
              )}
            </div>
          ) : viewMode === 'table' ? (
            <LeadTableView leads={filtered} onSelect={setSelectedLead} />
          ) : viewMode === 'pipeline' ? (
            <LeadPipelineView
              leads={filtered}
              onSelect={setSelectedLead}
              onStatusChange={(id, status, sort_order) => reorderLead.mutate({ id, status, sort_order })}
              canDrag={isStaff}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(lead => (
                <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddLeadDialog open={addOpen} onOpenChange={setAddOpen} onSubmit={lead => createLead.mutate(lead)} isLoading={createLead.isPending} />
      <LeadDetailSheet
        lead={selectedLead} open={!!selectedLead} onOpenChange={open => !open && setSelectedLead(null)}
        onUpdate={(id, updates) => updateLead.mutate({ id, updates })} onDelete={id => deleteLead.mutate(id)} isUpdating={updateLead.isPending}
      />
      <BrandLeadsInstructions open={infoOpen} onOpenChange={setInfoOpen} />
      <BulkImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={(leads) => bulkCreateLeads.mutate(leads, { onSuccess: () => setImportOpen(false) })} isLoading={bulkCreateLeads.isPending} />
    </div>
  );
};

export default BrandLeads;
