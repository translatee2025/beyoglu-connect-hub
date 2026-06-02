import { Outlet, useLocation } from "react-router-dom";
import { Suspense } from "react";
import Navigation from "./Navigation";
import AppSidebar from "./AppSidebar";
import { ErrorBoundary } from "./ErrorBoundary";
import BottomNav from "./BottomNav";

const PublicLayout = () => {
  const location = useLocation();
  return (
  <div className="min-h-screen flex" style={{ backgroundColor: "#F8FAFF" }}>
    {/* Desktop sidebar */}
    <AppSidebar />

    {/* Main column */}
    <div className="flex-1 flex flex-col min-w-0">
      {/* Mobile header - hidden on desktop */}
      <Navigation />

      {/* Page content */}
      <main className="flex-1 pb-20 lg:pb-0 lg:ml-[220px] lg:py-6 lg:px-6">
        <div className="lg:max-w-[860px]">
          {/* Per-route boundary: one page's crash won't kill the nav/sidebar,
              and navigating to another route clears the error. */}
          <ErrorBoundary resetKeys={[location.pathname]}>
            <Suspense fallback={<div className="p-6"><div className="h-40 animate-pulse rounded-xl bg-muted/60" /></div>}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </div>

    {/* Mobile primary navigation */}
    <BottomNav />
  </div>
  );
};

export default PublicLayout;
