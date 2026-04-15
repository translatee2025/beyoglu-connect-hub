import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/providers/LanguageProvider";
import { useSpecies, useBreeds } from "@/hooks/useSpeciesBreeds";

interface AdoptionFormProps { onSuccess: () => void; onBack: () => void; }

const AdoptionForm = ({ onSuccess, onBack }: AdoptionFormProps) => {
  const [form, setForm] = useState({ title: "", species: "dog", breed: "", age_text: "", gender: "", description: "", phone: "", whatsapp: "", address: "" });
  const { toast } = useToast();
  const { t } = useLanguage();
  const { speciesOptions } = useSpecies();
  const { breedOptions } = useBreeds(form.species);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("common.login_required", "Please log in"));
      const { error } = await supabase.from("pet_posts").insert({ user_id: user.id, post_type: "adoption" as any, title: form.title, species: form.species, breed: form.breed, age_text: form.age_text, gender: form.gender, description: form.description, phone: form.phone, whatsapp: form.whatsapp, address: form.address });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: t("pets.post_adoption", "Adoption post created!") }); onSuccess(); },
    onError: (e: any) => toast({ title: t("common.error", "Error"), description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
          <DialogTitle>{t("pets.adoption_title", "🐾 Post Pet for Adoption")}</DialogTitle>
        </div>
      </DialogHeader>
      <div className="space-y-3">
        <div><Label>{t("pets.pet_name", "Pet Name / Title")}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{t("pets.species", "Species")}</Label>
            <Select value={form.species} onValueChange={(v) => setForm({ ...form, species: v, breed: "" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {speciesOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>{t("pets.gender", "Gender")}</Label>
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
              <SelectTrigger><SelectValue placeholder={t("common.select", "Select")} /></SelectTrigger>
              <SelectContent><SelectItem value="male">{t("pets.male", "Male")}</SelectItem><SelectItem value="female">{t("pets.female", "Female")}</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{t("pets.breed", "Breed")}</Label>
            <Select value={form.breed} onValueChange={(v) => setForm({ ...form, breed: v })}>
              <SelectTrigger><SelectValue placeholder={t("common.select", "Select")} /></SelectTrigger>
              <SelectContent>
                {breedOptions.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>{t("pets.age", "Age")}</Label><Input value={form.age_text} onChange={(e) => setForm({ ...form, age_text: e.target.value })} /></div>
        </div>
        <div><Label>{t("pets.description", "Description")}</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div><Label>{t("pets.location", "Location / Area")}</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>{t("pets.phone", "Phone")}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+90 5xx..." /></div>
          <div><Label>{t("pets.whatsapp", "WhatsApp")}</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+90 5xx..." /></div>
        </div>
        <Button className="w-full" onClick={() => mutation.mutate()} disabled={!form.title || mutation.isPending}>
          {mutation.isPending ? t("common.posting", "Posting...") : t("pets.post_adoption", "Post for Adoption")}
        </Button>
      </div>
    </div>
  );
};

export default AdoptionForm;
