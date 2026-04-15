import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useSpecies } from "@/hooks/useSpeciesBreeds";

export interface PetFilterState {
  species: string;
  size: string;
  ageRange: string;
  gender: string;
  personality: string;
  energyLevel: string;
}

const defaultFilters: PetFilterState = {
  species: "all",
  size: "all",
  ageRange: "all",
  gender: "all",
  personality: "all",
  energyLevel: "all",
};

interface PetFiltersProps {
  filters: PetFilterState;
  onChange: (filters: PetFilterState) => void;
}

const PetFilters = ({ filters, onChange }: PetFiltersProps) => {
  const { speciesOptions } = useSpecies();
  const update = (key: keyof PetFilterState, value: string) =>
    onChange({ ...filters, [key]: value });

  const activeCount = Object.values(filters).filter((v) => v !== "all").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Filters</p>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => onChange(defaultFilters)} className="text-xs gap-1 h-7">
            <X className="w-3 h-3" /> Clear ({activeCount})
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={filters.species} onValueChange={(v) => update("species", v)}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Species" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Species</SelectItem>
            {speciesOptions.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.size} onValueChange={(v) => update("size", v)}>
          <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Size" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sizes</SelectItem>
            <SelectItem value="small">Small</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="large">Large</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.ageRange} onValueChange={(v) => update("ageRange", v)}>
          <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Age" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ages</SelectItem>
            <SelectItem value="puppy">Puppy (0-1y)</SelectItem>
            <SelectItem value="young">Young (1-3y)</SelectItem>
            <SelectItem value="adult">Adult (3-8y)</SelectItem>
            <SelectItem value="senior">Senior (8+y)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.gender} onValueChange={(v) => update("gender", v)}>
          <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Gender" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            <SelectItem value="male">♂ Male</SelectItem>
            <SelectItem value="female">♀ Female</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.personality} onValueChange={(v) => update("personality", v)}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Character" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Characters</SelectItem>
            <SelectItem value="friendly">😊 Friendly</SelectItem>
            <SelectItem value="energetic">⚡ Energetic</SelectItem>
            <SelectItem value="calm">😌 Calm</SelectItem>
            <SelectItem value="shy">🙈 Shy</SelectItem>
            <SelectItem value="playful">🎾 Playful</SelectItem>
            <SelectItem value="protective">🛡️ Protective</SelectItem>
            <SelectItem value="curious">🔍 Curious</SelectItem>
            <SelectItem value="independent">🐺 Independent</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.energyLevel} onValueChange={(v) => update("energyLevel", v)}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Energy" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Energy</SelectItem>
            <SelectItem value="low">🐢 Low</SelectItem>
            <SelectItem value="medium">🐕 Medium</SelectItem>
            <SelectItem value="high">🐆 High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(filters)
            .filter(([, v]) => v !== "all")
            .map(([k, v]) => (
              <Badge key={k} variant="secondary" className="text-xs gap-1">
                {v}
                <X className="w-3 h-3 cursor-pointer" onClick={() => update(k as keyof PetFilterState, "all")} />
              </Badge>
            ))}
        </div>
      )}
    </div>
  );
};

export { defaultFilters };
export default PetFilters;
