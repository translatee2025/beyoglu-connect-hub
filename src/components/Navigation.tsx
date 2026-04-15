import { NavLink } from "@/components/NavLink";
import { GlobalSearchMobile } from "@/components/GlobalSearch";
import { Menu } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import MobileDrawer from "./MobileDrawer";

const Navigation = () => {
  const { language, setLanguage } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 lg:hidden" style={{ backgroundColor: '#1E3A5F', height: '52px' }}>
        <div className="container mx-auto px-4 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-2 flex-shrink-0">
              <span className="text-white text-sm" style={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                beyoğlu
              </span>
            </NavLink>

            {/* Right side: language toggle + hamburger */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage(language === "tr" ? "en" : "tr")}
                className="text-white text-xs font-semibold uppercase px-2 py-1 rounded"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                {language === "tr" ? "TR" : "EN"}
              </button>
              <button
                onClick={() => setDrawerOpen(true)}
                className="w-10 h-10 flex items-center justify-center"
              >
                <Menu className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
};

export default Navigation;
