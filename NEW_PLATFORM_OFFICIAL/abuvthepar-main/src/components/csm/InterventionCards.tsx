import { motion } from 'framer-motion';
import { UserX, Ghost, AlertTriangle, PhoneOff, TrendingDown, TrendingUp, ArrowRight } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { InterventionCardExpanded } from './InterventionCardExpanded';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface InterventionCardProps {
  label: string;
  count: number;
  pendingFollowUps: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  isActive: boolean;
  onClick: () => void;
  trendDelta: number;
  accentHex: string;
  sparklineData: number[];
}

function UrgencyPill({ pending }: { pending: number }) {
  if (pending === 0) {
    return (
      <span className="inline-flex items-center text-[11px] font-semibold rounded-full px-2 py-0.5 bg-muted text-muted-foreground">
        All clear
      </span>
    );
  }
  const isHigh = pending >= 4;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 ${
        isHigh ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
      }`}
    >
      <span className="text-[8px]">●</span>
      {pending} pending
    </span>
  );
}

function TrendIndicator({ delta }: { delta: number }) {
  if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-emerald-600">
        <TrendingDown className="h-3 w-3" />
        {delta} this week
      </span>
    );
  }
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-red-600">
        <TrendingUp className="h-3 w-3" />
        +{delta} this week
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-muted-foreground">
      <ArrowRight className="h-3 w-3" />
      No change
    </span>
  );
}

function MiniSparkline({ data, accentHex }: { data: number[]; accentHex: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[2px] h-5 mt-1.5">
      {data.map((v, i) => (
        <div
          key={i}
          className="w-1 rounded-sm"
          style={{
            height: `${(v / max) * 100}%`,
            minHeight: '3px',
            backgroundColor: accentHex,
            opacity: i === data.length - 1 ? 1 : 0.4,
          }}
        />
      ))}
    </div>
  );
}

function AnimatedCount({ value }: { value: number }) {
  const animated = useCountUp(value);
  return <span className="text-lg font-bold leading-none">{animated}</span>;
}

function InterventionCard({
  label, count, pendingFollowUps, icon: Icon, color, bgColor, borderColor,
  isActive, onClick, trendDelta, accentHex, sparklineData,
}: InterventionCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      whileTap={{ scale: 0.98 }}
      className={`relative text-left rounded-lg p-2.5 transition-shadow duration-150 cursor-pointer w-full max-h-[100px] overflow-hidden ${
        isActive ? 'bg-card border-2' : `bg-card border-l-[3px] ${borderColor} hover:bg-muted/50`
      }`}
      style={isActive ? { borderColor: accentHex, boxShadow: `0 0 0 3px ${accentHex}26` } : undefined}
    >
      <div className="flex items-center gap-2">
        <div className={`p-1 rounded ${bgColor}`}>
          <Icon className={`h-3.5 w-3.5 ${color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-muted-foreground font-medium truncate">{label}</p>
          <div className="flex items-baseline gap-1.5">
            <AnimatedCount value={count} />
            <TrendIndicator delta={trendDelta} />
          </div>
          <div className="mt-1">
            <UrgencyPill pending={pendingFollowUps} />
          </div>
        </div>
        {pendingFollowUps > 0 && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        )}
      </div>
      <MiniSparkline data={sparklineData} accentHex={accentHex} />
    </motion.button>
  );
}

interface InterventionCardsRowProps {
  neverLoggedInCount: number;
  doaCount: number;
  atRiskCount: number;
  missedOnboardingCount: number;
  pendingByType: Record<string, number>;
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  neverLoggedInStudents?: any[];
  doaStudents?: any[];
  atRiskStudents?: any[];
  missedOnboardingStudents?: any[];
  outreachMap?: Record<string, string>;
  onStatusChange?: (userId: string, metricType: string, status: string) => Promise<void>;
  readOnly?: boolean;
  variant?: 'card' | 'pill';
}

export function InterventionCardsRow({
  neverLoggedInCount, doaCount, atRiskCount, missedOnboardingCount,
  pendingByType, activeFilter, onFilterChange,
  neverLoggedInStudents = [], doaStudents = [], atRiskStudents = [], missedOnboardingStudents = [],
  outreachMap = {}, onStatusChange, readOnly,
  variant = 'card',
}: InterventionCardsRowProps) {
  const tooltipDescriptions: Record<string, React.ReactNode> = {
    never_logged_in: 'Students who created an account but have never signed in',
    dead_on_arrival: 'Students who logged in but have completed zero tasks with 0% progress',
    at_risk: (
      <div className="space-y-1.5">
        <p className="font-semibold">Classified as At-Risk when ALL conditions are met:</p>
        <ol className="list-decimal ml-4 space-y-0.5">
          <li>Active account (not refunded/offboarded)</li>
          <li>Has logged in before</li>
          <li>Inactive for 7+ days since last sign-in</li>
          <li>Has completed at least 1 task</li>
        </ol>
      </div>
    ),
    missed_onboarding: 'Students who missed their scheduled onboarding call 48+ hours ago and haven\'t rescheduled',
  };

  const cards = [
    {
      key: 'never_logged_in',
      label: 'Never Logged In',
      count: neverLoggedInCount,
      icon: UserX,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-l-amber-500',
      students: neverLoggedInStudents,
      trendDelta: 0,
      accentHex: '#F59E0B',
      sparklineData: [],
      hoverAccent: 'hover:text-amber-600',
      pillBg: 'bg-amber-100 dark:bg-amber-900/30',
      pillText: 'text-amber-800 dark:text-amber-300',
      pillBorder: 'border-amber-300 dark:border-amber-700',
      pillActiveBg: 'bg-amber-200 dark:bg-amber-800/50',
    },
    {
      key: 'dead_on_arrival',
      label: 'Dead-on-Arrival',
      count: doaCount,
      icon: Ghost,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-l-orange-500',
      students: doaStudents,
      trendDelta: 0,
      accentHex: '#EA580C',
      sparklineData: [],
      hoverAccent: 'hover:text-orange-600',
      pillBg: 'bg-orange-100 dark:bg-orange-900/30',
      pillText: 'text-orange-800 dark:text-orange-300',
      pillBorder: 'border-orange-300 dark:border-orange-700',
      pillActiveBg: 'bg-orange-200 dark:bg-orange-800/50',
    },
    {
      key: 'at_risk',
      label: 'At-Risk (7d+)',
      count: atRiskCount,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-l-red-500',
      students: atRiskStudents,
      trendDelta: 0,
      accentHex: '#DC2626',
      sparklineData: [],
      hoverAccent: 'hover:text-red-600',
      pillBg: 'bg-red-100 dark:bg-red-900/30',
      pillText: 'text-red-800 dark:text-red-300',
      pillBorder: 'border-red-300 dark:border-red-700',
      pillActiveBg: 'bg-red-200 dark:bg-red-800/50',
    },
    {
      key: 'missed_onboarding',
      label: 'Missed Onboarding',
      count: missedOnboardingCount,
      icon: PhoneOff,
      color: 'text-violet-600',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-l-violet-500',
      students: missedOnboardingStudents,
      trendDelta: 0,
      accentHex: '#7C3AED',
      sparklineData: [],
      hoverAccent: 'hover:text-violet-600',
      pillBg: 'bg-violet-100 dark:bg-violet-900/30',
      pillText: 'text-violet-800 dark:text-violet-300',
      pillBorder: 'border-violet-300 dark:border-violet-700',
      pillActiveBg: 'bg-violet-200 dark:bg-violet-800/50',
    },
  ];

  const noopStatus = async () => {};

  if (variant === 'pill') {
    const totalAttention = neverLoggedInCount + doaCount + atRiskCount + missedOnboardingCount;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-[13px] font-semibold">Needs Attention</h3>
          <span className="text-[11px] text-muted-foreground">({totalAttention})</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {cards.map((card) => {
            const isActive = activeFilter === card.key;
            const pending = pendingByType[card.key] || 0;
            const Icon = card.icon;
            return (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onFilterChange(isActive ? null : card.key)}
                      className={cn(
                        'relative inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium border transition-all cursor-pointer',
                        isActive ? `${card.pillActiveBg} ${card.pillText} ${card.pillBorder}` : `${card.pillBg} ${card.pillText} ${card.pillBorder} opacity-80 hover:opacity-100`
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      <span>{card.label}</span>
                      <span className="font-bold">({card.count})</span>
                      {pending > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[280px] text-xs">
                    {tooltipDescriptions[card.key]}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="mt-2 mb-1">
        <h3 className="text-[13px] font-semibold">Students Requiring Attention</h3>
        <p className="text-[11px] text-muted-foreground">Students who need action from your team today</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {cards.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 + 0.2, duration: 0.3 }}
          >
            <InterventionCardExpanded
              metricType={card.key}
              students={card.students}
              outreachMap={outreachMap}
              onStatusChange={onStatusChange || noopStatus}
              hoverAccent={card.hoverAccent}
            >
              <InterventionCard
                label={card.label}
                count={card.count}
                pendingFollowUps={pendingByType[card.key] || 0}
                icon={card.icon}
                color={card.color}
                bgColor={card.bgColor}
                borderColor={card.borderColor}
                isActive={activeFilter === card.key}
                onClick={() => onFilterChange(activeFilter === card.key ? null : card.key)}
                trendDelta={card.trendDelta}
                accentHex={card.accentHex}
                sparklineData={card.sparklineData}
              />
            </InterventionCardExpanded>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
