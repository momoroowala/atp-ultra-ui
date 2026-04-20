import { useState, useEffect } from 'react';
import { ClipboardList, Check, Mail, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useBrandLeads } from '@/hooks/useBrandLeads';
import { useNavigate } from 'react-router-dom';

const DEFAULT_ACTIONS = [
  { id: 'outreach', label: 'Send 5 brand outreach emails', icon: '✉️' },
  { id: 'smartscout', label: 'Review 3 product listings on SmartScout', icon: '⚙️' },
  { id: 'shipping', label: 'Check shipping status', icon: '📦' },
  { id: 'course', label: "Complete today's course module", icon: '📖' },
  { id: 'community', label: 'Post in community', icon: '⚡' },
];

const getTodayKey = () => {
  const d = new Date();
  return `daily-actions-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export const DailyActionsCard = () => {
  const navigate = useNavigate();
  const { leads } = useBrandLeads();

  const [completedActions, setCompletedActions] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(getTodayKey());
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(getTodayKey(), JSON.stringify(completedActions));
  }, [completedActions]);

  const toggle = (id: string) => {
    setCompletedActions((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const done = completedActions.length;
  const total = DEFAULT_ACTIONS.length;

  // Brand outreach stats
  const contacted = leads.filter(l => ['Email Sent', '2 Email Sent'].includes(l.status)).length;
  const followUps = leads.filter(l => ['2 Email Sent', 'Phone Call'].includes(l.status)).length;
  const approved = leads.filter(l => l.status === 'Approved').length;

  return (
    <div className="rounded-xl border border-amber-500/20 bg-card overflow-hidden shadow-[0_0_16px_rgba(217,119,6,0.05)] hover:shadow-xl hover:shadow-amber-500/5 transition-shadow duration-300">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-[hsl(30,50%,45%)] via-[hsl(35,48%,50%)] to-[hsl(40,45%,55%)]">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-white/20">
            <ClipboardList className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Daily Actions</h3>
            <p className="text-[11px] text-white/70">{done}/{total} done today</p>
          </div>
        </div>
        {/* Mini progress */}
        <div className="mt-2 h-1.5 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-white/80"
            style={{
              width: `${total > 0 ? Math.round((done / total) * 100) : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Actions list */}
      <div className="p-3 space-y-0.5">
        {DEFAULT_ACTIONS.map((action, i) => {
          const isDone = completedActions.includes(action.id);
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              onClick={() => toggle(action.id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-left transition-all duration-200 group',
                isDone ? 'bg-primary/5' : 'hover:bg-muted/50'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center h-5 w-5 rounded-full border-2 shrink-0 transition-all duration-300',
                  isDone
                    ? 'bg-primary border-primary text-primary-foreground shadow-[0_0_8px_rgba(85,189,138,0.4)]'
                    : 'border-muted-foreground/30 bg-background group-hover:border-primary/50'
                )}
              >
                {isDone && <Check className="h-3 w-3" />}
              </div>
              <span className="text-sm shrink-0">{action.icon}</span>
              <span
                className={cn(
                  'text-xs font-medium truncate transition-colors',
                  isDone ? 'text-muted-foreground line-through' : 'text-foreground'
                )}
              >
                {action.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* All done celebration */}
      {done === total && (
        <div className="px-3 pb-3">
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-2 text-center">
            <p className="text-xs font-semibold text-primary">⚡ All daily actions done! Great work!</p>
          </div>
        </div>
      )}

      {/* Brand Outreach This Week */}
      <div className="px-3 pb-3">
        <div className="rounded-xl border border-amber-500/15 bg-amber-50/30 dark:bg-amber-900/10 p-3">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Brand Outreach This Week
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2.5 text-center">
              <p className="text-lg font-bold text-blue-400">{contacted}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400/70">Contacted</p>
            </div>
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-center">
              <p className="text-lg font-bold text-amber-400">{followUps}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/70">Follow-ups</p>
            </div>
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-center">
              <p className="text-lg font-bold text-emerald-400">{approved}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70">Approved</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">{leads.length} total brands tracked</span>
            <button
              onClick={() => navigate('/brand-leads')}
              className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
