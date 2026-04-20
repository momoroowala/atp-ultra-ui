import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { cn } from "@/lib/utils";
import { FeatureLockedModal } from "./FeatureLockedModal";

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Home, GraduationCap, Calendar, Users, MessageCircle, ChevronsRight, ChevronsLeft, Rocket, HelpCircle, Headphones, AlertTriangle, Target, StickyNote } from "lucide-react";
import { useSupportNotificationCount } from "@/hooks/useSupportNotifications";


interface RouteItem {
  path: string;
  icon: React.ElementType;
  title: string;
  label: string;
  featureKey?: string;
  pageKey?: string;
}

const routeItems: RouteItem[] = [{
  path: "/home",
  icon: Home,
  title: "Home",
  label: "HOME",
  pageKey: "home"
}, {
  path: "/courses",
  icon: GraduationCap,
  title: "Courses",
  label: "COURSE",
  pageKey: "courses"
}, {
  path: "/my-plan",
  icon: Rocket,
  title: "My Roadmap",
  label: "SPRINT",
  pageKey: "my_plan"
}, {
  path: "/my-notes",
  icon: StickyNote,
  title: "My Notes",
  label: "NOTES",
  pageKey: "my_notes"
}, {
  path: "/brand-leads",
  icon: Target,
  title: "Brand Leads",
  label: "LEADS",
  pageKey: "brand_leads"
}, {
  path: "/calendar",
  icon: Calendar,
  title: "Events",
  label: "EVENTS",
  pageKey: "calendar"
}, {
  path: "/community",
  icon: Users,
  title: "Community",
  label: "COMMUNITY",
  pageKey: "community"
}, {
  path: "/1on1s",
  icon: MessageCircle,
  title: "Direct Messages",
  label: "DMS",
  pageKey: "one_on_ones"
}, {
  path: "/support",
  icon: HelpCircle,
  title: "Support",
  label: "SUPPORT",
  pageKey: "support"
}, {
  path: "/csm-panel",
  icon: Headphones,
  title: "CSM Panel",
  label: "CSM",
  pageKey: "csm_panel"
}, {
  path: "/support-tickets",
  icon: AlertTriangle,
  title: "Support Tickets",
  label: "TICKETS",
  pageKey: "support_tickets"
}];

export const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, featureAccess, featureVisibility } = useAuth();
  const { canAccessPage } = useRoleCheck();
  const { totalChannelUnread, totalDmUnread } = useUnreadCounts();
  const { count: supportUnread } = useSupportNotificationCount();
  const [lockedFeature, setLockedFeature] = useState<string | null>(null);
  const { state, toggleSidebar } = useSidebar();
  const expanded = state === "expanded";

  const isActive = (path: string) => {
    if (path === "/home") return location.pathname === "/home" || location.pathname === "/";
    if (path === "/support") return location.pathname === "/support";
    return location.pathname.startsWith(path);
  };

  const hasFeatureAccess = (featureKey?: string) => {
    if (!featureKey) return true;
    return featureAccess?.[featureKey] !== false;
  };

  const isFeatureVisible = (featureKey?: string) => {
    if (!featureKey) return true;
    return featureVisibility?.[featureKey] !== false;
  };

  return <>
    <Sidebar
      collapsible="icon"
      className="hidden md:flex flex-col border-none bg-sidebar text-sidebar-foreground"
      data-tour="sidebar-nav"
    >
      {/* Header - Logo + Toggle (top area sits behind the fixed TopBanner) */}
      {/* Hidden behind TopBanner overlay */}
      <SidebarHeader className="h-14" />

      {/* Navigation */}
      <SidebarContent className="py-1">
        {/* Toggle button - first clickable item below the banner */}
        <div className={cn("px-3 pt-1 pb-0", expanded ? "flex justify-end" : "flex justify-center")}>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-sidebar-accent/50 transition-colors text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            {expanded ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
          </button>
        </div>
        <SidebarGroup className="p-2 !pr-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-0 !pr-0 !mr-0">
              {routeItems.map(item => {
                if (!isFeatureVisible(item.featureKey)) return null;
                if (item.pageKey && !canAccessPage(item.pageKey)) return null;
                const active = isActive(item.path);
                const hasAccess = hasFeatureAccess(item.featureKey);
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.path} data-tour={item.pageKey === "home" ? "nav-home" : item.pageKey === "courses" ? "nav-courses" : item.pageKey === "my_plan" ? "nav-my-plan" : item.pageKey === "brand_leads" ? "nav-brand-leads" : item.pageKey === "calendar" ? "nav-calendar" : item.pageKey === "community" ? "nav-community" : undefined} className={cn(active ? "sidebar-active-tab" : "", "overflow-visible")}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          onClick={() => {
                            if (!hasAccess) {
                              setLockedFeature(item.featureKey || null);
                              return;
                            }
                            navigate(item.path);
                          }}
                          className={cn(
                            "transition-all duration-200 w-full overflow-visible",
                            active
                              ? "bg-content hover:bg-content rounded-l-2xl !rounded-r-none shadow-none border-none py-2 !pr-0 pl-[2px]"
                              : "opacity-85 hover:opacity-100 hover:bg-sidebar-accent/50 rounded-xl border border-transparent py-1 px-[2px]",
                            expanded
                              ? "flex flex-row items-center gap-3 h-auto justify-start"
                              : "flex flex-col items-center justify-center gap-0.5 h-auto"
                          )}
                        >
                          <div className={cn(
                            "relative flex items-center justify-center overflow-visible",
                            expanded ? "w-10 h-10 rounded-lg" : "w-14 h-12 rounded-xl"
                          )}>
                            <Icon className="h-6 w-6" strokeWidth={2} color={active ? "hsl(var(--sidebar-primary))" : "hsl(var(--sidebar-foreground))"} />
                            {item.path === "/community" && totalChannelUnread > 0 && (
                              <span className="absolute top-0 right-0 translate-x-1 -translate-y-1 z-10 bg-destructive text-destructive-foreground text-[9px] font-bold px-1 min-w-[14px] h-3.5 flex items-center justify-center rounded-full">
                                {totalChannelUnread > 99 ? "99+" : totalChannelUnread}
                              </span>
                            )}
                            {item.path === "/1on1s" && totalDmUnread > 0 && (
                              <span className="absolute top-0 right-0 translate-x-1 -translate-y-1 z-10 bg-destructive text-destructive-foreground text-[9px] font-bold px-1 min-w-[14px] h-3.5 flex items-center justify-center rounded-full">
                                {totalDmUnread > 99 ? "99+" : totalDmUnread}
                              </span>
                            )}
                            {item.path === "/support" && supportUnread > 0 && (
                              <span className="absolute top-0 right-0 translate-x-1 -translate-y-1 z-10 bg-destructive text-destructive-foreground text-[9px] font-bold px-1 min-w-[14px] h-3.5 flex items-center justify-center rounded-full">
                                {supportUnread > 99 ? "99+" : supportUnread}
                              </span>
                            )}
                            {item.path === "/csm-panel" && supportUnread > 0 && (
                              <span className="absolute top-0 right-0 translate-x-1 -translate-y-1 z-10 bg-destructive text-destructive-foreground text-[9px] font-bold px-1 min-w-[14px] h-3.5 flex items-center justify-center rounded-full">
                                {supportUnread > 99 ? "99+" : supportUnread}
                              </span>
                            )}
                          </div>

                          <span className={cn(
                            "uppercase font-semibold leading-[1.1] tracking-wide",
                            expanded
                              ? "text-xs text-left"
                              : "max-w-[64px] text-center text-[9px] [text-wrap:balance]",
                            active ? "text-sidebar-primary" : "text-sidebar-foreground"
                          )}>
                            {expanded ? item.title : item.label}
                          </span>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {!expanded && (
                        <TooltipContent side="right" className="font-medium">
                          {item.title}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>


    </Sidebar>

    <FeatureLockedModal open={!!lockedFeature} onOpenChange={open => !open && setLockedFeature(null)} featureName={lockedFeature || ""} />
  </>;
};
