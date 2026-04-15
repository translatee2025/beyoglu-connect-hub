import { NavLink } from "@/components/NavLink";
import { MessageSquare, Calendar, Dog, Store } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

const BottomNav = () => {
  const { t } = useLanguage();

  const items = [
    { to: "/wall", icon: MessageSquare, label: t("nav.wall", "Wall") },
    { to: "/venues", icon: Store, label: t("nav.venues", "Venues") },
    { to: "/pets", icon: Dog, label: t("nav.pets", "Pets") },
    { to: "/events", icon: Calendar, label: t("nav.events", "Events") },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border lg:hidden">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-muted-foreground transition-colors"
            activeClassName="text-primary"
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
