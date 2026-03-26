import { useState } from "react";
import { Dog, Search, AlertTriangle, Heart, Plus, MapPin, Map, Clock, Phone, Filter, Sparkles } from "lucide-react";
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
import ReportLostPetForm from "@/components/pets/ReportLostPetForm";
import PetFilters, { PetFilterState, defaultFilters } from "@/components/pets/PetFilters";
import PetSwipeCards from "@/components/pets/PetSwipeCards";
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
  dog: "🐕", cat: "🐈", bird: "🐦", rabbit: "🐇", fish: "🐟", other: "🐾",
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function matchesFilters(pet: any, filters: PetFilterState): boolean {
  if (filters.species !== "all" && pet.species !== filters.species) return false;
  if (filters.size !== "all" && pet.size !== filters.size) return false;
  if (filters.gender !== "all" && pet.gender !== filters.gender) return false;
  if (filters.personality !== "all" && !(pet.personality_tags || []).includes(filters.personality)) return false;
  if (filters.energyLevel !== "all" && pet.energy_level !== filters.energyLevel) return false;
  if (filters.ageRange !== "all") {
    const y = pet.age_years || 0;
    if (filters.ageRange === "puppy" && y > 1) return false;
    if (filters.ageRange === "young" && (y < 1 || y > 3)) return false;
    if (filters.ageRange === "adult" && (y < 3 || y > 8)) return false;
    if (filters.ageRange === "senior" && y < 8) return false;
  }
  return true;
}

const Pets = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [addPetOpen, setAddPetOpen] = useState(false);
  const [reportLostOpen, setReportLostOpen] = useState(false);
  const [filters, setFilters] = useState<PetFilterState>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: pets = [], isLoading, refetch } = useQuery({
    queryKey: ["pet-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pet_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const lostPets = pets.filter((p: any) => p.is_lost);
  const browsePets = pets.filter((p: any) => !p.is_lost);

  const filteredPets = browsePets
    .filter((p: any) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.breed && p.breed.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .filter((p: any) => matchesFilters(p, filters));

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
            <div className="flex gap-2">
              <Dialog open={addPetOpen} onOpenChange={setAddPetOpen}>
                <DialogTrigger asChild>
                  <Button variant="default" className="gap-2">
                    <Plus className="w-4 h-4" /> Add My Pet
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <AddPetForm onSuccess={() => { setAddPetOpen(false); refetch(); }} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Tabs defaultValue="browse" className="w-full">
            <TabsList className="mb-6 flex-wrap h-auto gap-1">
              <TabsTrigger value="browse" className="flex items-center gap-2">
                <Dog className="w-4 h-4" /> Browse
              </TabsTrigger>
              <TabsTrigger value="swipe" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Discover
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <Map className="w-4 h-4" /> Map
              </TabsTrigger>
              <TabsTrigger value="friends" className="flex items-center gap-2">
                <Heart className="w-4 h-4" /> Friends
              </TabsTrigger>
              <TabsTrigger value="lost" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Lost & Found
                {lostPets.length > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">{lostPets.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Browse Pets */}
            <TabsContent value="browse">
              <div className="space-y-4">
                {/* Filter toggle */}
                <div>
                  <Button variant="outline" size="sm" onClick={() => setFiltersOpen(!filtersOpen)} className="gap-2 text-xs">
                    <Filter className="w-3 h-3" />
                    {filtersOpen ? "Hide Filters" : "Filters"}
                    {Object.values(filters).filter(v => v !== "all").length > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                        {Object.values(filters).filter(v => v !== "all").length}
                      </Badge>
                    )}
                  </Button>
                  {filtersOpen && (
                    <div className="mt-2 p-3 rounded-lg border border-border bg-card">
                      <PetFilters filters={filters} onChange={setFilters} />
                    </div>
                  )}
                </div>

                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">Loading pets...</div>
                ) : filteredPets.length === 0 ? (
                  <div className="text-center py-12">
                    <Dog className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No pets found</h3>
                    <p className="text-muted-foreground mb-4">Try adjusting your filters or add your pet!</p>
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
              </div>
            </TabsContent>

            {/* Swipe / Discover */}
            <TabsContent value="swipe">
              <PetSwipeCards pets={pets} />
            </TabsContent>

            {/* Map View */}
            <TabsContent value="map">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  🗺️ Explore pets, vet clinics 🏥 and pet shops 🛒 nearby. Tap pins for details.
                </p>
                <PetMap pets={pets} showFilters />
              </div>
            </TabsContent>

            {/* Friend Finder */}
            <TabsContent value="friends">
              <FriendFinder />
            </TabsContent>

            {/* Lost & Found */}
            <TabsContent value="lost">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Lost & Found Alerts</h3>
                      <p className="text-sm text-muted-foreground">
                        {lostPets.length > 0
                          ? `${lostPets.length} pet${lostPets.length > 1 ? "s" : ""} currently missing`
                          : "No missing pets — help keep it that way!"}
                      </p>
                    </div>
                  </div>
                  <Dialog open={reportLostOpen} onOpenChange={setReportLostOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="gap-2 whitespace-nowrap">
                        <AlertTriangle className="w-4 h-4" /> Report Lost Pet
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <ReportLostPetForm onSuccess={() => { setReportLostOpen(false); refetch(); }} />
                    </DialogContent>
                  </Dialog>
                </div>

                {lostPets.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-destructive" /> Last Seen Locations
                    </h4>
                    <PetMap pets={lostPets} showFilters={false} />
                  </div>
                )}

                {lostPets.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
                      <span className="text-3xl">✅</span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">All pets safe!</h3>
                    <p className="text-muted-foreground">No lost pets reported right now.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lostPets.map((pet: any) => (
                      <Card key={pet.id} className="border-destructive/50 bg-destructive/5 overflow-hidden">
                        <div className="bg-destructive text-white px-4 py-1.5 text-xs font-bold flex items-center gap-2">
                          <span className="animate-pulse">🚨</span> URGENT — LOST PET
                          {pet.lost_at && (
                            <span className="ml-auto font-normal opacity-80 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {getTimeAgo(pet.lost_at)}
                            </span>
                          )}
                        </div>
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-16 h-16 ring-2 ring-destructive ring-offset-2">
                              {pet.photo_url && <AvatarImage src={pet.photo_url} alt={pet.name} />}
                              <AvatarFallback className="bg-destructive/20 text-destructive text-2xl">
                                {speciesEmoji[pet.species] || "🐾"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{pet.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {pet.breed || pet.species} {pet.gender && `• ${pet.gender === "male" ? "♂" : "♀"}`}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {pet.lost_details && <p className="text-sm text-foreground">{pet.lost_details}</p>}
                          {pet.lost_location && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="w-3 h-3 text-destructive" />
                              Last seen: <span className="font-medium text-foreground">{pet.lost_location}</span>
                            </div>
                          )}
                          <div className="flex gap-2 pt-1">
                            <Button variant="destructive" size="sm" className="flex-1 gap-1">
                              <Phone className="w-3 h-3" /> I've Seen This Pet
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1">Share</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
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
          {pet.photo_url && <AvatarImage src={pet.photo_url} alt={pet.name} />}
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
              <MapPin className="w-3 h-3" /> {pet.neighborhood}
            </div>
          )}
        </div>
      </div>
    </CardHeader>
    <CardContent>
      {pet.bio && <p className="text-sm text-foreground mb-3 line-clamp-2">{pet.bio}</p>}
      {pet.personality_tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {pet.personality_tags.map((tag: string) => (
            <span key={tag} className={`text-xs px-2 py-0.5 rounded-full border ${personalityColors[tag] || "bg-muted text-muted-foreground"}`}>
              {tag}
            </span>
          ))}
        </div>
      )}
      <Button variant="outline" size="sm" className="w-full gap-2">
        <Heart className="w-4 h-4" /> Send a Woof
      </Button>
    </CardContent>
  </Card>
);

export default Pets;
