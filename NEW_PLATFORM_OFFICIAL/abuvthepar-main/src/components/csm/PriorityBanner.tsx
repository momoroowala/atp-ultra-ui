import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PriorityBannerProps {
  atRisk: number;
  neverLoggedIn: number;
  missedOnboarding: number;
  deadOnArrival: number;
  unreadDMs?: number;
  onCategoryClick: (key: string) => void;
  onDMClick?: () => void;
}

const DISMISS_KEY_PREFIX = 'csm-banner-dismissed-';

function getDismissKey() {
  const d = new Date();
  return `${DISMISS_KEY_PREFIX}${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function PriorityBanner({ atRisk, neverLoggedIn, missedOnboarding, deadOnArrival, unreadDMs = 0, onCategoryClick, onDMClick }: PriorityBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(getDismissKey()) === '1'; } catch { return false; }
  });

  if (dismissed) return null;

  const studentTotal = atRisk + neverLoggedIn + missedOnboarding + deadOnArrival;
  const total = studentTotal + unreadDMs;
  const hasPending = total > 0;

  const handleDismiss = () => {
    try { localStorage.setItem(getDismissKey(), '1'); } catch {}
    setDismissed(true);
  };

  const CountLink = ({ count, label, categoryKey }: { count: number; label: string; categoryKey: string }) => {
    if (count === 0) return null;
    return (
      <button
        onClick={() => onCategoryClick(categoryKey)}
        className="underline underline-offset-2 decoration-dotted hover:decoration-solid cursor-pointer"
      >
        <span className="font-bold">{count}</span> {label}
      </button>
    );
  };

  const segments = [
    { count: atRisk, label: 'at-risk', key: 'at_risk' },
    { count: neverLoggedIn, label: 'never logged in', key: 'never_logged_in' },
    { count: missedOnboarding, label: 'missed onboarding', key: 'missed_onboarding' },
    { count: deadOnArrival, label: 'dead-on-arrival', key: 'dead_on_arrival' },
  ].filter(s => s.count > 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={`w-full rounded-lg px-3.5 py-2 flex flex-col md:flex-row md:items-center gap-2 md:gap-3 text-xs md:text-[13px] ${
          hasPending
            ? 'bg-amber-50 dark:bg-amber-950/30 border-l-[3px] border-l-amber-500'
            : 'bg-green-50 dark:bg-green-950/30 border-l-[3px] border-l-green-600'
        }`}
      >
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <span className="shrink-0 text-base">{hasPending ? '🔴' : '🎉'}</span>

          <p className="flex-1 text-foreground leading-snug flex flex-wrap items-center gap-x-1">
            {hasPending ? (
              <>
                {studentTotal > 0 && (
                  <>
                    You have <span className="font-bold">{studentTotal}</span> students needing follow-up today —{' '}
                    {segments.map((s, i) => (
                      <span key={s.key}>
                        <CountLink count={s.count} label={s.label} categoryKey={s.key} />
                        {i < segments.length - 1 && <span>, </span>}
                      </span>
                    ))}
                  </>
                )}
                {unreadDMs > 0 && (
                  <>
                    {studentTotal > 0 && <span> — and </span>}
                    <button
                      onClick={onDMClick}
                      className="underline underline-offset-2 decoration-dotted hover:decoration-solid cursor-pointer"
                    >
                      <span className="font-bold">{unreadDMs}</span> unread {unreadDMs === 1 ? 'message' : 'messages'}
                    </button>
                  </>
                )}
              </>
            ) : (
              <span>All caught up! No students need follow-up right now. <span className="font-bold">Great work today.</span></span>
            )}
          </p>
        </div>

        <button
          onClick={handleDismiss}
          className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap self-end md:self-auto"
        >
          Dismiss for today
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
