import { useState, useMemo, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { motion } from 'framer-motion';
import { differenceInDays } from 'date-fns';
import { formatDistanceToNowStrict } from 'date-fns';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { OutreachStatusSelector } from './OutreachStatusSelector';
import { UserProfilePopover } from '@/components/UserProfilePopover';

export interface QueueStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  context: string;
  metricType: string;
  lastSignInAt?: string | null;
  completedTasks?: number;
  assignedCsmName?: string;
}

interface FollowUpQueueProps {
  students: QueueStudent[];
  outreachStatuses: Record<string, string>;
  onStatusChange: (userId: string, metricType: string, status: string) => Promise<void>;
  activeFilter: string | null;
  onClearFilter?: () => void;
  hideHeader?: boolean;
  readOnly?: boolean;
}

const CATEGORY_ACCENT: Record<string, string> = {
  never_logged_in: '#F59E0B',
  dead_on_arrival: '#EA580C',
  at_risk: '#DC2626',
  missed_onboarding: '#7C3AED',
};

const CATEGORY_CONFIG: Record<string, { label: string; className: string }> = {
  never_logged_in: { label: 'Never Logged In', className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700' },
  dead_on_arrival: { label: 'DOA', className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700' },
  at_risk: { label: 'At-Risk', className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700' },
  missed_onboarding: { label: 'Missed OB', className: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700' },
};


function getInitials(first: string, last: string, email: string) {
  if (first || last) return `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();
  return (email[0] || '?').toUpperCase();
}

function hashColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash % 360);
  return `hsl(${hue} 45% 55%)`;
}

function getLastSeen(lastSignInAt?: string | null) {
  if (!lastSignInAt) return 'Never';
  try {
    return formatDistanceToNowStrict(new Date(lastSignInAt), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

function getInactiveDays(lastSignInAt?: string | null): number | null {
  if (!lastSignInAt) return null;
  try {
    return differenceInDays(new Date(), new Date(lastSignInAt));
  } catch {
    return null;
  }
}

function InactiveBadge({ lastSignInAt }: { lastSignInAt?: string | null }) {
  const days = getInactiveDays(lastSignInAt);

  if (days === null) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-[#374151] text-white">
        Never
      </span>
    );
  }
  if (days <= 0) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
        Today
      </span>
    );
  }
  if (days <= 6) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
        {days}d
      </span>
    );
  }
  if (days <= 13) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
        {days}d
      </span>
    );
  }
  if (days <= 20) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
        {days}d
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
      {days}d 🔴
    </span>
  );
}

function LastStepBadge({ completedTasks }: { completedTasks?: number }) {
  if (!completedTasks || completedTasks === 0) {
    return (
      <span className="inline-flex items-center rounded-full px-1.5 py-0 text-[8px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
        No progress
      </span>
    );
  }
  return (
    <span className="text-[11px] font-medium text-foreground">
      Step {completedTasks}
    </span>
  );
}

type SortField = 'lastSeen' | 'inactive' | null;
type SortDir = 'asc' | 'desc';

function SortIcon({ field, activeField, activeDir }: { field: SortField; activeField: SortField; activeDir: SortDir }) {
  if (activeField !== field) return <ArrowUpDown className="h-3 w-3 ml-0.5 opacity-40" />;
  return activeDir === 'asc' ? <ArrowUp className="h-3 w-3 ml-0.5" /> : <ArrowDown className="h-3 w-3 ml-0.5" />;
}

const PAGE_SIZE = 10;

export function FollowUpQueue({ students, outreachStatuses, onStatusChange, activeFilter, onClearFilter, hideHeader, readOnly }: FollowUpQueueProps) {
  const categoryFilter = activeFilter || 'all';
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [sortField, setSortField] = useState<SortField>(null);
  const [flashingRow, setFlashingRow] = useState<string | null>(null);

  const handleRowFlash = useCallback((key: string) => {
    setFlashingRow(key);
    setTimeout(() => setFlashingRow(null), 400);
  }, []);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    let list = categoryFilter === 'all' ? students : students.filter(s => s.metricType === categoryFilter);

    if (sortField) {
      list = [...list].sort((a, b) => {
        let aVal: number;
        let bVal: number;
        if (sortField === 'lastSeen' || sortField === 'inactive') {
          aVal = a.lastSignInAt ? new Date(a.lastSignInAt).getTime() : 0;
          bVal = b.lastSignInAt ? new Date(b.lastSignInAt).getTime() : 0;
          if (sortField === 'inactive') {
            return sortDir === 'asc' ? bVal - aVal : aVal - bVal;
          }
        } else {
          aVal = 0;
          bVal = 0;
        }
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    return list;
  }, [students, categoryFilter, sortField, sortDir, activeFilter]);

  const contacted = filtered.filter(s => outreachStatuses[`${s.id}_${s.metricType}`] === 'contacted').length;
  const pending = filtered.length - contacted;
  const visible = filtered;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="bg-card rounded-xl border shadow-sm flex flex-col h-full"
    >
      {/* Header — only shown when hideHeader is not set */}
      {!hideHeader && (
        <div className="flex items-center justify-between px-3 py-2 border-b gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-semibold whitespace-nowrap">Follow-Up Queue</h3>
            {activeFilter && CATEGORY_CONFIG[activeFilter] && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5"
                style={{
                  backgroundColor: `${CATEGORY_ACCENT[activeFilter]}26`,
                  color: CATEGORY_ACCENT[activeFilter],
                }}
              >
                Showing: {CATEGORY_CONFIG[activeFilter].label}
                <button
                  onClick={(e) => { e.stopPropagation(); onClearFilter?.(); }}
                  className="ml-0.5 hover:opacity-70 cursor-pointer"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="font-bold text-emerald-600">{contacted} contacted</span>
            <span className="text-muted-foreground">·</span>
            <span className="flex items-center gap-1">
              <span className="font-bold text-amber-600">{pending} pending</span>
              {pending > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              )}
            </span>
          </div>
        </div>
      )}

      {/* Table Header — Sticky */}
      <div className="hidden md:grid grid-cols-[36px_1.5fr_1fr_0.8fr_0.8fr_0.8fr_1fr] gap-1 px-3 py-1.5 text-[9px] font-medium text-muted-foreground border-b bg-card sticky top-0 z-10">
        <span></span>
        <span>Student</span>
        <span>Category</span>
        <button
          onClick={() => toggleSort('lastSeen')}
          className="flex items-center hover:text-foreground transition-colors cursor-pointer"
        >
          Last Seen
          <SortIcon field="lastSeen" activeField={sortField} activeDir={sortDir} />
        </button>
        <button
          onClick={() => toggleSort('inactive')}
          className="flex items-center hover:text-foreground transition-colors cursor-pointer"
        >
          Inactive
          <SortIcon field="inactive" activeField={sortField} activeDir={sortDir} />
        </button>
        <span>Last Step</span>
        <span className="text-right">Status</span>
      </div>

      {/* Scrollable Rows */}
      <div className="max-h-[calc(100vh-560px)] overflow-y-auto">
        {visible.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
            All clear — no follow-ups needed! 🎉
          </div>
        ) : (
          <div className="divide-y divide-border">
            {visible.map((s) => {
              const statusKey = `${s.id}_${s.metricType}`;
              const currentStatus = outreachStatuses[statusKey] || 'follow_up_required';
              const isFollowUp = currentStatus !== 'contacted';
              const cat = CATEGORY_CONFIG[s.metricType];
              const initials = getInitials(s.firstName, s.lastName, s.email);
              const avatarColor = hashColor(s.id);

              const rowBg = flashingRow === statusKey
                ? 'bg-green-50 dark:bg-green-900/20'
                : isFollowUp
                  ? 'border-l-[3px] border-l-amber-400 bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20'
                  : 'bg-card hover:bg-muted/50';

              return (
                <div key={statusKey}>
                  {/* Desktop row */}
                  <div
                    className={`hidden md:grid group grid-cols-[36px_1.5fr_1fr_0.8fr_0.8fr_0.8fr_1fr] gap-1 items-center px-3 py-1 text-xs transition-all duration-200 ${rowBg}`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {initials}
                    </div>
                    <UserProfilePopover userId={s.id}>
                      <div className="min-w-0 cursor-default">
                        <p className="font-medium truncate text-[13px]">
                          {s.firstName || s.lastName ? `${s.firstName} ${s.lastName}`.trim() : s.email}
                        </p>
                        {(s.firstName || s.lastName) && (
                          <p className="text-[11px] text-muted-foreground truncate">{s.email}</p>
                        )}
                      </div>
                    </UserProfilePopover>
                    <div>
                      {cat && (
                        <Badge variant="outline" className={`text-[8px] px-1 py-0 border whitespace-nowrap max-w-[90px] ${cat.className}`}>
                          {cat.label}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[9px] text-muted-foreground truncate">
                      {getLastSeen(s.lastSignInAt)}
                    </span>
                    <div>
                      <InactiveBadge lastSignInAt={s.lastSignInAt} />
                    </div>
                    <div className="min-w-0">
                      <LastStepBadge completedTasks={s.completedTasks} />
                    </div>
                    <div className="flex justify-end">
                      <OutreachStatusSelector
                        userId={s.id}
                        metricType={s.metricType}
                        currentStatus={currentStatus}
                        onStatusChange={onStatusChange}
                        onSaveFlash={() => handleRowFlash(statusKey)}
                        disabled={readOnly}
                      />
                    </div>
                  </div>

                  {/* Mobile card */}
                  <div className={`md:hidden flex flex-col gap-1.5 px-3 py-2 text-xs transition-all duration-200 ${rowBg}`}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {initials}
                      </div>
                      <UserProfilePopover userId={s.id}>
                        <div className="min-w-0 flex-1 cursor-default">
                          <p className="font-medium truncate text-[12px]">
                            {s.firstName || s.lastName ? `${s.firstName} ${s.lastName}`.trim() : s.email}
                          </p>
                        </div>
                      </UserProfilePopover>
                      <InactiveBadge lastSignInAt={s.lastSignInAt} />
                    </div>
                    <div className="flex items-center justify-between pl-9">
                      <div className="flex items-center gap-1.5">
                        {cat && (
                          <Badge variant="outline" className={`text-[8px] px-1 py-0 border whitespace-nowrap ${cat.className}`}>
                            {cat.label}
                          </Badge>
                        )}
                        <LastStepBadge completedTasks={s.completedTasks} />
                      </div>
                      <OutreachStatusSelector
                        userId={s.id}
                        metricType={s.metricType}
                        currentStatus={currentStatus}
                        onStatusChange={onStatusChange}
                        onSaveFlash={() => handleRowFlash(statusKey)}
                        disabled={readOnly}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </motion.div>
  );
}
