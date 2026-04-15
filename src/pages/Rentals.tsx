import { useState } from "react";
import { Home, Search, Plus, MapPin, List, Map, ArrowLeft, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { MediaUpload } from "@/components/shared/MediaUpload";
import ListingMap from "@/components/shared/ListingMap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserName } from "@/components/shared/UserName";
import { useLanguage } from "@/providers/LanguageProvider";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { SkeletonGrid } from "@/components/shared/SkeletonCard";
import { EmptyState as EmptyStateComponent } from "@/components/shared/EmptyState";
import { DistanceLabel } from "@/components/shared/DistanceLabel";

const aptCategoryKeys = [
  { key: "All", tKey: "filter.all", fallback: "All" },
  { key: "1+0 Studio", tKey: "rental.type.studio", fallback: "1+0 Studio" },
  { key: "1+1", tKey: "rental.type.1_1", fallback: "1+1" },
  { key: "2+1", tKey: "rental.type.2_1", fallback: "2+1" },
  { key: "3+1", tKey: "rental.type.3_1", fallback: "3+1" },
  { key: "4+1", tKey: "rental.type.4_1", fallback: "4+1" },
  { key: "Villa", tKey: "rental.type.villa", fallback: "Villa" },
  { key: "Shared Room", tKey: "rental.type.shared_room", fallback: "Shared Room" },
  { key: "Office", tKey: "rental.type.office", fallback: "Office" },
];

const Rentals = () => {
  const [mainTab, setMainTab] = useState("offering");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [listingMode, setListingMode] = useState<"rent" | "sell">("rent");
  const [viewMode, setViewMode] = useState("list");
  const [postOpen, setPostOpen] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleContact = (userId: string) => {
    if (!user) { navigate("/auth"); return; }
    navigate(`/messages?to=${userId}`);
  };

  const { data: lookingListings = [], isLoading: lookingLoading } = useQuery({
    queryKey: ["rentals-looking"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classifieds").select("*").eq("section", "rental").eq("listing_mode", "looking").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: offeringListings = [], isLoading: offeringLoading } = useQuery({
    queryKey: ["rentals-offering", listingMode],
    queryFn: async () => {
      const { data, error } = await supabase.from("classifieds").select("*").eq("section", "rental").eq("listing_mode", listingMode).order("created_at", { ascending: false });
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

  const mapPins = (items: any[]) => items.filter((i) => i.lat && i.lng).map((i) => ({ lat: i.lat, lng: i.lng, title: i.title, badge: i.category, extra: i.price ? `${i.currency || "₺"}${i.price}` : undefined }));

  const RentalCard = ({ item }: { item: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Home className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={item.listing_mode === "sell" ? "destructive" : item.listing_mode === "rent" ? "default" : "secondary"}>
                {item.listing_mode === "sell" ? t("rentals.for_sale", "For Sale") : item.listing_mode === "rent" ? t("rentals.for_rent", "For Rent") : t("rentals.looking", "Looking")}
              </Badge>
              {item.category && <Badge variant="outline">{item.category}</Badge>}
            </div>
            <CardTitle className="text-lg mb-1">{item.title}</CardTitle>
            {item.description && <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>}
            {item.price && <p className="text-primary font-semibold mt-2">{item.currency || "₺"}{item.price}{item.listing_mode !== "sell" ? "/month" : ""}</p>}
            {item.user_id && <div className="mt-1"><UserName userId={item.user_id} showAvatar /></div>}
            <div className="mt-1"><DistanceLabel lat={item.lat} lng={item.lng} neighborhood={item.neighborhood} /></div>
          </div>
        </div>
      </CardHeader>
      <CardContent><Button variant="outline" className="w-full" onClick={() => item.user_id && handleContact(item.user_id)}>{t("common.contact", "Contact")}</Button></CardContent>
    </Card>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <Home className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">{message}</h3>
      <p className="text-muted-foreground">{t("common.be_first", "Be the first to post!")}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">



          <Tabs value={mainTab} onValueChange={setMainTab}>
            <div className="flex border-b border-[#E2EBFC] mb-6">
              <button
                onClick={() => setMainTab("offering")}
                className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${mainTab === "offering" ? "text-[#1E3A5F] border-b-2 border-[#1E3A5F]" : "text-[#94A3B8] hover:text-[#64748B]"}`}
              >
                {t("rentals.offers", "İlanlar")}
              </button>
              <button
                onClick={() => setMainTab("looking")}
                className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${mainTab === "looking" ? "text-[#1E3A5F] border-b-2 border-[#1E3A5F]" : "text-[#94A3B8] hover:text-[#64748B]"}`}
              >
                {t("rentals.requests", "Arıyorum")}
              </button>
            </div>

            <TabsContent value="looking">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder={t("common.search", "Search...")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
                <Dialog open={postOpen} onOpenChange={setPostOpen}>
                  <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> {t("rentals.post_looking", "Post \"Looking For\"")}</Button></DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <RentalPostForm mode="looking" onSuccess={() => { setPostOpen(false); queryClient.invalidateQueries({ queryKey: ["rentals-looking"] }); }} />
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {aptCategoryKeys.map((cat) => <Button key={cat.key} variant={category === cat.key ? "default" : "outline"} size="sm" onClick={() => setCategory(cat.key)}>{t(cat.tKey, cat.fallback)}</Button>)}
              </div>
              {lookingLoading ? <SkeletonGrid count={3} hasPhoto photoHeight={140} />
                : filterItems(lookingListings).length === 0 ? <EmptyStateComponent emoji="🏠" message={t("empty.rentals", "Bu bölgede henüz ilan yok. İlanını ekle!")} />
                : <div className="space-y-4">{filterItems(lookingListings).map((item: any) => <RentalCard key={item.id} item={item} />)}</div>}
            </TabsContent>

            <TabsContent value="offering">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder={t("common.search", "Search...")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                  </div>
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    <button className={`px-4 py-2 text-sm font-medium transition-colors ${listingMode === "rent" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`} onClick={() => setListingMode("rent")}>{t("rentals.rent", "Rent")}</button>
                    <button className={`px-4 py-2 text-sm font-medium transition-colors ${listingMode === "sell" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`} onClick={() => setListingMode("sell")}>{t("rentals.sale", "Sale")}</button>
                  </div>
                </div>
                <Dialog open={postOpen} onOpenChange={setPostOpen}>
                  <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> {t("rentals.list_apt", "List Apartment")}</Button></DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <RentalPostForm mode="offer" onSuccess={() => { setPostOpen(false); queryClient.invalidateQueries({ queryKey: ["rentals-offering"] }); }} />
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {aptCategoryKeys.map((cat) => <Button key={cat.key} variant={category === cat.key ? "default" : "outline"} size="sm" onClick={() => setCategory(cat.key)}>{t(cat.tKey, cat.fallback)}</Button>)}
              </div>
              <div className="flex gap-2 mb-4">
                <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")} className="gap-1"><List className="w-4 h-4" /> {t("common.list", "List")}</Button>
                <Button variant={viewMode === "map" ? "default" : "outline"} size="sm" onClick={() => setViewMode("map")} className="gap-1"><Map className="w-4 h-4" /> {t("common.map", "Map")}</Button>
              </div>
              {viewMode === "list" ? (
                offeringLoading ? <SkeletonGrid count={3} hasPhoto photoHeight={140} />
                : filterItems(offeringListings).length === 0 ? <EmptyStateComponent emoji="🏠" message={t("empty.rentals", "Bu bölgede henüz ilan yok. İlanını ekle!")} actionLabel={t("rentals.list_apt", "List Apartment")} onAction={() => setPostOpen(true)} />
                : <div className="grid md:grid-cols-2 gap-6">{filterItems(offeringListings).map((item: any) => <RentalCard key={item.id} item={item} />)}</div>
              ) : (
                <ListingMap items={mapPins(filterItems(offeringListings))} height="400px" />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

const RentalPostForm = ({ mode, onSuccess }: { mode: "looking" | "offer"; onSuccess: () => void }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ title: "", description: "", category: "", price: "", neighborhood: "", phone: "", listingMode: mode === "looking" ? "looking" : "rent" });
  const [photos, setPhotos] = useState<string[]>([]);
  const { toast } = useToast();
  const { t } = useLanguage();
  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to post");
      const { error } = await supabase.from("classifieds").insert({
        user_id: user.id, section: "rental" as any, category: form.category, title: form.title,
        description: form.description, price: form.price, neighborhood: form.neighborhood, phone: form.phone,
        listing_mode: form.listingMode, photos: photos.length > 0 ? photos : null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: t("common.posted", "Posted!") }); onSuccess(); },
    onError: (e: any) => toast({ title: t("common.error", "Error"), description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <DialogHeader><DialogTitle>{mode === "looking" ? t("rentals.i_need", "I'm Looking for a Place") : t("rentals.list_apt", "List an Apartment")}</DialogTitle></DialogHeader>
      <Progress value={(step / 2) * 100} className="h-1.5" />
      <p className="text-xs text-muted-foreground text-center">{t("common.step_of", "Step")} {step} / 2</p>

      {step === 1 && (
        <div className="space-y-3">
          <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={mode === "looking" ? "e.g. Looking for 2+1 near Taksim" : "e.g. Bright 2+1 near İstiklal"} /></div>
          {mode === "offer" && (
            <div><Label>Listing Type</Label>
              <Select value={form.listingMode} onValueChange={(v) => setForm({ ...form, listingMode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="rent">{t("rentals.for_rent", "For Rent")}</SelectItem><SelectItem value="sell">{t("rentals.for_sale", "For Sale")}</SelectItem></SelectContent>
              </Select>
            </div>
          )}
          <div><Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>{aptCategoryKeys.filter(c => c.key !== "All").map(c => <SelectItem key={c.key} value={c.key}>{t(c.tKey, c.fallback)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{mode === "looking" ? "Budget (₺)" : "Price (₺)"}</Label><Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="15,000" /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div><Label>Photos / Videos</Label><MediaUpload value={photos} onChange={setPhotos} maxFiles={8} /></div>
          <div><Label>Neighborhood</Label><Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} placeholder="Cihangir" /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+90 5xx xxx xx xx" /></div>
        </div>
      )}

      <div className="flex gap-2">
        {step > 1 && <Button variant="outline" onClick={() => setStep(1)} className="gap-1"><ArrowLeft className="w-4 h-4" /> Back</Button>}
        {step < 2 ? (
          <Button className="flex-1 gap-1" onClick={() => setStep(2)} disabled={!form.title.trim()}>Next <ArrowRight className="w-4 h-4" /></Button>
        ) : (
          <Button className="flex-1" onClick={() => mutation.mutate()} disabled={!form.title || mutation.isPending}>{mutation.isPending ? t("common.posting", "Posting...") : t("common.post", "Post")}</Button>
        )}
      </div>
    </div>
  );
};

export default Rentals;
