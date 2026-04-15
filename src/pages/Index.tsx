import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarDays, ShoppingBag, MessageCircle, ShieldCheck, Languages } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/providers/LanguageProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-beyoglu.jpg";

const useCms = (key: string, fallback: string) => {
  const { language } = useLanguage();
  const { data } = useQuery({
    queryKey: ["site-setting", key],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
      return data?.value as Record<string, string> | null;
    },
    staleTime: 1000 * 60 * 10,
  });
  if (!data) return fallback;
  return data[language] || data["en"] || fallback;
};

const Index = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const heroTitle = useCms("hero_title", "Welcome to Beyoğlu Connect");
  const heroSubtitle = useCms("hero_subtitle", "Your neighborhood hub for community, events, and local connections");
  const heroCtaPrimary = useCms("hero_cta_primary", "Explore Community");
  const heroCtaSecondary = useCms("hero_cta_secondary", "Sign Up Free");
  const featuresHeading = useCms("features_heading", "Everything Your Community Needs");
  const featuresSubtitle = useCms("features_subtitle", "Connect, share, and thrive together in Beyoğlu");
  const benefitsHeading = useCms("benefits_heading", "Why Beyoğlu Connect?");
  const ctaHeading = useCms("cta_heading", "Join Your Community Today");
  const ctaSubtitle = useCms("cta_subtitle", "Start connecting with your neighbors and discover what's happening in Beyoğlu");
  const ctaButton = useCms("cta_button", "Get Started");

  const features = [
    { icon: Users, title: useCms("feature_1_title", "Community Groups"), description: useCms("feature_1_desc", "Connect with neighbors who share your interests and passions") },
    { icon: CalendarDays, title: useCms("feature_2_title", "Local Events"), description: useCms("feature_2_desc", "Discover and participate in events happening in your neighborhood") },
    { icon: ShoppingBag, title: useCms("feature_3_title", "Classifieds"), description: useCms("feature_3_desc", "Buy, sell, and exchange services within the community") },
    { icon: MessageCircle, title: useCms("feature_4_title", "Community Wall"), description: useCms("feature_4_desc", "Share updates and stay connected with your neighbors") },
  ];

  const benefits = [
    { icon: Languages, title: useCms("benefit_1_title", "Bilingual Platform"), description: useCms("benefit_1_desc", "Seamlessly switch between Turkish and English to connect with everyone") },
    { icon: ShieldCheck, title: useCms("benefit_2_title", "Verified Community"), description: useCms("benefit_2_desc", "Feel safe knowing members are verified residents and local businesses") },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }}>
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 to-foreground/60" />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="font-display font-bold text-5xl md:text-7xl text-primary-foreground mb-6">{heroTitle}</h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">{heroSubtitle}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" onClick={() => navigate("/wall")} className="text-lg px-8 py-6">{heroCtaPrimary}</Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/auth")} className="text-lg px-8 py-6 bg-card/90 hover:bg-card border-2">{heroCtaSecondary}</Button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">{featuresHeading}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{featuresSubtitle}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent><CardDescription className="text-base">{feature.description}</CardDescription></CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">{benefitsHeading}</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <benefit.icon className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl mb-2">{benefit.title}</CardTitle>
                        <CardDescription className="text-base">{benefit.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-4xl md:text-5xl text-primary-foreground mb-6">{ctaHeading}</h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">{ctaSubtitle}</p>
          <Button variant="outline" size="lg" onClick={() => navigate("/auth")} className="text-lg px-8 py-6 bg-card hover:bg-card/90 border-2">{ctaButton}</Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
