import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarDays, ShoppingBag, MessageCircle, ShieldCheck, Languages } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-beyoglu.jpg";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Community Groups",
      description: "Connect with neighbors who share your interests and passions",
    },
    {
      icon: CalendarDays,
      title: "Local Events",
      description: "Discover and participate in events happening in your neighborhood",
    },
    {
      icon: ShoppingBag,
      title: "Classifieds",
      description: "Buy, sell, and exchange services within the community",
    },
    {
      icon: MessageCircle,
      title: "Community Wall",
      description: "Share updates and stay connected with your neighbors",
    },
  ];

  const benefits = [
    {
      icon: Languages,
      title: "Bilingual Platform",
      description: "Seamlessly switch between Turkish and English to connect with everyone",
    },
    {
      icon: ShieldCheck,
      title: "Verified Community",
      description: "Feel safe knowing members are verified residents and local businesses",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 to-foreground/60" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="font-display font-bold text-5xl md:text-7xl text-primary-foreground mb-6">
            Welcome to Beyoğlu Connect
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Your neighborhood hub for community, events, and local connections
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="hero"
              size="lg"
              onClick={() => navigate("/wall")}
              className="text-lg px-8 py-6"
            >
              Explore Community
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6 bg-card/90 hover:bg-card border-2"
            >
              Sign Up Free
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">
              Everything Your Community Needs
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Connect, share, and thrive together in Beyoğlu
            </p>
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
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">
                Why Beyoğlu Connect?
              </h2>
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
                        <CardDescription className="text-base">
                          {benefit.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-4xl md:text-5xl text-primary-foreground mb-6">
            Join Your Community Today
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Start connecting with your neighbors and discover what's happening in Beyoğlu
          </p>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/auth")}
            className="text-lg px-8 py-6 bg-card hover:bg-card/90 border-2"
          >
            Get Started
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
