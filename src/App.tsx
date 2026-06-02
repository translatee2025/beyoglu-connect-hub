import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { LocationProvider } from "@/providers/LocationProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import PublicLayout from "./components/PublicLayout";

// Route components are code-split so the initial bundle stays small; each page
// (and the heavy libs it pulls in, e.g. leaflet) loads on demand.
const Index = lazy(() => import("./pages/Index"));
const Groups = lazy(() => import("./pages/Groups"));
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const Classifieds = lazy(() => import("./pages/Classifieds"));
const Rentals = lazy(() => import("./pages/Rentals"));
const Parking = lazy(() => import("./pages/Parking"));
const Wall = lazy(() => import("./pages/Wall"));
const GroupDetail = lazy(() => import("./pages/GroupDetail"));
const Pets = lazy(() => import("./pages/Pets"));
const Venues = lazy(() => import("./pages/Venues"));
const NeighborHelp = lazy(() => import("./pages/NeighborHelp"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Messages = lazy(() => import("./pages/Messages"));
const VenueCharts = lazy(() => import("./pages/VenueCharts"));
const VenueDetail = lazy(() => import("./pages/VenueDetail"));
const Reels = lazy(() => import("./pages/Reels"));
const LostFound = lazy(() => import("./pages/LostFound"));
const Jobs = lazy(() => import("./pages/Jobs"));
const Families = lazy(() => import("./pages/Families"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminModules = lazy(() => import("./pages/admin/AdminModules"));
const AdminTheme = lazy(() => import("./pages/admin/AdminTheme"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminAI = lazy(() => import("./pages/admin/AdminAI"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 0, refetchOnWindowFocus: false },
  },
});

const PageFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
  </div>
);

const App = () => (
  <HelmetProvider>
    <BrowserRouter>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <AuthProvider>
              <LocationProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <ErrorBoundary>
                <Suspense fallback={<PageFallback />}>
                <Routes>
                  {/* Admin routes */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="modules" element={<AdminModules />} />
                    <Route path="theme" element={<AdminTheme />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="ai" element={<AdminAI />} />
                  </Route>

                  {/* Auth */}
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reels" element={<Reels />} />

                  {/* Public routes with navigation */}
                  <Route element={<PublicLayout />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/groups" element={<Groups />} />
                    <Route path="/groups/:id" element={<GroupDetail />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/events/:id" element={<EventDetail />} />
                    <Route path="/classifieds" element={<Classifieds />} />
                    <Route path="/rentals" element={<Rentals />} />
                    <Route path="/parking" element={<Parking />} />
                    <Route path="/wall" element={<Wall />} />
                    <Route path="/pets" element={<Pets />} />
                    <Route path="/venues" element={<Venues />} />
                    <Route path="/help" element={<NeighborHelp />} />
                    <Route path="/lost-found" element={<LostFound />} />
                    <Route path="/jobs" element={<Jobs />} />
                    <Route path="/families" element={<Families />} />
                    <Route path="/profile/edit" element={<EditProfile />} />
                    <Route path="/profile/:userId" element={<Profile />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/charts" element={<VenueCharts />} />
                    <Route path="/venue/:venueId" element={<VenueDetail />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
                </Suspense>
                </ErrorBoundary>
              </TooltipProvider>
              </LocationProvider>
            </AuthProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  </HelmetProvider>
);

export default App;
