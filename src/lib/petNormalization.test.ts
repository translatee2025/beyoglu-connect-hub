import { describe, it, expect } from "vitest";
import { resolveSpecies, matchesSpeciesFilter, pickPetPhoto } from "./petNormalization";

const species = [
  { id: "uuid-dog", name_en: "Dog", name_tr: "Köpek", emoji: "🐕", display_order: 1 },
  { id: "uuid-cat", name_en: "Cat", name_tr: "Kedi", emoji: "🐈", display_order: 2 },
] as any;

describe("resolveSpecies", () => {
  it("resolves by species_id (canonical)", () => {
    expect(resolveSpecies({ species_id: "uuid-cat" }, species)?.name_en).toBe("Cat");
  });

  it("resolves by legacy enum text", () => {
    expect(resolveSpecies({ species: "dog" }, species)?.id).toBe("uuid-dog");
  });

  it("resolves a UUID accidentally stored in the text column", () => {
    expect(resolveSpecies({ species: "uuid-cat" }, species)?.name_en).toBe("Cat");
  });

  it("returns undefined when unmatched", () => {
    expect(resolveSpecies({ species: "fish" }, species)).toBeUndefined();
  });
});

describe("matchesSpeciesFilter", () => {
  // The FriendFinder bug: filter holds a UUID, pet rows hold legacy text.
  it("matches a UUID filter against a legacy-text pet", () => {
    expect(matchesSpeciesFilter({ species: "dog" }, "uuid-dog", species)).toBe(true);
  });

  it("excludes non-matching species", () => {
    expect(matchesSpeciesFilter({ species: "cat" }, "uuid-dog", species)).toBe(false);
  });

  it("treats 'all' as match-everything", () => {
    expect(matchesSpeciesFilter({ species: "anything" }, "all", species)).toBe(true);
  });
});

describe("pickPetPhoto", () => {
  it("prefers photos[0]", () => {
    expect(pickPetPhoto({ photos: ["a.jpg"], photo_url: "b.jpg" })).toBe("a.jpg");
  });

  it("falls back to photo_url", () => {
    expect(pickPetPhoto({ photos: [], photo_url: "b.jpg" })).toBe("b.jpg");
    expect(pickPetPhoto({ photo_url: "b.jpg" })).toBe("b.jpg");
  });

  it("returns null when there is no photo", () => {
    expect(pickPetPhoto({})).toBeNull();
  });
});
