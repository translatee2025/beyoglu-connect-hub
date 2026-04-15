import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  MessageSquare, Store, Calendar, Film,
  Users, Dog, Heart, Search,
  Home, Car, Wrench, ShoppingBag, Briefcase,
  Menu, X, Globe,
} from "lucide-react";

const districts = ["İstanbul", "Beyoğlu", "Şişli", "Kadıköy", "Beşiktaş"];

const sections = [
  {
    label: "DISCOVER",
    items: [
      { to: "/wall", icon: MessageSquare, label: "Feed" },
      { to: "/venues", icon: Store, label: "Venues" },
      { to: "/events", icon: Calendar, label: "Events" },
      { to: "/reels", icon: Film, label: "Reels" },
    ],
  },
  {
    label: "COMMUNITY",
    items: [
      { to: "/groups", icon: Users, label: "Groups" },
      { to: "/pets", icon: Dog, label: "Pets" },
      { to: "#", icon: Heart, label: "Families" },
      { to: "/lost-found", icon: Search, label: "Lost & Found" },
    ],
  },
  {
    label: "SERVICES",
    items: [
      { to: "/rentals", icon: Home, label: "Rentals" },
      { to: "/parking", icon: Car, label: "Parking" },
      { to: "/help", icon: Wrench, label: "Help" },
      { to: "/classifieds", icon: ShoppingBag, label: "Classifieds" },
      { to: "#", icon: Briefcase, label: "Jobs" },
    ],
  },
];

const MobileDrawer = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { user, signOut } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [activeDistrict, setActiveDistrict] = useState("İstanbul");

  const { data: profile } = useQuery({
    queryKey: ["drawer-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("display_name, avatar_url, neighborhood").eq("user_id", user.id).single();
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const handleNav = (to: string) => {
    navigate(to);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full z-[70] bg-white flex flex-col transition-transform duration-300 lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: 280 }}
      >
        {/* Close button */}
        <div className="flex items-center justify-end p-3">
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" style={{ color: "#1E3A5F" }} />
          </button>
        </div>

        {/* User section */}
        <div className="px-4 pb-3 border-b" style={{ borderColor: "#E2EBFC" }}>
          {user ? (
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNav(`/profile/${user.id}`)}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ backgroundColor: "#1E3A5F" }}>
                  {(profile?.display_name || user.email || "U").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: "#1E3A5F" }}>
                  {profile?.display_name || user.email?.split("@")[0]}
                </div>
                <div className="text-xs" style={{ color: "#94A3B8" }}>
                  {profile?.neighborhood || "Beyoğlu"}
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => handleNav("/auth")}
              className="w-full text-white text-sm font-medium py-2.5 rounded-lg"
              style={{ backgroundColor: "#E74C3C" }}
            >
              Giriş Yap
            </button>
          )}
        </div>

        {/* District pills */}
        <div className="flex flex-wrap gap-1.5 px-4 py-3">
          {districts.map((d) => (
            <button
              key={d}
              onClick={() => setActiveDistrict(d)}
              className="transition-colors"
              style={{
                padding: "3px 12px",
                borderRadius: 20,
                fontSize: 11,
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

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {sections.map((section, si) => (
            <div key={section.label}>
              {si > 0 && <div style={{ height: 1, background: "#E2EBFC", margin: "10px 0" }} />}
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#94A3B8",
                  letterSpacing: "0.07em",
                  textTransform: "uppercase" as const,
                  margin: "14px 0 5px 10px",
                }}
              >
                {section.label}
              </div>
              {section.items.map((item) => (
                <button
                  key={item.to + item.label}
                  onClick={() => handleNav(item.to)}
                  className="flex items-center gap-2.5 w-full text-left transition-colors"
                  style={{
                    padding: "9px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "#64748B",
                  }}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom language toggle */}
        <div className="mt-auto border-t px-4 py-3 flex items-center gap-2" style={{ borderColor: "#E2EBFC" }}>
          <Globe className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
          {["tr", "en"].map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className="uppercase transition-colors"
              style={{
                fontSize: 12,
                fontWeight: language === lang ? 600 : 400,
                color: language === lang ? "#1E3A5F" : "#94A3B8",
                padding: "2px 6px",
              }}
            >
              {lang}
            </button>
          ))}
          {user && (
            <button
              onClick={() => { signOut(); onClose(); }}
              className="ml-auto text-xs"
              style={{ color: "#E74C3C" }}
            >
              Çıkış
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileDrawer;
