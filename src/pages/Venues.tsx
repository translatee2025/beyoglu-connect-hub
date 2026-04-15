import { useState } from "react";
import { Store, Search, Plus, MapPin, List, Map, Clock, ArrowLeft, ArrowRight } from "lucide-react";
import { MediaUpload } from "@/components/shared/MediaUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ListingMap from "@/components/shared/ListingMap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { UserName } from "@/components/shared/UserName";
import { useLanguage } from "@/providers/LanguageProvider";
import { SkeletonGrid } from "@/components/shared/SkeletonCard";
import { EmptyState } from "@/components/shared/EmptyState";

const CATEGORY_PLACEHOLDERS: Record<string, { bg: string; emoji: string }> = {
  restaurant: { bg: "#FEF3C7", emoji: "🍽️" },
  cafe: { bg: "#FEF3C7", emoji: "☕" },
  bar: { bg: "#F5C4B3", emoji: "🍸" },
  nightlife: { bg: "#F5C4B3", emoji: "🍸" },
  health: { bg: "#E0F2FE", emoji: "🏥" },
  pharmacy: { bg: "#E0F2FE", emoji: "🏥" },
  culture: { bg: "#EDE9FE", emoji: "🎨" },
  sports: { bg: "#DCFCE7", emoji: "💪" },
  gym: { bg: "#DCFCE7", emoji: "💪" },
  pets: { bg: "#DCFCE7", emoji: "🐾" },
  vet: { bg: "#DCFCE7", emoji: "🐾" },
};

const getPlaceholder = (typeName?: string) => {
  if (!typeName) return { bg: "#EFF4FF", emoji: "📍" };
  const key = typeName.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_PLACEHOLDERS)) {
    if (key.includes(k)) return v;
  }
  return { bg: "#EFF4FF", emoji: "📍" };
};

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const isVenueOpen = (hours: Record<string, { open: string; close: string }> | null): boolean | null => {
  if (!hours || Object.keys(hours).length === 0) return null;
  const now = new Date();
  const dayKey = DAY_KEYS[now.getDay()];
  const h = hours[dayKey];
  if (!h) return false;
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return currentTime >= h.open && currentTime <= h.close;
};

const Venues = () => {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [postOpen, setPostOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { data: venueTypes = [] } = useQuery({
    queryKey: ["venue-types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("venue_types").select("id, name, icon").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: venues = [], isLoading } = useQuery({
    queryKey: ["venues-list", selectedType],
    queryFn: async () => {
      let query = supabase.from("venues").select("*, venue_types(name, icon)").order("created_at", { ascending: false });
      if (selectedType !== "all") query = query.eq("venue_type_id", selectedType);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: reviewStats = {} } = useQuery({
    queryKey: ["venue-review-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("venue_reviews").select("venue_id, rating");
      if (!data) return {};
      const stats: Record<string, { avg: number; count: number }> = {};
      for (const r of data) {
        if (!stats[r.venue_id]) stats[r.venue_id] = { avg: 0, count: 0 };
        stats[r.venue_id].count++;
        stats[r.venue_id].avg += r.rating;
      }
      for (const k of Object.keys(stats)) {
        stats[k].avg = stats[k].avg / stats[k].count;
      }
      return stats;
    },
  });

  const filtered = venues.filter((v: any) => v.name.toLowerCase().includes(search.toLowerCase()) || (v.description || "").toLowerCase().includes(search.toLowerCase()));
  const mapPins = filtered.filter((v: any) => v.lat && v.lng).map((v: any) => ({ lat: v.lat, lng: v.lng, title: v.name, badge: (v as any).venue_types?.name, extra: v.address }));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-app mx-auto">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h1 className="text-[15px] font-semibold text-foreground">{t("venues.title", "Venues")}</h1>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
                <Input placeholder={t("venues.search", "Search venues...")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 text-xs" />
              </div>
              <Dialog open={postOpen} onOpenChange={setPostOpen}>
                <DialogTrigger asChild><Button size="sm" variant="cta" className="gap-1 text-xs"><Plus className="w-3.5 h-3.5" /> {t("venues.add", "Add")}</Button></DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <VenuePostForm venueTypes={venueTypes} onSuccess={() => { setPostOpen(false); queryClient.invalidateQueries({ queryKey: ["venues-list"] }); }} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Category grid */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { key: "restaurants", emoji: "🍽️", label: "Restaurants & Bars" },
              { key: "cafes", emoji: "☕", label: "Cafés" },
              { key: "nightlife", emoji: "🍸", label: "Nightlife" },
              { key: "health", emoji: "🏥", label: "Health" },
              { key: "culture", emoji: "🎨", label: "Culture" },
              { key: "sports", emoji: "💪", label: "Sports & Wellness" },
              { key: "pets", emoji: "🐾", label: "Pets" },
              { key: "other", emoji: "📍", label: "Other" },
            ].map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedType(selectedType === cat.key ? "all" : cat.key)}
                className="rounded-xl text-center transition-all"
                style={{
                  border: selectedType === cat.key ? "2px solid #1E3A5F" : "1px solid #E2EBFC",
                  backgroundColor: selectedType === cat.key ? "#EFF4FF" : "white",
                  padding: "16px 10px",
                }}
              >
                <div className="text-[28px] mb-1">{cat.emoji}</div>
                <span className="text-xs block" style={{ color: selectedType === cat.key ? "#1E3A5F" : "#64748B" }}>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* View mode */}
          <div className="flex gap-1.5 mb-4">
            <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")} className="gap-1 text-xs"><List className="w-3.5 h-3.5" /> {t("venues.list", "List")}</Button>
            <Button variant={viewMode === "map" ? "default" : "outline"} size="sm" onClick={() => setViewMode("map")} className="gap-1 text-xs"><Map className="w-3.5 h-3.5" /> {t("venues.map", "Map")}</Button>
          </div>

          {viewMode === "list" ? (
            isLoading ? <SkeletonGrid count={3} hasPhoto photoHeight={140} cols={3} />
            : filtered.length === 0 ? (
              <EmptyState emoji="📍" message={t("empty.venues", "Bu bölgede henüz mekan eklenmemiş. Favorin nerede?")} actionLabel={t("venues.add_venue", "Mekan Ekle")} onAction={() => {}} />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((venue: any) => {
                  const typeName = venue.venue_types?.name;
                  const ph = getPlaceholder(typeName);
                  const openStatus = isVenueOpen(venue.hours as any);
                  const stats = (reviewStats as any)[venue.id];
                  return (
                    <div
                      key={venue.id}
                      className="bg-card rounded-xl overflow-hidden hover:shadow-sm transition-shadow cursor-pointer"
                      style={{ border: "1px solid #E2EBFC" }}
                      onClick={() => navigate(`/venue/${venue.id}`)}
                    >
                      {/* Photo area */}
                      <div className="h-[140px] relative overflow-hidden" style={{ borderRadius: "12px 12px 0 0" }}>
                        {venue.photos?.[0] || venue.cover_photo ? (
                          <img src={venue.photos?.[0] || venue.cover_photo} alt={venue.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: ph.bg }}>
                            <span className="text-[32px]">{ph.emoji}</span>
                          </div>
                        )}
                        {/* Category badge */}
                        {typeName && (
                          <span
                            className="absolute top-0 left-0 text-[10px] font-medium text-white"
                            style={{ backgroundColor: "#1E3A5F", padding: "3px 8px", borderRadius: "0 0 6px 0" }}
                          >
                            {typeName}
                          </span>
                        )}
                        {/* Open/Closed badge */}
                        {openStatus !== null && (
                          <span
                            className="absolute top-0 right-0 text-[10px] font-medium"
                            style={{
                              padding: "3px 8px",
                              borderRadius: "0 0 0 6px",
                              backgroundColor: openStatus ? "#DCFCE7" : "#FEF2F2",
                              color: openStatus ? "#166534" : "#DC2626",
                            }}
                          >
                            {openStatus ? "Açık" : "Kapalı"}
                          </span>
                        )}
                      </div>
                      {/* Card body */}
                      <div className="p-3">
                        <h3 className="text-[13px] font-semibold mb-0.5" style={{ color: "#1E3A5F" }}>{venue.name}</h3>
                        {venue.address && (
                          <p className="text-[11px] truncate mb-1" style={{ color: "#94A3B8" }}>{venue.address}</p>
                        )}
                        {/* Rating row */}
                        {stats && (
                          <div className="flex items-center gap-1 mb-2">
                            <span className="text-[12px]">⭐</span>
                            <span className="text-[11px] font-semibold" style={{ color: "#1E3A5F" }}>{stats.avg.toFixed(1)}</span>
                            <span className="text-[11px]" style={{ color: "#94A3B8" }}>({stats.count})</span>
                          </div>
                        )}
                        {/* CTA */}
                        <button
                          className="w-full py-1.5 rounded-md text-white text-[10px] font-medium"
                          style={{ backgroundColor: "#E74C3C" }}
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          Mesaj Gönder
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : <ListingMap items={mapPins} height="450px" />}
        </div>
      </div>
    </div>
  );
};

/* ── Venue Post Form ── */
const VenuePostForm = ({ venueTypes, onSuccess }: { venueTypes: any[]; onSuccess: () => void }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", description: "", address: "", phone: "", whatsapp: "", neighborhood: "", venueTypeId: "" });
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [hours, setHours] = useState<Record<string, { open: string; close: string }>>({});
  const { toast } = useToast();
  const { t } = useLanguage();

  const WEEKDAYS = [
    { key: "mon", label: t("weekday.mon", "Mon") }, { key: "tue", label: t("weekday.tue", "Tue") },
    { key: "wed", label: t("weekday.wed", "Wed") }, { key: "thu", label: t("weekday.thu", "Thu") },
    { key: "fri", label: t("weekday.fri", "Fri") }, { key: "sat", label: t("weekday.sat", "Sat") },
    { key: "sun", label: t("weekday.sun", "Sun") },
  ];

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) { setSelectedDays(selectedDays.filter((d) => d !== day)); const h = { ...hours }; delete h[day]; setHours(h); }
    else { setSelectedDays([...selectedDays, day]); setHours({ ...hours, [day]: { open: "09:00", close: "18:00" } }); }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("common.login_required", "Please log in"));
      let venueTypeId = form.venueTypeId;
      if (!venueTypeId) { const { data: types } = await supabase.from("venue_types").select("id").limit(1); venueTypeId = types?.[0]?.id; if (!venueTypeId) throw new Error("No venue types configured"); }
      const { error } = await supabase.from("venues").insert({ name: form.name, description: form.description, address: form.address, phone: form.phone, neighborhood: form.neighborhood, venue_type_id: venueTypeId, created_by_user_id: user.id, photos: photos.length > 0 ? photos : null, hours: selectedDays.length > 0 ? hours : null });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: t("venues.add_btn", "Venue added!") }); onSuccess(); },
    onError: (e: any) => toast({ title: t("common.error", "Error"), description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-3">
      <DialogHeader><DialogTitle className="text-[15px] font-semibold">{t("venues.add_venue", "Add a Venue")}</DialogTitle></DialogHeader>
      <div className="flex items-center gap-2 mb-2">
        <div className="h-[3px] flex-1 rounded-full" style={{ backgroundColor: "#E2EBFC" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${(step / 2) * 100}%`, backgroundColor: "#1E3A5F" }} />
        </div>
        <span className="text-xxs text-[#94A3B8]">{step}/2</span>
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <div><Label className="text-xs font-medium text-[#374151] mb-1">{t("venues.name", "Name *")}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ali's Shoe Repair" className="text-sm" /></div>
          <div><Label className="text-xs font-medium text-[#374151] mb-1">{t("venues.type", "Venue Type")}</Label>
            <Select value={form.venueTypeId} onValueChange={(v) => setForm({ ...form, venueTypeId: v })}>
              <SelectTrigger className="text-sm"><SelectValue placeholder={t("venues.select_type", "Select type")} /></SelectTrigger>
              <SelectContent>{venueTypes.map((vt: any) => <SelectItem key={vt.id} value={vt.id} className="text-xs">{vt.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs font-medium text-[#374151] mb-1">{t("venues.address", "Address")}</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="text-sm" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs font-medium text-[#374151] mb-1">{t("venues.phone", "Phone")}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+90 5xx" className="text-sm" /></div>
            <div><Label className="text-xs font-medium text-[#374151] mb-1">{t("venues.whatsapp", "WhatsApp")}</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="text-sm" /></div>
          </div>
          <div><Label className="text-xs font-medium text-[#374151] mb-1">{t("venues.description", "Description")}</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t("venues.what_offer", "What does this place offer?")} rows={3} className="text-sm" /></div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-3">
          <div><Label className="text-xs font-medium text-[#374151] mb-1">{t("venues.photos", "Photos")}</Label><MediaUpload value={photos} onChange={setPhotos} maxFiles={8} /></div>
          <div><Label className="text-xs font-medium text-[#374151] mb-1">{t("venues.neighborhood", "Neighborhood")}</Label><Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} placeholder="Beyoğlu" className="text-sm" /></div>
          <div>
            <Label className="flex items-center gap-1 mb-1.5 text-xs font-medium text-[#374151]"><Clock className="w-3.5 h-3.5" /> {t("venues.hours", "Opening Hours")}</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {WEEKDAYS.map((d) => <Button key={d.key} type="button" variant={selectedDays.includes(d.key) ? "default" : "outline"} size="sm" onClick={() => toggleDay(d.key)} className="text-xxs h-7 px-2">{d.label}</Button>)}
            </div>
            {selectedDays.length > 0 && (
              <div className="space-y-1.5">
                {WEEKDAYS.filter((d) => selectedDays.includes(d.key)).map((d) => (
                  <div key={d.key} className="flex items-center gap-1.5">
                    <span className="text-xs font-medium w-8">{d.label}</span>
                    <Input type="time" className="w-24 text-xs h-7" value={hours[d.key]?.open || "09:00"} onChange={(e) => setHours({ ...hours, [d.key]: { ...hours[d.key], open: e.target.value } })} />
                    <span className="text-[#94A3B8]">–</span>
                    <Input type="time" className="w-24 text-xs h-7" value={hours[d.key]?.close || "18:00"} onChange={(e) => setHours({ ...hours, [d.key]: { ...hours[d.key], close: e.target.value } })} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        {step > 1 && <Button variant="outline" onClick={() => setStep(1)} className="gap-1 text-xs"><ArrowLeft className="w-3.5 h-3.5" /> {t("common.back", "Back")}</Button>}
        {step < 2 ? (
          <Button variant="cta" className="flex-1 gap-1 text-xs" onClick={() => setStep(2)} disabled={!form.name.trim()}>{t("common.next", "Next")} <ArrowRight className="w-3.5 h-3.5" /></Button>
        ) : (
          <Button variant="cta" className="flex-1 text-xs" onClick={() => mutation.mutate()} disabled={!form.name || mutation.isPending}>{mutation.isPending ? t("venues.adding", "Adding...") : t("venues.add_btn", "Add Venue")}</Button>
        )}
      </div>
    </div>
  );
};

export default Venues;
