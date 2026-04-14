import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Users, Calendar, ShoppingBag, MessageSquare, Dog, Menu, X, Home, Car, Globe } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, language, setLanguage, languages } = useLanguage();

  const navItems = [
    { to: "/groups", labelKey: "nav.groups", fallback: "Groups", icon: Users },
    { to: "/events", labelKey: "nav.events", fallback: "Events", icon: Calendar },
    { to: "/classifieds", labelKey: "nav.classifieds", fallback: "Classifieds", icon: ShoppingBag },
    { to: "/rentals", labelKey: "nav.rentals", fallback: "Rentals", icon: Home },
    { to: "/parking", labelKey: "nav.parking", fallback: "Parking", icon: Car },
    { to: "/wall", labelKey: "nav.wall", fallback: "Wall", icon: MessageSquare },
    { to: "/pets", labelKey: "nav.pets", fallback: "Pets", icon: Dog },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-hero flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">B</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground hidden sm:inline">
              Beyoğlu Connect
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                activeClassName="text-primary bg-muted font-medium"
              >
                <item.icon className="w-4 h-4" />
                <span>{t(item.labelKey, item.fallback)}</span>
              </NavLink>
            ))}
          </div>

          {/* Desktop Auth + Language */}
          <div className="hidden md:flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Globe className="w-4 h-4" />
                  <span className="absolute -bottom-0.5 -right-0.5 text-[9px] font-bold uppercase bg-primary text-primary-foreground rounded px-0.5 leading-tight">
                    {language}
                  </span>
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
            <Button variant="ghost">{t('nav.login', 'Log In')}</Button>
            <Button variant="default">{t('nav.signup', 'Sign Up')}</Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-2">
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
              {/* Language switcher mobile */}
              <div className="flex items-center gap-2 px-4 py-3">
                <Globe className="w-5 h-5 text-muted-foreground" />
                {languages.map((lang) => (
                  <Button
                    key={lang.code}
                    variant={language === lang.code ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLanguage(lang.code)}
                  >
                    {lang.native_name}
                  </Button>
                ))}
              </div>
              <div className="flex flex-col gap-2 mt-4 px-4">
                <Button variant="ghost" className="w-full">{t('nav.login', 'Log In')}</Button>
                <Button variant="default" className="w-full">{t('nav.signup', 'Sign Up')}</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
