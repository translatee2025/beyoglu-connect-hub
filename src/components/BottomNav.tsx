import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageSquare, Store, Calendar, Dog, Menu } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import MobileDrawer from "./MobileDrawer";

/**
 * Mobile primary navigation: a 5-tab bottom bar (UI bible §5.1 / AP-009 —
 * primary destinations must be visible bottom tabs, not hidden in a hamburger).
 * The 5th "More" tab opens the full drawer for secondary sections.
 * Hidden on desktop (the sidebar handles navigation there).
 */
const BottomNav = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const tabs = [
    { to: "/wall", icon: MessageSquare, label: t("nav.feed", "Feed") },
    { to: "/venues", icon: Store, label: t("nav.venues", "Venues") },
    { to: "/events", icon: Calendar, label: t("nav.events", "Events") },
    { to: "/pets", icon: Dog, label: t("nav.pets", "Pets") },
  ];
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch bg-white"
        style={{ borderTop: "1px solid #E2EBFC", paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary"
      >
        {tabs.map((tab) => {
          const active = isActive(tab.to);
          return (
            <button
              key={tab.to}
              type="button"
              onClick={() => navigate(tab.to)}
              aria-current={active ? "page" : undefined}
              className="relative flex-1 flex flex-col items-center justify-center gap-0.5"
              style={{ minHeight: 56, color: active ? "#1E3A5F" : "#64748B" }}
            >
              <tab.icon className="w-5 h-5" strokeWidth={active ? 2.4 : 1.8} />
              <span className="text-xs" style={{ fontWeight: active ? 600 : 400 }}>{tab.label}</span>
              {active && (
                <span style={{ position: "absolute", top: 0, height: 2, width: 28, borderRadius: 2, backgroundColor: "#E74C3C" }} />
              )}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5"
          style={{ minHeight: 56, color: "#64748B" }}
        >
          <Menu className="w-5 h-5" strokeWidth={1.8} />
          <span className="text-xs">{t("nav.more", "More")}</span>
        </button>
      </nav>
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
};

export default BottomNav;
