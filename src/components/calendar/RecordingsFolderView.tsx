import { useEffect, useMemo, useState } from 'react';
import { Crown, Sparkles, Clock, Play, Video } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import type { CallRecording } from '@/hooks/useCallRecordings';

type FolderKey =
  | 'inner_circle'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'special';

type Folder = {
  key: FolderKey;
  /** Compact tab label. */
  label: string;
  /** Longer label used in the expanded content-panel header. */
  longLabel: string;
  /** Gradient used for the active tab + content-card accent stripe. */
  gradient: string;
  /** Soft tint for the folder icon badge when the tab is inactive. */
  tint: string;
  /** Small colored dot on the tab to reinforce color coding when inactive. */
  dot: string;
};

const FOLDERS: Folder[] = [
  { key: 'inner_circle', label: 'Inner Circle', longLabel: 'Inner Circle',     gradient: 'from-amber-500 to-yellow-400',  tint: 'text-amber-600 bg-amber-500/10',    dot: 'bg-amber-500' },
  { key: 'monday',       label: 'Mon',          longLabel: 'Monday',           gradient: 'from-emerald-500 to-teal-400',  tint: 'text-emerald-600 bg-emerald-500/10', dot: 'bg-emerald-500' },
  { key: 'tuesday',      label: 'Tue',          longLabel: 'Tuesday',          gradient: 'from-orange-500 to-amber-400',  tint: 'text-orange-600 bg-orange-500/10',  dot: 'bg-orange-500' },
  { key: 'wednesday',    label: 'Wed',          longLabel: 'Wednesday',        gradient: 'from-sky-500 to-blue-400',      tint: 'text-sky-600 bg-sky-500/10',        dot: 'bg-sky-500' },
  { key: 'thursday',     label: 'Thu',          longLabel: 'Thursday',         gradient: 'from-indigo-500 to-violet-500', tint: 'text-indigo-600 bg-indigo-500/10',  dot: 'bg-indigo-500' },
  { key: 'friday',       label: 'Fri',          longLabel: 'Friday',           gradient: 'from-fuchsia-500 to-pink-500',  tint: 'text-fuchsia-600 bg-fuchsia-500/10', dot: 'bg-fuchsia-500' },
  { key: 'special',      label: 'Special',      longLabel: 'Special Calls',    gradient: 'from-slate-600 to-zinc-700',    tint: 'text-slate-600 bg-slate-500/10',    dot: 'bg-slate-500' },
];

function classify(r: CallRecording): FolderKey {
  const title = (r.title || '').toLowerCase();
  const tags = (r.tags || []).map(t => t.toLowerCase());

  if (title.includes('inner circle') || tags.some(t => t.includes('inner circle') || t === 'inner-circle')) {
    return 'inner_circle';
  }
  if (tags.includes('special') || tags.includes('workshop') || title.includes('workshop')) {
    return 'special';
  }
  if (!r.recorded_date) return 'special';
  const dow = parseISO(r.recorded_date).getDay();
  // Mon-Fri map to their folder; Sat/Sun fall into Special.
  const map: Record<number, FolderKey> = {
    1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday',
  };
  return map[dow] ?? 'special';
}

function PanelHeaderIcon({ folder }: { folder: Folder }) {
  if (folder.key === 'inner_circle') return <Crown className="h-5 w-5" />;
  if (folder.key === 'special')      return <Sparkles className="h-5 w-5" />;
  return <span className="text-sm font-bold">{folder.label}</span>;
}

interface RecordingsFolderViewProps {
  recordings: CallRecording[];
  canSeeInnerCircle: boolean;
  onRecordingClick: (recording: CallRecording) => void;
}

export function RecordingsFolderView({
  recordings,
  canSeeInnerCircle,
  onRecordingClick,
}: RecordingsFolderViewProps) {
  const visibleFolders = useMemo(
    () => FOLDERS.filter(f => f.key !== 'inner_circle' || canSeeInnerCircle),
    [canSeeInnerCircle],
  );

  const grouped = useMemo(() => {
    const map: Record<FolderKey, CallRecording[]> = {
      inner_circle: [], monday: [], tuesday: [], wednesday: [],
      thursday: [], friday: [], special: [],
    };
    for (const r of recordings) map[classify(r)].push(r);
    for (const k of Object.keys(map) as FolderKey[]) {
      map[k].sort((a, b) => {
        const aKey = `${a.recorded_date} ${a.recorded_time || '00:00'}`;
        const bKey = `${b.recorded_date} ${b.recorded_time || '00:00'}`;
        return bKey.localeCompare(aKey);
      });
    }
    return map;
  }, [recordings]);

  const latestFolder = useMemo<FolderKey | null>(() => {
    let bestKey: FolderKey | null = null;
    let bestDate = '';
    for (const f of visibleFolders) {
      const recs = grouped[f.key];
      if (recs.length === 0) continue;
      const top = `${recs[0].recorded_date} ${recs[0].recorded_time || '00:00'}`;
      if (top > bestDate) { bestDate = top; bestKey = f.key; }
    }
    return bestKey;
  }, [grouped, visibleFolders]);

  const [activeFolder, setActiveFolder] = useState<FolderKey | null>(latestFolder);

  // Re-sync to the latest folder if it changes after data loads, as long as the
  // user hasn't picked something else manually.
  useEffect(() => {
    if (activeFolder === null && latestFolder) setActiveFolder(latestFolder);
  }, [latestFolder, activeFolder]);

  const activeDef = visibleFolders.find(f => f.key === activeFolder) ?? null;
  const activeRecs = activeFolder ? grouped[activeFolder] : [];

  return (
    <div className="space-y-6">
      {/* Tab strip -- horizontal scroll on narrow screens, wraps on lg+ */}
      <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:overflow-visible md:px-0 md:pb-0">
        <div className="flex min-w-max items-center gap-3 lg:min-w-0 lg:flex-wrap">
          {visibleFolders.map(folder => {
            const isActive = folder.key === activeFolder;
            const count = grouped[folder.key].length;
            return (
              <button
                key={folder.key}
                type="button"
                onClick={() => setActiveFolder(folder.key)}
                aria-pressed={isActive}
                className={cn(
                  'group relative flex shrink-0 items-center gap-2.5 rounded-2xl border px-5 py-3 text-left transition-all duration-200',
                  'whitespace-nowrap',
                  isActive
                    ? cn(
                        'border-transparent bg-gradient-to-br text-white shadow-lg',
                        folder.gradient,
                        'scale-[1.03]',
                      )
                    : 'border-border bg-card text-foreground hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-sm',
                )}
              >
                {folder.key === 'inner_circle' ? (
                  <Crown className={cn('h-4 w-4', isActive ? 'text-white' : 'text-amber-500')} />
                ) : folder.key === 'special' ? (
                  <Sparkles className={cn('h-4 w-4', isActive ? 'text-white' : 'text-slate-500')} />
                ) : (
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      isActive ? 'bg-white/80' : folder.dot,
                    )}
                  />
                )}

                <span className="text-sm font-semibold tracking-tight">{folder.label}</span>

                <span
                  className={cn(
                    'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums',
                    isActive ? 'bg-white/25 text-white' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content panel */}
      {activeDef && (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className={cn('h-1.5 bg-gradient-to-r', activeDef.gradient)} />

          {/* Header */}
          <div className="flex items-center gap-4 border-b bg-muted/20 px-6 py-5">
            <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', activeDef.tint)}>
              <PanelHeaderIcon folder={activeDef} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold text-foreground">{activeDef.longLabel}</h3>
              <p className="text-sm text-muted-foreground">
                {activeRecs.length} {activeRecs.length === 1 ? 'recording' : 'recordings'}
                {activeRecs.length > 0 && ' — newest first'}
              </p>
            </div>
          </div>

          {/* List */}
          {activeRecs.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className={cn('mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl', activeDef.tint)}>
                <Video className="h-5 w-5 opacity-60" />
              </div>
              <p className="text-sm font-medium text-foreground">No recordings in this folder yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Check back after the next {activeDef.longLabel.toLowerCase()} session.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {activeRecs.map(r => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => onRecordingClick(r)}
                    className="group flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-accent/40"
                  >
                    <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', activeDef.tint)}>
                      <Video className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground md:text-base">{r.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-medium">{format(parseISO(r.recorded_date), 'EEEE, MMM d, yyyy')}</span>
                        {r.duration_minutes ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {r.duration_minutes} min
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground/70 transition-all group-hover:border-primary/50 group-hover:text-primary">
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span className="hidden sm:inline">Watch</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
