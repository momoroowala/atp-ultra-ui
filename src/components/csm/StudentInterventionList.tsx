import { useState, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OutreachStatusSelector } from './OutreachStatusSelector';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  lastSignInAt?: string;
  joinedDate?: string;
  daysInactive?: number;
  progress?: number;
  completedTasks?: number;
}

interface Props {
  students: Student[];
  metricType: string;
  outreachMap: Record<string, string>;
  onStatusChange: (userId: string, metricType: string, status: string) => Promise<void>;
  emptyMessage?: string;
}

function getInitials(first: string, last: string) {
  return `${(first || '?')[0]}${(last || '?')[0]}`.toUpperCase();
}

function hashColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 55%)`;
}

function daysAgo(dateStr?: string) {
  if (!dateStr) return 'Never';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return '1 day ago';
  return `${diff}d ago`;
}

export const StudentInterventionList = memo(function StudentInterventionList({ students, metricType, outreachMap, onStatusChange, emptyMessage }: Props) {
  const navigate = useNavigate();
  const [atRiskTab, setAtRiskTab] = useState('7');
  const isAtRisk = metricType === 'at_risk';
  const isMissedOnboarding = metricType === 'missed_onboarding';

  const filtered = useMemo(() => {
    if (!isAtRisk) return students;
    const minDays = parseInt(atRiskTab);
    return students.filter(s => (s.daysInactive || 0) >= minDays);
  }, [students, atRiskTab, isAtRisk]);

  if (isMissedOnboarding && students.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-muted-foreground">
        Awaiting webhook integration — students will appear here once connected.
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-6 space-y-1">
        <p className="text-lg">✅</p>
        <p className="text-xs font-medium text-foreground">No students in this category right now</p>
        <p className="text-[10px] text-muted-foreground">Check back after the next data sync</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isAtRisk && (
        <Tabs value={atRiskTab} onValueChange={setAtRiskTab} className="w-fit">
          <TabsList className="h-7 p-0.5">
            <TabsTrigger value="7" className="text-[10px] px-2 py-0.5 h-6">7+ days</TabsTrigger>
            <TabsTrigger value="14" className="text-[10px] px-2 py-0.5 h-6">14+ days</TabsTrigger>
            <TabsTrigger value="21" className="text-[10px] px-2 py-0.5 h-6">21+ days</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] text-muted-foreground border-b">
              <th className="text-left py-1.5 pl-1 font-medium">Student</th>
              <th className="text-left py-1.5 font-medium">Last Seen</th>
              <th className="text-left py-1.5 font-medium">Progress</th>
              <th className="text-left py-1.5 font-medium">CSM</th>
              <th className="text-left py-1.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              const fullName = `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.email;
              const initials = getInitials(s.firstName, s.lastName);
              const status = outreachMap[`${s.id}_${metricType}`] || 'follow_up_required';
              const isHighRisk = isAtRisk && (s.daysInactive || 0) >= 21;

              return (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-1.5 pl-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: hashColor(fullName) }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span
                            className="cursor-pointer hover:underline text-foreground font-medium truncate"
                            onClick={() => navigate('/csm-panel', { state: { viewStudentId: s.id, activeTab: 'students' } })}
                          >
                            {fullName}
                          </span>
                          {isHighRisk && <span className="text-[9px]">🔴 High Risk</span>}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-1.5 text-muted-foreground">{daysAgo(s.lastSignInAt)}</td>
                  <td className="py-1.5 text-muted-foreground">
                    {s.progress != null ? `${s.progress}%` : s.completedTasks ? `${s.completedTasks} tasks` : 'None'}
                  </td>
                  <td className="py-1.5 text-muted-foreground">—</td>
                  <td className="py-1.5">
                    <OutreachStatusSelector
                      userId={s.id}
                      metricType={metricType}
                      currentStatus={status}
                      onStatusChange={onStatusChange}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
