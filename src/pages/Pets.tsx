import { useState } from "react";
import { Dog, Search, AlertTriangle, Heart, Plus, MapPin, Map, Clock, Phone, Filter, Sparkles, Stethoscope, ShoppingBag, Home } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import PetPostChooser from "@/components/pets/PetPostChooser";
import FriendFinder from "@/components/pets/FriendFinder";
import PetMap from "@/components/pets/PetMap";
import PetFilters, { PetFilterState, defaultFilters } from "@/components/pets/PetFilters";
import LostFoundSection from "@/components/pets/LostFoundSection";
import PetSwipeCards from "@/components/pets/PetSwipeCards";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserName } from "@/components/shared/UserName";
import { useLanguage } from "@/providers/LanguageProvider";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { SkeletonGrid } from "@/components/shared/SkeletonCard";

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

const Pets = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [postChooserOpen, setPostChooserOpen] = useState(false);
  const [sittingFilter, setSittingFilter] = useState<"all" | "offer" | "want">("all");
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleContact = (userId: string) => {
    if (!user) { navigate("/auth"); return; }
    navigate(`/messages?to=${userId}`);
  };

  const { data: pets = [], isLoading: petsLoading, refetch: refetchPets } = useQuery({
    queryKey: ["pet-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pet_profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: petPosts = [], isLoading: postsLoading, refetch: refetchPosts } = useQuery({
    queryKey: ["pet-posts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pet_posts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const lostPets = pets.filter((p: any) => p.is_lost);
  const adoptionPosts = petPosts.filter((p: any) => p.post_type === "adoption");
  const sittingPosts = petPosts.filter((p: any) => {
    if (p.post_type !== "pet_sitting") return false;
    if (sittingFilter === "offer") return p.is_offering;
    if (sittingFilter === "want") return !p.is_offering;
    return true;
  });
  const lostFoundPosts = petPosts.filter((p: any) => p.post_type === "lost" || p.post_type === "found");
  const shopPosts = petPosts.filter((p: any) => p.post_type === "shop");
  const vetPosts = petPosts.filter((p: any) => p.post_type === "vet");

  const handleRefresh = () => { refetchPets(); refetchPosts(); };

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
              <TabsTrigger value="sitting" className="flex items-center gap-2 text-[#374151] data-[state=active]:text-[#1E3A5F] data-[state=active]:bg-[#EFF4FF]"><Home className="w-4 h-4" /> {t("pets.sitting", "Pet Sitting")}</TabsTrigger>
              <TabsTrigger value="friends" className="flex items-center gap-2 text-[#374151] data-[state=active]:text-[#1E3A5F] data-[state=active]:bg-[#EFF4FF]"><Heart className="w-4 h-4" /> {t("pets.friends", "Friends")}</TabsTrigger>
              <TabsTrigger value="lost" className="flex items-center gap-2 text-[#374151] data-[state=active]:text-[#1E3A5F] data-[state=active]:bg-[#EFF4FF]">
                <AlertTriangle className="w-4 h-4" /> {t("pets.lost_found", "Lost & Found")}
                {(lostPets.length + lostFoundPosts.length) > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">{lostPets.length + lostFoundPosts.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="shops" className="flex items-center gap-2 text-[#374151] data-[state=active]:text-[#1E3A5F] data-[state=active]:bg-[#EFF4FF]"><Stethoscope className="w-4 h-4" /> {t("pets.shops_vets", "Shops & Vets")}</TabsTrigger>
            </TabsList>

            <TabsContent value="adoption">
              {postsLoading ? (
                <SkeletonGrid count={2} hasPhoto photoHeight={140} />
              ) : adoptionPosts.length === 0 ? (
                <EmptyState emoji="🐾" title={t("pets.no_adoption", "No adoption posts yet")} subtitle={t("pets.post_adoption", "Post a pet available for adoption!")} onAction={() => setPostChooserOpen(true)} />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {adoptionPosts.map((post: any) => (
                    <PostCard key={post.id} post={post} badgeLabel={t("pets.adoption", "Adoption")} onContact={handleContact} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sitting">
              <div className="flex gap-2 mb-4">
                {(["all", "offer", "want"] as const).map((f) => (
                  <Button key={f} variant={sittingFilter === f ? "default" : "outline"} size="sm" onClick={() => setSittingFilter(f)}>
                    {f === "all" ? t("common.all", "All") : f === "offer" ? t("pets.i_offer", "I Offer") : t("pets.i_want", "I Want")}
                  </Button>
                ))}
              </div>
              {postsLoading ? (
                <SkeletonGrid count={2} hasPhoto photoHeight={140} />
              ) : sittingPosts.length === 0 ? (
                <EmptyState emoji="🏠" title={t("pets.no_sitting", "No pet sitting posts")} subtitle={t("pets.post_sitting", "Post a sitting service or request!")} onAction={() => setPostChooserOpen(true)} />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sittingPosts.map((post: any) => (
                    <PostCard key={post.id} post={post} badgeLabel={post.is_offering ? t("classifieds.offering", "Offering") : t("classifieds.looking_for", "Looking for")} onContact={handleContact} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="friends">
              <FriendFinder />
            </TabsContent>

            <TabsContent value="lost">
              <LostFoundSection onReport={() => setPostChooserOpen(true)} />
            </TabsContent>

            <TabsContent value="shops">
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">🗺️ {t("pets.browse_shops", "Browse pet shops and vet clinics registered by the community.")}</p>
                <PetMap pets={pets} showFilters />
                <div className="grid sm:grid-cols-2 gap-6">
                  {shopPosts.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">🛒 {t("pets.pet_shops", "Pet Shops")}</h3>
                      <div className="space-y-3">
                        {shopPosts.map((post: any) => <VenueCard key={post.id} post={post} onContact={handleContact} />)}
                      </div>
                    </div>
                  )}
                  {vetPosts.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">🏥 {t("pets.vet_clinics", "Vet Clinics")}</h3>
                      <div className="space-y-3">
                        {vetPosts.map((post: any) => <VenueCard key={post.id} post={post} onContact={handleContact} />)}
                      </div>
                    </div>
                  )}
                </div>
                {shopPosts.length === 0 && vetPosts.length === 0 && (
                  <EmptyState emoji="🏥" title={t("pets.no_shops", "No shops or vets registered yet")} subtitle={t("pets.register_shop", "Register your pet shop or vet clinic!")} onAction={() => setPostChooserOpen(true)} />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

const PostCard = ({ post, badgeLabel, isUrgent, onContact }: { post: any; badgeLabel: string; isUrgent?: boolean; onContact: (userId: string) => void }) => (
  <Card className={`hover:shadow-md transition-shadow ${isUrgent ? "border-destructive/50 bg-destructive/5" : ""}`}>
    <CardHeader>
      <div className="flex items-center gap-2 mb-2">
        <Badge variant={isUrgent ? "destructive" : "default"}>{badgeLabel}</Badge>
        {post.species && <Badge variant="outline">{post.species}</Badge>}
      </div>
      <CardTitle className="text-lg">{post.title}</CardTitle>
      {post.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.description}</p>}
      {post.price && <p className="text-primary font-semibold mt-2">{post.price}</p>}
      {post.user_id && <div className="mt-1"><UserName userId={post.user_id} showAvatar /></div>}
      {post.address && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <MapPin className="w-3 h-3" /> {post.address}
        </div>
      )}
    </CardHeader>
    <CardContent>
      <Button variant="outline" className="w-full" onClick={() => post.user_id && onContact(post.user_id)}>Contact</Button>
    </CardContent>
  </Card>
);

const VenueCard = ({ post, onContact }: { post: any; onContact: (userId: string) => void }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardHeader className="pb-2">
      <CardTitle className="text-base">{post.title}</CardTitle>
      {post.address && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" /> {post.address}
        </div>
      )}
      {post.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.description}</p>}
      {post.user_id && <div className="mt-1"><UserName userId={post.user_id} showAvatar /></div>}
    </CardHeader>
    <CardContent className="pt-0">
      <div className="flex gap-2">
        {post.phone && <Button variant="outline" size="sm" className="flex-1 gap-1"><Phone className="w-3 h-3" /> Call</Button>}
        <Button variant="outline" size="sm" className="flex-1" onClick={() => post.user_id && onContact(post.user_id)}>Contact</Button>
      </div>
    </CardContent>
  </Card>
);

const EmptyState = ({ emoji, title, subtitle, onAction }: { emoji: string; title: string; subtitle: string; onAction: () => void }) => (
  <div className="text-center py-12">
    <span className="text-5xl block mb-4">{emoji}</span>
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground mb-4">{subtitle}</p>
    <Button variant="default" onClick={onAction}><Plus className="w-4 h-4 mr-2" /> Create Post</Button>
  </div>
);

export default Pets;
