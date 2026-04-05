import { createPortal } from "react-dom";
import { useGuidedTour } from "@/hooks/useGuidedTour";
import { TourOverlay } from "./TourOverlay";
import { TourTooltip } from "./TourTooltip";
import { useEffect } from "react";
import confetti from "canvas-confetti";

interface GuidedTourProps {
  tourState: ReturnType<typeof useGuidedTour>;
}

export const GuidedTour = ({ tourState }: GuidedTourProps) => {
  const {
    isActive,
    currentStep,
    currentIndex,
    totalSteps,
    targetRect,
    nextStep,
    prevStep,
    skipTour,
  } = tourState;

  // Fire confetti on tour completion
  useEffect(() => {
    const wasActive = sessionStorage.getItem("tour_was_active");
    if (wasActive === "true" && !isActive) {
      sessionStorage.removeItem("tour_was_active");
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#55BD8A", "#6EDAA6", "#2D8F64", "#A3E4C1"],
      });
    }
  }, [isActive]);

  // Track that tour is active
  useEffect(() => {
    if (isActive) {
      sessionStorage.setItem("tour_was_active", "true");
    }
  }, [isActive]);

  if (!isActive || !currentStep) return null;

  return createPortal(
    <>
      <TourOverlay targetRect={targetRect} isActive={isActive} />
      <TourTooltip
        step={currentStep}
        targetRect={targetRect}
        currentIndex={currentIndex}
        totalSteps={totalSteps}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={skipTour}
      />
    </>,
    document.body
  );
};
