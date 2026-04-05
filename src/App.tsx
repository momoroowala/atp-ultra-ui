import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { LoaderShimmer } from "./components/LoaderShimmer";

// Static imports - needed for initial load / auth flow
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";
import ChangeEmail from "./pages/ChangeEmail";
import CreateNewPassword from "./pages/CreateNewPassword";
import AuthCallback from "./pages/AuthCallback";
import GoogleCalendarCallback from "./pages/GoogleCalendarCallback";
import TermsOfService from "./pages/TermsOfService";

// Lazy imports - route-based code splitting
const Home = lazy(() => import("./pages/Home"));
const Community = lazy(() => import("./pages/Community"));
const Calendar = lazy(() => import("./pages/Calendar"));
const MyPlan = lazy(() => import("./pages/MyPlan"));
const BrandLeads = lazy(() => import("./pages/BrandLeads"));
const CSMPanel = lazy(() => import("./pages/CSMPanel"));
const SettingsNew = lazy(() => import("./pages/SettingsNew"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const ModuleLesson = lazy(() => import("./pages/ModuleLesson"));
const MyTasks = lazy(() => import("./pages/MyTasks"));
const OneOnOnes = lazy(() => import("./pages/OneOnOnes"));
const Support = lazy(() => import("./pages/Support"));
const SupportTickets = lazy(() => import("./pages/SupportTickets"));
const MyNotes = lazy(() => import("./pages/MyNotes"));
const MyProfile = lazy(() => import("./pages/MyProfile"));
const LearningJourney = lazy(() => import("./pages/LearningJourney"));
const CourseCatalog = lazy(() => import("./pages/CourseCatalog"));

import { CrispChat } from "./components/CrispChat";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { BadgeEarnedNotification } from "./components/BadgeEarnedNotification";
import { BadgeCelebrationModal } from "./components/BadgeCelebrationModal";
import { InitializeUserSession } from "./components/InitializeUserSession";
import { AppVersionChecker } from "./components/AppVersionChecker";

import { SidebarProvider } from "./components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      // 5 minutes - data stays fresh
      gcTime: 10 * 60 * 1000,
      // 10 minutes - cache retention
      refetchOnWindowFocus: false,
      // Don't refetch on tab switch
      refetchOnMount: false,
      // Don't refetch on mount - use cache
      refetchOnReconnect: false,
      // Don't refetch on reconnect
      refetchInterval: false,
      // Disable interval refetching
      refetchIntervalInBackground: false,
      // Disable background polling
      retry: 1 // Only retry failed requests once
    }
  }
});
const ConditionalChatBubble = () => {
  // Show Crisp chat on all pages including AI pages
  return <CrispChat />;
};

import { MobileBottomNav } from "@/components/MobileBottomNav";
import { TopBanner } from "@/components/TopBanner";

// Layout wrapper for authenticated routes with persistent sidebar
const AuthenticatedLayout = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const location = useLocation();

  return <SidebarProvider defaultOpen={true}>
  <TopBanner />
  <div className="flex h-screen w-full bg-sidebar pt-[44px] overflow-hidden">
        {/* Desktop: Collapsible sidebar */}
        <AppSidebar />
        
        {/* Main content - big card with rounded edges */}
        <div className="flex-1 flex flex-col min-w-0 pb-[68px] md:pb-0 md:m-2 md:ml-0">
          <div className="flex-1 flex flex-col min-h-0 bg-content md:rounded-2xl overflow-clip">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              className="flex-1 flex flex-col min-h-0"
            >
              {children}
            </motion.div>
          </div>
        </div>
      {/* Mobile: Bottom navigation bar */}
      <MobileBottomNav />
      
      <ConditionalChatBubble />
    </div>
  </SidebarProvider>;
};
const App = () => <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" storageKey="eec-theme">
      <AuthProvider>
        <BadgeEarnedNotification />
        <BadgeCelebrationModal />
        <InitializeUserSession />
        <AppVersionChecker />
        <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          
          <PWAInstallPrompt />
          <Suspense fallback={<div className="flex-1 flex items-center justify-center"><LoaderShimmer /></div>}>
          <Routes>
            <Route path="/" element={<ProtectedRoute>
                <Index />
              </ProtectedRoute>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/google-calendar/callback" element={<GoogleCalendarCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/create-new-password" element={<CreateNewPassword />} />
            {/* Public Legal Pages */}
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/change-password" element={<ProtectedRoute>
                <AuthenticatedLayout>
                  <ChangePassword />
                </AuthenticatedLayout>
              </ProtectedRoute>} />
            <Route path="/change-email" element={<ProtectedRoute>
                <AuthenticatedLayout>
                  <ChangeEmail />
                </AuthenticatedLayout>
              </ProtectedRoute>} />
             <Route path="/home" element={<ProtectedRoute>
                <AuthenticatedLayout>
                  <Home />
                </AuthenticatedLayout>
              </ProtectedRoute>} />
             <Route path="/my-profile" element={<ProtectedRoute>
                 <AuthenticatedLayout>
                   <MyProfile />
                 </AuthenticatedLayout>
               </ProtectedRoute>} />
             <Route path="/settings" element={<ProtectedRoute>
                 <AdminRoute>
                   <AuthenticatedLayout>
                     <SettingsNew />
                   </AuthenticatedLayout>
                 </AdminRoute>
               </ProtectedRoute>} />
             <Route path="/courses" element={<ProtectedRoute>
                 <AuthenticatedLayout>
                   <CourseCatalog />
                 </AuthenticatedLayout>
               </ProtectedRoute>} />
             <Route path="/courses/:courseId" element={<ProtectedRoute>
                 <AuthenticatedLayout>
                   <CourseDetail />
                 </AuthenticatedLayout>
               </ProtectedRoute>} />
             <Route path="/courses/:courseId/modules/:moduleId" element={<ProtectedRoute>
                 <AuthenticatedLayout>
                   <ModuleLesson />
                 </AuthenticatedLayout>
               </ProtectedRoute>} />
               <Route path="/calendar" element={<ProtectedRoute>
                   <AuthenticatedLayout>
                     <Calendar />
                   </AuthenticatedLayout>
                 </ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute>
                <AuthenticatedLayout>
                  <Community />
                </AuthenticatedLayout>
              </ProtectedRoute>} />
            <Route path="/community/:channelId" element={<ProtectedRoute>
                <AuthenticatedLayout>
                  <Community />
                </AuthenticatedLayout>
              </ProtectedRoute>} />
            <Route path="/1on1s" element={<ProtectedRoute>
                <AuthenticatedLayout>
                  <OneOnOnes />
                </AuthenticatedLayout>
              </ProtectedRoute>} />
            <Route path="/1on1s/:conversationId" element={<ProtectedRoute>
                <AuthenticatedLayout>
                  <OneOnOnes />
                </AuthenticatedLayout>
              </ProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="/my-plan" element={<ProtectedRoute>
                <AuthenticatedLayout>
                  <MyPlan />
                </AuthenticatedLayout>
              </ProtectedRoute>} />
            <Route path="/my-notes" element={<ProtectedRoute>
                <AuthenticatedLayout>
                  <MyNotes />
                </AuthenticatedLayout>
              </ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute>
                <AuthenticatedLayout>
                  <Support />
                </AuthenticatedLayout>
              </ProtectedRoute>} />
            <Route path="/support-tickets" element={<ProtectedRoute>
                <AdminRoute>
                  <AuthenticatedLayout>
                    <SupportTickets />
                  </AuthenticatedLayout>
                </AdminRoute>
              </ProtectedRoute>} />
            <Route path="/brand-leads" element={<ProtectedRoute>
                <AuthenticatedLayout>
                  <BrandLeads />
                </AuthenticatedLayout>
              </ProtectedRoute>} />
            <Route path="/csm-panel" element={<ProtectedRoute>
                <AdminRoute>
                  <AuthenticatedLayout>
                    <CSMPanel />
                  </AuthenticatedLayout>
                </AdminRoute>
              </ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>;
export default App;
