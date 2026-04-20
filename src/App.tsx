import { lazy, Suspense, useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
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
// GitHub Pages SPA redirect handler -- picks up path stored by 404.html
function SpaRedirectHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    const redirect = sessionStorage.getItem('spa-redirect');
    if (redirect) {
      sessionStorage.removeItem('spa-redirect');
      navigate(redirect, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// Seed localStorage with demo data for GitHub Pages deploy
function SeedDemoData() {
  if (import.meta.env.BASE_URL === '/') return null;
  if (localStorage.getItem('demo_seeded')) return null;

  // Brand leads
  const leads = [
    { id: 'seed-1', user_id: 'demo-admin-001', company_brand_name: 'GreenLeaf Organics', category: 'Health & Household', contact_name: 'Sarah Mitchell', email: 'sarah@greenleaf.com', phone: '555-0101', status: 'Email Sent', business_model: 'Brand', website: 'greenleaforganics.com', state: 'CA', amazon_lead_product_url: null, notes: 'Found on SmartScout', last_email_sent_date: '2026-04-01', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'seed-2', user_id: 'demo-admin-001', company_brand_name: 'PureVita Supplements', category: 'Beauty & Personal Care', contact_name: 'James Chen', email: 'james@purevita.com', phone: '555-0102', status: 'Approved', business_model: 'Brand', website: 'purevita.com', state: 'NY', amazon_lead_product_url: null, notes: 'Account opened', last_email_sent_date: '2026-03-25', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'seed-3', user_id: 'demo-admin-001', company_brand_name: 'KidsBright Toys', category: 'Toys & Games', contact_name: 'Maria Rodriguez', email: 'maria@kidsbright.com', phone: '555-0103', status: '2 Email Sent', business_model: 'Brand', website: 'kidsbright.com', state: 'TX', amazon_lead_product_url: null, notes: 'Follow up scheduled', last_email_sent_date: '2026-03-28', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'seed-4', user_id: 'demo-admin-001', company_brand_name: 'NaturePaws Pet Co', category: 'Pet Supplies', contact_name: 'Lisa Park', email: 'lisa@naturepaws.com', phone: '555-0105', status: 'Phone Call', business_model: 'Brand', website: 'naturepaws.com', state: 'WA', amazon_lead_product_url: null, notes: 'Strong Amazon presence', last_email_sent_date: '2026-04-03', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'seed-5', user_id: 'demo-admin-001', company_brand_name: 'FreshHome Living', category: 'Home & Kitchen', contact_name: 'Tom Wilson', email: 'tom@freshhome.com', phone: '555-0104', status: 'Approved', business_model: 'Brand', website: 'freshhomeliving.com', state: 'FL', amazon_lead_product_url: null, notes: 'Ready for PO', last_email_sent_date: '2026-03-25', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ];
  localStorage.setItem('brand_leads_local', JSON.stringify(leads));

  // Support tickets
  const tickets = [
    { id: 'seed-tk-1', ticket_number: 1, subject: 'SmartScout integration question', description: 'How do I connect SmartScout filters?', priority: 'medium', status: 'open', ticket_type: 'support', topic: 'Platform Question', submitter_name: 'Mo', submitter_email: 'mo@test.dev', submitter_user_id: 'demo-admin-001', has_new_reply: false, internal: false, attachments: [], created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 'seed-tk-2', ticket_number: 2, subject: 'Brand approval process', description: 'What documents do I need for brand approval?', priority: 'low', status: 'resolved', ticket_type: 'support', topic: 'Program Content Issue', submitter_name: 'Mo', submitter_email: 'mo@test.dev', submitter_user_id: 'demo-admin-001', has_new_reply: false, internal: false, attachments: [], created_at: new Date(Date.now() - 172800000).toISOString(), updated_at: new Date(Date.now() - 172800000).toISOString() },
  ];
  localStorage.setItem('demo_support_tickets', JSON.stringify(tickets));

  // Demo awarded badges
  localStorage.setItem('demo_awarded_badges', JSON.stringify(['first_login', 'brand_hunter', 'community_star', 'streak_7']));

  // Daily actions
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(`daily_actions_${today}`, JSON.stringify({ 0: true, 1: false, 2: true, 3: false, 4: false }));

  // Sprint task notes
  localStorage.setItem('sprint_task_notes_local', JSON.stringify({ 'task-1': 'Need to finish resale cert by Wednesday', 'task-3': 'Dun & Bradstreet took 2 days to process' }));

  localStorage.setItem('demo_seeded', '1');
  return null;
}

const App = () => <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" storageKey="eec-theme">
      <AuthProvider>
        <SeedDemoData />
        <BadgeEarnedNotification />
        <BadgeCelebrationModal />
        <InitializeUserSession />
        <AppVersionChecker />
        <TooltipProvider>
        <Sonner />
        <BrowserRouter basename={import.meta.env.BASE_URL !== '/' ? import.meta.env.BASE_URL.replace(/\/$/, '') : undefined}>
          <SpaRedirectHandler />
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
