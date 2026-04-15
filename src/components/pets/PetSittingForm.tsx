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

interface PetSittingFormProps { onSuccess: () => void; onBack: () => void; }

const days = [
  { key: "mon", label: "Pzt" },
  { key: "tue", label: "Sal" },
  { key: "wed", label: "Çar" },
  { key: "thu", label: "Per" },
  { key: "fri", label: "Cum" },
  { key: "sat", label: "Cmt" },
  { key: "sun", label: "Paz" },
];

const PetSittingForm = ({ onSuccess, onBack }: PetSittingFormProps) => {
  const [serviceType, setServiceType] = useState<"sitting" | "walking">("sitting");
  const [isOffering, setIsOffering] = useState(true);
  const [selectedSpecies, setSelectedSpecies] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [priceType, setPriceType] = useState<"per_session" | "per_hour">("per_session");
  const [form, setForm] = useState({ title: "", description: "", price: "", address: "" });
  const { toast } = useToast();
  const { speciesOptions, isLoading: speciesLoading } = useSpecies();

  const toggleDay = (d: string) => {
    setSelectedDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Giriş yapın");
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
        species: selectedSpecies || null,
        available_days: selectedDays,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "İlan oluşturuldu! ✅" }); onSuccess(); },
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
          <DialogTitle>🐾 Pet Sitting / Walking</DialogTitle>
        </div>
      </DialogHeader>

      <div className="space-y-4">
        {/* Service type */}
        <div>
          <Label className="mb-2 block text-xs font-semibold" style={{ color: "#1E3A5F" }}>Hizmet Türü</Label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setServiceType("sitting")} className="p-3 rounded-lg text-center text-sm font-semibold transition-all" style={cardStyle(serviceType === "sitting")}>
              🐾 Pet Sitting
            </button>
            <button onClick={() => setServiceType("walking")} className="p-3 rounded-lg text-center text-sm font-semibold transition-all" style={cardStyle(serviceType === "walking")}>
              🦮 Pet Walking
            </button>
          </div>
        </div>

        {/* Offer / Want */}
        <div>
          <Label className="mb-2 block text-xs font-semibold" style={{ color: "#1E3A5F" }}>İlan Türü</Label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setIsOffering(true)} className="p-3 rounded-lg text-center text-sm font-semibold transition-all" style={cardStyle(isOffering)}>
              ✅ Ben Yaparım
            </button>
            <button onClick={() => setIsOffering(false)} className="p-3 rounded-lg text-center text-sm font-semibold transition-all" style={cardStyle(!isOffering)}>
              🔍 Arıyorum
            </button>
          </div>
        </div>

        {/* Species emoji cards */}
        <div>
          <Label className="mb-2 block text-xs font-semibold" style={{ color: "#1E3A5F" }}>Hayvan Türü</Label>
          {speciesLoading ? (
            <p className="text-xs" style={{ color: "#94A3B8" }}>Yükleniyor...</p>
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
          <Label className="text-xs" style={{ color: "#1E3A5F" }}>Başlık</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={{ border: "1px solid #E2EBFC" }} />
        </div>

        {/* Price + type */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs" style={{ color: "#1E3A5F" }}>Ücret</Label>
            <Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="₺200" style={{ border: "1px solid #E2EBFC" }} />
          </div>
          <div>
            <Label className="text-xs" style={{ color: "#1E3A5F" }}>Birim</Label>
            <div className="flex gap-1 mt-1">
              <button onClick={() => setPriceType("per_session")} className="flex-1 py-1.5 rounded text-xs font-medium" style={{
                backgroundColor: priceType === "per_session" ? "#1E3A5F" : "white",
                color: priceType === "per_session" ? "white" : "#64748B",
                border: "1px solid #E2EBFC",
              }}>Seans</button>
              <button onClick={() => setPriceType("per_hour")} className="flex-1 py-1.5 rounded text-xs font-medium" style={{
                backgroundColor: priceType === "per_hour" ? "#1E3A5F" : "white",
                color: priceType === "per_hour" ? "white" : "#64748B",
                border: "1px solid #E2EBFC",
              }}>Saat</button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <Label className="text-xs" style={{ color: "#1E3A5F" }}>Açıklama</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ border: "1px solid #E2EBFC" }} />
        </div>

        {/* Available days */}
        <div>
          <Label className="mb-2 block text-xs font-semibold" style={{ color: "#1E3A5F" }}>Müsait Günler</Label>
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
          <Label className="text-xs" style={{ color: "#1E3A5F" }}>Mahalle</Label>
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Cihangir, Beyoğlu" style={{ border: "1px solid #E2EBFC" }} />
        </div>

        <Button
          className="w-full"
          style={{ backgroundColor: "#1E3A5F" }}
          onClick={() => mutation.mutate()}
          disabled={!form.title || mutation.isPending}
        >
          {mutation.isPending ? "Gönderiliyor..." : "İlanı Yayınla"}
        </Button>
      </div>
    </div>
  );
};

export default PetSittingForm;
