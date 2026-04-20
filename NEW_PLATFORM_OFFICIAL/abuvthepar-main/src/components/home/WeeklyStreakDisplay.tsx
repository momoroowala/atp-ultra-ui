import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Check, Flag, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { startOfWeek, addDays, isToday, isBefore } from 'date-fns';
import { motion } from 'framer-motion';

export const WeeklyStreakDisplay = () => {
  const { user } = useAuth();

  const { data: streak, isLoading } = useQuery({
    queryKey: ['user-login-streaks', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('user_login_streaks')
        .select('current_streak, longest_streak, last_login_date')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const currentStreak = streak?.current_streak || 0;
  const lastLoginDate = streak?.last_login_date ? new Date(streak.last_login_date) : null;

  const isDayCompleted = (dayDate: Date): boolean => {
    if (!lastLoginDate || currentStreak === 0) return false;
    if (!isBefore(dayDate, today) && !isToday(dayDate)) return false;
    const daysDiff = Math.floor((lastLoginDate.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 0) return false;
    return daysDiff >= 0 && daysDiff < currentStreak;
  };

  const allComplete = daysOfWeek.every(d => isDayCompleted(d));

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        {dayLabels.map((_, i) => (
          <div key={i} className="w-8 h-8 rounded-full bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg border bg-card transition-shadow duration-300 ${allComplete ? 'shadow-[0_0_16px_rgba(85,189,138,0.25)] border-primary/50' : ''}`}>
      {daysOfWeek.map((day, index) => {
        const isCompleted = isDayCompleted(day);
        const isTodayDate = isToday(day);
        const isFuture = !isBefore(day, today) && !isTodayDate;
        const isMissed = !isCompleted && !isFuture && !isTodayDate;
        const isLastDay = index === 6;

        return (
          <div key={index} className="flex flex-col items-center gap-1">
            <span className={`text-[10px] font-medium ${isTodayDate ? 'text-primary' : isMissed ? 'text-destructive/60' : 'text-muted-foreground'}`}>
              {dayLabels[index]}
            </span>
            <motion.div
              initial={isCompleted ? { scale: 0.5 } : false}
              animate={isCompleted ? { scale: 1 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: index * 0.05 }}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center transition-all
                ${isCompleted 
                  ? 'text-primary-foreground shadow-[0_0_8px_rgba(85,189,138,0.4)]' 
                  : isMissed
                    ? 'bg-destructive/10 border border-destructive/30'
                    : isFuture 
                      ? 'bg-muted/50 border border-dashed border-muted-foreground/30' 
                      : isTodayDate 
                        ? 'bg-muted border-2 border-primary'
                        : 'bg-muted border border-muted-foreground/20'
                }
              `}
              style={isCompleted ? { background: 'radial-gradient(160.59% 161.46% at 50% 0%, hsl(var(--primary)) 0%, #6EDAA6 100%)' } : undefined}
            >
              {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              {isMissed && <X className="w-3 h-3 text-destructive/60 stroke-[2.5]" />}
              {isLastDay && !isCompleted && !isMissed && <Flag className="w-3 h-3 text-primary" />}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};
