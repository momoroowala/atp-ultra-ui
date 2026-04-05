import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { FeatureLockedModal } from "./FeatureLockedModal";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Home, GraduationCap, Calendar, Users, MessageCircle, MoreHorizontal, User, Settings, LogOut, Rocket, HelpCircle, Headphones, Target, StickyNote } from "lucide-react";
import { useSupportNotificationCount } from "@/hooks/useSupportNotifications";
import { ThemeToggle } from "./ThemeToggle";

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
  featureKey?: string;
  pageKey?: string;
}

// All nav items matching desktop sidebar exactly
const allNavItems: NavItem[] = [
  { path: "/home", icon: Home, label: "Home", pageKey: "home" },
  { path: "/courses", icon: GraduationCap, label: "Course", pageKey: "courses" },
  { path: "/my-plan", icon: Rocket, label: "Roadmap", pageKey: "my_plan" },
  { path: "/my-notes", icon: StickyNote, label: "Notes", pageKey: "my_notes" },
  { path: "/brand-leads", icon: Target, label: "Leads", pageKey: "brand_leads" },
  { path: "/calendar", icon: Calendar, label: "Events", pageKey: "calendar" },
  { path: "/community", icon: Users, label: "Community", pageKey: "community" },
  { path: "/1on1s", icon: MessageCircle, label: "DMs", pageKey: "one_on_ones" },
  { path: "/support", icon: HelpCircle, label: "Support", pageKey: "support" },
  { path: "/csm-panel", icon: Headphones, label: "CSM Panel", pageKey: "csm_panel" },
];

// Primary items shown directly in bottom nav (first 5)
const PRIMARY_NAV_COUNT = 5;

export const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { featureAccess, featureVisibility, signOut } = useAuth();
  const { canAccessPage, canAccessAdminPanel } = useRoleCheck();
  const { totalChannelUnread, totalDmUnread } = useUnreadCounts();
  const { count: supportUnread } = useSupportNotificationCount();
  const [lockedFeature, setLockedFeature] = useState<string | null>(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/home") return location.pathname === "/home" || location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const hasFeatureAccess = (featureKey?: string) => {
    if (!featureKey) return true;
    return featureAccess?.[featureKey as keyof typeof featureAccess] !== false;
  };

  const isFeatureVisible = (featureKey?: string) => {
    if (!featureKey) return true;
    return featureVisibility?.[featureKey as keyof typeof featureVisibility] !== false;
  };

  // Filter items based on visibility
  const visibleItems = allNavItems.filter(item => isFeatureVisible(item.featureKey) && (!item.pageKey || canAccessPage(item.pageKey)));
  
  // Split into primary (bottom bar) and overflow (more menu)
  const primaryItems = visibleItems.slice(0, PRIMARY_NAV_COUNT);
  const moreItems = visibleItems.slice(PRIMARY_NAV_COUNT);

  const handleNavClick = (item: NavItem) => {
    if (!hasFeatureAccess(item.featureKey)) {
      setLockedFeature(item.featureKey || null);
      return;
    }
    navigate(item.path);
    setMoreMenuOpen(false);
  };

  // Check if any "more" item is active
  const isMoreActive = moreItems.some(item => isActive(item.path));

  const renderNavButton = (item: NavItem, inSheet = false) => {
    const active = isActive(item.path);
    const Icon = item.icon;

    if (inSheet) {
      return (
        <button
          key={item.path}
          onClick={() => handleNavClick(item)}
          className={cn(
            "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200",
            active 
              ? "bg-card border border-border shadow-sm" 
              : "hover:bg-muted/50"
          )}
        >
          <Icon
            className={cn("h-6 w-6", active ? "text-primary" : "text-foreground")}
            strokeWidth={2}
          />
          <span className={cn("font-medium text-sm", active ? "text-primary" : "text-foreground")}>
            {item.label}
          </span>
        </button>
      );
    }

    return (
      <button
        key={item.path}
        onClick={() => handleNavClick(item)}
        className={cn(
          "relative flex items-center justify-center transition-all duration-200",
          active ? "opacity-100" : "opacity-80"
        )}
        style={{
          width: '48px',
          height: '48px',
          padding: '8px',
          borderRadius: '12px',
          background: active ? 'hsl(var(--content-background))' : 'transparent',
          border: active ? '1px solid transparent' : '1px solid transparent',
          boxShadow: active ? '0px 4px 4px rgba(0, 0, 0, 0.04)' : 'none',
        }}
      >
        <Icon
          className={cn("h-6 w-6", active ? "text-sidebar-primary" : "text-sidebar-foreground")}
          strokeWidth={2}
        />
        
        {/* Unread badge for community */}
        {item.path === "/community" && totalChannelUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold px-1 min-w-[16px] h-4 flex items-center justify-center rounded-full">
            {totalChannelUnread > 99 ? "99+" : totalChannelUnread}
          </span>
        )}
        {/* Unread badge for 1on1s */}
        {item.path === "/1on1s" && totalDmUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold px-1 min-w-[16px] h-4 flex items-center justify-center rounded-full">
            {totalDmUnread > 99 ? "99+" : totalDmUnread}
          </span>
        )}
        {/* Unread badge for support */}
        {item.path === "/support" && supportUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold px-1 min-w-[16px] h-4 flex items-center justify-center rounded-full">
            {supportUnread > 99 ? "99+" : supportUnread}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-sidebar"
        data-tour="sidebar-nav"
        style={{
          borderTop: '1px solid hsl(var(--sidebar-border))',
          boxShadow: '0px -8px 12px rgba(0, 0, 0, 0.12)',
        }}
      >
        <div 
          className="flex items-center justify-between mx-auto safe-area-pb"
          style={{
            padding: '10px 16px',
            maxWidth: '390px',
            height: '68px',
          }}
        >
          {/* Primary nav items */}
          {primaryItems.map((item) => renderNavButton(item))}

          {/* More button with sheet */}
          {moreItems.length > 0 && (
            <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className={cn(
                    "relative flex items-center justify-center transition-all duration-200",
                    isMoreActive ? "opacity-100" : "opacity-80"
                  )}
                  style={{
                    width: '48px',
                    height: '48px',
                    padding: '8px',
                    borderRadius: '12px',
                    background: isMoreActive ? 'hsl(var(--content-background))' : 'transparent',
                    border: isMoreActive ? '1px solid transparent' : '1px solid transparent',
                    boxShadow: isMoreActive ? '0px 4px 4px rgba(0, 0, 0, 0.04)' : 'none',
                  }}
                >
                  <MoreHorizontal
                    className={cn("h-6 w-6", isMoreActive ? "text-sidebar-primary" : "text-sidebar-foreground")}
                    strokeWidth={2}
                  />
                </button>
              </SheetTrigger>
              <SheetContent 
                side="bottom" 
                className="rounded-t-2xl bg-background"
              >
                <SheetHeader className="pb-2">
                  <SheetTitle className="text-left text-foreground">
                    More
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-1">
                  {moreItems.map((item) => renderNavButton(item, true))}
                </div>
                
                {/* Account section */}
                <Separator className="my-3" />
                <div className="flex flex-col gap-1 pb-4">
                  {/* My Profile */}
                  <button
                    onClick={() => {
                      navigate('/my-profile');
                      setMoreMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200",
                      location.pathname === '/my-profile'
                        ? "bg-card border border-border shadow-sm" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    <User
                      className={cn("h-6 w-6", location.pathname === '/my-profile' ? "text-primary" : "text-foreground")}
                      strokeWidth={2}
                    />
                    <span className={cn("font-medium text-sm", location.pathname === '/my-profile' ? "text-primary" : "text-foreground")}>
                      My Profile
                    </span>
                  </button>

                  {/* Admin Panel - only for admins */}
                  {canAccessAdminPanel && (
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setMoreMenuOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200",
                        location.pathname === '/settings'
                          ? "bg-card border border-border shadow-sm" 
                          : "hover:bg-muted/50"
                      )}
                    >
                      <Settings
                        className={cn("h-6 w-6", location.pathname === '/settings' ? "text-primary" : "text-foreground")}
                        strokeWidth={2}
                      />
                      <span className={cn("font-medium text-sm", location.pathname === '/settings' ? "text-primary" : "text-foreground")}>
                        Admin Panel
                      </span>
                    </button>
                  )}


                  {/* Theme Toggle */}
                  <div className="flex items-center gap-3 w-full px-4 py-3 rounded-xl">
                    <ThemeToggle className="h-9 w-9" />
                    <span className="font-medium text-sm text-foreground">Theme</span>
                  </div>

                  {/* Sign Out */}
                  <button
                    onClick={async () => {
                      setMoreMenuOpen(false);
                      await signOut();
                      navigate('/auth');
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 hover:bg-muted/50"
                  >
                    <LogOut
                      className="h-6 w-6 text-foreground"
                      strokeWidth={2}
                    />
                    <span className="font-medium text-sm text-foreground">
                      Sign Out
                    </span>
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </nav>

      <FeatureLockedModal 
        open={!!lockedFeature} 
        onOpenChange={(open) => !open && setLockedFeature(null)} 
        featureName={lockedFeature || ""} 
      />
    </>
  );
};
