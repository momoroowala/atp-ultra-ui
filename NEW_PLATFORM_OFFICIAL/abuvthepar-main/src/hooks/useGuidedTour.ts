import { useState, useCallback, useEffect, useRef } from "react";

import tourHome from "@/assets/tour/tour-home.png";
import tourSidebar from "@/assets/tour/tour-sidebar.png";
import tourCourses from "@/assets/tour/tour-courses.png";
import tourMyPlan from "@/assets/tour/tour-my-plan.png";
import tourCalendar from "@/assets/tour/tour-calendar.png";
import tourCommunity from "@/assets/tour/tour-community.png";
import tourFirstModule from "@/assets/tour/tour-first-module.png";
import tourBrandLeads from "@/assets/tour/tour-brand-leads.png";

export interface TourStep {
  target: string;
  title: string;
  description: string;
  path: string;
  placement?: "top" | "bottom" | "left" | "right";
  image?: string;
  requiredTierKeys?: string[];
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="sidebar-nav"]',
    title: "Your Navigation Hub",
    description: "Access all platform features from this sidebar — courses, plan, calendar, community, and more.",
    path: "/home",
    placement: "right",
    
  },
  {
    target: '[data-tour="nav-home"]',
    title: "Your Dashboard",
    description: "This is your home base. Get a quick overview of your progress, upcoming events, streaks, and milestones — all in one place.",
    path: "/home",
    placement: "right",
    image: tourHome,
  },
  {
    target: '[data-tour="nav-courses"]',
    title: "Courses",
    description: "Browse and complete your learning modules here. Track your progress through each course.",
    path: "/home",
    placement: "right",
    image: tourCourses,
  },
  {
    target: '[data-tour="nav-my-plan"]',
    title: "Your Action Plan",
    description: "Track your personalized sprint tasks and milestones to keep you on track.",
    path: "/home",
    placement: "right",
    image: tourMyPlan,
  },
  {
    target: '[data-tour="nav-brand-leads"]',
    title: "Brand Leads",
    description: "Track your brand outreach, manage leads, and monitor your progress toward your 100-lead goal.",
    path: "/home",
    placement: "right",
    image: tourBrandLeads,
    requiredTierKeys: ["platinum", "diamond"],
  },
  {
    target: '[data-tour="nav-calendar"]',
    title: "Events & Recordings",
    description: "View upcoming live calls, coaching sessions, and past session recordings.",
    path: "/home",
    placement: "right",
    image: tourCalendar,
  },
  {
    target: '[data-tour="nav-community"]',
    title: "Community",
    description: "Connect with peers, ask questions, share wins, and get support from the group.",
    path: "/home",
    placement: "right",
    image: tourCommunity,
  },
  {
    target: '[data-tour="onboarding-step-3"]',
    title: "Start the First Module",
    description: "Head to the EEC Course and begin with the welcome module to start building real skills!",
    path: "/home",
    placement: "bottom",
    image: tourFirstModule,
  },
];

const STORAGE_KEY = "onboarding_tour_completed";

export function hasTourCompleted(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function useGuidedTour(tierKey?: string | null) {
  const [isActive, setIsActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number>(0);

  const filteredSteps = TOUR_STEPS.filter(
    (step) => !step.requiredTierKeys || (tierKey && step.requiredTierKeys.includes(tierKey))
  );

  const currentStep = filteredSteps[currentIndex];
  const totalSteps = filteredSteps.length;

  const findAndHighlight = useCallback((selector: string) => {
    const el = document.querySelector(selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return true;
    }
    return false;
  }, []);

  // Poll for target element
  const waitForElement = useCallback(
    (selector: string, maxAttempts = 30) => {
      let attempts = 0;
      const poll = () => {
        if (findAndHighlight(selector)) return;
        attempts++;
        if (attempts < maxAttempts) {
          rafRef.current = requestAnimationFrame(poll);
        }
      };
      setTimeout(poll, 200);
    },
    [findAndHighlight]
  );

  // Find element for current step
  useEffect(() => {
    if (!isActive || !currentStep) return;

    const timer = setTimeout(() => {
      waitForElement(currentStep.target);
    }, 150);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, currentIndex, currentStep, waitForElement]);

  // Update rect on scroll/resize
  useEffect(() => {
    if (!isActive || !currentStep) return;

    const update = () => {
      const el = document.querySelector(currentStep.target);
      if (el) setTargetRect(el.getBoundingClientRect());
    };

    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [isActive, currentStep]);

  const startTour = useCallback(() => {
    setCurrentIndex(0);
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    if (currentIndex < totalSteps - 1) {
      setTargetRect(null);
      setCurrentIndex((i) => i + 1);
    } else {
      localStorage.setItem(STORAGE_KEY, "true");
      setIsActive(false);
      setTargetRect(null);
    }
  }, [currentIndex, totalSteps]);

  const prevStep = useCallback(() => {
    if (currentIndex > 0) {
      setTargetRect(null);
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const skipTour = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsActive(false);
    setTargetRect(null);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    isActive,
    currentStep,
    currentIndex,
    totalSteps,
    targetRect,
    startTour,
    nextStep,
    prevStep,
    skipTour,
  };
}
