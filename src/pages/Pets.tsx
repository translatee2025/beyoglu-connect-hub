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
import PetSwipeCards from "@/components/pets/PetSwipeCards";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

  // Existing pet profiles
  const { data: pets = [], isLoading: petsLoading, refetch: refetchPets } = useQuery({
    queryKey: ["pet-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pet_profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Pet posts from new table
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
          <div className="text-center mb-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Dog className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">Pet Community</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Connect with furry (and feathery) neighbors. Adopt, find sitters, playmates, and more.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search pets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Button variant="hero" className="gap-2" onClick={() => setPostChooserOpen(true)}>
              <Plus className="w-4 h-4" /> Create Post
            </Button>
          </div>

          <PetPostChooser open={postChooserOpen} onOpenChange={setPostChooserOpen} onSuccess={handleRefresh} />

          <Tabs defaultValue="adoption" className="w-full">
            <TabsList className="mb-6 flex-wrap h-auto gap-1">
              <TabsTrigger value="adoption" className="flex items-center gap-2"><Dog className="w-4 h-4" /> Adoption</TabsTrigger>
              <TabsTrigger value="sitting" className="flex items-center gap-2"><Home className="w-4 h-4" /> Pet Sitting</TabsTrigger>
              <TabsTrigger value="friends" className="flex items-center gap-2"><Heart className="w-4 h-4" /> Friends</TabsTrigger>
              <TabsTrigger value="lost" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Lost & Found
                {(lostPets.length + lostFoundPosts.length) > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">{lostPets.length + lostFoundPosts.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="shops" className="flex items-center gap-2"><Stethoscope className="w-4 h-4" /> Shops & Vets</TabsTrigger>
            </TabsList>

            {/* Adoption */}
            <TabsContent value="adoption">
              {postsLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : adoptionPosts.length === 0 ? (
                <EmptyState emoji="🐾" title="No adoption posts yet" subtitle="Post a pet available for adoption!" onAction={() => setPostChooserOpen(true)} />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {adoptionPosts.map((post: any) => (
                    <PostCard key={post.id} post={post} badgeLabel="Adoption" />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Pet Sitting */}
            <TabsContent value="sitting">
              <div className="flex gap-2 mb-4">
                {(["all", "offer", "want"] as const).map((f) => (
                  <Button key={f} variant={sittingFilter === f ? "default" : "outline"} size="sm" onClick={() => setSittingFilter(f)}>
                    {f === "all" ? "All" : f === "offer" ? "I Offer" : "I Want"}
                  </Button>
                ))}
              </div>
              {postsLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : sittingPosts.length === 0 ? (
                <EmptyState emoji="🏠" title="No pet sitting posts" subtitle="Post a sitting service or request!" onAction={() => setPostChooserOpen(true)} />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sittingPosts.map((post: any) => (
                    <PostCard key={post.id} post={post} badgeLabel={post.is_offering ? "Offering" : "Looking for"} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Friends */}
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
                        {(lostPets.length + lostFoundPosts.length) > 0
                          ? `${lostPets.length + lostFoundPosts.length} active report(s)`
                          : "No missing pets — help keep it that way!"}
                      </p>
                    </div>
                  </div>
                  <Button variant="destructive" className="gap-2 whitespace-nowrap" onClick={() => setPostChooserOpen(true)}>
                    <AlertTriangle className="w-4 h-4" /> Report Lost / Found
                  </Button>
                </div>

                {lostPets.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-destructive" /> Last Seen Locations
                    </h4>
                    <PetMap pets={lostPets} showFilters={false} />
                  </div>
                )}

                {lostPets.length === 0 && lostFoundPosts.length === 0 ? (
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
                          <span className="animate-pulse">🚨</span> LOST PET
                          {pet.lost_at && <span className="ml-auto font-normal opacity-80 flex items-center gap-1"><Clock className="w-3 h-3" /> {getTimeAgo(pet.lost_at)}</span>}
                        </div>
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-16 h-16 ring-2 ring-destructive ring-offset-2">
                              {pet.photo_url && <AvatarImage src={pet.photo_url} alt={pet.name} />}
                              <AvatarFallback className="bg-destructive/20 text-destructive text-2xl">{speciesEmoji[pet.species] || "🐾"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{pet.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">{pet.breed || pet.species}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {pet.lost_details && <p className="text-sm text-foreground">{pet.lost_details}</p>}
                          {pet.lost_location && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="w-3 h-3 text-destructive" /> Last seen: <span className="font-medium text-foreground">{pet.lost_location}</span>
                            </div>
                          )}
                          <Button variant="destructive" size="sm" className="w-full gap-1"><Phone className="w-3 h-3" /> I've Seen This Pet</Button>
                        </CardContent>
                      </Card>
                    ))}
                    {lostFoundPosts.map((post: any) => (
                      <PostCard key={post.id} post={post} badgeLabel={post.post_type === "lost" ? "Lost" : "Found"} isUrgent />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Shops & Vets */}
            <TabsContent value="shops">
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">🗺️ Browse pet shops and vet clinics registered by the community.</p>
                <PetMap pets={pets} showFilters />
                <div className="grid sm:grid-cols-2 gap-6">
                  {shopPosts.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">🛒 Pet Shops</h3>
                      <div className="space-y-3">
                        {shopPosts.map((post: any) => <VenueCard key={post.id} post={post} />)}
                      </div>
                    </div>
                  )}
                  {vetPosts.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">🏥 Vet Clinics</h3>
                      <div className="space-y-3">
                        {vetPosts.map((post: any) => <VenueCard key={post.id} post={post} />)}
                      </div>
                    </div>
                  )}
                </div>
                {shopPosts.length === 0 && vetPosts.length === 0 && (
                  <EmptyState emoji="🏥" title="No shops or vets registered yet" subtitle="Register your pet shop or vet clinic!" onAction={() => setPostChooserOpen(true)} />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

const PostCard = ({ post, badgeLabel, isUrgent }: { post: any; badgeLabel: string; isUrgent?: boolean }) => (
  <Card className={`hover:shadow-md transition-shadow ${isUrgent ? "border-destructive/50 bg-destructive/5" : ""}`}>
    <CardHeader>
      <div className="flex items-center gap-2 mb-2">
        <Badge variant={isUrgent ? "destructive" : "default"}>{badgeLabel}</Badge>
        {post.species && <Badge variant="outline">{post.species}</Badge>}
      </div>
      <CardTitle className="text-lg">{post.title}</CardTitle>
      {post.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.description}</p>}
      {post.price && <p className="text-primary font-semibold mt-2">{post.price}</p>}
      {post.address && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <MapPin className="w-3 h-3" /> {post.address}
        </div>
      )}
    </CardHeader>
    <CardContent>
      <Button variant="outline" className="w-full">Contact</Button>
    </CardContent>
  </Card>
);

const VenueCard = ({ post }: { post: any }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardHeader className="pb-2">
      <CardTitle className="text-base">{post.title}</CardTitle>
      {post.address && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" /> {post.address}
        </div>
      )}
      {post.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.description}</p>}
    </CardHeader>
    <CardContent className="pt-0">
      <div className="flex gap-2">
        {post.phone && <Button variant="outline" size="sm" className="flex-1 gap-1"><Phone className="w-3 h-3" /> Call</Button>}
        <Button variant="outline" size="sm" className="flex-1">Details</Button>
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
