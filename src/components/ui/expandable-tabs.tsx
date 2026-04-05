import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

export type TabItem = {
  id: string;
  icon: LucideIcon;
  label: string;
  color: string;
};

export type ExpandableTabsProps = {
  tabs: TabItem[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  className?: string;
};

export const ExpandableTabs = ({
  tabs,
  activeTabId,
  onTabChange,
  className,
}: ExpandableTabsProps) => {
  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "flex items-center gap-1 rounded-xl bg-muted p-1.5 overflow-x-auto scrollbar-hide",
          className
        )}
      >
        {tabs.map((tab) => {
          const isActive = activeTabId === tab.id;
          const Icon = tab.icon;

          const button = (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              initial={false}
              animate={{
                width: isActive ? 150 : 42,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
              className={cn(
                "relative flex items-center justify-center h-9 rounded-lg cursor-pointer overflow-hidden shrink-0 transition-colors",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/50"
              )}
            >
              <div className="flex items-center gap-2 px-3">
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? tab.color : ""
                  )}
                />
                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="whitespace-nowrap text-sm font-medium overflow-hidden"
                    >
                      {tab.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          );

          if (isActive) return button;

          return (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>{button}</TooltipTrigger>
              <TooltipContent side="bottom">{tab.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
