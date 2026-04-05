import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, X, Compass } from "lucide-react";
import type { TourStep } from "@/hooks/useGuidedTour";

interface TourTooltipProps {
  step: TourStep;
  targetRect: DOMRect | null;
  currentIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

const TOOLTIP_WIDTH = 480;
const TOOLTIP_GAP = 16;

export const TourTooltip = ({
  step,
  targetRect,
  currentIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: TourTooltipProps) => {
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [actualPlacement, setActualPlacement] = useState<"top" | "bottom" | "left" | "right">("bottom");

  useEffect(() => {
    if (!targetRect) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tooltipHeight = step.image ? 500 : 220;
    const preferred = step.placement || "bottom";

    let top = 0;
    let left = 0;
    let placement = preferred;

    // Try preferred placement, fallback if off-screen
    if (preferred === "bottom" && targetRect.bottom + TOOLTIP_GAP + tooltipHeight < vh) {
      top = targetRect.bottom + TOOLTIP_GAP;
      left = Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2, vw - TOOLTIP_WIDTH - 16));
    } else if (preferred === "top" && targetRect.top - TOOLTIP_GAP - tooltipHeight > 0) {
      top = targetRect.top - TOOLTIP_GAP - tooltipHeight;
      left = Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2, vw - TOOLTIP_WIDTH - 16));
    } else if (preferred === "right" && targetRect.right + TOOLTIP_GAP + TOOLTIP_WIDTH < vw) {
      top = Math.max(16, targetRect.top + targetRect.height / 2 - tooltipHeight / 2);
      left = targetRect.right + TOOLTIP_GAP;
      placement = "right";
    } else if (preferred === "left" && targetRect.left - TOOLTIP_GAP - TOOLTIP_WIDTH > 0) {
      top = Math.max(16, targetRect.top + targetRect.height / 2 - tooltipHeight / 2);
      left = targetRect.left - TOOLTIP_GAP - TOOLTIP_WIDTH;
      placement = "left";
    } else {
      // Default: below or above
      if (targetRect.bottom + TOOLTIP_GAP + tooltipHeight < vh) {
        top = targetRect.bottom + TOOLTIP_GAP;
        placement = "bottom";
      } else {
        top = Math.max(16, targetRect.top - TOOLTIP_GAP - tooltipHeight);
        placement = "top";
      }
      left = Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - TOOLTIP_WIDTH / 2, vw - TOOLTIP_WIDTH - 16));
    }

    setPosition({ top, left });
    setActualPlacement(placement);
  }, [targetRect, step.placement]);

  if (!targetRect) return null;

  const isLast = currentIndex === totalSteps - 1;
  const progressPercent = ((currentIndex + 1) / totalSteps) * 100;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: actualPlacement === "top" ? 10 : -10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: actualPlacement === "top" ? 10 : -10, scale: 0.97 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="fixed z-[10000] pointer-events-auto"
        style={{
          top: position.top,
          left: position.left,
          width: TOOLTIP_WIDTH,
        }}
      >
        <div className="rounded-2xl border border-primary/40 bg-card shadow-[0_0_30px_hsl(var(--primary)/0.2),_0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
          {/* Header */}
          <div className="px-5 pt-5 pb-3 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center">
                <Compass className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-primary tracking-wide uppercase">
                  Step {currentIndex + 1} of {totalSteps}
                </p>
                <h3 className="text-base font-bold text-foreground leading-tight mt-0.5">
                  {step.title}
                </h3>
              </div>
            </div>
            <button
              onClick={onSkip}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 pb-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Screenshot preview */}
          {step.image && (
            <div className="px-4 pb-3">
              <div className="rounded-xl overflow-hidden border border-border/30">
                <img
                  src={step.image}
                  alt={`${step.title} preview`}
                  className="w-full h-[220px] object-cover object-top"
                  style={{
                    maskImage: "radial-gradient(ellipse 90% 85% at 50% 45%, black 45%, transparent 100%)",
                    WebkitMaskImage: "radial-gradient(ellipse 90% 85% at 50% 45%, black 45%, transparent 100%)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div className="px-5 pb-3">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Skip Tour
            </Button>
            <div className="flex items-center gap-2">
              {currentIndex > 0 && (
                <Button variant="outline" size="sm" onClick={onPrev} className="h-9 px-3">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button
                size="sm"
                onClick={onNext}
                className="h-9 px-4 shadow-[0_0_16px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_24px_hsl(var(--primary)/0.5)] transition-shadow"
              >
                {isLast ? "Finish" : "Next"}
                {!isLast && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
