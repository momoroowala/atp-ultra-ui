import { useState, useMemo } from 'react';
import { useBrandLeads, LEAD_STATUSES } from '@/hooks/useBrandLeads';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { useCSMStudents, useCSMList } from '@/hooks/useCSMStudents';
import { useMyAssignedStudentIds } from '@/hooks/useMyAssignedStudentIds';
import { LeadCard } from '@/components/brand-leads/LeadCard';
import { LeadTable } from '@/components/brand-leads/LeadTable';
import { LeadPipeline } from '@/components/brand-leads/LeadPipeline';
import { LeadFilters, FilterUser } from '@/components/brand-leads/LeadFilters';
import { AddLeadDialog } from '@/components/brand-leads/AddLeadDialog';
import { LeadDetailSheet } from '@/components/brand-leads/LeadDetailSheet';
import { BrandLeadsInstructions } from '@/components/brand-leads/BrandLeadsInstructions';
import { BulkImportDialog } from '@/components/brand-leads/BulkImportDialog';
import { OutreachReminderPopup } from '@/components/brand-leads/OutreachReminderPopup';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, Info, Target, Lightbulb, X, Trophy, Upload, ChevronRight } from 'lucide-react';
import { MobileLogoHeader } from '@/components/MobileLogoHeader';
import { cn } from '@/lib/utils';
import type { BrandLead } from '@/hooks/useBrandLeads';

const LEAD_GOAL = 100;
const TIP_DISMISSED_KEY = 'brand_leads_tip_dismissed';
const VIEW_PREF_KEY = 'brand_leads_view';

type ViewMode = 'table' | 'cards' | 'pipeline';

// Pipeline status colors for the summary bar (bg for the segment background)
const pipelineColors: Record<string, string> = {
  'Email Sent': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  '2 Email Sent': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'Phone Call': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Approved': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'Not Approved': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const BrandLeads = () => {
  const { isAdmin, isMegaAdmin, isCSM, isClient } = useRoleCheck();
  const isStaff = isAdmin || isMegaAdmin || isCSM;

  // CSM + Student filter state
  const [csmFilter, setCsmFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('all');

  // Admin: fetch CSM list
  const { data: csmListData = [] } = useCSMList();

  // Admin: fetch students for a selected CSM only
  const showAdminCsmStudents = (isAdmin || isMegaAdmin) && csmFilter !== 'all';
  const { data: adminCsmStudents = [] } = useCSMStudents(showAdminCsmStudents ? csmFilter : undefined);

  // CSM: fetch own assigned students
  const { data: myStudentData } = useMyAssignedStudentIds();
  const isCsmOnly = isCSM && !isAdmin && !isMegaAdmin;
  const { data: csmOwnStudents = [] } = useCSMStudents(isCsmOnly ? undefined : 'no-match-id');

  // Build student list for filter dropdown
  const effectiveStudentList = useMemo<FilterUser[]>(() => {
    if (isAdmin || isMegaAdmin) {
      if (!showAdminCsmStudents) return []; // No student dropdown when "All CSMs"
      return adminCsmStudents.map(s => ({
        id: s.id,
        label: `${s.firstName} ${s.lastName}`.trim() || s.email,
      }));
    }
    if (isCsmOnly) {
      return csmOwnStudents.map(s => ({
        id: s.id,
        label: `${s.firstName} ${s.lastName}`.trim() || s.email,
      }));
    }
    return [];
  }, [isAdmin, isMegaAdmin, isCsmOnly, showAdminCsmStudents, adminCsmStudents, csmOwnStudents]);

  // CSM list for admin filter
  const csmList = useMemo<FilterUser[]>(() => {
    return csmListData.map(c => ({
      id: c.id,
      label: `${c.firstName} ${c.lastName}`.trim() || c.email,
    }));
  }, [csmListData]);

  // Compute userIds to pass to useBrandLeads
  const userIds = useMemo<string[] | undefined>(() => {
    if (isClient && !isStaff) return undefined; // RLS handles it

    if (isCSM && !isAdmin && !isMegaAdmin) {
      if (studentFilter !== 'all') return [studentFilter];
      if (myStudentData?.ids) return Array.from(myStudentData.ids);
      return []; // loading, return empty to avoid showing all
    }

    if (isAdmin || isMegaAdmin) {
      if (studentFilter !== 'all') return [studentFilter];
      if (csmFilter !== 'all') {
        // Show all students of selected CSM
        return adminCsmStudents.map(s => s.id);
      }
      return undefined; // all leads
    }

    return undefined;
  }, [isClient, isStaff, isCSM, isAdmin, isMegaAdmin, studentFilter, csmFilter, myStudentData, adminCsmStudents]);

  const { leads, isLoading, createLead, updateLead, deleteLead, bulkCreateLeads } = useBrandLeads(userIds);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<BrandLead | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tipDismissed, setTipDismissed] = useState(() => localStorage.getItem(TIP_DISMISSED_KEY) === 'true');
  const [view, setView] = useState<ViewMode>(() => (localStorage.getItem(VIEW_PREF_KEY) as ViewMode) || 'table');

  const handleViewChange = (v: ViewMode) => {
    setView(v);
    localStorage.setItem(VIEW_PREF_KEY, v);
  };

  // Pipeline counts from all leads (unfiltered)
  const pipelineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of LEAD_STATUSES) counts[s.value] = 0;
    for (const l of leads) {
      if (counts[l.status] !== undefined) counts[l.status]++;
      else counts[l.status] = (counts[l.status] || 0) + 1;
    }
    return counts;
  }, [leads]);

  // Active filter pills
  const activeFilters = useMemo(() => {
    const pills: { key: string; label: string }[] = [];
    if (search) pills.push({ key: 'search', label: `Search: "${search}"` });
    if (statusFilter !== 'all') pills.push({ key: 'status', label: `Status: ${statusFilter}` });
    if (categoryFilter !== 'all') pills.push({ key: 'category', label: `Category: ${categoryFilter}` });
    return pills;
  }, [search, statusFilter, categoryFilter]);

  const removeFilter = (key: string) => {
    if (key === 'search') setSearch('');
    if (key === 'status') setStatusFilter('all');
    if (key === 'category') setCategoryFilter('all');
  };

  // Reset student filter when CSM filter changes
  const handleCsmFilterChange = (v: string) => {
    setCsmFilter(v);
    setStudentFilter('all');
  };

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

  return (
    <div className="flex flex-col h-full">
      <MobileLogoHeader />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Brand Leads</h1>
              <button onClick={() => setInfoOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex bg-muted rounded-lg p-0.5">
                <button
                  className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-colors", view === 'table' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground')}
                  onClick={() => handleViewChange('table')}
                >
                  Table
                </button>
                <button
                  className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-colors", view === 'cards' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground')}
                  onClick={() => handleViewChange('cards')}
                >
                  Cards
                </button>
                <button
                  className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-colors", view === 'pipeline' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground')}
                  onClick={() => handleViewChange('pipeline')}
                >
                  Pipeline
                </button>
              </div>
              <Button onClick={() => setImportOpen(true)} size="sm" variant="outline" className="gap-1.5">
                <Upload className="h-4 w-4" /> Import
              </Button>
              <Button onClick={() => setAddOpen(true)} size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> Add Lead
              </Button>
            </div>
          </div>

          {/* Progress Tracker (client only) */}
          {!isLoading && showProgressAndTips && (
            <div className="rounded-xl border border-primary/30 bg-card shadow-[0_0_16px_rgba(85,189,138,0.1)] overflow-hidden">
              <div className="bg-gradient-to-r from-primary/35 via-primary/15 to-transparent px-4 py-2.5 flex items-center gap-2">
                <div className="rounded-lg bg-primary/30 p-1.5">
                  {leads.length >= LEAD_GOAL ? (
                    <Trophy className="h-4 w-4 text-primary" />
                  ) : (
                    <Target className="h-4 w-4 text-primary" />
                  )}
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
                    {leads.length >= LEAD_GOAL
                      ? '🎉 Goal reached!'
                      : `${Math.round((leads.length / LEAD_GOAL) * 100)}% to goal`}
                  </span>
                </div>
                <Progress value={(leads.length / LEAD_GOAL) * 100} className="h-3" />
              </div>
            </div>
          )}

          {/* SmartScout Tip Banner (client only) */}
          {!tipDismissed && showProgressAndTips && (
            <div className="relative rounded-lg border border-primary/20 bg-primary/5 p-4 pr-10">
              <button
                onClick={() => { localStorage.setItem(TIP_DISMISSED_KEY, 'true'); setTipDismissed(true); }}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
              >
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
            csmFilter={csmFilter}
            onCsmFilterChange={handleCsmFilterChange}
            csmList={csmList}
            showStudentFilter={isStaff}
            studentFilter={studentFilter}
            onStudentFilterChange={setStudentFilter}
            studentList={effectiveStudentList}
          />

          {/* Pipeline Summary */}
          {!isLoading && leads.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {LEAD_STATUSES.map((s, i) => (
                <div key={s.value} className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (statusFilter === s.value) setStatusFilter('all');
                      else setStatusFilter(s.value);
                    }}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      pipelineColors[s.value] || 'bg-muted text-muted-foreground',
                      statusFilter === s.value && 'ring-2 ring-offset-1 ring-primary/50'
                    )}
                  >
                    {s.value}
                    <span className="font-bold">({pipelineCounts[s.value] || 0})</span>
                  </button>
                  {i < LEAD_STATUSES.length - 1 && (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Active Filter Pills */}
          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {activeFilters.map(f => (
                <span key={f.key} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {f.label}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter(f.key)} />
                </span>
              ))}
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            view === 'table' ? (
              <div className="w-full space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : view === 'pipeline' ? (
              <div className="flex gap-3 overflow-x-auto">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-[220px] shrink-0 space-y-2">
                    <div className="h-6 rounded bg-muted animate-pulse w-24" />
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-24 rounded-lg bg-muted animate-pulse" />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            )
          ) : filtered.length === 0 ? (
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
          ) : view === 'table' ? (
            <LeadTable
              leads={filtered}
              onSelectLead={setSelectedLead}
              onUpdateLead={(id, updates) => updateLead.mutate({ id, updates })}
              onDeleteLead={(id) => deleteLead.mutate(id)}
              createLead={createLead}
              showClientActions={showClientActions}
            />
          ) : view === 'pipeline' ? (
            <LeadPipeline
              leads={filtered}
              onSelectLead={setSelectedLead}
              onUpdateStatus={(id, status) => updateLead.mutate({ id, updates: { status } })}
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

      <AddLeadDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={lead => createLead.mutate(lead)}
        isLoading={createLead.isPending}
      />
      <LeadDetailSheet
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={open => !open && setSelectedLead(null)}
        onUpdate={(id, updates) => updateLead.mutate({ id, updates })}
        onDelete={id => deleteLead.mutate(id)}
        isUpdating={updateLead.isPending}
      />
      <BrandLeadsInstructions open={infoOpen} onOpenChange={setInfoOpen} />
      <BulkImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={(leads) => bulkCreateLeads.mutate(leads, { onSuccess: () => setImportOpen(false) })}
        isLoading={bulkCreateLeads.isPending}
      />
      <OutreachReminderPopup />
    </div>
  );
};

export default BrandLeads;
