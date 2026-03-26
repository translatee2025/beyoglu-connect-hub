import { useState } from "react";
import { Dog, Search, AlertTriangle, Heart, Plus, MapPin, Map } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import AddPetForm from "@/components/pets/AddPetForm";
import FriendFinder from "@/components/pets/FriendFinder";
import PetMap from "@/components/pets/PetMap";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const personalityColors: Record<string, string> = {
  friendly: "bg-green-100 text-green-800 border-green-200",
  energetic: "bg-orange-100 text-orange-800 border-orange-200",
  calm: "bg-blue-100 text-blue-800 border-blue-200",
  shy: "bg-purple-100 text-purple-800 border-purple-200",
  playful: "bg-yellow-100 text-yellow-800 border-yellow-200",
  protective: "bg-red-100 text-red-800 border-red-200",
  curious: "bg-teal-100 text-teal-800 border-teal-200",
  independent: "bg-gray-100 text-gray-800 border-gray-200",
};

const speciesEmoji: Record<string, string> = {
  dog: "🐕",
  cat: "🐈",
  bird: "🐦",
  rabbit: "🐇",
  fish: "🐟",
  other: "🐾",
};

const Pets = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [addPetOpen, setAddPetOpen] = useState(false);

  const { data: pets = [], isLoading, refetch } = useQuery({
    queryKey: ["pet-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pet_profiles")
        .select("*, profiles:owner_id(display_name, neighborhood)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const lostPets = pets.filter((p: any) => p.is_lost);
  const browsePets = pets.filter((p: any) => !p.is_lost);

  const filteredPets = browsePets.filter(
    (p: any) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.breed && p.breed.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">
              🐾 Pet Community
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Connect with furry (and feathery) neighbors. Find playmates, organize walks, and keep our pets safe.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search pets by name or breed..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={addPetOpen} onOpenChange={setAddPetOpen}>
              <DialogTrigger asChild>
                <Button variant="default" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add My Pet
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <AddPetForm
                  onSuccess={() => {
                    setAddPetOpen(false);
                    refetch();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="browse" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="browse" className="flex items-center gap-2">
                <Dog className="w-4 h-4" />
                Browse Pets
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <Map className="w-4 h-4" />
                Map
              </TabsTrigger>
              <TabsTrigger value="friends" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Friend Finder
              </TabsTrigger>
              <TabsTrigger value="lost" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Lost & Found
                {lostPets.length > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">
                    {lostPets.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Browse Pets */}
            <TabsContent value="browse">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading pets...</div>
              ) : filteredPets.length === 0 ? (
                <div className="text-center py-12">
                  <Dog className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No pets yet</h3>
                  <p className="text-muted-foreground mb-4">Be the first to add your pet to the community!</p>
                  <Button variant="default" onClick={() => setAddPetOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add My Pet
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPets.map((pet: any) => (
                    <PetCard key={pet.id} pet={pet} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Map View */}
            <TabsContent value="map">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  🗺️ Explore pets in your neighborhood. Zoom in/out and drag to navigate. Tap a pin to see pet details.
                </p>
                <PetMap pets={pets} />
              </div>
            </TabsContent>

            {/* Friend Finder */}
            <TabsContent value="friends">
              <FriendFinder />
            </TabsContent>

            {/* Lost & Found */}
            <TabsContent value="lost">
              {lostPets.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No lost pets reported</h3>
                  <p className="text-muted-foreground">
                    Great news! All pets in the community are accounted for.
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lostPets.map((pet: any) => (
                    <Card key={pet.id} className="border-destructive/50 bg-destructive/5">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-16 h-16">
                            {pet.photo_url ? (
                              <AvatarImage src={pet.photo_url} alt={pet.name} />
                            ) : null}
                            <AvatarFallback className="bg-destructive/20 text-destructive text-2xl">
                              {speciesEmoji[pet.species] || "🐾"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Badge variant="destructive" className="mb-1">LOST</Badge>
                            <CardTitle className="text-lg">{pet.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {pet.breed || pet.species} {pet.gender && `• ${pet.gender}`}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {pet.lost_details && (
                          <p className="text-sm text-foreground mb-2">{pet.lost_details}</p>
                        )}
                        {pet.lost_location && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            Last seen: {pet.lost_location}
                          </div>
                        )}
                        <Button variant="default" size="sm" className="w-full mt-3">
                          I've Seen This Pet
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

const PetCard = ({ pet }: { pet: any }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardHeader className="pb-3">
      <div className="flex items-center gap-3">
        <Avatar className="w-16 h-16">
          {pet.photo_url ? <AvatarImage src={pet.photo_url} alt={pet.name} /> : null}
          <AvatarFallback className="bg-primary/10 text-primary text-2xl">
            {speciesEmoji[pet.species] || "🐾"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-lg truncate">{pet.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {pet.breed || pet.species}
            {pet.age_years ? ` • ${pet.age_years}y` : ""}
            {pet.age_months ? ` ${pet.age_months}m` : ""}
          </p>
          {pet.neighborhood && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3" />
              {pet.neighborhood}
            </div>
          )}
        </div>
      </div>
    </CardHeader>
    <CardContent>
      {pet.bio && <p className="text-sm text-foreground mb-3 line-clamp-2">{pet.bio}</p>}
      {pet.personality_tags && pet.personality_tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {pet.personality_tags.map((tag: string) => (
            <span
              key={tag}
              className={`text-xs px-2 py-0.5 rounded-full border ${personalityColors[tag] || "bg-muted text-muted-foreground"}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <Button variant="outline" size="sm" className="w-full gap-2">
        <Heart className="w-4 h-4" />
        Send a Woof
      </Button>
    </CardContent>
  </Card>
);

export default Pets;
