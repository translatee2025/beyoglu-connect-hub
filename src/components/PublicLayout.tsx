import { Outlet } from "react-router-dom";
import Navigation from "./Navigation";
import BottomNav from "./BottomNav";
import AppSidebar from "./AppSidebar";

const PublicLayout = () => (
  <div className="min-h-screen flex" style={{ backgroundColor: "#F8FAFF" }}>
    {/* Desktop sidebar */}
    <AppSidebar />

    {/* Main column */}
    <div className="flex-1 flex flex-col min-w-0">
      {/* Mobile header - hidden on desktop */}
      <Navigation />

      {/* Page content */}
      <main className="flex-1 pb-16 lg:pb-0 lg:ml-[220px] lg:py-6 lg:px-6">
        <div className="lg:max-w-[860px]">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  </div>
);

export default PublicLayout;
