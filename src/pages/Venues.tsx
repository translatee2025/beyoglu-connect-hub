import { useState } from "react";
import { Store, Search, Plus, MapPin, List, Map, Phone } from "lucide-react";
import { MediaUpload } from "@/components/shared/MediaUpload";
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

const venueCategories = ["All", "Restaurant", "Pharmacy", "Bar", "Hospital", "Tekkel", "Other"];

const Venues = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [viewMode, setViewMode] = useState("list");
  const [postOpen, setPostOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: venues = [], isLoading } = useQuery({
    queryKey: ["venues-list", category],
    queryFn: async () => {
      let query = supabase.from("venues").select("*").order("created_at", { ascending: false });
      // We can't filter by category directly since venue uses venue_type_id
      // For now fetch all and filter client-side
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filtered = venues.filter((v: any) => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || (v.description || "").toLowerCase().includes(search.toLowerCase());
    // Category filtering would need venue_types join - for now show all
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-2">🏪 Venues</h1>
            <p className="text-muted-foreground">Restaurants, pharmacies, bars, shops and more</p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search venues..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Dialog open={postOpen} onOpenChange={setPostOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> Add Venue</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <VenuePostForm onSuccess={() => { setPostOpen(false); queryClient.invalidateQueries({ queryKey: ["venues-list"] }); }} />
              </DialogContent>
            </Dialog>
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
            isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading venues...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No venues found</h3>
                <p className="text-muted-foreground">Be the first to add a venue!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((venue: any) => (
                  <Card key={venue.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Store className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{venue.name}</CardTitle>
                          {venue.description && <p className="text-sm text-muted-foreground line-clamp-2">{venue.description}</p>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {venue.address && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 flex-shrink-0" /> {venue.address}
                        </div>
                      )}
                      {venue.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-4 h-4 flex-shrink-0" /> {venue.phone}
                        </div>
                      )}
                      <Button variant="outline" className="w-full mt-2">View Details</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <div className="rounded-lg border border-border bg-muted/30 h-96 flex items-center justify-center">
              <p className="text-muted-foreground">Map view — coming soon with venue pins</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const VenuePostForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [form, setForm] = useState({
    name: "", description: "", address: "", phone: "", whatsapp: "", neighborhood: "",
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to add a venue");

      // Get or create a default venue type
      const { data: types } = await supabase.from("venue_types").select("id").limit(1);
      let venueTypeId = types?.[0]?.id;
      if (!venueTypeId) throw new Error("No venue types configured. Contact admin.");

      const { error } = await supabase.from("venues").insert({
        name: form.name,
        description: form.description,
        address: form.address,
        phone: form.phone,
        neighborhood: form.neighborhood,
        venue_type_id: venueTypeId,
        created_by_user_id: user.id,
        photos: photos.length > 0 ? photos : null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Venue added!" }); onSuccess(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <DialogHeader><DialogTitle>Add a Venue</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Name / Headline</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ali's Shoe Repair" /></div>
        <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street address" /></div>
        <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+90 5xx xxx xx xx" /></div>
        <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+90 5xx xxx xx xx" /></div>
        <div><Label>Neighborhood</Label><Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} placeholder="Beyoğlu" /></div>
        <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this place offer?" /></div>
        <div>
          <Label>Photos / Videos</Label>
          <MediaUpload value={photos} onChange={setPhotos} maxFiles={8} />
        </div>
        <Button className="w-full" onClick={() => mutation.mutate()} disabled={!form.name || mutation.isPending}>
          {mutation.isPending ? "Adding..." : "Add Venue"}
        </Button>
      </div>
    </div>
  );
};

export default Venues;
