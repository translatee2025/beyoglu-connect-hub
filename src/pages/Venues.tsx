import { useState } from "react";
import { Store, Search, Plus, MapPin, List, Map, Phone, Clock, ArrowLeft, ArrowRight } from "lucide-react";
import { MediaUpload } from "@/components/shared/MediaUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import ListingMap from "@/components/shared/ListingMap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { UserName } from "@/components/shared/UserName";
import { useLanguage } from "@/providers/LanguageProvider";

const CATEGORY_ICONS: Record<string, string> = {
  restaurant: "🍽️",
  cafe: "☕",
  bar: "🍸",
  shop: "🛍️",
  pharmacy: "💊",
  gym: "🏋️",
  salon: "💇",
  market: "🛒",
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

  const filtered = venues.filter((v: any) => v.name.toLowerCase().includes(search.toLowerCase()) || (v.description || "").toLowerCase().includes(search.toLowerCase()));
  const mapPins = filtered.filter((v: any) => v.lat && v.lng).map((v: any) => ({ lat: v.lat, lng: v.lng, title: v.name, badge: (v as any).venue_types?.name, extra: v.address }));

  const displayTypes = venueTypes.slice(0, 7);

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
            <button
              onClick={() => setSelectedType(selectedType === 'restaurants' ? 'all' : 'restaurants')}
              className="rounded-xl text-center transition-all"
              style={{
                border: selectedType === 'restaurants' ? '2px solid #1E3A5F' : '1px solid #E2EBFC',
                backgroundColor: selectedType === 'restaurants' ? '#EFF4FF' : 'white',
                padding: '16px 10px',
              }}
            >
              <div className="text-[28px] mb-1">🍽️</div>
              <span className="text-xs block" style={{ color: selectedType === 'restaurants' ? '#1E3A5F' : '#64748B' }}>Restaurants & Bars</span>
            </button>
            <button
              onClick={() => setSelectedType(selectedType === 'cafes' ? 'all' : 'cafes')}
              className="rounded-xl text-center transition-all"
              style={{
                border: selectedType === 'cafes' ? '2px solid #1E3A5F' : '1px solid #E2EBFC',
                backgroundColor: selectedType === 'cafes' ? '#EFF4FF' : 'white',
                padding: '16px 10px',
              }}
            >
              <div className="text-[28px] mb-1">☕</div>
              <span className="text-xs block" style={{ color: selectedType === 'cafes' ? '#1E3A5F' : '#64748B' }}>Cafés</span>
            </button>
            <button
              onClick={() => setSelectedType(selectedType === 'nightlife' ? 'all' : 'nightlife')}
              className="rounded-xl text-center transition-all"
              style={{
                border: selectedType === 'nightlife' ? '2px solid #1E3A5F' : '1px solid #E2EBFC',
                backgroundColor: selectedType === 'nightlife' ? '#EFF4FF' : 'white',
                padding: '16px 10px',
              }}
            >
              <div className="text-[28px] mb-1">🍸</div>
              <span className="text-xs block" style={{ color: selectedType === 'nightlife' ? '#1E3A5F' : '#64748B' }}>Nightlife</span>
            </button>
            <button
              onClick={() => setSelectedType(selectedType === 'health' ? 'all' : 'health')}
              className="rounded-xl text-center transition-all"
              style={{
                border: selectedType === 'health' ? '2px solid #1E3A5F' : '1px solid #E2EBFC',
                backgroundColor: selectedType === 'health' ? '#EFF4FF' : 'white',
                padding: '16px 10px',
              }}
            >
              <div className="text-[28px] mb-1">🏥</div>
              <span className="text-xs block" style={{ color: selectedType === 'health' ? '#1E3A5F' : '#64748B' }}>Health</span>
            </button>
            <button
              onClick={() => setSelectedType(selectedType === 'culture' ? 'all' : 'culture')}
              className="rounded-xl text-center transition-all"
              style={{
                border: selectedType === 'culture' ? '2px solid #1E3A5F' : '1px solid #E2EBFC',
                backgroundColor: selectedType === 'culture' ? '#EFF4FF' : 'white',
                padding: '16px 10px',
              }}
            >
              <div className="text-[28px] mb-1">🎨</div>
              <span className="text-xs block" style={{ color: selectedType === 'culture' ? '#1E3A5F' : '#64748B' }}>Culture</span>
            </button>
            <button
              onClick={() => setSelectedType(selectedType === 'sports' ? 'all' : 'sports')}
              className="rounded-xl text-center transition-all"
              style={{
                border: selectedType === 'sports' ? '2px solid #1E3A5F' : '1px solid #E2EBFC',
                backgroundColor: selectedType === 'sports' ? '#EFF4FF' : 'white',
                padding: '16px 10px',
              }}
            >
              <div className="text-[28px] mb-1">💪</div>
              <span className="text-xs block" style={{ color: selectedType === 'sports' ? '#1E3A5F' : '#64748B' }}>Sports & Wellness</span>
            </button>
            <button
              onClick={() => setSelectedType(selectedType === 'pets' ? 'all' : 'pets')}
              className="rounded-xl text-center transition-all"
              style={{
                border: selectedType === 'pets' ? '2px solid #1E3A5F' : '1px solid #E2EBFC',
                backgroundColor: selectedType === 'pets' ? '#EFF4FF' : 'white',
                padding: '16px 10px',
              }}
            >
              <div className="text-[28px] mb-1">🐾</div>
              <span className="text-xs block" style={{ color: selectedType === 'pets' ? '#1E3A5F' : '#64748B' }}>Pets</span>
            </button>
            <button
              onClick={() => setSelectedType(selectedType === 'other' ? 'all' : 'other')}
              className="rounded-xl text-center transition-all"
              style={{
                border: selectedType === 'other' ? '2px solid #1E3A5F' : '1px solid #E2EBFC',
                backgroundColor: selectedType === 'other' ? '#EFF4FF' : 'white',
                padding: '16px 10px',
              }}
            >
              <div className="text-[28px] mb-1">📍</div>
              <span className="text-xs block" style={{ color: selectedType === 'other' ? '#1E3A5F' : '#64748B' }}>Other</span>
            </button>
          </div>

          {/* View mode */}
          <div className="flex gap-1.5 mb-4">
            <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")} className="gap-1 text-xs"><List className="w-3.5 h-3.5" /> {t("venues.list", "List")}</Button>
            <Button variant={viewMode === "map" ? "default" : "outline"} size="sm" onClick={() => setViewMode("map")} className="gap-1 text-xs"><Map className="w-3.5 h-3.5" /> {t("venues.map", "Map")}</Button>
          </div>

          {viewMode === "list" ? (
            isLoading ? <div className="text-center py-12 text-[#94A3B8] text-xs">{t("venues.loading", "Loading venues...")}</div>
            : filtered.length === 0 ? (
              <div className="text-center py-12">
                <Store className="w-12 h-12 mx-auto text-[#94A3B8] mb-3" />
                <h3 className="text-sm font-medium text-foreground mb-1">{t("venues.no_venues", "No venues found")}</h3>
                <p className="text-xs text-[#94A3B8]">{t("venues.be_first", "Be the first to add a venue!")}</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((venue: any) => (
                  <div key={venue.id} className="bg-card rounded-xl overflow-hidden hover:shadow-sm transition-shadow" style={{ border: '1px solid #E2EBFC' }}>
                    {/* Photo placeholder */}
                    <div className="h-[120px] sm:h-[100px] relative" style={{ backgroundColor: '#E8F0FE' }}>
                      {venue.photos?.[0] ? (
                        <img src={venue.photos[0]} alt={venue.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Store className="w-8 h-8 text-primary/30" />
                        </div>
                      )}
                      {venue.venue_types?.name && (
                        <span className="absolute top-2 left-2 text-[7px] font-medium px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: '#1E3A5F' }}>
                          {venue.venue_types.name}
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <h3 className="text-xs font-semibold text-foreground mb-0.5">{venue.name}</h3>
                      {venue.address && (
                        <div className="flex items-center gap-1 text-xxs text-[#64748B] mb-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" /> {venue.address}
                        </div>
                      )}
                      {venue.created_by_user_id && (
                        <div className="flex items-center gap-1 mb-2">
                          <div className="w-3.5 h-3.5 rounded-full bg-primary-light flex items-center justify-center">
                            <span className="text-[6px] text-primary font-medium">{venue.name?.slice(0, 1)}</span>
                          </div>
                          <span className="text-xxs text-[#64748B]"><UserName userId={venue.created_by_user_id} className="text-xxs" /></span>
                        </div>
                      )}
                      <Button size="sm" variant="cta" className="w-full text-[9px] py-1 h-auto" onClick={() => navigate(`/venue/${venue.id}`)}>
                        {t("venues.view_details", "View Details")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : <ListingMap items={mapPins} height="450px" />}
        </div>
      </div>
    </div>
  );
};

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
      {/* Progress */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-[3px] flex-1 rounded-full" style={{ backgroundColor: '#E2EBFC' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${(step / 2) * 100}%`, backgroundColor: '#1E3A5F' }} />
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
