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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center"><Store className="w-8 h-8 text-primary" /></div>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-2">{t("venues.title", "Venues")}</h1>
            <p className="text-muted-foreground">{t("venues.subtitle", "Restaurants, pharmacies, bars, shops and more")}</p>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={t("venues.search", "Search venues...")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Dialog open={postOpen} onOpenChange={setPostOpen}>
              <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> {t("venues.add", "Add Venue")}</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <VenuePostForm venueTypes={venueTypes} onSuccess={() => { setPostOpen(false); queryClient.invalidateQueries({ queryKey: ["venues-list"] }); }} />
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant={selectedType === "all" ? "default" : "outline"} size="sm" onClick={() => setSelectedType("all")}>{t("venues.all", "All")}</Button>
            {venueTypes.map((vt: any) => (
              <Button key={vt.id} variant={selectedType === vt.id ? "default" : "outline"} size="sm" onClick={() => setSelectedType(vt.id)}>{vt.name}</Button>
            ))}
          </div>
          <div className="flex gap-2 mb-4">
            <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")} className="gap-1"><List className="w-4 h-4" /> {t("venues.list", "List")}</Button>
            <Button variant={viewMode === "map" ? "default" : "outline"} size="sm" onClick={() => setViewMode("map")} className="gap-1"><Map className="w-4 h-4" /> {t("venues.map", "Map")}</Button>
          </div>
          {viewMode === "list" ? (
            isLoading ? <div className="text-center py-12 text-muted-foreground">{t("venues.loading", "Loading venues...")}</div>
            : filtered.length === 0 ? (
              <div className="text-center py-12"><Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-semibold text-foreground mb-2">{t("venues.no_venues", "No venues found")}</h3><p className="text-muted-foreground">{t("venues.be_first", "Be the first to add a venue!")}</p></div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((venue: any) => (
                  <Card key={venue.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"><Store className="w-6 h-6 text-primary" /></div>
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{venue.name}</CardTitle>
                          {venue.venue_types?.name && <Badge variant="outline" className="mb-1">{venue.venue_types.name}</Badge>}
                          {venue.description && <p className="text-sm text-muted-foreground line-clamp-2">{venue.description}</p>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {venue.address && <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-4 h-4 flex-shrink-0" /> {venue.address}</div>}
                      {venue.phone && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-4 h-4 flex-shrink-0" /> {venue.phone}</div>}
                      {venue.created_by_user_id && <div className="mt-1"><UserName userId={venue.created_by_user_id} showAvatar /></div>}
                      <Button variant="outline" className="w-full mt-2" onClick={() => navigate(`/venue/${venue.id}`)}>{t("venues.view_details", "View Details")}</Button>
                    </CardContent>
                  </Card>
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
    <div className="space-y-4">
      <DialogHeader><DialogTitle>{t("venues.add_venue", "Add a Venue")}</DialogTitle></DialogHeader>
      <Progress value={(step / 2) * 100} className="h-1.5" />
      <p className="text-xs text-muted-foreground text-center">{t("common.step_of", `Step ${step} of 2`).replace("{step}", String(step)).replace("{total}", "2")}</p>
      {step === 1 && (
        <div className="space-y-3">
          <div><Label>{t("venues.name", "Name / Headline *")}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ali's Shoe Repair" /></div>
          <div><Label>{t("venues.type", "Venue Type")}</Label>
            <Select value={form.venueTypeId} onValueChange={(v) => setForm({ ...form, venueTypeId: v })}>
              <SelectTrigger><SelectValue placeholder={t("venues.select_type", "Select type")} /></SelectTrigger>
              <SelectContent>{venueTypes.map((vt: any) => <SelectItem key={vt.id} value={vt.id}>{vt.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{t("venues.address", "Address")}</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("venues.phone", "Phone")}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+90 5xx" /></div>
            <div><Label>{t("venues.whatsapp", "WhatsApp")}</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
          </div>
          <div><Label>{t("venues.description", "Description")}</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t("venues.what_offer", "What does this place offer?")} rows={3} /></div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-3">
          <div><Label>{t("venues.photos", "Photos / Videos")}</Label><MediaUpload value={photos} onChange={setPhotos} maxFiles={8} /></div>
          <div><Label>{t("venues.neighborhood", "Neighborhood")}</Label><Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} placeholder="Beyoğlu" /></div>
          <div>
            <Label className="flex items-center gap-1 mb-2"><Clock className="w-4 h-4" /> {t("venues.hours", "Opening Hours")}</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {WEEKDAYS.map((d) => <Button key={d.key} type="button" variant={selectedDays.includes(d.key) ? "default" : "outline"} size="sm" onClick={() => toggleDay(d.key)}>{d.label}</Button>)}
            </div>
            {selectedDays.length > 0 && (
              <div className="space-y-2">
                {WEEKDAYS.filter((d) => selectedDays.includes(d.key)).map((d) => (
                  <div key={d.key} className="flex items-center gap-2">
                    <span className="text-sm font-medium w-10">{d.label}</span>
                    <Input type="time" className="w-28" value={hours[d.key]?.open || "09:00"} onChange={(e) => setHours({ ...hours, [d.key]: { ...hours[d.key], open: e.target.value } })} />
                    <span className="text-muted-foreground">–</span>
                    <Input type="time" className="w-28" value={hours[d.key]?.close || "18:00"} onChange={(e) => setHours({ ...hours, [d.key]: { ...hours[d.key], close: e.target.value } })} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        {step > 1 && <Button variant="outline" onClick={() => setStep(1)} className="gap-1"><ArrowLeft className="w-4 h-4" /> {t("common.back", "Back")}</Button>}
        {step < 2 ? (
          <Button className="flex-1 gap-1" onClick={() => setStep(2)} disabled={!form.name.trim()}>{t("common.next", "Next")} <ArrowRight className="w-4 h-4" /></Button>
        ) : (
          <Button className="flex-1" onClick={() => mutation.mutate()} disabled={!form.name || mutation.isPending}>{mutation.isPending ? t("venues.adding", "Adding...") : t("venues.add_btn", "Add Venue")}</Button>
        )}
      </div>
    </div>
  );
};

export default Venues;
