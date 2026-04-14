import { useState } from "react";
import { Car, Search, Plus, MapPin, List, Map } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const parkingTypes = ["All", "Garage", "Open Air", "Street", "Underground", "Valet"];

const Parking = () => {
  const [mainTab, setMainTab] = useState("looking");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [viewMode, setViewMode] = useState("list");
  const [postOpen, setPostOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lookingListings = [], isLoading: lookingLoading } = useQuery({
    queryKey: ["parking-looking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classifieds")
        .select("*")
        .eq("section", "parking")
        .eq("listing_mode", "looking")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: offeringListings = [], isLoading: offeringLoading } = useQuery({
    queryKey: ["parking-offering"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classifieds")
        .select("*")
        .eq("section", "parking")
        .eq("listing_mode", "rent")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filterItems = (items: any[]) =>
    items.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || (item.description || "").toLowerCase().includes(search.toLowerCase());
      const matchesCat = category === "All" || item.category === category;
      return matchesSearch && matchesCat;
    });

  const ParkingCard = ({ item }: { item: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Car className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={item.listing_mode === "rent" ? "default" : "secondary"}>
                {item.listing_mode === "rent" ? "Available" : "Looking"}
              </Badge>
              {item.category && <Badge variant="outline">{item.category}</Badge>}
            </div>
            <CardTitle className="text-lg mb-1">{item.title}</CardTitle>
            {item.description && <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>}
            {item.price && <p className="text-primary font-semibold mt-2">₺{item.price}/month</p>}
            {item.neighborhood && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <MapPin className="w-3 h-3" /> {item.neighborhood}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="w-full">Contact</Button>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <Car className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">{message}</h3>
      <p className="text-muted-foreground">Be the first to post!</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-2">🅿️ Parking Finder</h1>
            <p className="text-muted-foreground">Find or offer parking spots in the neighborhood</p>
          </div>

          <Tabs value={mainTab} onValueChange={setMainTab}>
            <TabsList className="w-full mb-6">
              <TabsTrigger value="looking" className="flex-1">🔍 I Need Parking</TabsTrigger>
              <TabsTrigger value="offering" className="flex-1">🅿️ Parking for Rent</TabsTrigger>
            </TabsList>

            {/* LOOKING TAB */}
            <TabsContent value="looking">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
                <Dialog open={postOpen} onOpenChange={setPostOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2"><Plus className="w-4 h-4" /> Post "Looking For"</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <ParkingPostForm mode="looking" onSuccess={() => { setPostOpen(false); queryClient.invalidateQueries({ queryKey: ["parking-looking"] }); }} />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {parkingTypes.map((cat) => (
                  <Button key={cat} variant={category === cat ? "default" : "outline"} size="sm" onClick={() => setCategory(cat)}>{cat}</Button>
                ))}
              </div>

              {lookingLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : filterItems(lookingListings).length === 0 ? (
                <EmptyState message="No listings yet" />
              ) : (
                <div className="space-y-4">
                  {filterItems(lookingListings).map((item: any) => <ParkingCard key={item.id} item={item} />)}
                </div>
              )}
            </TabsContent>

            {/* OFFERING TAB */}
            <TabsContent value="offering">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
                <Dialog open={postOpen} onOpenChange={setPostOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2"><Plus className="w-4 h-4" /> List Parking Spot</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <ParkingPostForm mode="offer" onSuccess={() => { setPostOpen(false); queryClient.invalidateQueries({ queryKey: ["parking-offering"] }); }} />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {parkingTypes.map((cat) => (
                  <Button key={cat} variant={category === cat ? "default" : "outline"} size="sm" onClick={() => setCategory(cat)}>{cat}</Button>
                ))}
              </div>

              <div className="flex gap-2 mb-4">
                <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")} className="gap-1">
                  <List className="w-4 h-4" /> List
                </Button>
                <Button variant={viewMode === "map" ? "default" : "outline"} size="sm" onClick={() => setViewMode("map")} className="gap-1">
                  <Map className="w-4 h-4" /> Map
                </Button>
              </div>

              {viewMode === "list" ? (
                offeringLoading ? (
                  <div className="text-center py-12 text-muted-foreground">Loading...</div>
                ) : filterItems(offeringListings).length === 0 ? (
                  <EmptyState message="No parking spots listed" />
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {filterItems(offeringListings).map((item: any) => <ParkingCard key={item.id} item={item} />)}
                  </div>
                )
              ) : (
                <div className="rounded-lg border border-border bg-muted/30 h-96 flex items-center justify-center">
                  <p className="text-muted-foreground">Map view — coming soon with parking pins</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

const ParkingPostForm = ({ mode, onSuccess }: { mode: "looking" | "offer"; onSuccess: () => void }) => {
  const [form, setForm] = useState({ title: "", description: "", category: "", price: "", neighborhood: "", phone: "" });
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to post");
      const { error } = await supabase.from("classifieds").insert({
        user_id: user.id,
        section: "parking" as any,
        category: form.category,
        title: form.title,
        description: form.description,
        price: form.price,
        neighborhood: form.neighborhood,
        phone: form.phone,
        listing_mode: mode === "looking" ? "looking" : "rent",
      });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Posted!" }); onSuccess(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <DialogHeader><DialogTitle>{mode === "looking" ? "I Need Parking" : "List a Parking Spot"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={mode === "looking" ? "e.g. Need garage near Taksim" : "e.g. Covered garage spot"} /></div>
        <div><Label>Parking Type</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>{["Garage", "Open Air", "Street", "Underground", "Valet"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>{mode === "looking" ? "Budget (₺/month)" : "Price (₺/month)"}</Label><Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="2,000" /></div>
        <div><Label>Neighborhood</Label><Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} /></div>
        <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+90 5xx xxx xx xx" /></div>
        <Button className="w-full" onClick={() => mutation.mutate()} disabled={!form.title || mutation.isPending}>
          {mutation.isPending ? "Posting..." : "Post"}
        </Button>
      </div>
    </div>
  );
};

export default Parking;
