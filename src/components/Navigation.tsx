import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Users, Calendar, ShoppingBag, MessageSquare, Dog, Home, Car, Globe, Store, Wrench, ChevronDown, Mail, User, TrendingUp, Film, Search, Plus } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const { t, language, setLanguage, languages } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: "/wall", labelKey: "nav.wall", fallback: "Feed", icon: MessageSquare },
    { to: "/groups", labelKey: "nav.groups", fallback: "Groups", icon: Users },
    { to: "/events", labelKey: "nav.events", fallback: "Events", icon: Calendar },
    { to: "/classifieds", labelKey: "nav.classifieds", fallback: "Classifieds", icon: ShoppingBag },
    { to: "/venues", labelKey: "nav.venues", fallback: "Venues", icon: Store },
    { to: "/pets", labelKey: "nav.pets", fallback: "Pets", icon: Dog },
  ];

  const moreItems = [
    { to: "/rentals", labelKey: "nav.rentals", fallback: "Rentals", icon: Home },
    { to: "/parking", labelKey: "nav.parking", fallback: "Parking", icon: Car },
    { to: "/help", labelKey: "nav.help", fallback: "Help", icon: Wrench },
    { to: "/reels", labelKey: "nav.reels", fallback: "Reels", icon: Film },
    { to: "/lost-found", labelKey: "nav.lost_found", fallback: "Lost & Found", icon: Search },
    { to: "/charts", labelKey: "nav.charts", fallback: "Charts", icon: TrendingUp },
  ];

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <nav className="sticky top-0 z-50 lg:hidden" style={{ backgroundColor: '#1E3A5F', height: '52px' }}>
      <div className="container mx-auto px-4 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-white text-sm" style={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
              beyoğlu
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="px-2.5 py-1 text-xs transition-colors border-b-[1.5px] border-transparent"
                activeClassName="!text-white !border-[#E74C3C] font-medium"
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                {t(item.labelKey, item.fallback)}
              </NavLink>
            ))}
            {moreItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-0.5 px-2.5 py-1 text-xs transition-colors" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    <ChevronDown className="w-3 h-3" />
                    {t('nav.more', 'More')}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {moreItems.map((item) => (
                    <DropdownMenuItem key={item.to} asChild>
                      <NavLink to={item.to} className="flex items-center gap-2 w-full text-xs" activeClassName="text-primary font-medium">
                        <item.icon className="w-3.5 h-3.5" />
                        <span>{t(item.labelKey, item.fallback)}</span>
                      </NavLink>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Right side controls */}
          <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0">
            {/* Post button */}
            <button
              onClick={() => navigate("/wall")}
              className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white rounded-md transition-colors"
              style={{ backgroundColor: '#E74C3C', fontSize: '11px' }}
            >
              <Plus className="w-3 h-3" /> Paylaş
            </button>

            {/* Language toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <Globe className="w-3.5 h-3.5" />
                  <span className="uppercase font-medium">{language}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((lang) => (
                  <DropdownMenuItem key={lang.code} onClick={() => setLanguage(lang.code)} className={`text-xs ${language === lang.code ? "font-medium" : ""}`}>
                    {lang.native_name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <>
                <NotificationBell />
                <NavLink to="/messages" className="p-1.5 rounded transition-colors" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <Mail className="w-5 h-5" />
                </NavLink>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xxs font-medium" style={{ backgroundColor: '#E74C3C' }}>
                      {userInitials}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/profile/${user.id}`)} className="text-xs">{t('nav.my_profile', 'My Profile')}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => signOut()} className="text-xs">{t('nav.logout', 'Log Out')}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <button onClick={() => navigate("/auth")} className="text-xs px-3 py-1 rounded transition-colors" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('nav.login', 'Log In')}</button>
                <button onClick={() => navigate("/auth")} className="text-xs px-3 py-1 rounded text-white font-medium" style={{ backgroundColor: '#E74C3C' }}>{t('nav.signup', 'Sign Up')}</button>
              </>
            )}
          </div>

          {/* Mobile: app name left + avatar right */}
          <div className="flex lg:hidden items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xxs font-medium" style={{ backgroundColor: '#E74C3C' }}>
                    {userInitials}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/profile/${user.id}`)} className="text-xs">{t('nav.my_profile', 'My Profile')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/messages")} className="text-xs">{t('nav.messages', 'Messages')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()} className="text-xs">{t('nav.logout', 'Log Out')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button onClick={() => navigate("/auth")} className="text-xs px-3 py-1 rounded text-white font-medium" style={{ backgroundColor: '#E74C3C' }}>{t('nav.login', 'Log In')}</button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
