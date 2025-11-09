import { Users, Lock, Globe, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Groups = () => {
  const groups = [
    {
      name: "Beyoğlu Expats",
      members: 1247,
      type: "public",
      category: "Community",
      description: "Connect with fellow expats living in Beyoğlu",
    },
    {
      name: "Local Food Lovers",
      members: 892,
      type: "public",
      category: "Food & Dining",
      description: "Discover the best restaurants and cafes in the neighborhood",
    },
    {
      name: "Turkish Language Exchange",
      members: 654,
      type: "request",
      category: "Education",
      description: "Practice Turkish and help others learn English",
    },
    {
      name: "Galata Tower Photography",
      members: 423,
      type: "public",
      category: "Arts & Culture",
      description: "Share and discuss photography around Galata",
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "public":
        return <Globe className="w-4 h-4" />;
      case "request":
        return <UserPlus className="w-4 h-4" />;
      default:
        return <Lock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">
              Community Groups
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Join groups to connect with neighbors who share your interests
            </p>
          </div>

          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-2">
              <Button variant="default">All Groups</Button>
              <Button variant="outline">My Groups</Button>
            </div>
            <Button variant="hero">Create Group</Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {groups.map((group, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-hero flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{group.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            {getTypeIcon(group.type)}
                            <span className="capitalize">{group.type}</span>
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {group.members} members
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="mt-3">{group.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    View Group
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

export default Groups;
