import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import Navigation from "./components/Navigation";
import Index from "./pages/Index";
import Groups from "./pages/Groups";
import Events from "./pages/Events";
import Classifieds from "./pages/Classifieds";
import Wall from "./pages/Wall";
import Pets from "./pages/Pets";
import Auth from "./pages/Auth";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminModules from "./pages/admin/AdminModules";
import AdminTheme from "./pages/admin/AdminTheme";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAI from "./pages/admin/AdminAI";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

const App = () => (
  <HelmetProvider>
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  {/* Admin routes - no public nav */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="modules" element={<AdminModules />} />
                    <Route path="theme" element={<AdminTheme />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="ai" element={<AdminAI />} />
                  </Route>

                  {/* Auth */}
                  <Route path="/auth" element={<Auth />} />

                  {/* Public routes with nav */}
                  <Route
                    path="*"
                    element={
                      <>
                        <Navigation />
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/groups" element={<Groups />} />
                          <Route path="/events" element={<Events />} />
                          <Route path="/classifieds" element={<Classifieds />} />
                          <Route path="/wall" element={<Wall />} />
                          <Route path="/pets" element={<Pets />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </>
                    }
                  />
                </Routes>
              </TooltipProvider>
            </AuthProvider>
          </QueryClientProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </HelmetProvider>
);

export default App;
