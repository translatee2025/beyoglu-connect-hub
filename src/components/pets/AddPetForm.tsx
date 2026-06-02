import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PetPhotoUpload from "./PetPhotoUpload";
import { useSpecies, useBreeds } from "@/hooks/useSpeciesBreeds";

const sizeOptions = [
  { value: "tiny", label: "Tiny (< 5kg)" },
  { value: "small", label: "Small (5-10kg)" },
  { value: "medium", label: "Medium (10-25kg)" },
  { value: "large", label: "Large (25-45kg)" },
  { value: "giant", label: "Giant (45kg+)" },
];

const energyOptions = [
  { value: "low", label: "🧘 Low" },
  { value: "moderate", label: "🚶 Moderate" },
  { value: "high", label: "🏃 High" },
  { value: "very_high", label: "⚡ Very High" },
];

const personalityOptions = [
  "friendly", "energetic", "calm", "shy", "playful", "protective", "curious", "independent",
];

const lookingForOptions = [
  "Walking Buddy", "Playdate", "Social Group", "Calm Companion",
];

const lifestyleOptions = [
  "Morning Walker", "Evening Walker", "Weekend Only", "Daily Runner",
  "Park Regular", "Beach Lover", "City Stroller", "Hiking Buddy",
  "Home Body", "Social Butterfly", "Training Enthusiast",
];

interface AddPetFormProps {
  onSuccess: () => void;
}

const AddPetForm = ({ onSuccess }: AddPetFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    species: "",
    breed: "",
    age_years: "",
    age_months: "",
    gender: "",
    is_neutered: false,
    weight_kg: "",
    bio: "",
    neighborhood: "",
    personality_tags: [] as string[],
    looking_for: [] as string[],
    size: "",
    energy_level: "",
    gender_preference: "any",
    size_preference: [] as string[],
    lifestyle_tags: [] as string[],
  });

  const { species, speciesOptions } = useSpecies();
  const { breedOptions, breeds } = useBreeds(form.species);

  const toggleArray = (field: "personality_tags" | "looking_for" | "size_preference" | "lifestyle_tags", value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
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
      // Normalize species: form.species is a UUID from speciesOptions.
      const selectedSpecies = species.find((s) => s.id === form.species);
      const speciesEnumText = selectedSpecies
        ? (selectedSpecies.name_en.toLowerCase() as any)
        : (form.species as any);
      const selectedBreed = breeds.find((b) => b.name_en === form.breed || b.name_tr === form.breed);
      const { error } = await supabase.from("pet_profiles").insert({
        owner_id: user.id,
        name: form.name.trim(),
        species: speciesEnumText,
        species_id: selectedSpecies?.id || null,
        breed: form.breed || null,
        breed_id: selectedBreed?.id || null,
        age_years: form.age_years ? parseInt(form.age_years) : null,
        age_months: form.age_months ? parseInt(form.age_months) : null,
        gender: form.gender || null,
        is_neutered: form.is_neutered,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        bio: form.bio || null,
        neighborhood: form.neighborhood || null,
        personality_tags: form.personality_tags as any,
        looking_for: form.looking_for,
        photo_url: photos.length > 0 ? photos[0] : null,
        photos: photos,
        size: form.size || null,
        energy_level: form.energy_level || null,
        gender_preference: form.gender_preference,
        size_preference: form.size_preference,
        lifestyle_tags: form.lifestyle_tags,
      } as any);

      if (error) throw error;
      toast({ title: "Pet added successfully! 🐾" });
      onSuccess();
    } catch (err: any) {
      toast({ title: "Error adding pet", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const TagSelector = ({ label, field, options }: { label: string; field: "personality_tags" | "looking_for" | "size_preference" | "lifestyle_tags"; options: string[] }) => (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map(tag => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleArray(field, tag)}
            className={`text-sm px-3 py-1 rounded-full border transition-colors ${
              form[field].includes(tag)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-border hover:border-primary"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Add Your Pet</h2>

      <div>
        <Label className="mb-2 block">Photos</Label>
        <PetPhotoUpload photos={photos} onPhotosChange={setPhotos} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Pet Name *</Label>
          <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Boncuk" required />
        </div>

        <div>
          <Label>Species</Label>
          <Select value={form.species} onValueChange={v => setForm({ ...form, species: v, breed: "" })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {speciesOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Breed</Label>
          <Select value={form.breed} onValueChange={v => setForm({ ...form, breed: v })}>
            <SelectTrigger><SelectValue placeholder="Select breed..." /></SelectTrigger>
            <SelectContent>
              {breedOptions.filter(b => b.value && String(b.value).trim()).map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="age_years">Age (years)</Label>
          <Input id="age_years" type="number" min="0" max="30" value={form.age_years} onChange={e => setForm({ ...form, age_years: e.target.value })} />
        </div>

        <div>
          <Label htmlFor="age_months">Age (months)</Label>
          <Input id="age_months" type="number" min="0" max="11" value={form.age_months} onChange={e => setForm({ ...form, age_months: e.target.value })} />
        </div>

        <div>
          <Label>Gender</Label>
          <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Size</Label>
          <Select value={form.size} onValueChange={v => setForm({ ...form, size: v })}>
            <SelectTrigger><SelectValue placeholder="Select size..." /></SelectTrigger>
            <SelectContent>
              {sizeOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Energy Level</Label>
          <Select value={form.energy_level} onValueChange={v => setForm({ ...form, energy_level: v })}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              {energyOptions.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input id="weight" type="number" step="0.1" min="0" value={form.weight_kg} onChange={e => setForm({ ...form, weight_kg: e.target.value })} />
        </div>

        <div className="col-span-2">
          <Label htmlFor="neighborhood">Neighborhood</Label>
          <Input id="neighborhood" value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} placeholder="e.g. Cihangir, Beyoğlu" />
        </div>
      </div>

      <div>
        <Label htmlFor="bio">About your pet</Label>
        <Textarea id="bio" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about your pet's personality..." rows={3} />
      </div>

      <TagSelector label="Personality Tags" field="personality_tags" options={personalityOptions} />
      <TagSelector label="Looking For" field="looking_for" options={lookingForOptions} />
      <TagSelector label="Lifestyle" field="lifestyle_tags" options={lifestyleOptions} />

      <div className="border-t border-border pt-4">
        <h3 className="font-semibold text-foreground mb-3">Friend Preferences</h3>
        <div className="space-y-4">
          <div>
            <Label>Gender Preference</Label>
            <Select value={form.gender_preference} onValueChange={v => setForm({ ...form, gender_preference: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Gender</SelectItem>
                <SelectItem value="male_only">♂ Males Only</SelectItem>
                <SelectItem value="female_only">♀ Females Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <TagSelector label="Preferred Friend Size" field="size_preference" options={sizeOptions.map(s => s.value)} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="neutered" checked={form.is_neutered} onCheckedChange={v => setForm({ ...form, is_neutered: v === true })} />
        <Label htmlFor="neutered" className="cursor-pointer">Neutered / Spayed</Label>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Adding..." : "Add Pet 🐾"}
      </Button>
    </form>
  );
};

export default AddPetForm;
