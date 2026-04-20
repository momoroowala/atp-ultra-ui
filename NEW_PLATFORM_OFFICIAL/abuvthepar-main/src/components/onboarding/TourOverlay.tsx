import { motion, AnimatePresence } from "framer-motion";

interface TourOverlayProps {
  targetRect: DOMRect | null;
  isActive: boolean;
}

const PADDING = 8;

export const TourOverlay = ({ targetRect, isActive }: TourOverlayProps) => {
  if (!isActive) return null;

  return (
    <AnimatePresence>
      {targetRect && (
        <>
          {/* Dark overlay with cutout */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9998] pointer-events-auto"
            style={{
              background: "rgba(0,0,0,0.6)",
              // Use clip-path polygon to cut out the target area
              clipPath: `polygon(
                0% 0%, 0% 100%, 
                ${targetRect.left - PADDING}px 100%, 
                ${targetRect.left - PADDING}px ${targetRect.top - PADDING}px, 
                ${targetRect.right + PADDING}px ${targetRect.top - PADDING}px, 
                ${targetRect.right + PADDING}px ${targetRect.bottom + PADDING}px, 
                ${targetRect.left - PADDING}px ${targetRect.bottom + PADDING}px, 
                ${targetRect.left - PADDING}px 100%, 
                100% 100%, 100% 0%
              )`,
            }}
          />

          {/* Pulse ring around target */}
          <motion.div
            key="pulse"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed z-[9999] pointer-events-none rounded-xl"
            style={{
              top: targetRect.top - PADDING,
              left: targetRect.left - PADDING,
              width: targetRect.width + PADDING * 2,
              height: targetRect.height + PADDING * 2,
              boxShadow: "0 0 0 3px hsl(var(--primary)), 0 0 20px hsl(var(--primary) / 0.4), 0 0 40px hsl(var(--primary) / 0.15)",
              animation: "tour-pulse 2s ease-in-out infinite",
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
};
