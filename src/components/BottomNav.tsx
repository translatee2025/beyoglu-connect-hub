import { NavLink } from "@/components/NavLink";
import { MessageSquare, Compass, Users, Briefcase, User } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { useAuth } from "@/providers/AuthProvider";

const BottomNav = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const items = [
    { to: "/wall", icon: MessageSquare, label: t("nav.feed", "Feed") },
    { to: "/venues", icon: Compass, label: t("nav.explore", "Explore") },
    { to: "/groups", icon: Users, label: t("nav.community", "Community") },
    { to: "/help", icon: Briefcase, label: t("nav.services", "Services") },
    { to: user ? `/profile/${user.id}` : "/auth", icon: User, label: t("nav.profile", "Profile") },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border lg:hidden" style={{ height: '56px' }}>
      <div className="flex items-center justify-around h-full px-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[56px] min-h-[44px] justify-center"
            activeClassName="[&_.nav-icon-wrap]:bg-primary [&_.nav-icon-wrap]:text-white [&_.nav-label]:text-primary [&_.nav-label]:font-medium [&_.nav-dot]:block"
          >
            <div className="relative">
              <div className="nav-dot hidden w-[3px] h-[3px] rounded-full bg-primary absolute -top-1 left-1/2 -translate-x-1/2" />
              <div className="nav-icon-wrap w-7 h-7 rounded flex items-center justify-center bg-[#F3F4F6] text-[#9CA3AF] transition-colors">
                <item.icon className="w-4 h-4" />
              </div>
            </div>
            <span className="nav-label text-[9px] text-[#9CA3AF] leading-none">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
