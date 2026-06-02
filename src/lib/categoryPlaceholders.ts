/**
 * Single source of truth for category placeholder colors/emojis.
 *
 * These maps were previously copy-pasted into Events/EventDetail and
 * Venues/VenueDetail and had already drifted (EventDetail was missing
 * `networking`/`other`; VenueDetail was missing `vet`), so the same item
 * rendered a different emoji on the list vs. the detail page.
 */

export interface Placeholder {
  bg: string;
  emoji: string;
}

const EVENT_DEFAULT: Placeholder = { bg: "#EFF4FF", emoji: "📅" };

export const EVENT_PLACEHOLDERS: Record<string, Placeholder> = {
  sports: { bg: "#DCFCE7", emoji: "⚽" },
  culture: { bg: "#EDE9FE", emoji: "🎨" },
  art: { bg: "#EDE9FE", emoji: "🎨" },
  music: { bg: "#FEF3C7", emoji: "🎵" },
  community: { bg: "#E0F2FE", emoji: "👥" },
  networking: { bg: "#E0F2FE", emoji: "🤝" },
  food: { bg: "#FEF3C7", emoji: "🍽️" },
  other: { bg: "#EFF4FF", emoji: "📅" },
};

/** Exact-key lookup for an event category. */
export const getEventPlaceholder = (category?: string | null): Placeholder => {
  if (!category) return EVENT_DEFAULT;
  return EVENT_PLACEHOLDERS[category.toLowerCase()] || EVENT_DEFAULT;
};

const VENUE_DEFAULT: Placeholder = { bg: "#EFF4FF", emoji: "📍" };

export const VENUE_PLACEHOLDERS: Record<string, Placeholder> = {
  restaurant: { bg: "#FEF3C7", emoji: "🍽️" },
  cafe: { bg: "#FEF3C7", emoji: "☕" },
  bar: { bg: "#F5C4B3", emoji: "🍸" },
  nightlife: { bg: "#F5C4B3", emoji: "🍸" },
  health: { bg: "#E0F2FE", emoji: "🏥" },
  pharmacy: { bg: "#E0F2FE", emoji: "🏥" },
  culture: { bg: "#EDE9FE", emoji: "🎨" },
  sports: { bg: "#DCFCE7", emoji: "💪" },
  gym: { bg: "#DCFCE7", emoji: "💪" },
  pets: { bg: "#DCFCE7", emoji: "🐾" },
  vet: { bg: "#DCFCE7", emoji: "🐾" },
};

/** Substring lookup for a venue type name (e.g. "Vet Clinic" → vet). */
export const getVenuePlaceholder = (typeName?: string | null): Placeholder => {
  if (!typeName) return VENUE_DEFAULT;
  const key = typeName.toLowerCase();
  for (const [k, v] of Object.entries(VENUE_PLACEHOLDERS)) {
    if (key.includes(k)) return v;
  }
  return VENUE_DEFAULT;
};
