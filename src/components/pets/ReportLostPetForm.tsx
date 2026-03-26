import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ReportLostPetFormProps {
  onSuccess: () => void;
}

const neighborhoods = [
  "Cihangir", "Galata", "Tophane", "Çukurcuma", "Firuzağa", "Asmalımescit",
  "İstiklal", "Taksim", "Tepebaşı", "Nişantaşı", "Beyoğlu (other)",
];

const ReportLostPetForm = ({ onSuccess }: ReportLostPetFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"my_pet" | "found">("my_pet");
  const [form, setForm] = useState({
    name: "",
    species: "dog",
    breed: "",
    gender: "",
    photo_url: "",
    lost_location: "",
    lost_details: "",
    contact_info: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.lost_location.trim()) {
      toast({ title: "Name and last seen location are required", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please log in to report a lost pet", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Find matching coordinates for the neighborhood
      const coords = getNeighborhoodCoords(form.lost_location);

      const { error } = await supabase.from("pet_profiles").insert({
        owner_id: user.id,
        name: form.name.trim(),
        species: form.species as any,
        breed: form.breed || null,
        gender: form.gender || null,
        photo_url: form.photo_url || null,
        is_lost: true,
        lost_location: form.lost_location,
        lost_details: form.lost_details || null,
        lost_at: new Date().toISOString(),
        neighborhood: form.lost_location,
        latitude: coords[0],
        longitude: coords[1],
      } as any);

      if (error) throw error;
      toast({
        title: "🚨 Lost pet alert posted!",
        description: "Nearby pet owners will be notified. We hope you find them soon!",
      });
      onSuccess();
    } catch (err: any) {
      toast({ title: "Error reporting lost pet", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-destructive/30">
        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Report Lost Pet</h2>
          <p className="text-sm text-muted-foreground">Alert your neighbors immediately</p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "my_pet" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("my_pet")}
          className="flex-1"
        >
          🆘 My Pet is Lost
        </Button>
        <Button
          type="button"
          variant={mode === "found" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("found")}
          className="flex-1"
        >
          🔍 I Found a Pet
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label htmlFor="lost-name">Pet Name *</Label>
          <Input
            id="lost-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={mode === "my_pet" ? "Your pet's name" : "Name (if known) or description"}
            required
          />
        </div>

        <div>
          <Label>Species</Label>
          <Select value={form.species} onValueChange={(v) => setForm({ ...form, species: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="dog">🐕 Dog</SelectItem>
              <SelectItem value="cat">🐈 Cat</SelectItem>
              <SelectItem value="bird">🐦 Bird</SelectItem>
              <SelectItem value="rabbit">🐇 Rabbit</SelectItem>
              <SelectItem value="other">🐾 Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="lost-breed">Breed</Label>
          <Input
            id="lost-breed"
            value={form.breed}
            onChange={(e) => setForm({ ...form, breed: e.target.value })}
            placeholder="e.g. Golden Retriever"
          />
        </div>

        <div>
          <Label>Gender</Label>
          <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">♂ Male</SelectItem>
              <SelectItem value="female">♀ Female</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Last Seen Location *</Label>
          <Select value={form.lost_location} onValueChange={(v) => setForm({ ...form, lost_location: v })}>
            <SelectTrigger><SelectValue placeholder="Select neighborhood..." /></SelectTrigger>
            <SelectContent>
              {neighborhoods.map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="lost-photo">Photo URL</Label>
        <Input
          id="lost-photo"
          value={form.photo_url}
          onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
          placeholder="Paste a photo URL of your pet"
        />
      </div>

      <div>
        <Label htmlFor="lost-details">
          {mode === "my_pet" ? "Details (what happened, when, any distinguishing marks)" : "Where did you find this pet? Any details?"}
        </Label>
        <Textarea
          id="lost-details"
          value={form.lost_details}
          onChange={(e) => setForm({ ...form, lost_details: e.target.value })}
          placeholder={mode === "my_pet"
            ? "e.g. Escaped from apartment around 3pm, wearing a red collar with name tag..."
            : "e.g. Found wandering near Galata Tower, no collar, seems friendly..."
          }
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="lost-contact">Contact Info</Label>
        <Input
          id="lost-contact"
          value={form.contact_info}
          onChange={(e) => setForm({ ...form, contact_info: e.target.value })}
          placeholder="Phone number or other contact method"
        />
      </div>

      <Button type="submit" disabled={loading} variant="destructive" className="w-full gap-2">
        <AlertTriangle className="w-4 h-4" />
        {loading ? "Posting Alert..." : mode === "my_pet" ? "🚨 Post Lost Pet Alert" : "📢 Post Found Pet Alert"}
      </Button>
    </form>
  );
};

function getNeighborhoodCoords(neighborhood: string): [number, number] {
  const coords: Record<string, [number, number]> = {
    "Cihangir": [41.0325, 28.9835],
    "Galata": [41.0256, 28.9742],
    "Tophane": [41.0270, 28.9810],
    "Çukurcuma": [41.0315, 28.9790],
    "Firuzağa": [41.0335, 28.9805],
    "Asmalımescit": [41.0305, 28.9760],
    "İstiklal": [41.0340, 28.9775],
    "Taksim": [41.0370, 28.9850],
    "Tepebaşı": [41.0295, 28.9755],
    "Nişantaşı": [41.0480, 28.9935],
    "Beyoğlu (other)": [41.0340, 28.9780],
  };
  // Add small random offset so pins don't stack
  const base = coords[neighborhood] || [41.0325, 28.9800];
  return [base[0] + (Math.random() - 0.5) * 0.002, base[1] + (Math.random() - 0.5) * 0.002];
}

export default ReportLostPetForm;
