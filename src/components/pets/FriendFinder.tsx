import { useState, useMemo } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import { Heart, Filter, MapPin, Dog, X, List, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PetSwipeCards from "./PetSwipeCards";
import { useSpecies, useBreeds } from "@/hooks/useSpeciesBreeds";
import { matchesSpeciesFilter, resolveSpecies } from "@/lib/petNormalization";

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

const personalityTags = ["friendly", "energetic", "calm", "shy", "playful", "protective", "curious", "independent"];

interface Filters {
  species: string;
  breed: string;
  size: string;
  energy_level: string;
  gender: string;
  personality: string[];
  looking_for: string;
}

const defaultFilters: Filters = {
  species: "all", breed: "all", size: "all", energy_level: "all", gender: "all", personality: [], looking_for: "all",
};

const FriendFinder = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"swipe" | "list">("swipe");
  const { speciesOptions, speciesEmojiMap, species } = useSpecies();
  const { breedOptions } = useBreeds(filters.species !== "all" ? filters.species : undefined);

  const { data: allPets = [], isLoading } = useQuery({
    queryKey: ["friend-finder-pets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pet_profiles").select("*").eq("is_lost", false).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filters.species !== "all") c++;
    if (filters.breed !== "all") c++;
    if (filters.size !== "all") c++;
    if (filters.energy_level !== "all") c++;
    if (filters.gender !== "all") c++;
    if (filters.personality.length > 0) c++;
    if (filters.looking_for !== "all") c++;
    return c;
  }, [filters]);

  const filteredPets = useMemo(() => {
    return allPets.filter((pet: any) => {
      if (!matchesSpeciesFilter(pet, filters.species, species)) return false;
      if (filters.breed !== "all" && pet.breed !== filters.breed) return false;
      if (filters.size !== "all" && pet.size !== filters.size) return false;
      if (filters.energy_level !== "all" && pet.energy_level !== filters.energy_level) return false;
      if (filters.gender !== "all" && pet.gender !== filters.gender) return false;
      if (filters.looking_for !== "all" && pet.looking_for && !pet.looking_for.includes(filters.looking_for)) return false;
      if (filters.personality.length > 0 && pet.personality_tags) {
        if (!filters.personality.some((p) => pet.personality_tags.includes(p))) return false;
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
    const { data: myPets } = await supabase.from("pet_profiles").select("id, name").eq("owner_id", user.id).limit(1);
    if (!myPets || myPets.length === 0) {
      toast({ title: "Add your pet first to connect with others!", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("pet_connections").insert({
      pet_id: myPets[0].id, friend_pet_id: pet.id, status: "pending",
    });
    if (error) {
      if (error.code === "23505") toast({ title: "You've already sent a woof to this pet! 🐾" });
      else toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    try {
      const { data: existingConvos } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", user.id);
      let conversationId: string | null = null;
      if (existingConvos && existingConvos.length > 0) {
        const convoIds = existingConvos.map(c => c.conversation_id);
        const { data: ownerParticipation } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", pet.owner_id).in("conversation_id", convoIds);
        if (ownerParticipation && ownerParticipation.length > 0) conversationId = ownerParticipation[0].conversation_id;
      }
      if (!conversationId) {
        const { data: newConvo } = await supabase.from("conversations").insert({}).select("id").single();
        if (newConvo) {
          conversationId = newConvo.id;
          await supabase.from("conversation_participants").insert([
            { conversation_id: conversationId, user_id: user.id },
            { conversation_id: conversationId, user_id: pet.owner_id },
          ]);
        }
      }
      if (conversationId) {
        await supabase.from("messages").insert({
          conversation_id: conversationId, sender_id: user.id,
          content: `❤️ ${myPets[0].name} liked your pet ${pet.name}! Let's arrange a meetup! 🐾`,
        });
      }
    } catch (e) {}
    toast({ title: `❤️ Woof sent to ${pet.name}!`, description: "The owner has been notified via message." });
  };

  const togglePersonality = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      personality: prev.personality.includes(tag) ? prev.personality.filter(t => t !== tag) : [...prev.personality, tag],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "swipe" | "list")} className="mr-auto">
          <TabsList className="h-9">
            <TabsTrigger value="swipe" className="gap-1.5 text-xs"><Sparkles className="w-3.5 h-3.5" /> Discover</TabsTrigger>
            <TabsTrigger value="list" className="gap-1.5 text-xs"><List className="w-3.5 h-3.5" /> List</TabsTrigger>
          </TabsList>
        </Tabs>

        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Filters
              {activeFilterCount > 0 && <Badge variant="default" className="ml-1 text-xs px-1.5 py-0 h-5">{activeFilterCount}</Badge>}
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader><SheetTitle>Filter Pets</SheetTitle></SheetHeader>
            <div className="space-y-5 mt-6">
              {/* Species emoji pills */}
              <div>
                <Label className="mb-2 block font-semibold">Species</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilters(f => ({ ...f, species: "all", breed: "all" }))}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: filters.species === "all" ? "#1E3A5F" : "white",
                      color: filters.species === "all" ? "white" : "#374151",
                      border: `1px solid ${filters.species === "all" ? "#1E3A5F" : "#E2EBFC"}`,
                    }}
                  >
                    🐾 {t("filter.all", "All")}
                  </button>
                  {speciesOptions.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setFilters(f => ({ ...f, species: s.value, breed: "all" }))}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: filters.species === s.value ? "#1E3A5F" : "white",
                        color: filters.species === s.value ? "white" : "#374151",
                        border: `1px solid ${filters.species === s.value ? "#1E3A5F" : "#E2EBFC"}`,
                      }}
                    >
                      {s.emoji} {s.label.replace(s.emoji + " ", "")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Breed pills */}
              {filters.species !== "all" && breedOptions.length > 0 && (
                <div>
                  <Label className="mb-2 block font-semibold">Breed</Label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setFilters(f => ({ ...f, breed: "all" }))}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: filters.breed === "all" ? "#1E3A5F" : "white",
                        color: filters.breed === "all" ? "white" : "#374151",
                        border: `1px solid ${filters.breed === "all" ? "#1E3A5F" : "#E2EBFC"}`,
                      }}
                    >
                      {t("pets.all_breeds", "All Breeds")}
                    </button>
                    {breedOptions.map(b => (
                      <button
                        key={b.value}
                        onClick={() => setFilters(f => ({ ...f, breed: b.value }))}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: filters.breed === b.value ? "#1E3A5F" : "white",
                          color: filters.breed === b.value ? "white" : "#374151",
                          border: `1px solid ${filters.breed === b.value ? "#1E3A5F" : "#E2EBFC"}`,
                        }}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="mb-2 block font-semibold">Size</Label>
                <Select value={filters.size} onValueChange={v => setFilters(f => ({ ...f, size: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Size</SelectItem>
                    {sizeOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.emoji} {s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block font-semibold">Energy Level</Label>
                <Select value={filters.energy_level} onValueChange={v => setFilters(f => ({ ...f, energy_level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    {energyOptions.map(e => <SelectItem key={e.value} value={e.value}>{e.icon} {e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block font-semibold">Gender</Label>
                <Select value={filters.gender} onValueChange={v => setFilters(f => ({ ...f, gender: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    <SelectItem value="male">♂ Male</SelectItem>
                    <SelectItem value="female">♀ Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block font-semibold">Personality</Label>
                <div className="flex flex-wrap gap-2">
                  {personalityTags.map(tag => (
                    <button key={tag} type="button" onClick={() => togglePersonality(tag)}
                      className="text-xs px-3 py-1.5 rounded-full transition-colors capitalize"
                      style={{
                        backgroundColor: filters.personality.includes(tag) ? "#1E3A5F" : "white",
                        color: filters.personality.includes(tag) ? "white" : "#374151",
                        border: `1px solid ${filters.personality.includes(tag) ? "#1E3A5F" : "#E2EBFC"}`,
                      }}
                    >{tag}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setFilters(defaultFilters)}>Clear</Button>
                <Button className="flex-1" onClick={() => setFiltersOpen(false)}>Show {filteredPets.length}</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-1">
            {filters.species !== "all" && <Badge variant="secondary" className="gap-1 cursor-pointer text-xs" onClick={() => setFilters(f => ({ ...f, species: "all", breed: "all" }))}>{speciesOptions.find(o => o.value === filters.species)?.label || filters.species} <X className="w-3 h-3" /></Badge>}
            {filters.breed !== "all" && <Badge variant="secondary" className="gap-1 cursor-pointer text-xs" onClick={() => setFilters(f => ({ ...f, breed: "all" }))}>Breed: {filters.breed} <X className="w-3 h-3" /></Badge>}
            {filters.size !== "all" && <Badge variant="secondary" className="gap-1 cursor-pointer text-xs" onClick={() => setFilters(f => ({ ...f, size: "all" }))}>Size: {filters.size} <X className="w-3 h-3" /></Badge>}
          </div>
        )}

        <span className="text-xs" style={{ color: "#64748B" }}>{filteredPets.length} pets</span>
      </div>

      {isLoading ? (
        <div className="text-center py-12" style={{ color: "#64748B" }}>Finding pets near you...</div>
      ) : filteredPets.length === 0 ? (
        <div className="text-center py-12">
          <Dog className="w-16 h-16 mx-auto mb-4" style={{ color: "#94A3B8" }} />
          <h3 className="text-lg font-semibold text-foreground mb-2">No matches found</h3>
          <p className="mb-4" style={{ color: "#64748B" }}>Try adjusting your filters.</p>
          <Button variant="outline" onClick={() => setFilters(defaultFilters)}>Clear Filters</Button>
        </div>
      ) : viewMode === "swipe" ? (
        <PetSwipeCards pets={filteredPets} onLike={handleWoof} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPets.map((pet: any) => (
            <FriendCard key={pet.id} pet={pet} onWoof={handleWoof} speciesEmojiMap={speciesEmojiMap} species={species} />
          ))}
        </div>
      )}
    </div>
  );
};

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

const FriendCard = ({ pet, onWoof, speciesEmojiMap, species }: { pet: any; onWoof: (pet: any) => void; speciesEmojiMap: Record<string, string>; species: any[] }) => (
  <Card className="hover:shadow-lg transition-all hover:-translate-y-0.5 overflow-hidden" style={{ border: "1px solid #E2EBFC" }}>
    <div className="relative aspect-[4/3]" style={{ backgroundColor: "#F8FAFF" }}>
      {pet.photo_url ? (
        <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-5xl">{resolveSpecies(pet, species)?.emoji || speciesEmojiMap[pet.species] || "🐾"}</div>
      )}
      <div className="absolute top-2 left-2 flex gap-1">
        {pet.gender && <span className="text-xs bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full font-medium">{pet.gender === "male" ? "♂" : "♀"}</span>}
      </div>
    </div>
    <CardContent className="p-4">
      <h3 className="font-bold text-lg" style={{ color: "#1E3A5F" }}>{pet.name}</h3>
      <p className="text-sm" style={{ color: "#94A3B8" }}>{pet.breed || pet.species}{pet.age_years ? ` • ${pet.age_years}y` : ""}</p>
      {pet.neighborhood && <div className="flex items-center gap-1 text-xs mt-1" style={{ color: "#94A3B8" }}><MapPin className="w-3 h-3" />{pet.neighborhood}</div>}
      {pet.bio && <p className="text-sm mt-2 line-clamp-2" style={{ color: "#64748B" }}>{pet.bio}</p>}
      {pet.personality_tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {pet.personality_tags.slice(0, 3).map((tag: string) => (
            <span key={tag} className={`text-[11px] px-2 py-0.5 rounded-full border ${personalityColors[tag] || "bg-gray-100 text-gray-800 border-gray-200"}`}>{tag}</span>
          ))}
        </div>
      )}
      <Button onClick={() => onWoof(pet)} size="sm" className="w-full gap-2 mt-3" style={{ backgroundColor: "#E74C3C" }}>
        <Heart className="w-4 h-4" /> Send a Woof 🐾
      </Button>
    </CardContent>
  </Card>
);

export default FriendFinder;
