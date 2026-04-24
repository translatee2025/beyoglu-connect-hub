/**
 * Pet species normalization helpers.
 *
 * The DB has two coexisting representations:
 * - `pet_profiles.species_id` (uuid → species table)  ← canonical when present
 * - `pet_profiles.species`     (enum text: dog/cat/...) ← legacy fallback
 *
 * Forms can submit either. These helpers let UI compare consistently and render
 * a stable label/emoji regardless of which shape a row uses.
 */

import type { Species } from "@/hooks/useSpeciesBreeds";

/** Resolve a pet row's species to a Species record, trying id first, then text. */
export function resolveSpecies(
  pet: { species?: string | null; species_id?: string | null },
  species: Species[]
): Species | undefined {
  if (!species.length) return undefined;
  if (pet.species_id) {
    const byId = species.find((s) => s.id === pet.species_id);
    if (byId) return byId;
  }
  if (pet.species) {
    const text = pet.species.toLowerCase();
    // Match against id (in case forms wrote a UUID into the enum slot)
    const byUuid = species.find((s) => s.id === pet.species);
    if (byUuid) return byUuid;
    // Match against english name
    return species.find((s) => s.name_en.toLowerCase() === text);
  }
  return undefined;
}

/** True if a pet matches the given filter value (which can be a species id or legacy text). */
export function matchesSpeciesFilter(
  pet: { species?: string | null; species_id?: string | null },
  filterValue: string,
  species: Species[]
): boolean {
  if (!filterValue || filterValue === "all") return true;
  const resolved = resolveSpecies(pet, species);
  const filterSpecies = species.find(
    (s) => s.id === filterValue || s.name_en.toLowerCase() === filterValue.toLowerCase()
  );
  if (!resolved || !filterSpecies) {
    // Fallback raw compare
    return pet.species === filterValue || pet.species_id === filterValue;
  }
  return resolved.id === filterSpecies.id;
}

/** Pick a display photo from a pet row that may use `photos[]` or `photo_url`. */
export function pickPetPhoto(pet: {
  photos?: string[] | null;
  photo_url?: string | null;
}): string | null {
  if (Array.isArray(pet.photos) && pet.photos.length > 0 && pet.photos[0]) {
    return pet.photos[0];
  }
  return pet.photo_url ?? null;
}
