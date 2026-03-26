import { useState, useMemo } from "react";
import { Heart, Filter, MapPin, Zap, Dog, Users, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const speciesEmoji: Record<string, string> = {
  dog: "🐕", cat: "🐈", bird: "🐦", rabbit: "🐇", fish: "🐟", other: "🐾",
};

const sizeOptions = [
  { value: "tiny", label: "Tiny (< 5kg)", emoji: "🐾" },
  { value: "small", label: "Small (5-10kg)", emoji: "🐕" },
  { value: "medium", label: "Medium (10-25kg)", emoji: "🦮" },
  { value: "large", label: "Large (25-45kg)", emoji: "🐕‍🦺" },
  { value: "giant", label: "Giant (45kg+)", emoji: "🐻" },
];

const energyOptions = [
  { value: "low", label: "Low Energy", icon: "🧘" },
  { value: "moderate", label: "Moderate", icon: "🚶" },
  { value: "high", label: "High Energy", icon: "🏃" },
  { value: "very_high", label: "Very High", icon: "⚡" },
];

const lifestyleOptions = [
  "Morning Walker", "Evening Walker", "Weekend Only", "Daily Runner",
  "Park Regular", "Beach Lover", "City Stroller", "Hiking Buddy",
  "Home Body", "Social Butterfly", "Training Enthusiast",
];

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

interface Filters {
  species: string;
  size: string;
  energy_level: string;
  gender: string;
  personality: string[];
  looking_for: string;
  neighborhood: string;
}

const defaultFilters: Filters = {
  species: "all",
  size: "all",
  energy_level: "all",
  gender: "all",
  personality: [],
  looking_for: "all",
  neighborhood: "",
};

const FriendFinder = () => {
  const { toast } = useToast();
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: allPets = [], isLoading } = useQuery({
    queryKey: ["friend-finder-pets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pet_profiles")
        .select("*")
        .eq("is_lost", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.species !== "all") count++;
    if (filters.size !== "all") count++;
    if (filters.energy_level !== "all") count++;
    if (filters.gender !== "all") count++;
    if (filters.personality.length > 0) count++;
    if (filters.looking_for !== "all") count++;
    if (filters.neighborhood) count++;
    return count;
  }, [filters]);

  const filteredPets = useMemo(() => {
    return allPets.filter((pet: any) => {
      if (filters.species !== "all" && pet.species !== filters.species) return false;
      if (filters.size !== "all" && pet.size !== filters.size) return false;
      if (filters.energy_level !== "all" && pet.energy_level !== filters.energy_level) return false;
      if (filters.gender !== "all" && pet.gender !== filters.gender) return false;
      if (filters.looking_for !== "all" && pet.looking_for && !pet.looking_for.includes(filters.looking_for)) return false;
      if (filters.neighborhood && pet.neighborhood && !pet.neighborhood.toLowerCase().includes(filters.neighborhood.toLowerCase())) return false;
      if (filters.personality.length > 0 && pet.personality_tags) {
        const hasMatch = filters.personality.some((p) => pet.personality_tags.includes(p));
        if (!hasMatch) return false;
      }
      return true;
    });
  }, [allPets, filters]);

  const handleWoof = async (pet: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please log in to connect with pets", variant: "destructive" });
      return;
    }

    // Check if user owns a pet first
    const { data: myPets } = await supabase
      .from("pet_profiles")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1);

    if (!myPets || myPets.length === 0) {
      toast({ title: "Add your pet first to connect with others!", variant: "destructive" });
      return;
    }

    // Create connection request
    const { error } = await supabase.from("pet_connections").insert({
      pet_id: myPets[0].id,
      friend_pet_id: pet.id,
      status: "pending",
    });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "You've already sent a woof to this pet! 🐾" });
      } else {
        toast({ title: "Error sending woof", description: error.message, variant: "destructive" });
      }
      return;
    }

    toast({ title: `Woof sent to ${pet.name}! 🐾`, description: "The owner will be notified." });
  };

  const togglePersonality = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      personality: prev.personality.includes(tag)
        ? prev.personality.filter(t => t !== tag)
        : [...prev.personality, tag],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="default" className="ml-1 text-xs px-1.5 py-0 h-5">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter Pets</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              {/* Species */}
              <div>
                <Label className="mb-2 block font-semibold">Species</Label>
                <Select value={filters.species} onValueChange={v => setFilters(f => ({ ...f, species: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Species</SelectItem>
                    <SelectItem value="dog">🐕 Dogs</SelectItem>
                    <SelectItem value="cat">🐈 Cats</SelectItem>
                    <SelectItem value="bird">🐦 Birds</SelectItem>
                    <SelectItem value="rabbit">🐇 Rabbits</SelectItem>
                    <SelectItem value="other">🐾 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Size */}
              <div>
                <Label className="mb-2 block font-semibold">Size</Label>
                <Select value={filters.size} onValueChange={v => setFilters(f => ({ ...f, size: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Size</SelectItem>
                    {sizeOptions.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.emoji} {s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Energy Level */}
              <div>
                <Label className="mb-2 block font-semibold">Energy Level</Label>
                <Select value={filters.energy_level} onValueChange={v => setFilters(f => ({ ...f, energy_level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Energy</SelectItem>
                    {energyOptions.map(e => (
                      <SelectItem key={e.value} value={e.value}>{e.icon} {e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gender */}
              <div>
                <Label className="mb-2 block font-semibold">Gender</Label>
                <Select value={filters.gender} onValueChange={v => setFilters(f => ({ ...f, gender: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Gender</SelectItem>
                    <SelectItem value="male">♂ Male Only</SelectItem>
                    <SelectItem value="female">♀ Female Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Looking For */}
              <div>
                <Label className="mb-2 block font-semibold">Looking For</Label>
                <Select value={filters.looking_for} onValueChange={v => setFilters(f => ({ ...f, looking_for: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Anything</SelectItem>
                    <SelectItem value="Walking Buddy">🚶 Walking Buddy</SelectItem>
                    <SelectItem value="Playdate">🎾 Playdate</SelectItem>
                    <SelectItem value="Social Group">👥 Social Group</SelectItem>
                    <SelectItem value="Calm Companion">🧘 Calm Companion</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Personality */}
              <div>
                <Label className="mb-2 block font-semibold">Personality</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(personalityColors).map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => togglePersonality(tag)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
                        filters.personality.includes(tag)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border hover:border-primary"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setFilters(defaultFilters)}>
                  Clear All
                </Button>
                <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
                  Show {filteredPets.length} Results
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Quick filter chips */}
        {filters.species !== "all" && (
          <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilters(f => ({ ...f, species: "all" }))}>
            {speciesEmoji[filters.species]} {filters.species} <X className="w-3 h-3" />
          </Badge>
        )}
        {filters.size !== "all" && (
          <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilters(f => ({ ...f, size: "all" }))}>
            Size: {filters.size} <X className="w-3 h-3" />
          </Badge>
        )}
        {filters.energy_level !== "all" && (
          <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFilters(f => ({ ...f, energy_level: "all" }))}>
            Energy: {filters.energy_level} <X className="w-3 h-3" />
          </Badge>
        )}

        <span className="text-sm text-muted-foreground ml-auto">
          {filteredPets.length} pet{filteredPets.length !== 1 ? "s" : ""} found
        </span>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Finding pets near you...</div>
      ) : filteredPets.length === 0 ? (
        <div className="text-center py-12">
          <Dog className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No matches found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your filters to find more pets.</p>
          <Button variant="outline" onClick={() => setFilters(defaultFilters)}>Clear Filters</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPets.map((pet: any) => (
            <FriendCard key={pet.id} pet={pet} onWoof={handleWoof} />
          ))}
        </div>
      )}
    </div>
  );
};

const FriendCard = ({ pet, onWoof }: { pet: any; onWoof: (pet: any) => void }) => {
  const sizeLabel = sizeOptions.find(s => s.value === pet.size);
  const energyLabel = energyOptions.find(e => e.value === pet.energy_level);

  return (
    <Card className="hover:shadow-lg transition-all hover:-translate-y-0.5 border-border/50">
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-muted">
        {pet.photo_url ? (
          <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {speciesEmoji[pet.species] || "🐾"}
          </div>
        )}
        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex gap-1">
          {pet.gender && (
            <span className="text-xs bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full font-medium">
              {pet.gender === "male" ? "♂" : pet.gender === "female" ? "♀" : ""}
            </span>
          )}
          {sizeLabel && (
            <span className="text-xs bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full font-medium">
              {sizeLabel.emoji} {sizeLabel.value}
            </span>
          )}
        </div>
        {energyLabel && (
          <span className="absolute top-2 right-2 text-xs bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full font-medium">
            {energyLabel.icon} {energyLabel.label}
          </span>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-bold text-foreground text-lg">{pet.name}</h3>
            <p className="text-sm text-muted-foreground">
              {pet.breed || pet.species}
              {pet.age_years ? ` • ${pet.age_years}y` : ""}
              {pet.age_months ? ` ${pet.age_months}m` : ""}
            </p>
          </div>
        </div>

        {pet.neighborhood && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <MapPin className="w-3 h-3" />
            {pet.neighborhood}
          </div>
        )}

        {pet.bio && <p className="text-sm text-foreground/80 mb-3 line-clamp-2">{pet.bio}</p>}

        {/* Tags */}
        {pet.personality_tags && pet.personality_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {pet.personality_tags.slice(0, 4).map((tag: string) => (
              <span
                key={tag}
                className={`text-[11px] px-2 py-0.5 rounded-full border ${personalityColors[tag] || "bg-muted text-muted-foreground"}`}
              >
                {tag}
              </span>
            ))}
            {pet.personality_tags.length > 4 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                +{pet.personality_tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Looking for */}
        {pet.looking_for && pet.looking_for.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {pet.looking_for.map((item: string) => (
              <Badge key={item} variant="outline" className="text-[11px] font-normal">
                {item}
              </Badge>
            ))}
          </div>
        )}

        {/* Gender & size preferences */}
        {pet.gender_preference && pet.gender_preference !== "any" && (
          <p className="text-xs text-muted-foreground mb-2">
            Prefers {pet.gender_preference === "male_only" ? "♂ male" : "♀ female"} friends
          </p>
        )}

        <Button onClick={() => onWoof(pet)} variant="default" size="sm" className="w-full gap-2 mt-1">
          <Heart className="w-4 h-4" />
          Send a Woof 🐾
        </Button>
      </CardContent>
    </Card>
  );
};

export default FriendFinder;
