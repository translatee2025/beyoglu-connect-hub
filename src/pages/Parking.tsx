import { useState } from "react";
import { Car, Search, Plus, List, Map, ArrowLeft, ArrowRight } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
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
import { ProfileInline } from "@/components/shared/ProfileInline";
import { useProfilesMap } from "@/hooks/useProfilesMap";
import { SafeImage } from "@/components/shared/SafeImage";
import { useLanguage } from "@/providers/LanguageProvider";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { SkeletonGrid } from "@/components/shared/SkeletonCard";
import { EmptyState as EmptyStateComponent } from "@/components/shared/EmptyState";
import { DistanceLabel } from "@/components/shared/DistanceLabel";
import SortFilterBar, { type SortOption } from "@/components/shared/SortFilterBar";
import { parsePhotos } from "@/lib/parsePhotos";
import { useAppOptions } from "@/hooks/useAppOptions";
import { useMemo } from "react";

const parsePrice = (p: string | null) => {
  if (!p) return 0;
  return parseFloat(p.replace(/[^0-9.]/g, "")) || 0;
};

const Parking = () => {
  const [mainTab, setMainTab] = useState("offering");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [viewMode, setViewMode] = useState("list");
  const [postOpen, setPostOpen] = useState(false);
  const [sort, setSort] = useState<SortOption>("newest");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [appliedMin, setAppliedMin] = useState<number | null>(null);
  const [appliedMax, setAppliedMax] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { options: parkingTypesRaw } = useAppOptions("parking_types");
  const FALLBACK_PARKING_TYPES = useMemo(() => [
    { value: "street", label: "Street Parking", emoji: null, metadata: {} },
    { value: "private_garage", label: "Private Garage", emoji: null, metadata: {} },
    { value: "covered_lot", label: "Covered Lot", emoji: null, metadata: {} },
    { value: "open_lot", label: "Open Lot", emoji: null, metadata: {} },
    { value: "underground", label: "Underground", emoji: null, metadata: {} },
    { value: "other", label: "Other", emoji: null, metadata: {} },
  ], []);
  const parkingTypes = parkingTypesRaw.length > 0 ? parkingTypesRaw : (FALLBACK_PARKING_TYPES as any);
  const parkingTypeKeys = useMemo(() => [
    { key: "All", label: t("filter.all", "All") },
    ...parkingTypes.map((o) => ({ key: o.value, label: o.label })),
  ], [parkingTypes, t]);

  const handleContact = (userId: string) => {
    if (!user) { navigate("/auth"); return; }
    navigate(`/messages?to=${userId}`);
  };

  const formatTimeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return language === "tr" ? "şimdi" : "now";
    if (mins < 60) return language === "tr" ? `${mins}dk` : `${mins}m`;
    const h = Math.floor(mins / 60);
    if (h < 24) return language === "tr" ? `${h}s` : `${h}h`;
    const days = Math.floor(h / 24);
    return language === "tr" ? `${days}g` : `${days}d`;
  };

  const { data: lookingListings = [], isLoading: lookingLoading } = useQuery({
    queryKey: ["parking-looking"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classifieds").select("*").eq("section", "parking").eq("listing_mode", "looking").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: offeringListings = [], isLoading: offeringLoading } = useQuery({
    queryKey: ["parking-offering"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classifieds").select("*").eq("section", "parking").eq("listing_mode", "offering").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const processItems = (items: any[]) => {
    let filtered = items.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || (item.description || "").toLowerCase().includes(search.toLowerCase());
      const matchesCat = category === "All" || item.category === category;
      return matchesSearch && matchesCat;
    });

    if (appliedMin !== null) filtered = filtered.filter(i => parsePrice(i.price) >= appliedMin);
    if (appliedMax !== null) filtered = filtered.filter(i => parsePrice(i.price) <= appliedMax);

    const sorted = [...filtered];
    if (sort === "price_asc") sorted.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    else if (sort === "price_desc") sorted.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    else sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return sorted;
  };

  const applyFilter = () => {
    setAppliedMin(priceMin ? parseFloat(priceMin) : null);
    setAppliedMax(priceMax ? parseFloat(priceMax) : null);
  };
  const clearFilter = () => {
    setPriceMin(""); setPriceMax("");
    setAppliedMin(null); setAppliedMax(null);
  };
  const filterActive = appliedMin !== null || appliedMax !== null;

  const mapPins = (items: any[]) => items.filter((i) => i.lat && i.lng).map((i) => ({ lat: i.lat, lng: i.lng, title: i.title, badge: i.category, extra: i.price ? `₺${i.price}/ay` : undefined }));

  const getCatLabel = (key: string) => parkingTypes.find((o) => o.value === key)?.label || key;

  const allListings = useMemo(() => [...lookingListings, ...offeringListings], [lookingListings, offeringListings]);
  const { profilesMap } = useProfilesMap(allListings.map((i: any) => i.user_id));

  const ParkingCard = ({ item }: { item: any }) => {
    const photo = parsePhotos(item.photos)[0] || null;
    return (
    <div style={{ borderRadius: 12, overflow: "hidden", backgroundColor: "white", border: "1px solid #E2EBFC" }}>
      {photo ? (
        <div style={{ width: "100%", height: 140, overflow: "hidden" }}>
          <SafeImage src={photo} alt={item.title} className="w-full h-full" style={{ width: "100%", height: "100%", objectFit: "cover" }} fallbackBg="#EFF4FF" fallbackEmoji="🅿️" />
        </div>
      ) : null}
      <div style={{ padding: 14 }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
        <Badge variant={item.listing_mode === "offering" ? "default" : "secondary"} style={{ fontSize: 11 }}>
          {item.listing_mode === "offering" ? t("common.available", "Available") : t("common.looking_for", "Looking")}
        </Badge>
        {item.category && <Badge variant="outline" style={{ fontSize: 11 }}>{getCatLabel(item.category)}</Badge>}
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: "#1E3A5F", marginBottom: 4 }}>{item.title}</div>

      {item.price && (
        <div style={{ fontSize: 16, fontWeight: 700, color: "#1E3A5F", marginBottom: 6 }}>
          {item.price} {language === "tr" ? "₺/ay" : "₺/mo"}
        </div>
      )}

      {item.description && (
        <p style={{ fontSize: 12, color: "#64748B", marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {item.description}
        </p>
      )}

      <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
        {item.user_id && <ProfileInline userId={item.user_id} profilesMap={profilesMap} showAvatar avatarSize="w-4 h-4" />}
        <span style={{ fontSize: 11, color: "#94A3B8" }}>· {formatTimeAgo(item.created_at)}</span>
      </div>

      <DistanceLabel lat={item.lat} lng={item.lng} neighborhood={item.neighborhood} />

      <button
        onClick={() => item.user_id && handleContact(item.user_id)}
        style={{
          width: "100%", marginTop: 10, padding: 8, backgroundColor: "#E74C3C", color: "white",
          fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer", borderRadius: 8,
        }}
      >
        {t("common.send_message", "Send Message")}
      </button>
      </div>
    </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <Tabs value={mainTab} onValueChange={setMainTab}>
            <div className="flex border-b border-[#E2EBFC] mb-5">
              <button
                onClick={() => setMainTab("offering")}
                className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${mainTab === "offering" ? "text-[#1E3A5F] border-b-2 border-[#1E3A5F]" : "text-[#94A3B8] hover:text-[#64748B]"}`}
              >
                {t("parking.listings", "Parking Listings")}
              </button>
              <button
                onClick={() => setMainTab("looking")}
                className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${mainTab === "looking" ? "text-[#1E3A5F] border-b-2 border-[#1E3A5F]" : "text-[#94A3B8] hover:text-[#64748B]"}`}
              >
                {t("common.looking_for", "Looking")}
              </button>
            </div>

            <TabsContent value="looking">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder={t("common.search", "Search...")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
                <Dialog open={postOpen} onOpenChange={setPostOpen}>
                  <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> {t("common.post_listing", "Post Listing")}</Button></DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <ParkingPostForm mode="looking" onSuccess={() => { setPostOpen(false); queryClient.invalidateQueries({ queryKey: ["parking-looking"] }); }} />
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {parkingTypeKeys.map((cat) => <Button key={cat.key} variant={category === cat.key ? "default" : "outline"} size="sm" onClick={() => setCategory(cat.key)}>{cat.label}</Button>)}
              </div>
              <SortFilterBar
                sort={sort} onSortChange={setSort}
                priceMin={priceMin} priceMax={priceMax}
                onPriceMinChange={setPriceMin} onPriceMaxChange={setPriceMax}
                onApplyFilter={applyFilter} onClearFilter={clearFilter}
                filterActive={filterActive}
              />
              {lookingLoading ? <SkeletonGrid count={3} />
                : processItems(lookingListings).length === 0 ? <EmptyStateComponent emoji="🅿️" message={t("parking.no_listings", "No parking listings yet.")} />
                : <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{processItems(lookingListings).map((item: any) => <ParkingCard key={item.id} item={item} />)}</div>}
            </TabsContent>

            <TabsContent value="offering">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder={t("common.search", "Search...")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
                <Dialog open={postOpen} onOpenChange={setPostOpen}>
                  <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> {t("parking.post_listing", "Post Parking Listing")}</Button></DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <ParkingPostForm mode="offer" onSuccess={() => { setPostOpen(false); queryClient.invalidateQueries({ queryKey: ["parking-offering"] }); }} />
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {parkingTypeKeys.map((cat) => <Button key={cat.key} variant={category === cat.key ? "default" : "outline"} size="sm" onClick={() => setCategory(cat.key)}>{cat.label}</Button>)}
              </div>
              <SortFilterBar
                sort={sort} onSortChange={setSort}
                priceMin={priceMin} priceMax={priceMax}
                onPriceMinChange={setPriceMin} onPriceMaxChange={setPriceMax}
                onApplyFilter={applyFilter} onClearFilter={clearFilter}
                filterActive={filterActive}
              />
              <div className="flex gap-2 mb-4">
                <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")} className="gap-1"><List className="w-4 h-4" /> {t("common.list", "List")}</Button>
                <Button variant={viewMode === "map" ? "default" : "outline"} size="sm" onClick={() => setViewMode("map")} className="gap-1"><Map className="w-4 h-4" /> {t("common.map", "Map")}</Button>
              </div>
              {viewMode === "list" ? (
                offeringLoading ? <SkeletonGrid count={3} />
                : processItems(offeringListings).length === 0 ? <EmptyStateComponent emoji="🅿️" message={t("parking.no_listings", "No parking listings yet.")} actionLabel={t("common.post_listing", "Post Listing")} onAction={() => setPostOpen(true)} />
                : <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{processItems(offeringListings).map((item: any) => <ParkingCard key={item.id} item={item} />)}</div>
              ) : mapPins(processItems(offeringListings)).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">{t("common.no_map_data", "No listings with location data yet.")}</div>
              ) : (
                <div className="pb-20 sm:pb-0"><ListingMap items={mapPins(processItems(offeringListings))} height="400px" /></div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

const ParkingPostForm = ({ mode, onSuccess }: { mode: "looking" | "offer"; onSuccess: () => void }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ title: "", description: "", category: "", price: "", neighborhood: "", phone: "" });
  const [photos, setPhotos] = useState<string[]>([]);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { options: parkingTypes, isLoading: typesLoading } = useAppOptions("parking_types");

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to post");
      const { error } = await supabase.from("classifieds").insert({
        user_id: user.id, section: "parking" as any, category: form.category, title: form.title,
        description: form.description, price: form.price, neighborhood: form.neighborhood, phone: form.phone,
        listing_mode: mode === "looking" ? "looking" : "offering", photos: photos.length > 0 ? photos : null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: t("common.posted", "Posted!") }); onSuccess(); },
    onError: (e: any) => toast({ title: t("common.error", "Error"), description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <DialogHeader><DialogTitle>{mode === "looking" ? t("parking.looking_title", "Looking for Parking") : t("parking.offer_title", "Post Parking Spot")}</DialogTitle></DialogHeader>
      <Progress value={(step / 2) * 100} className="h-1.5" />
      <p className="text-xs text-muted-foreground text-center">{t("common.step_of", "Step")} {step} / 2</p>

      {step === 1 && (
        <div className="space-y-3">
          <div><Label>{t("common.title_required", "Title *")}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={mode === "looking" ? t("parking.looking_placeholder", "e.g. Looking for garage near Taksim") : t("parking.offer_placeholder", "e.g. Covered garage spot")} /></div>
          <div><Label>{t("parking.type_label", "Parking Type")}</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue placeholder={t("common.select_type", "Select type")} /></SelectTrigger>
              <SelectContent>{typesLoading ? <SelectItem value="__loading" disabled>Loading...</SelectItem> : parkingTypes.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{mode === "looking" ? t("common.budget_monthly", "Budget (₺/mo)") : t("common.price_monthly", "Price (₺/mo)")}</Label><Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="2.000" /></div>
          <div><Label>{t("common.description", "Description")}</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div><Label>{t("common.photos_video", "Photo / Video")}</Label><MediaUpload value={photos} onChange={setPhotos} maxFiles={6} /></div>
          <div><Label>{t("common.neighborhood", "Neighborhood")}</Label><Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} /></div>
          <div><Label>{t("common.phone", "Phone")}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+90 5xx xxx xx xx" /></div>
        </div>
      )}

      <div className="flex gap-2">
        {step > 1 && <Button variant="outline" onClick={() => setStep(1)} className="gap-1"><ArrowLeft className="w-4 h-4" /> {t("common.back", "Back")}</Button>}
        {step < 2 ? (
          <Button className="flex-1 gap-1" onClick={() => setStep(2)} disabled={!form.title.trim()}>{t("common.next", "Next")} <ArrowRight className="w-4 h-4" /></Button>
        ) : (
          <Button className="flex-1" onClick={() => mutation.mutate()} disabled={!form.title || mutation.isPending}>{mutation.isPending ? t("common.sending", "Sending...") : t("common.share", "Share")}</Button>
        )}
      </div>
    </div>
  );
};

export default Parking;
