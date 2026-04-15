import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Users, Calendar, ShoppingBag, MessageSquare, Dog, Menu, X, Home, Car, Globe, Store, Wrench, ChevronDown, Mail, User, TrendingUp, Film } from "lucide-react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, language, setLanguage, languages } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: "/groups", labelKey: "nav.groups", fallback: "Groups", icon: Users },
    { to: "/events", labelKey: "nav.events", fallback: "Events", icon: Calendar },
    { to: "/classifieds", labelKey: "nav.classifieds", fallback: "Classifieds", icon: ShoppingBag },
    { to: "/rentals", labelKey: "nav.rentals", fallback: "Rentals", icon: Home },
    { to: "/parking", labelKey: "nav.parking", fallback: "Parking", icon: Car },
    { to: "/wall", labelKey: "nav.wall", fallback: "Wall", icon: MessageSquare },
    { to: "/pets", labelKey: "nav.pets", fallback: "Pets", icon: Dog },
    { to: "/venues", labelKey: "nav.venues", fallback: "Venues", icon: Store },
    { to: "/help", labelKey: "nav.help", fallback: "Help", icon: Wrench },
    { to: "/reels", labelKey: "nav.reels", fallback: "Reels", icon: Film },
    { to: "/charts", labelKey: "nav.charts", fallback: "Charts", icon: TrendingUp },
  ];

  // Split: show first 6 on desktop, rest in "More" dropdown
  const visibleItems = navItems.slice(0, 6);
  const moreItems = navItems.slice(6);

  const LanguageSwitcher = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 px-2">
          <Globe className="w-4 h-4" />
          <span className="text-xs font-bold uppercase">{language}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={language === lang.code ? "bg-muted font-medium" : ""}
          >
            {lang.native_name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">B</span>
            </div>
            <span className="font-display font-bold text-lg text-foreground hidden xl:inline">
              Beyoğlu Connect
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-0.5">
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm"
                activeClassName="text-primary bg-muted font-medium"
              >
                <item.icon className="w-4 h-4" />
                <span>{t(item.labelKey, item.fallback)}</span>
              </NavLink>
            ))}

            {/* More dropdown for remaining items */}
            {moreItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm">
                    <ChevronDown className="w-4 h-4" />
                    <span>More</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {moreItems.map((item) => (
                    <DropdownMenuItem key={item.to} asChild>
                      <NavLink
                        to={item.to}
                        className="flex items-center gap-2 w-full"
                        activeClassName="text-primary font-medium"
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{t(item.labelKey, item.fallback)}</span>
                      </NavLink>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Desktop Auth + Language */}
          <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0">
            <LanguageSwitcher />
            {user ? (
              <>
                <NavLink to="/messages" className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
                  <Mail className="w-5 h-5" />
                </NavLink>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm">
                      <User className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/profile/${user.id}`)}>My Profile</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => signOut()}>Log Out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>{t('nav.login', 'Log In')}</Button>
                <Button variant="default" size="sm" onClick={() => navigate("/auth")}>{t('nav.signup', 'Sign Up')}</Button>
              </>
            )}
          </div>

          {/* Mobile: Language + Hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-foreground"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  activeClassName="text-primary bg-muted font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{t(item.labelKey, item.fallback)}</span>
                </NavLink>
              ))}
              <div className="flex flex-col gap-2 mt-4 px-4">
                {user ? (
                  <>
                    <NavLink to="/messages" className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                      <Mail className="w-5 h-5" /> Messages
                    </NavLink>
                    <NavLink to={`/profile/${user.id}`} className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => setMobileMenuOpen(false)}>
                      <User className="w-5 h-5" /> My Profile
                    </NavLink>
                    <Button variant="ghost" className="w-full" onClick={() => { signOut(); setMobileMenuOpen(false); }}>Log Out</Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="w-full" onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }}>{t('nav.login', 'Log In')}</Button>
                    <Button variant="default" className="w-full" onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }}>{t('nav.signup', 'Sign Up')}</Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
