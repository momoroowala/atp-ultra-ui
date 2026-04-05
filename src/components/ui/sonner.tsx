import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-primary/20 group-[.toaster]:shadow-[0_0_15px_hsl(var(--primary)/0.1)]",
          description: "group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:!bg-muted group-[.toast]:!border-border/50 group-[.toast]:!text-foreground/60 group-[.toast]:hover:!bg-muted-foreground/20 group-[.toast]:!rounded-full group-[.toast]:!h-5 group-[.toast]:!w-5 group-[.toast]:!top-2 group-[.toast]:!right-2 group-[.toast]:!left-auto group-[.toast]:!transform-none",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:!border-l-4 group-[.toaster]:!border-l-primary",
          error:
            "group-[.toaster]:!border-l-4 group-[.toaster]:!border-l-destructive",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
