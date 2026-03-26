import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const species = [
  { value: "dog", label: "🐕 Dog" },
  { value: "cat", label: "🐈 Cat" },
  { value: "bird", label: "🐦 Bird" },
  { value: "rabbit", label: "🐇 Rabbit" },
  { value: "fish", label: "🐟 Fish" },
  { value: "other", label: "🐾 Other" },
];

const personalityOptions = [
  "friendly", "energetic", "calm", "shy", "playful", "protective", "curious", "independent",
];

const lookingForOptions = [
  "Walking Buddy", "Playdate", "Social Group", "Calm Companion",
];

interface AddPetFormProps {
  onSuccess: () => void;
}

const AddPetForm = ({ onSuccess }: AddPetFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    species: "dog" as string,
    breed: "",
    age_years: "",
    age_months: "",
    gender: "" as string,
    is_neutered: false,
    weight_kg: "",
    bio: "",
    neighborhood: "",
    personality_tags: [] as string[],
    looking_for: [] as string[],
  });

  const toggleTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      personality_tags: prev.personality_tags.includes(tag)
        ? prev.personality_tags.filter((t) => t !== tag)
        : [...prev.personality_tags, tag],
    }));
  };

  const toggleLookingFor = (item: string) => {
    setForm((prev) => ({
      ...prev,
      looking_for: prev.looking_for.includes(item)
        ? prev.looking_for.filter((i) => i !== item)
        : [...prev.looking_for, item],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please log in to add a pet", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("pet_profiles").insert({
        owner_id: user.id,
        name: form.name.trim(),
        species: form.species as any,
        breed: form.breed || null,
        age_years: form.age_years ? parseInt(form.age_years) : null,
        age_months: form.age_months ? parseInt(form.age_months) : null,
        gender: form.gender || null,
        is_neutered: form.is_neutered,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        bio: form.bio || null,
        neighborhood: form.neighborhood || null,
        personality_tags: form.personality_tags as any,
        looking_for: form.looking_for,
      });

      if (error) throw error;

      toast({ title: "Pet added successfully! 🐾" });
      onSuccess();
    } catch (err: any) {
      toast({ title: "Error adding pet", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Add Your Pet</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Pet Name *</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Boncuk"
            required
          />
        </div>

        <div>
          <Label>Species</Label>
          <Select value={form.species} onValueChange={(v) => setForm({ ...form, species: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {species.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="breed">Breed</Label>
          <Input
            id="breed"
            value={form.breed}
            onChange={(e) => setForm({ ...form, breed: e.target.value })}
            placeholder="e.g. Golden Retriever"
          />
        </div>

        <div>
          <Label htmlFor="age_years">Age (years)</Label>
          <Input
            id="age_years"
            type="number"
            min="0"
            max="30"
            value={form.age_years}
            onChange={(e) => setForm({ ...form, age_years: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="age_months">Age (months)</Label>
          <Input
            id="age_months"
            type="number"
            min="0"
            max="11"
            value={form.age_months}
            onChange={(e) => setForm({ ...form, age_months: e.target.value })}
          />
        </div>

        <div>
          <Label>Gender</Label>
          <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            min="0"
            value={form.weight_kg}
            onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="neighborhood">Neighborhood</Label>
          <Input
            id="neighborhood"
            value={form.neighborhood}
            onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
            placeholder="e.g. Cihangir, Beyoğlu"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="bio">About your pet</Label>
        <Textarea
          id="bio"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          placeholder="Tell us about your pet's personality..."
          rows={3}
        />
      </div>

      <div>
        <Label className="mb-2 block">Personality Tags</Label>
        <div className="flex flex-wrap gap-2">
          {personalityOptions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                form.personality_tags.includes(tag)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-border hover:border-primary"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Looking For</Label>
        <div className="flex flex-wrap gap-2">
          {lookingForOptions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleLookingFor(item)}
              className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                form.looking_for.includes(item)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-border hover:border-primary"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="neutered"
          checked={form.is_neutered}
          onCheckedChange={(v) => setForm({ ...form, is_neutered: v === true })}
        />
        <Label htmlFor="neutered" className="cursor-pointer">Neutered / Spayed</Label>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Adding..." : "Add Pet 🐾"}
      </Button>
    </form>
  );
};

export default AddPetForm;
