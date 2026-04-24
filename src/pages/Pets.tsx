import { useState, useMemo } from "react";
import { Dog, Search, AlertTriangle, Heart, Plus, MapPin, Phone, Home } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import PetPostChooser from "@/components/pets/PetPostChooser";
import FriendFinder from "@/components/pets/FriendFinder";
import ShopsVetsSection from "@/components/pets/ShopsVetsSection";
import LostFoundSection from "@/components/pets/LostFoundSection";
import PetSittingWalkingSection from "@/components/pets/PetSittingWalkingSection";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProfileInline } from "@/components/shared/ProfileInline";
import { useProfilesMap } from "@/hooks/useProfilesMap";
import { SafeImage } from "@/components/shared/SafeImage";
import { useLanguage } from "@/providers/LanguageProvider";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { SkeletonGrid } from "@/components/shared/SkeletonCard";
import { useSpecies, useBreeds, type Species } from "@/hooks/useSpeciesBreeds";
import { Stethoscope } from "lucide-react";
import { resolveSpecies, matchesSpeciesFilter, pickPetPhoto } from "@/lib/petNormalization";

const Pets = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [postChooserOpen, setPostChooserOpen] = useState(false);
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [breedFilter, setBreedFilter] = useState("all");
  const [adoptionSort, setAdoptionSort] = useState<"newest" | "nearest">("newest");
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { species, speciesOptions, speciesEmojiMap } = useSpecies();
  const { breedOptions } = useBreeds(speciesFilter !== "all" ? speciesFilter : undefined);

  const handleContact = (userId: string) => {
    if (!user) { navigate("/auth"); return; }
    navigate(`/messages?to=${userId}`);
  };

  const { data: pets = [], isLoading: petsLoading, isSuccess: petsLoaded, refetch: refetchPets } = useQuery({
    queryKey: ["pet-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pet_profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const { data: petPosts = [], refetch: refetchPosts } = useQuery({
    queryKey: ["pet-posts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pet_posts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const lostPets = pets.filter((p: any) => p.is_lost);
  const lostFoundPosts = petPosts.filter((p: any) => p.post_type === "lost" || p.post_type === "found");

  // Adoption listings come from pet_profiles. Exclude lost pets.
  const adoptionPosts = useMemo(() => {
    let list: any[] = (pets as any[])
      .filter((p: any) => !p.is_lost)
      .map((p: any) => ({
        ...p,
        title: p.name,
        description: p.bio,
        address: p.neighborhood,
        user_id: p.owner_id,
      }));
    if (speciesFilter !== "all") {
      list = list.filter((p: any) => matchesSpeciesFilter(p, speciesFilter, species));
    }
    if (breedFilter !== "all") {
      list = list.filter((p: any) => p.breed === breedFilter);
    }
    if (adoptionSort === "newest") {
      list.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list;
  }, [pets, speciesFilter, breedFilter, adoptionSort, species]);

  const handleRefresh = () => { refetchPets(); refetchPosts(); };

  const pillStyle = (active: boolean) => ({
    backgroundColor: active ? "#1E3A5F" : "white",
    color: active ? "white" : "#374151",
    border: `1px solid ${active ? "#1E3A5F" : "#E2EBFC"}`,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={t("common.search", "Search...")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Button variant="hero" className="gap-2" onClick={() => setPostChooserOpen(true)}>
              <Plus className="w-4 h-4" /> {t("pets.create_post", "Create Post")}
            </Button>
          </div>

          <PetPostChooser open={postChooserOpen} onOpenChange={setPostChooserOpen} onSuccess={handleRefresh} />

          <Tabs defaultValue="adoption" className="w-full">
            <TabsList className="mb-6 flex-wrap h-auto gap-1 bg-white border border-[#E2EBFC]">
              <TabsTrigger value="adoption" className="flex items-center gap-2 text-[#374151] data-[state=active]:text-[#1E3A5F] data-[state=active]:bg-[#EFF4FF]"><Dog className="w-4 h-4" /> {t("pets.adoption", "Adoption")}</TabsTrigger>
              <TabsTrigger value="sitting" className="flex items-center gap-2 text-[#374151] data-[state=active]:text-[#1E3A5F] data-[state=active]:bg-[#EFF4FF]"><Home className="w-4 h-4" /> {t("pets.sitting", "Pet Care")}</TabsTrigger>
              <TabsTrigger value="friends" className="flex items-center gap-2 text-[#374151] data-[state=active]:text-[#1E3A5F] data-[state=active]:bg-[#EFF4FF]"><Heart className="w-4 h-4" /> {t("pets.friends", "Friends")}</TabsTrigger>
              <TabsTrigger value="lost" className="flex items-center gap-2 text-[#374151] data-[state=active]:text-[#1E3A5F] data-[state=active]:bg-[#EFF4FF]">
                <AlertTriangle className="w-4 h-4" /> {t("pets.lost_found", "Lost & Found")}
                {(lostPets.length + lostFoundPosts.length) > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">{lostPets.length + lostFoundPosts.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="shops" className="flex items-center gap-2 text-[#374151] data-[state=active]:text-[#1E3A5F] data-[state=active]:bg-[#EFF4FF]"><Stethoscope className="w-4 h-4" /> {t("pets.shops_vets", "Shops & Vets")}</TabsTrigger>
            </TabsList>

            {/* ADOPTION TAB */}
            <TabsContent value="adoption">
              {/* Species filter pills */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <button onClick={() => { setSpeciesFilter("all"); setBreedFilter("all"); }} className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors" style={pillStyle(speciesFilter === "all")}>
                  {t("filter.all", "All")} 🐾
                </button>
                {speciesOptions.map((s) => (
                  <button key={s.value} onClick={() => { setSpeciesFilter(s.value); setBreedFilter("all"); }} className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors" style={pillStyle(speciesFilter === s.value)}>
                    {s.emoji} {s.label.replace(s.emoji + " ", "")}
                  </button>
                ))}
              </div>

              {/* Breed filter pills */}
              {speciesFilter !== "all" && breedOptions.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: "none" }}>
                  <button onClick={() => setBreedFilter("all")} className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors" style={pillStyle(breedFilter === "all")}>
                    {t("pets.all_breeds", "All Breeds")}
                  </button>
                  {breedOptions.map((b) => (
                    <button key={b.value} onClick={() => setBreedFilter(b.value)} className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors" style={pillStyle(breedFilter === b.value)}>
                      {b.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Sort pills */}
              <div className="flex gap-2 mb-4">
                {([
                  { key: "newest" as const, label: t("sort.newest", "Newest") },
                  { key: "nearest" as const, label: t("sort.nearby", "Nearby") },
                ]).map((s) => (
                  <button key={s.key} onClick={() => setAdoptionSort(s.key)} className="px-3 py-1 rounded-full text-xs font-medium transition-colors" style={pillStyle(adoptionSort === s.key)}>
                    {s.label}
                  </button>
                ))}
              </div>

              {petsLoading ? (
                <SkeletonGrid count={2} hasPhoto photoHeight={140} />
              ) : petsLoaded && adoptionPosts.length === 0 ? (
                <EmptyState emoji="🐾" title={t("pets.no_adoption", "No adoption posts yet")} subtitle={t("pets.post_adoption", "Post a pet available for adoption!")} onAction={() => setPostChooserOpen(true)} />
              ) : (
                <AdoptionGrid posts={adoptionPosts} t={t} handleContact={handleContact} speciesEmojiMap={speciesEmojiMap} species={species} />
              )}
            </TabsContent>

            {/* SITTING/WALKING TAB */}
            <TabsContent value="sitting">
              <PetSittingWalkingSection onCreatePost={() => setPostChooserOpen(true)} />
            </TabsContent>

            <TabsContent value="friends">
              <FriendFinder />
            </TabsContent>

            <TabsContent value="lost">
              <LostFoundSection onReport={() => setPostChooserOpen(true)} />
            </TabsContent>

            <TabsContent value="shops">
              <ShopsVetsSection />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

const AdoptionGrid = ({ posts, t, handleContact, speciesEmojiMap, species }: { posts: any[]; t: any; handleContact: (id: string) => void; speciesEmojiMap?: Record<string, string>; species: Species[] }) => {
  const { profilesMap } = useProfilesMap(posts.map((p) => p.user_id));
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post: any) => (
        <PostCard key={post.id} post={post} badgeLabel={t("pets.adoption", "Adoption")} onContact={handleContact} speciesEmojiMap={speciesEmojiMap} profilesMap={profilesMap} species={species} />
      ))}
    </div>
  );
};

const PostCard = ({ post, badgeLabel, isUrgent, onContact, speciesEmojiMap, profilesMap, species }: { post: any; badgeLabel: string; isUrgent?: boolean; onContact: (userId: string) => void; speciesEmojiMap?: Record<string, string>; profilesMap?: Record<string, any>; species?: Species[] }) => {
  const { t } = useLanguage();
  const resolved = species ? resolveSpecies(post, species) : undefined;
  const speciesLabel = resolved?.name_en;
  const emoji = resolved?.emoji || speciesEmojiMap?.[(post.species || "").toLowerCase()] || "🐾";
  const photo = pickPetPhoto(post);
  return (
  <Card className="hover:shadow-md transition-shadow overflow-hidden" style={{ border: `1px solid ${isUrgent ? "#FECACA" : "#E2EBFC"}` }}>
    {/* Photo */}
    <div className="h-[140px] overflow-hidden">
      <SafeImage src={photo} alt={post.title} className="w-full h-full object-cover" fallbackBg="#EFF4FF" fallbackEmoji={emoji} />
    </div>
    <CardHeader className="pb-2">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <Badge className="text-[10px] px-1.5 py-0 h-4" style={{ backgroundColor: "#EFF4FF", color: "#1E3A5F", border: "none" }}>{badgeLabel}</Badge>
        {speciesLabel && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{emoji} {speciesLabel}</Badge>}
        {post.breed && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{post.breed}</Badge>}
      </div>
      <CardTitle className="text-[15px]" style={{ color: "#1E3A5F" }}>{post.title}</CardTitle>
      {post.description && <p className="text-[11px] mt-1 line-clamp-2" style={{ color: "#64748B" }}>{post.description}</p>}
      {post.price && <p className="font-bold text-[13px] mt-1" style={{ color: "#1E3A5F" }}>{post.price}</p>}
      {post.user_id && profilesMap && <div className="mt-1"><ProfileInline userId={post.user_id} profilesMap={profilesMap} showAvatar /></div>}
      {post.address && (
        <div className="flex items-center gap-1 text-[11px] mt-1" style={{ color: "#94A3B8" }}>
          <MapPin className="w-3 h-3" /> {post.address}
        </div>
      )}
    </CardHeader>
    <CardContent className="pt-0">
      <button
        onClick={() => post.user_id && onContact(post.user_id)}
        className="w-full py-1.5 rounded-lg text-xs font-semibold text-white"
        style={{ backgroundColor: "#E74C3C" }}
      >
        {t("common.contact", "Contact")}
      </button>
    </CardContent>
  </Card>
  );
};

const EmptyState = ({ emoji, title, subtitle, onAction }: { emoji: string; title: string; subtitle: string; onAction: () => void }) => {
  const { t } = useLanguage();
  return (
    <div className="text-center py-12">
      <span className="text-5xl block mb-4">{emoji}</span>
      <h3 className="text-lg font-semibold mb-2" style={{ color: "#1E3A5F" }}>{title}</h3>
      <p className="mb-4" style={{ color: "#94A3B8" }}>{subtitle}</p>
      <Button style={{ backgroundColor: "#1E3A5F" }} onClick={onAction}><Plus className="w-4 h-4 mr-2" /> {t("pets.create_post", "Create Post")}</Button>
    </div>
  );
};

export default Pets;
