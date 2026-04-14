import { Outlet } from "react-router-dom";
import Navigation from "./Navigation";

const PublicLayout = () => (
  <>
    <Navigation />
    <Outlet />
  </>
);

export default PublicLayout;
