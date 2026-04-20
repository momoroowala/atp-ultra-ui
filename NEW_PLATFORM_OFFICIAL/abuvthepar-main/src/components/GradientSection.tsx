import { cn } from "@/lib/utils";

interface GradientSectionProps {
  children: React.ReactNode;
  className?: string;
  /** Extra padding at the bottom of the gradient section */
  paddingBottom?: string;
}

/**
 * A wrapper component that applies a green-tinted gradient background.
 */
export const GradientSection = ({
  children,
  className,
  paddingBottom = "10px",
}: GradientSectionProps) => {
  return (
    <div
      className={cn("relative", className)}
      style={{
        paddingBottom: paddingBottom,
      }}
    >
      {children}
    </div>
  );
};
