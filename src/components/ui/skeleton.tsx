import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-md bg-muted", className)}
      style={{
        backgroundImage:
          "linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--background)) 50%, hsl(var(--muted)) 100%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.6s ease-in-out infinite",
      }}
      {...props}
    />
  )
}

export { Skeleton }
