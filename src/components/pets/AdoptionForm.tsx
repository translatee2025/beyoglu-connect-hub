import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import { PhotoUploader } from "@/components/shared/PhotoUploader";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSpecies, useBreeds } from "@/hooks/useSpeciesBreeds";
import { useLanguage } from "@/providers/LanguageProvider";

interface AdoptionFormProps { onSuccess: () => void; onBack: () => void; }

const AdoptionForm = ({ onSuccess, onBack }: AdoptionFormProps) => {
  const [form, setForm] = useState({
    title: "", species: "", breed: "", age_years: "", age_months: "", gender: "",
    size: "", energy_level: "", description: "", address: "",
    is_vaccinated: false, is_neutered: false, good_with_children: false, good_with_pets: false,
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { species, speciesOptions, isLoading: speciesLoading } = useSpecies();
  const { breedOptions, breeds, isLoading: breedsLoading } = useBreeds(form.species);

  // Photo upload handled by PhotoUploader component

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("pets.login_required", "Please log in"));
      const cleanPhotos = photos.filter(Boolean);
      // Normalize species: form.species may be a UUID (from speciesOptions). Resolve to:
      //  - species_id (uuid)
      //  - species enum text (e.g. "dog") for legacy consumers
      const selectedSpecies = species.find((s) => s.id === form.species);
      const speciesEnumText = selectedSpecies
        ? selectedSpecies.name_en.toLowerCase()
        : form.species || null;
      const selectedBreed = breeds.find((b) => b.name_en === form.breed || b.name_tr === form.breed);
      const insertPayload: any = {
        owner_id: user.id,
        name: form.title,
        breed: form.breed || null,
        breed_id: selectedBreed?.id || null,
        age_years: form.age_years ? parseInt(form.age_years) : null,
        age_months: form.age_months ? parseInt(form.age_months) : null,
        gender: form.gender || null,
        size: form.size || null,
        energy_level: form.energy_level || null,
        bio: form.description || null,
        neighborhood: form.address || null,
        photos: cleanPhotos,
        photo_url: cleanPhotos[0] || null,
        is_neutered: form.is_neutered,
        is_lost: false,
      };
      if (selectedSpecies) {
        insertPayload.species_id = selectedSpecies.id;
        insertPayload.species = speciesEnumText;
      } else if (form.species) {
        insertPayload.species = form.species;
      }
      const { error } = await supabase.from("pet_profiles").insert(insertPayload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t("pets.adoption_success", "Adoption listing created! ✅") });
      queryClient.invalidateQueries({ queryKey: ["pet-profiles"] });
      onSuccess();
    },
    onError: (e: any) => toast({ title: t("common.error", "Error"), description: e.message, variant: "destructive" }),
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
          <DialogTitle>{t("pets.adoption_form_title", "🐾 Adoption Listing")}</DialogTitle>
        </div>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <Label className="mb-2 block text-xs font-semibold" style={{ color: "#1E3A5F" }}>{t("pets.photos_label", "Photos (first = profile)")}</Label>
          <PhotoUploader value={photos} onChange={setPhotos} maxFiles={5} pathPrefix="pet_posts" />
        </div>

        <div>
          <Label className="text-xs" style={{ color: "#1E3A5F" }}>{t("pets.pet_name_field", "Pet Name")}</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ border: "1px solid #E2EBFC" }} />
        </div>

        <div>
          <Label className="mb-2 block text-xs font-semibold" style={{ color: "#1E3A5F" }}>{t("pets.species_label", "Species")}</Label>
          {speciesLoading ? (
            <p className="text-xs" style={{ color: "#64748B" }}>{t("loading", "Loading...")}</p>
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

        {form.species && (
          <div>
            <Label className="mb-2 block text-xs font-semibold" style={{ color: "#1E3A5F" }}>{t("pets.breed_label", "Breed")}</Label>
            {breedsLoading ? (
              <p className="text-xs" style={{ color: "#64748B" }}>{t("loading", "Loading...")}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setForm({ ...form, breed: "mixed" })}
                  className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
                  style={{
                    backgroundColor: form.breed === "mixed" ? "#1E3A5F" : "white",
                    color: form.breed === "mixed" ? "white" : "#64748B",
                    border: `1px solid ${form.breed === "mixed" ? "#1E3A5F" : "#E2EBFC"}`,
                  }}
                >
                  {t("pets.breed_mixed", "Mixed")}
                </button>
                {breedOptions.map((b) => (
                  <button
                    key={b.value}
                    onClick={() => setForm({ ...form, breed: b.value })}
                    className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
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

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs" style={{ color: "#1E3A5F" }}>{t("pets.age_years", "Age (Years)")}</Label>
            <Select value={form.age_years || "unknown"} onValueChange={(v) => setForm({ ...form, age_years: v === "unknown" ? "" : v })}>
              <SelectTrigger style={{ border: "1px solid #E2EBFC" }}><SelectValue placeholder={t("pets.select", "Select")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unknown">Unknown</SelectItem>
                {Array.from({ length: 16 }, (_, i) => (
                  <SelectItem key={i} value={String(i)}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(!form.age_years || form.age_years === "0") && (
            <div>
              <Label className="text-xs" style={{ color: "#1E3A5F" }}>{t("pets.age_months", "Age (Months)")}</Label>
              <Select value={form.age_months} onValueChange={(v) => setForm({ ...form, age_months: v })}>
                <SelectTrigger style={{ border: "1px solid #E2EBFC" }}><SelectValue placeholder={t("pets.select", "Select")} /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div>
          <Label className="mb-2 block text-xs font-semibold" style={{ color: "#1E3A5F" }}>{t("pets.gender_label", "Gender")}</Label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setForm({ ...form, gender: "male" })} className="p-3 rounded-lg text-center text-sm font-semibold flex items-center justify-center" style={{ ...cardStyle(form.gender === "male"), minHeight: 72 }}>{t("pets.male_label", "Male 🐾")}</button>
            <button onClick={() => setForm({ ...form, gender: "female" })} className="p-3 rounded-lg text-center text-sm font-semibold flex items-center justify-center" style={{ ...cardStyle(form.gender === "female"), minHeight: 72 }}>{t("pets.female_label", "Female 🐾")}</button>
          </div>
        </div>

        <div>
          <Label className="mb-2 block text-xs font-semibold" style={{ color: "#1E3A5F" }}>{t("pets.size_label", "Size")}</Label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { v: "tiny", l: t("pets.size_tiny", "Tiny") },
              { v: "small", l: t("pets.size_small", "Small") },
              { v: "medium", l: t("pets.size_medium", "Medium") },
              { v: "large", l: t("pets.size_large", "Large") },
            ].map((s) => (
              <button key={s.v} onClick={() => setForm({ ...form, size: s.v })} className="py-2 rounded-lg text-xs font-semibold text-center" style={cardStyle(form.size === s.v)}>{s.l}</button>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-2 block text-xs font-semibold" style={{ color: "#1E3A5F" }}>{t("pets.energy_label", "Energy Level")}</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: "low", l: t("pets.energy_low", "Calm 😌") },
              { v: "moderate", l: t("pets.energy_moderate", "Moderate ⚡") },
              { v: "high", l: t("pets.energy_high", "Energetic 🚀") },
            ].map((e) => (
              <button key={e.v} onClick={() => setForm({ ...form, energy_level: e.v })} className="py-2 rounded-lg text-xs font-semibold text-center" style={cardStyle(form.energy_level === e.v)}>{e.l}</button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {[
            { key: "is_vaccinated" as const, label: t("pets.is_vaccinated", "Vaccinated?") },
            { key: "is_neutered" as const, label: t("pets.is_neutered", "Neutered?") },
            { key: "good_with_children" as const, label: t("pets.good_with_children", "Good with children?") },
            { key: "good_with_pets" as const, label: t("pets.good_with_pets", "Good with other pets?") },
          ].map((tgl) => (
            <div key={tgl.key} className="flex items-center justify-between">
              <Label className="text-xs" style={{ color: "#1E3A5F" }}>{tgl.label}</Label>
              <Switch checked={form[tgl.key]} onCheckedChange={(v) => setForm({ ...form, [tgl.key]: v })} />
            </div>
          ))}
        </div>

        <div>
          <Label className="text-xs" style={{ color: "#1E3A5F" }}>{t("pets.description_label", "Description")}</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ border: "1px solid #E2EBFC" }} />
        </div>

        <div>
          <Label className="text-xs" style={{ color: "#1E3A5F" }}>{t("pets.neighborhood_label", "Neighborhood")}</Label>
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Cihangir, Beyoğlu" style={{ border: "1px solid #E2EBFC" }} />
        </div>

        <Button
          className="w-full"
          style={{ backgroundColor: "#1E3A5F" }}
          onClick={() => mutation.mutate()}
          disabled={!form.title || mutation.isPending}
        >
          {mutation.isPending ? t("common.sending", "Sending...") : t("pets.submit_adoption", "Publish Adoption Listing")}
        </Button>
      </div>
    </div>
  );
};

export default AdoptionForm;
