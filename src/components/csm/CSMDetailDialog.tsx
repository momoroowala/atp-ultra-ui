import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

function CourseBottleneckDetail() {
  return <EmptyState message="No bottleneck data available yet" />;
}

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
              {s.lastSignInAt ? format(new Date(s.lastSignInAt), 'MMM d, yyyy') : '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

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
              {s.lastSignInAt ? format(new Date(s.lastSignInAt), 'MMM d, yyyy') : '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const DETAIL_CONFIG: Record<string, { title: string; emoji: string }> = {
  course_bottleneck: { title: 'Course Bottleneck Details', emoji: '🚧' },
  re_engagement: { title: 'Re-Engagement Tracking', emoji: '🔄' },
  offboarding: { title: 'Offboarding Tracking', emoji: '📋' },
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
          {openDetail === 'course_bottleneck' && <CourseBottleneckDetail />}
          {openDetail === 're_engagement' && <ReEngagementDetail students={metrics?.reEngaged || []} />}
          {openDetail === 'offboarding' && <OffboardingDetail students={metrics?.offboarded || []} />}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
