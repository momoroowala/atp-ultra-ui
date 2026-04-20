import { useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';

interface BadgeEventDetail {
  badge_name: string;
  icon_emoji: string;
  description: string | null;
  points_value: number | null;
}

const fireCelebrationConfetti = () => {
  // Center burst
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.5 },
    colors: ['#FFD700', '#FFA500', '#FF6347', '#7C3AED', '#10B981'],
    scalar: 1.2,
  });

  // Left cannon
  setTimeout(() => {
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6347'],
    });
  }, 300);

  // Right cannon
  setTimeout(() => {
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6347'],
    });
  }, 500);

  // Star burst
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.4 },
      colors: ['#FFD700', '#FFC107'],
      shapes: ['star'],
      scalar: 1.5,
    });
  }, 800);
};

export const BadgeCelebrationModal = () => {
  const [badge, setBadge] = useState<BadgeEventDetail | null>(null);
  const [open, setOpen] = useState(false);

  const handleBadgeEarned = useCallback((e: Event) => {
    const detail = (e as CustomEvent<BadgeEventDetail>).detail;
    setBadge(detail);
    setOpen(true);
    fireCelebrationConfetti();
  }, []);

  useEffect(() => {
    window.addEventListener('badge-earned', handleBadgeEarned);
    return () => window.removeEventListener('badge-earned', handleBadgeEarned);
  }, [handleBadgeEarned]);

  const handleClose = () => {
    setOpen(false);
    setBadge(null);
  };

  if (!badge) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md border-none bg-transparent shadow-none [&>button]:hidden">
        <DialogTitle className="sr-only">Badge Earned</DialogTitle>
        <DialogDescription className="sr-only">You earned a new achievement badge</DialogDescription>
        <div className="flex flex-col items-center text-center gap-6 py-8 px-6 rounded-2xl bg-card border border-border shadow-xl relative overflow-hidden">
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-orange-400/10 animate-pulse pointer-events-none" />
          
          {/* Badge emoji */}
          <div className="relative">
            <div className="text-8xl animate-[scale-in_0.5s_ease-out] drop-shadow-lg">
              {badge.icon_emoji || '🏆'}
            </div>
            <div className="absolute -inset-4 rounded-full bg-yellow-400/20 blur-xl -z-10 animate-pulse" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              🎉 Badge Earned!
            </p>
            <h2 className="text-2xl font-bold text-foreground font-rebond">
              {badge.badge_name}
            </h2>
          </div>

          {/* Description */}
          {badge.description && (
            <p className="text-muted-foreground text-base max-w-xs">
              {badge.description}
            </p>
          )}

          {/* Points */}
          {badge.points_value != null && badge.points_value > 0 && (
            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20">
              <span className="text-yellow-600 dark:text-yellow-400 font-semibold text-lg">
                +{badge.points_value} pts
              </span>
            </div>
          )}

          {/* CTA */}
          <Button onClick={handleClose} className="mt-2 min-w-[160px]">
            Awesome! 🚀
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
