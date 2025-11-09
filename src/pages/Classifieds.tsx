import { ShoppingBag, Home, Briefcase, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Classifieds = () => {
  const classifieds = [
    {
      title: "Apartment for Rent",
      description: "2+1 apartment near İstiklal, fully furnished",
      category: "Housing",
      type: "offer",
      price: "₺15,000/month",
      icon: Home,
    },
    {
      title: "English Tutor Needed",
      description: "Looking for experienced English teacher",
      category: "Services",
      type: "need",
      price: "Negotiable",
      icon: Briefcase,
    },
    {
      title: "Vintage Furniture Sale",
      description: "Moving sale - various items available",
      category: "Items",
      type: "offer",
      price: "Various",
      icon: ShoppingBag,
    },
    {
      title: "Plumber Recommendation",
      description: "Need reliable plumber for bathroom repair",
      category: "Services",
      type: "need",
      price: "Negotiable",
      icon: Wrench,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">
              Classifieds
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Buy, sell, and exchange services within the community
            </p>
          </div>

          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-2">
              <Button variant="default">All Posts</Button>
              <Button variant="outline">Offers</Button>
              <Button variant="outline">Needs</Button>
            </div>
            <Button variant="hero">Post Ad</Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {classifieds.map((item, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={item.type === "offer" ? "default" : "secondary"}>
                          {item.type === "offer" ? "Offering" : "Looking for"}
                        </Badge>
                        <Badge variant="outline">{item.category}</Badge>
                      </div>
                      <CardTitle className="text-xl mb-2">{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                      <p className="text-primary font-semibold mt-2">{item.price}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Contact
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Classifieds;
