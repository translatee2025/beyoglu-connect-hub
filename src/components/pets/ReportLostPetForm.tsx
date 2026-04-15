import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/providers/LanguageProvider";
import { useSpecies, useBreeds } from "@/hooks/useSpeciesBreeds";

interface ReportLostPetFormProps { onSuccess: () => void; }

const neighborhoods = ["Cihangir", "Galata", "Tophane", "Çukurcuma", "Firuzağa", "Asmalımescit", "İstiklal", "Taksim", "Tepebaşı", "Nişantaşı", "Beyoğlu (other)"];

const ReportLostPetForm = ({ onSuccess }: ReportLostPetFormProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"my_pet" | "found">("my_pet");
  const [form, setForm] = useState({ name: "", species: "dog", breed: "", gender: "", photo_url: "", lost_location: "", lost_details: "", contact_info: "" });

  const { speciesOptions } = useSpecies();
  const { breedOptions } = useBreeds(form.species);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.lost_location.trim()) { toast({ title: t("pets.lost_title", "Name and location required"), variant: "destructive" }); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: t("common.login_required", "Please log in"), variant: "destructive" }); return; }
    setLoading(true);
    try {
      const coords = getNeighborhoodCoords(form.lost_location);
      const { error } = await supabase.from("lost_found_posts").insert({
        user_id: user.id,
        type: mode === "my_pet" ? "lost" : "found",
        category: "Pet",
        title: form.name.trim(),
        description: form.lost_details || null,
        neighborhood: form.lost_location,
        last_seen_lat: coords[0],
        last_seen_lng: coords[1],
        phone: form.contact_info || null,
        photo_urls: form.photo_url ? [form.photo_url] : [],
        status: "active",
        last_seen_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast({ title: "🚨 " + t("pets.post_lost_alert", "Lost pet alert posted!") });
      onSuccess();
    } catch (err: any) { toast({ title: t("common.error", "Error"), description: err.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-destructive/30">
        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-destructive" /></div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("pets.lost_title", "Report Lost Pet")}</h2>
          <p className="text-sm text-muted-foreground">{t("pets.lost_subtitle", "Alert your neighbors immediately")}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant={mode === "my_pet" ? "default" : "outline"} size="sm" onClick={() => setMode("my_pet")} className="flex-1">{t("pets.my_pet_lost", "🆘 My Pet is Lost")}</Button>
        <Button type="button" variant={mode === "found" ? "default" : "outline"} size="sm" onClick={() => setMode("found")} className="flex-1">{t("pets.found_pet", "🔍 I Found a Pet")}</Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label>{t("pets.pet_name_label", "Pet Name *")}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div><Label>{t("pets.species", "Species")}</Label>
          <Select value={form.species} onValueChange={(v) => setForm({ ...form, species: v, breed: "" })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {speciesOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label>{t("pets.breed", "Breed")}</Label>
          <Select value={form.breed} onValueChange={(v) => setForm({ ...form, breed: v })}>
            <SelectTrigger><SelectValue placeholder={t("common.select", "Select...")} /></SelectTrigger>
            <SelectContent>
              {breedOptions.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label>{t("pets.gender", "Gender")}</Label>
          <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
            <SelectTrigger><SelectValue placeholder={t("common.select", "Select...")} /></SelectTrigger>
            <SelectContent><SelectItem value="male">♂ {t("pets.male", "Male")}</SelectItem><SelectItem value="female">♀ {t("pets.female", "Female")}</SelectItem><SelectItem value="unknown">{t("pets.unknown", "Unknown")}</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label>{t("pets.last_seen", "Last Seen Location *")}</Label>
          <Select value={form.lost_location} onValueChange={(v) => setForm({ ...form, lost_location: v })}>
            <SelectTrigger><SelectValue placeholder={t("pets.select_neighborhood", "Select neighborhood...")} /></SelectTrigger>
            <SelectContent>{neighborhoods.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>{t("pets.photo_url", "Photo URL")}</Label><Input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} /></div>
      <div><Label>{t("pets.details", "Details")}</Label><Textarea value={form.lost_details} onChange={(e) => setForm({ ...form, lost_details: e.target.value })} rows={3} /></div>
      <div><Label>{t("pets.contact_info", "Contact Info")}</Label><Input value={form.contact_info} onChange={(e) => setForm({ ...form, contact_info: e.target.value })} /></div>
      <Button type="submit" disabled={loading} variant="destructive" className="w-full gap-2">
        <AlertTriangle className="w-4 h-4" />
        {loading ? t("pets.posting_alert", "Posting Alert...") : mode === "my_pet" ? t("pets.post_lost_alert", "🚨 Post Lost Pet Alert") : t("pets.post_found_alert", "📢 Post Found Pet Alert")}
      </Button>
    </form>
  );
};

function getNeighborhoodCoords(neighborhood: string): [number, number] {
  const coords: Record<string, [number, number]> = { "Cihangir": [41.0325, 28.9835], "Galata": [41.0256, 28.9742], "Tophane": [41.0270, 28.9810], "Çukurcuma": [41.0315, 28.9790], "Firuzağa": [41.0335, 28.9805], "Asmalımescit": [41.0305, 28.9760], "İstiklal": [41.0340, 28.9775], "Taksim": [41.0370, 28.9850], "Tepebaşı": [41.0295, 28.9755], "Nişantaşı": [41.0480, 28.9935], "Beyoğlu (other)": [41.0340, 28.9780] };
  const base = coords[neighborhood] || [41.0325, 28.9800];
  return [base[0] + (Math.random() - 0.5) * 0.002, base[1] + (Math.random() - 0.5) * 0.002];
}

export default ReportLostPetForm;
