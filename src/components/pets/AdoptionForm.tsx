import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Upload } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSpecies, useBreeds } from "@/hooks/useSpeciesBreeds";

interface AdoptionFormProps { onSuccess: () => void; onBack: () => void; }

const AdoptionForm = ({ onSuccess, onBack }: AdoptionFormProps) => {
  const [form, setForm] = useState({
    title: "", species: "", breed: "", age_years: "", age_months: "", gender: "",
    size: "", energy_level: "", description: "", address: "",
    is_vaccinated: false, is_neutered: false, good_with_children: false, good_with_pets: false,
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const { toast } = useToast();
  const { speciesOptions, isLoading: speciesLoading } = useSpecies();
  const { breedOptions, isLoading: breedsLoading } = useBreeds(form.species);

  const handlePhotoUpload = async (index: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const ext = file.name.split(".").pop();
      const path = `pets/${Date.now()}_${index}.${ext}`;
      const { error } = await supabase.storage.from("user-media").upload(path, file);
      if (error) { toast({ title: "Upload failed", variant: "destructive" }); return; }
      const { data: { publicUrl } } = supabase.storage.from("user-media").getPublicUrl(path);
      const newPhotos = [...photos];
      newPhotos[index] = publicUrl;
      setPhotos(newPhotos);
    };
    input.click();
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Giriş yapın");
      const { error } = await supabase.from("pet_posts").insert({
        user_id: user.id,
        post_type: "adoption" as any,
        title: form.title,
        species: form.species,
        breed: form.breed,
        age_text: form.age_years ? `${form.age_years}y ${form.age_months || 0}m` : undefined,
        age_years: form.age_years ? parseInt(form.age_years) : null,
        age_months: form.age_months ? parseInt(form.age_months) : null,
        gender: form.gender,
        size: form.size,
        energy_level: form.energy_level,
        description: form.description,
        address: form.address,
        photos: photos.filter(Boolean),
        is_vaccinated: form.is_vaccinated,
        is_neutered: form.is_neutered,
        good_with_children: form.good_with_children,
        good_with_pets: form.good_with_pets,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Sahiplendirme ilanı oluşturuldu! ✅" }); onSuccess(); },
    onError: (e: any) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  const cardStyle = (active: boolean) => ({
    border: `2px solid ${active ? "#1E3A5F" : "#E2EBFC"}`,
    backgroundColor: active ? "#EFF4FF" : "white",
    color: active ? "#1E3A5F" : "#64748B",
  });

  return (
    <div className="space-y-4">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
          <DialogTitle>🐾 Sahiplendirme İlanı</DialogTitle>
        </div>
      </DialogHeader>

      <div className="space-y-4">
        {/* Photo upload - 5 slots */}
        <div>
          <Label className="mb-2 block text-xs font-semibold" style={{ color: "#1E3A5F" }}>Fotoğraflar (ilk = profil)</Label>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <button
                key={i}
                onClick={() => handlePhotoUpload(i)}
                className="flex-1 aspect-square rounded-lg flex items-center justify-center overflow-hidden transition-all"
                style={{ border: `2px dashed ${photos[i] ? "#1E3A5F" : "#E2EBFC"}`, backgroundColor: photos[i] ? undefined : "#F8FAFF" }}
              >
                {photos[i] ? (
                  <img src={photos[i]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-4 h-4" style={{ color: "#94A3B8" }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Pet name */}
        <div>
          <Label className="text-xs" style={{ color: "#1E3A5F" }}>Hayvan Adı</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ border: "1px solid #E2EBFC" }} />
        </div>

        {/* Species emoji cards */}
        <div>
          <Label className="mb-2 block text-xs font-semibold" style={{ color: "#1E3A5F" }}>Tür</Label>
          {speciesLoading ? (
            <p className="text-xs" style={{ color: "#94A3B8" }}>Yükleniyor...</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {speciesOptions.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setForm({ ...form, species: s.value, breed: "" })}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                  style={cardStyle(form.species === s.value)}
                >
                  <span className="text-xl">{s.emoji}</span>
                  <span>{s.label.replace(s.emoji + " ", "")}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Breed scrollable pills */}
        {form.species && (
          <div>
            <Label className="mb-2 block text-xs font-semibold" style={{ color: "#1E3A5F" }}>Cins</Label>
            {breedsLoading ? (
              <p className="text-xs" style={{ color: "#94A3B8" }}>Yükleniyor...</p>
            ) : (
              <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {breedOptions.map((b) => (
                  <button
                    key={b.value}
                    onClick={() => setForm({ ...form, breed: b.value })}
                    className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0"
                    style={{
                      backgroundColor: form.breed === b.value ? "#1E3A5F" : "white",
                      color: form.breed === b.value ? "white" : "#64748B",
                      border: `1px solid ${form.breed === b.value ? "#1E3A5F" : "#E2EBFC"}`,
                    }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Age */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs" style={{ color: "#1E3A5F" }}>Yaş (Yıl)</Label>
            <Input type="number" min={0} value={form.age_years} onChange={(e) => setForm({ ...form, age_years: e.target.value })} style={{ border: "1px solid #E2EBFC" }} />
          </div>
          <div>
            <Label className="text-xs" style={{ color: "#1E3A5F" }}>Yaş (Ay)</Label>
            <Input type="number" min={0} max={11} value={form.age_months} onChange={(e) => setForm({ ...form, age_months: e.target.value })} style={{ border: "1px solid #E2EBFC" }} />
          </div>
        </div>

        {/* Gender */}
        <div>
          <Label className="mb-2 block text-xs font-semibold" style={{ color: "#1E3A5F" }}>Cinsiyet</Label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setForm({ ...form, gender: "male" })} className="p-3 rounded-lg text-center text-sm font-semibold" style={cardStyle(form.gender === "male")}>Erkek 🐾</button>
            <button onClick={() => setForm({ ...form, gender: "female" })} className="p-3 rounded-lg text-center text-sm font-semibold" style={cardStyle(form.gender === "female")}>Dişi 🐾</button>
          </div>
        </div>

        {/* Size */}
        <div>
          <Label className="mb-2 block text-xs font-semibold" style={{ color: "#1E3A5F" }}>Boyut</Label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { v: "tiny", l: "Mini" }, { v: "small", l: "Küçük" }, { v: "medium", l: "Orta" }, { v: "large", l: "Büyük" },
            ].map((s) => (
              <button key={s.v} onClick={() => setForm({ ...form, size: s.v })} className="py-2 rounded-lg text-xs font-semibold text-center" style={cardStyle(form.size === s.v)}>{s.l}</button>
            ))}
          </div>
        </div>

        {/* Energy level */}
        <div>
          <Label className="mb-2 block text-xs font-semibold" style={{ color: "#1E3A5F" }}>Enerji Seviyesi</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: "low", l: "Sakin 😌" }, { v: "moderate", l: "Orta ⚡" }, { v: "high", l: "Enerjik 🚀" },
            ].map((e) => (
              <button key={e.v} onClick={() => setForm({ ...form, energy_level: e.v })} className="py-2 rounded-lg text-xs font-semibold text-center" style={cardStyle(form.energy_level === e.v)}>{e.l}</button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          {[
            { key: "is_vaccinated" as const, label: "Aşılı mı?" },
            { key: "is_neutered" as const, label: "Kısırlaştırılmış mı?" },
            { key: "good_with_children" as const, label: "Çocuklarla iyi geçinir mi?" },
            { key: "good_with_pets" as const, label: "Diğer hayvanlarla iyi geçinir mi?" },
          ].map((t) => (
            <div key={t.key} className="flex items-center justify-between">
              <Label className="text-xs" style={{ color: "#1E3A5F" }}>{t.label}</Label>
              <Switch checked={form[t.key]} onCheckedChange={(v) => setForm({ ...form, [t.key]: v })} />
            </div>
          ))}
        </div>

        {/* Description */}
        <div>
          <Label className="text-xs" style={{ color: "#1E3A5F" }}>Açıklama</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ border: "1px solid #E2EBFC" }} />
        </div>

        {/* Neighborhood */}
        <div>
          <Label className="text-xs" style={{ color: "#1E3A5F" }}>Mahalle</Label>
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Cihangir, Beyoğlu" style={{ border: "1px solid #E2EBFC" }} />
        </div>

        <Button
          className="w-full"
          style={{ backgroundColor: "#1E3A5F" }}
          onClick={() => mutation.mutate()}
          disabled={!form.title || mutation.isPending}
        >
          {mutation.isPending ? "Gönderiliyor..." : "Sahiplendirme İlanı Yayınla"}
        </Button>
      </div>
    </div>
  );
};

export default AdoptionForm;
