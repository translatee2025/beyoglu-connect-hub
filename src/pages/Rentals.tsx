import { useState } from "react";
import { Home, Search, Plus, MapPin, List, Map } from "lucide-react";
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

const categories = ["All", "1+0 Studio", "1+1", "2+1", "3+1", "4+1", "Villa", "Shared Room"];

const Rentals = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [postOpen, setPostOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["rentals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classifieds")
        .select("*")
        .eq("section", "rental")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = listings.filter((item: any) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "All" || item.category === category;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-4">
              🏠 Rental Finder
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Find apartments and homes for rent in the neighborhood
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search rentals..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Dialog open={postOpen} onOpenChange={setPostOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" className="gap-2"><Plus className="w-4 h-4" /> Post Rental</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <RentalPostForm onSuccess={() => { setPostOpen(false); queryClient.invalidateQueries({ queryKey: ["rentals"] }); }} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <Button key={cat} variant={category === cat ? "default" : "outline"} size="sm" onClick={() => setCategory(cat)}>
                {cat}
              </Button>
            ))}
          </div>

          <Tabs defaultValue="list">
            <TabsList className="mb-4">
              <TabsTrigger value="list" className="gap-2"><List className="w-4 h-4" /> List</TabsTrigger>
              <TabsTrigger value="map" className="gap-2"><Map className="w-4 h-4" /> Map</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading rentals...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <Home className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No rentals found</h3>
                  <p className="text-muted-foreground">Be the first to post a rental listing!</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {filtered.map((item: any) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <Home className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={item.type === "offer" ? "default" : "secondary"}>
                                {item.type === "offer" ? "For Rent" : "Looking"}
                              </Badge>
                              {item.category && <Badge variant="outline">{item.category}</Badge>}
                            </div>
                            <CardTitle className="text-xl mb-1">{item.title}</CardTitle>
                            {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                            {item.price && <p className="text-primary font-semibold mt-2">{item.currency}{item.price}/month</p>}
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
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="map">
              <div className="rounded-lg border border-border bg-muted/30 h-96 flex items-center justify-center">
                <p className="text-muted-foreground">Map view — coming soon with rental pins</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

const RentalPostForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [form, setForm] = useState({ title: "", description: "", category: "", price: "", neighborhood: "", phone: "", type: "offer" });
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to post");
      const { error } = await supabase.from("classifieds").insert({
        user_id: user.id,
        section: "rental" as any,
        category: form.category,
        title: form.title,
        description: form.description,
        price: form.price,
        neighborhood: form.neighborhood,
        phone: form.phone,
        type: form.type,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Rental posted!" }); onSuccess(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <DialogHeader><DialogTitle>Post a Rental</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Bright 2+1 near İstiklal" /></div>
        <div><Label>Type</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="offer">For Rent</SelectItem><SelectItem value="need">Looking for</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>{categories.filter(c => c !== "All").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Price (₺/month)</Label><Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="15,000" /></div>
        <div><Label>Neighborhood</Label><Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} placeholder="Cihangir" /></div>
        <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the property..." /></div>
        <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+90 5xx xxx xx xx" /></div>
        <Button className="w-full" onClick={() => mutation.mutate()} disabled={!form.title || mutation.isPending}>
          {mutation.isPending ? "Posting..." : "Post Rental"}
        </Button>
      </div>
    </div>
  );
};

export default Rentals;
