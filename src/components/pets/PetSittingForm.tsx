import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSpecies } from "@/hooks/useSpeciesBreeds";
import { useLanguage } from "@/providers/LanguageProvider";

interface PetSittingFormProps { onSuccess: () => void; onBack: () => void; }

const PetSittingForm = ({ onSuccess, onBack }: PetSittingFormProps) => {
  const [serviceType, setServiceType] = useState<"sitting" | "walking">("sitting");
  const [isOffering, setIsOffering] = useState(true);
  const [selectedSpecies, setSelectedSpecies] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [priceType, setPriceType] = useState<"per_session" | "per_hour">("per_session");
  const [form, setForm] = useState({ title: "", description: "", price: "", address: "" });
  const { toast } = useToast();
  const { t } = useLanguage();
  const { speciesOptions, species, isLoading: speciesLoading } = useSpecies();

  const days = [
    { key: "mon", label: t("days.mon", "Mon") },
    { key: "tue", label: t("days.tue", "Tue") },
    { key: "wed", label: t("days.wed", "Wed") },
    { key: "thu", label: t("days.thu", "Thu") },
    { key: "fri", label: t("days.fri", "Fri") },
    { key: "sat", label: t("days.sat", "Sat") },
    { key: "sun", label: t("days.sun", "Sun") },
  ];

  const toggleDay = (d: string) => {
    setSelectedDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(t("common.login_required", "Please log in"));
      // selectedSpecies holds a species UUID; store the canonical enum text
      // (e.g. "dog") so name-keyed emoji/label maps keep working — never a raw UUID.
      const resolvedSpecies = species.find((s) => s.id === selectedSpecies);
      const { error } = await supabase.from("pet_posts").insert({
        user_id: user.id,
        post_type: "pet_sitting" as any,
        service_type: serviceType,
        title: form.title,
        description: form.description,
        price: form.price,
        price_type: priceType,
        address: form.address,
        is_offering: isOffering,
        species: resolvedSpecies ? resolvedSpecies.name_en.toLowerCase() : (selectedSpecies || null),
        available_days: selectedDays,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: t("pets.listing_created", "Listing created! ✅") }); onSuccess(); },
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
          <DialogTitle>🐾 {t("pets.pet_sitting", "Pet Sitting")} / {t("pets.pet_walking", "Pet Walking")}</DialogTitle>
        </div>
      </DialogHeader>

      <div className="space-y-4">
        {/* Service type */}
        <div>
          <Label className="mb-2 block text-xs font-semibold" style={{ color: "#1E3A5F" }}>{t("pets.service_type", "Service Type")}</Label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setServiceType("sitting")} className="p-3 rounded-lg text-center text-sm font-semibold transition-all" style={cardStyle(serviceType === "sitting")}>
              🐾 {t("pets.pet_sitting", "Pet Sitting")}
            </button>
            <button onClick={() => setServiceType("walking")} className="p-3 rounded-lg text-center text-sm font-semibold transition-all" style={cardStyle(serviceType === "walking")}>
              🦮 {t("pets.pet_walking", "Pet Walking")}
            </button>
          </div>
        </div>

        {/* Offer / Want */}
        <div>
          <Label className="mb-2 block text-xs font-semibold" style={{ color: "#1E3A5F" }}>{t("pets.listing_type_label", "Listing Type")}</Label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setIsOffering(true)} className="p-3 rounded-lg text-center text-sm font-semibold transition-all" style={cardStyle(isOffering)}>
              ✅ {t("pets.i_offer", "I Offer")}
            </button>
            <button onClick={() => setIsOffering(false)} className="p-3 rounded-lg text-center text-sm font-semibold transition-all" style={cardStyle(!isOffering)}>
              🔍 {t("pets.i_want", "I Want")}
            </button>
          </div>
        </div>

        {/* Species emoji cards */}
        <div>
          <Label className="mb-2 block text-xs font-semibold" style={{ color: "#1E3A5F" }}>{t("pets.animal_type", "Animal Type")}</Label>
          {speciesLoading ? (
            <p className="text-xs" style={{ color: "#94A3B8" }}>{t("common.loading", "Loading...")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {speciesOptions.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSelectedSpecies(selectedSpecies === s.value ? "" : s.value)}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                  style={cardStyle(selectedSpecies === s.value)}
                >
                  <span className="text-xl">{s.emoji}</span>
                  <span>{s.label.replace(s.emoji + " ", "")}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <Label className="text-xs" style={{ color: "#1E3A5F" }}>{t("common.title", "Title")}</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ border: "1px solid #E2EBFC" }} />
        </div>

        {/* Price + type */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs" style={{ color: "#1E3A5F" }}>{t("common.price", "Price")}</Label>
            <Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="₺200" style={{ border: "1px solid #E2EBFC" }} />
          </div>
          <div>
            <Label className="text-xs" style={{ color: "#1E3A5F" }}>{t("common.unit", "Unit")}</Label>
            <div className="flex gap-1 mt-1">
              <button onClick={() => setPriceType("per_session")} className="flex-1 py-1.5 rounded text-xs font-medium" style={{
                backgroundColor: priceType === "per_session" ? "#1E3A5F" : "white",
                color: priceType === "per_session" ? "white" : "#64748B",
                border: "1px solid #E2EBFC",
              }}>{t("pets.per_session", "Per Session")}</button>
              <button onClick={() => setPriceType("per_hour")} className="flex-1 py-1.5 rounded text-xs font-medium" style={{
                backgroundColor: priceType === "per_hour" ? "#1E3A5F" : "white",
                color: priceType === "per_hour" ? "white" : "#64748B",
                border: "1px solid #E2EBFC",
              }}>{t("pets.per_hour", "Per Hour")}</button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <Label className="text-xs" style={{ color: "#1E3A5F" }}>{t("common.description", "Description")}</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ border: "1px solid #E2EBFC" }} />
        </div>

        {/* Available days */}
        <div>
          <Label className="mb-2 block text-xs font-semibold" style={{ color: "#1E3A5F" }}>{t("pets.available_days", "Available Days")}</Label>
          <div className="flex flex-wrap gap-1.5">
            {days.map((d) => (
              <button
                key={d.key}
                onClick={() => toggleDay(d.key)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={{
                  backgroundColor: selectedDays.includes(d.key) ? "#1E3A5F" : "white",
                  color: selectedDays.includes(d.key) ? "white" : "#64748B",
                  border: `1px solid ${selectedDays.includes(d.key) ? "#1E3A5F" : "#E2EBFC"}`,
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Neighborhood */}
        <div>
          <Label className="text-xs" style={{ color: "#1E3A5F" }}>{t("common.neighborhood", "Neighborhood")}</Label>
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Cihangir, Beyoğlu" style={{ border: "1px solid #E2EBFC" }} />
        </div>

        <Button
          className="w-full"
          style={{ backgroundColor: "#1E3A5F" }}
          onClick={() => mutation.mutate()}
          disabled={!form.title || mutation.isPending}
        >
          {mutation.isPending ? t("common.sending", "Sending...") : t("common.post", "Post")}
        </Button>
      </div>
    </div>
  );
};

export default PetSittingForm;
