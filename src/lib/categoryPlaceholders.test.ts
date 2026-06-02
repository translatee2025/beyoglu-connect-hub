import { describe, it, expect } from "vitest";
import { getEventPlaceholder, getVenuePlaceholder } from "./categoryPlaceholders";

describe("getEventPlaceholder", () => {
  it("maps known categories", () => {
    expect(getEventPlaceholder("music").emoji).toBe("🎵");
  });

  // Regression guard for the drift bug: EventDetail's copy was missing these.
  it("includes 'networking' and 'other'", () => {
    expect(getEventPlaceholder("networking").emoji).toBe("🤝");
    expect(getEventPlaceholder("other").emoji).toBe("📅");
  });

  it("is case-insensitive and falls back to the calendar default", () => {
    expect(getEventPlaceholder("MUSIC").emoji).toBe("🎵");
    expect(getEventPlaceholder("zzz").emoji).toBe("📅");
    expect(getEventPlaceholder(null).emoji).toBe("📅");
  });
});

describe("getVenuePlaceholder", () => {
  it("substring-matches venue type names", () => {
    // 'vet' was missing from VenueDetail's copy before the extraction.
    expect(getVenuePlaceholder("Vet Clinic").emoji).toBe("🐾");
    expect(getVenuePlaceholder("Italian Restaurant").emoji).toBe("🍽️");
  });

  it("falls back to the pin default", () => {
    expect(getVenuePlaceholder("spaceship").emoji).toBe("📍");
    expect(getVenuePlaceholder(null).emoji).toBe("📍");
  });
});
