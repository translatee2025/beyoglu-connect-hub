import { NavLink } from "@/components/NavLink";
import { GlobalSearchDesktop } from "@/components/GlobalSearch";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare, Store, Calendar, Film,
  Users, Dog,
  Home, Car, Wrench, ShoppingBag, Briefcase,
} from "lucide-react";
import { useState, useMemo } from "react";

const districts = ["İstanbul", "Beyoğlu", "Şişli", "Kadıköy", "Beşiktaş"];

const AppSidebar = () => {
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [activeDistrict, setActiveDistrict] = useState("İstanbul");

  const sections = useMemo(() => [
    {
      label: t("nav.discover", "DISCOVER"),
      items: [
        { to: "/wall", icon: MessageSquare, label: t("nav.feed", "Feed") },
        { to: "/venues", icon: Store, label: t("nav.venues", "Venues") },
        { to: "/events", icon: Calendar, label: t("nav.events", "Events") },
        { to: "/reels", icon: Film, label: t("nav.reels", "Reels") },
      ],
    },
    {
      label: t("nav.community", "COMMUNITY"),
      items: [
        { to: "/groups", icon: Users, label: t("nav.groups", "Groups") },
        { to: "/pets", icon: Dog, label: t("nav.pets", "Pets") },
      ],
    },
    {
      label: t("nav.services", "SERVICES"),
      items: [
        { to: "/rentals", icon: Home, label: t("nav.rentals", "Rentals") },
        { to: "/parking", icon: Car, label: t("nav.parking", "Parking") },
        { to: "/help", icon: Wrench, label: t("nav.help", "Help") },
        { to: "/classifieds", icon: ShoppingBag, label: t("nav.classifieds", "Classifieds") },
        { to: "/jobs", icon: Briefcase, label: t("nav.jobs", "Jobs") },
      ],
    },
  ], [t]);

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <aside
      className="hidden lg:flex flex-col fixed top-0 left-0 h-screen z-40 bg-white overflow-y-auto"
      style={{ width: 220, borderRight: "1px solid #E2EBFC" }}
    >
      <div className="flex items-center justify-between" style={{ padding: "16px 16px 10px" }}>
        <span
          className="cursor-pointer"
          style={{ fontSize: 18, fontWeight: 800, color: "#1E3A5F", letterSpacing: "-0.3px" }}
          onClick={() => navigate("/wall")}
        >
          beyoğlu
        </span>
        <div className="flex gap-1">
          {["tr", "en"].map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              style={{
                fontSize: 12, fontWeight: language === lang ? 600 : 400,
                color: language === lang ? "#1E3A5F" : "#64748B",
                padding: "2px 6px", borderRadius: 4,
                backgroundColor: language === lang ? "#EFF4FF" : "transparent",
                border: language === lang ? "1px solid #E2EBFC" : "1px solid transparent",
                textTransform: "uppercase",
              }}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      <GlobalSearchDesktop />

      <div className="flex flex-wrap gap-1.5 px-3 pb-3">
        {districts.map((d) => (
          <button
            key={d}
            onClick={() => setActiveDistrict(d)}
            className="transition-colors"
            style={{
              padding: "3px 12px", borderRadius: 20, fontSize: 12,
              fontWeight: activeDistrict === d ? 500 : 400,
              backgroundColor: activeDistrict === d ? "#1E3A5F" : "white",
              color: activeDistrict === d ? "white" : "#64748B",
              border: activeDistrict === d ? "none" : "0.5px solid #C7D7F7",
            }}
          >
            {d}
          </button>
        ))}
      </div>

      <nav className="flex-1 px-2 pb-4">
        {sections.map((section, si) => (
          <div key={section.label}>
            {si > 0 && <div style={{ height: 1, background: "#E2EBFC", margin: "10px 0" }} />}
            <div
              style={{
                fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "0.07em",
                textTransform: "uppercase" as const, margin: "14px 0 5px 10px",
              }}
            >
              {section.label}
            </div>
            {section.items.map((item) => (
              <NavLink
                key={item.to + item.label}
                to={item.to}
                className="flex items-center gap-2.5 transition-colors"
                activeClassName="!bg-[#EFF4FF] !text-[#1E3A5F] !font-medium !border-l-[3px] !border-l-[#E74C3C]"
                style={{
                  padding: "7px 12px", borderRadius: 8, fontSize: 13,
                  color: "#64748B", borderLeft: "3px solid transparent",
                }}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t px-3 py-3" style={{ borderColor: "#E2EBFC" }}>
        {user ? (
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => navigate(`/profile/${user.id}`)}
          >
            <div
              className="flex items-center justify-center rounded-full text-white flex-shrink-0"
              style={{ width: 36, height: 36, backgroundColor: "#1E3A5F", fontSize: 12, fontWeight: 600 }}
            >
              {userInitials}
            </div>
            <div className="min-w-0">
              <div style={{ fontSize: 12, fontWeight: 500, color: "#1E3A5F" }} className="truncate">
                {user.email?.split("@")[0]}
              </div>
              <div style={{ fontSize: 12, color: "#64748B" }}>Beyoğlu</div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="w-full text-white text-xs font-medium py-2 rounded-lg"
            style={{ backgroundColor: "#E74C3C" }}
          >
            {t("nav.login", "Log In")}
          </button>
        )}

      </div>
    </aside>
  );
};

export default AppSidebar;
