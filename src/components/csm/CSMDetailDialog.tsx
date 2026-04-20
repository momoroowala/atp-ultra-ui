import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { format } from 'date-fns';
import type { CSMMetrics } from '@/hooks/useCSMMetrics';

interface CSMDetailDialogProps {
  openDetail: string | null;
  onClose: () => void;
  readOnly?: boolean;
  metrics?: CSMMetrics;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center text-muted-foreground">
      <Users className="h-8 w-8 mx-auto mb-3 opacity-40" />
      <p className="text-sm font-medium">{message}</p>
      <p className="text-xs mt-1">Data will appear here once available.</p>
    </div>
  );
}

// ── Course Bottleneck Detail (now with phase drop-off) ──
function CourseBottleneckDetail({ metrics }: { metrics?: CSMMetrics }) {
  if (!metrics || metrics.stuckStudents === 0) {
    return <EmptyState message="No bottleneck data available yet" />;
  }
  return (
    <div className="space-y-4">
      {metrics.bottleneckPhase && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Biggest bottleneck: <strong>{metrics.bottleneckPhase.name}</strong> ({metrics.bottleneckPhase.stuckCount} students stuck)
          </p>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Phase</TableHead>
            <TableHead className="text-right">Students Stuck</TableHead>
            <TableHead className="text-right">% of Stuck</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.phaseDropOff.map((p) => (
            <TableRow key={p.phase}>
              <TableCell className="font-medium">{p.phase}</TableCell>
              <TableCell className="text-right">{p.count}</TableCell>
              <TableCell className="text-right text-muted-foreground">{p.pct}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-xs text-muted-foreground">
        Total stuck students (7+ days inactive, &lt;50% progress): {metrics.stuckStudents}
      </p>
    </div>
  );
}

// ── Re-Engagement Detail ──
function ReEngagementDetail({ students }: { students: CSMMetrics['reEngaged'] }) {
  if (!students || students.length === 0) {
    return <EmptyState message="No re-engaged students found" />;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Last Active</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-medium">{s.firstName} {s.lastName}</TableCell>
            <TableCell className="text-muted-foreground text-xs">{s.email}</TableCell>
            <TableCell>{s.progress}%</TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {s.lastSignInAt ? format(new Date(s.lastSignInAt), 'MMM d, yyyy') : '--'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ── Offboarding Detail ──
function OffboardingDetail({ students }: { students: CSMMetrics['offboarded'] }) {
  if (!students || students.length === 0) {
    return <EmptyState message="No offboarded students found" />;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Last Active</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-medium">{s.firstName} {s.lastName}</TableCell>
            <TableCell className="text-muted-foreground text-xs">{s.email}</TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {s.lastSignInAt ? format(new Date(s.lastSignInAt), 'MMM d, yyyy') : '--'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ── Revenue at Risk Detail ──
function RevenueAtRiskDetail({ metrics }: { metrics?: CSMMetrics }) {
  if (!metrics) return <EmptyState message="No revenue data available" />;
  const atRiskStudents = metrics.atRisk || [];
  const doaStudents = metrics.deadOnArrival || [];

  const allAtRisk = [
    ...atRiskStudents.map((s) => ({ ...s, riskType: 'At Risk' as const })),
    ...doaStudents.map((s) => ({ ...s, riskType: 'Dead on Arrival' as const, daysInactive: 0, revenue: 0, tier: 'STB' })),
  ];

  if (allAtRisk.length === 0) return <EmptyState message="No students at risk" />;

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;

  return (
    <div className="space-y-3">
      <div className="flex gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Total at risk: </span>
          <span className="font-bold text-red-600">{fmt(metrics.revenueAtRisk)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Portfolio: </span>
          <span className="font-bold text-emerald-600">{fmt(metrics.totalPortfolioValue)}</span>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead>Days Inactive</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allAtRisk.map((s) => (
            <TableRow key={`${s.id}-${s.riskType}`}>
              <TableCell className="font-medium">{s.firstName} {s.lastName}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[10px]">{(s as any).tier || 'STB'}</Badge>
              </TableCell>
              <TableCell>{fmt((s as any).revenue || 0)}</TableCell>
              <TableCell>
                <Badge variant={s.riskType === 'Dead on Arrival' ? 'destructive' : 'secondary'} className="text-[10px]">
                  {s.riskType}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {(s as any).daysInactive > 0 ? `${(s as any).daysInactive}d` : '--'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── NPS Detail ──
function NPSDetail({ metrics }: { metrics?: CSMMetrics }) {
  if (!metrics) return <EmptyState message="No NPS data available" />;
  const { npsScore, npsBreakdown } = metrics;
  const total = npsBreakdown.promoters + npsBreakdown.passives + npsBreakdown.detractors;
  if (total === 0) return <EmptyState message="No NPS responses collected yet" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        <div>
          <p className="text-3xl font-bold" style={{ color: npsScore >= 50 ? '#16A34A' : npsScore >= 0 ? '#F59E0B' : '#DC2626' }}>
            {npsScore > 0 ? '+' : ''}{npsScore}
          </p>
          <p className="text-xs text-muted-foreground">NPS Score</p>
        </div>
        <div className="flex-1 flex rounded-full overflow-hidden h-3">
          {npsBreakdown.promoters > 0 && <div style={{ flex: npsBreakdown.promoters, backgroundColor: '#16A34A' }} />}
          {npsBreakdown.passives > 0 && <div style={{ flex: npsBreakdown.passives, backgroundColor: '#F59E0B' }} />}
          {npsBreakdown.detractors > 0 && <div style={{ flex: npsBreakdown.detractors, backgroundColor: '#DC2626' }} />}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <p className="text-2xl font-bold text-green-600">{npsBreakdown.promoters}</p>
          <p className="text-xs text-muted-foreground">Promoters (9-10)</p>
          <p className="text-xs text-muted-foreground">{total > 0 ? Math.round((npsBreakdown.promoters / total) * 100) : 0}%</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
          <p className="text-2xl font-bold text-amber-600">{npsBreakdown.passives}</p>
          <p className="text-xs text-muted-foreground">Passives (7-8)</p>
          <p className="text-xs text-muted-foreground">{total > 0 ? Math.round((npsBreakdown.passives / total) * 100) : 0}%</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
          <p className="text-2xl font-bold text-red-600">{npsBreakdown.detractors}</p>
          <p className="text-xs text-muted-foreground">Detractors (1-6)</p>
          <p className="text-xs text-muted-foreground">{total > 0 ? Math.round((npsBreakdown.detractors / total) * 100) : 0}%</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{total} total responses from {metrics.totalUsers} students</p>
    </div>
  );
}

// ── First Sale Detail ──
function FirstSaleDetail({ metrics }: { metrics?: CSMMetrics }) {
  if (!metrics || metrics.firstSaleCount === 0) return <EmptyState message="No first sales recorded yet" />;

  return (
    <div className="space-y-3">
      <div className="flex gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Conversion: </span>
          <span className="font-bold text-emerald-600">{metrics.firstSaleConversionRate}%</span>
        </div>
        <div>
          <span className="text-muted-foreground">Students with sales: </span>
          <span className="font-bold">{metrics.firstSaleCount} / {metrics.totalUsers}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        First sale is the strongest leading indicator of long-term success. Students who make their first sale within 30 days have 3x higher retention.
      </p>
    </div>
  );
}

// ── Community Engagement Detail ──
function CommunityEngagementDetail({ metrics }: { metrics?: CSMMetrics }) {
  if (!metrics) return <EmptyState message="No community data available" />;

  return (
    <div className="space-y-3">
      <div className="flex gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Engagement rate: </span>
          <span className="font-bold text-emerald-600">{metrics.communityEngagementRate}%</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Students who participate in community are 2x more likely to complete the program. Low engagement correlates with higher churn risk.
      </p>

      {/* Cohort comparison table */}
      {metrics.cohortMetrics.length > 0 && (
        <>
          <h4 className="text-sm font-semibold mt-4">Cohort Comparison</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cohort</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Avg Progress</TableHead>
                <TableHead className="text-right">Active Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.cohortMetrics.map((c) => (
                <TableRow key={c.week}>
                  <TableCell className="font-medium">Week {c.week}</TableCell>
                  <TableCell className="text-right">{c.count}</TableCell>
                  <TableCell className="text-right">{c.avgProgress}%</TableCell>
                  <TableCell className="text-right">
                    <span className={c.activeRate >= 60 ? 'text-emerald-600' : c.activeRate >= 30 ? 'text-amber-600' : 'text-red-600'}>
                      {c.activeRate}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}

const DETAIL_CONFIG: Record<string, { title: string; emoji: string }> = {
  course_bottleneck: { title: 'Course Bottleneck Details', emoji: '' },
  re_engagement: { title: 'Re-Engagement Tracking', emoji: '' },
  offboarding: { title: 'Offboarding Tracking', emoji: '' },
  revenue_at_risk: { title: 'Revenue at Risk', emoji: '' },
  nps_detail: { title: 'Net Promoter Score', emoji: '' },
  first_sale: { title: 'First Sale Conversion', emoji: '' },
  community_engagement: { title: 'Community & Cohort Health', emoji: '' },
};

export function CSMDetailDialog({ openDetail, onClose, readOnly, metrics }: CSMDetailDialogProps) {
  const config = openDetail ? DETAIL_CONFIG[openDetail] : null;

  return (
    <Dialog open={!!openDetail} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <DialogTitle className="text-base font-semibold">
            {config?.emoji} {config?.title}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6 py-4">
          {openDetail === 'course_bottleneck' && <CourseBottleneckDetail metrics={metrics} />}
          {openDetail === 're_engagement' && <ReEngagementDetail students={metrics?.reEngaged || []} />}
          {openDetail === 'offboarding' && <OffboardingDetail students={metrics?.offboarded || []} />}
          {openDetail === 'revenue_at_risk' && <RevenueAtRiskDetail metrics={metrics} />}
          {openDetail === 'nps_detail' && <NPSDetail metrics={metrics} />}
          {openDetail === 'first_sale' && <FirstSaleDetail metrics={metrics} />}
          {openDetail === 'community_engagement' && <CommunityEngagementDetail metrics={metrics} />}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
