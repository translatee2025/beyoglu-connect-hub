import { Outlet } from "react-router-dom";
import Navigation from "./Navigation";
import BottomNav from "./BottomNav";

const PublicLayout = () => (
  <>
    <Navigation />
    <div className="pb-14 lg:pb-0">
      <Outlet />
    </div>
    <BottomNav />
  </>
);

export default PublicLayout;
