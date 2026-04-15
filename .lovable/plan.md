

# Plan: Map Views, Venue Enhancements, Wall Posts, Helper Pricing, and Turkish Translations

## What we're building

1. **Map views for Rentals, Parking, and Venues** using Leaflet (already in the project via EventsMap). Replace "coming soon" placeholders with actual interactive maps showing pins for items that have lat/lng or address data.

2. **Venues page overhaul**:
   - Fetch `venue_types` from DB and show as filter buttons at the top (with "All" button)
   - Join venues with venue_types to enable filtering
   - Venue creation form gets: venue type dropdown, image upload, opening times (weekday buttons as multi-select + from/to time inputs per selected day)
   - 2-step wizard for venue creation

3. **Wall "Add Post" button** — the Wall already has a post composer (line 139-158 in Wall.tsx). It's there but could be more prominent. Add a visible "Add Post" button that scrolls to / focuses the composer, or opens it in a dialog on mobile.

4. **Neighbor Help: price + pricing model** — Add `price` and `price_type` fields (fixed / per hour) to the helper offering form. Requires a DB migration to add these columns to `neighbor_help_posts`.

5. **Turkish translations** — Seed missing translations for all pages (Rentals, Parking, Venues, NeighborHelp, Wall, Pets, Groups) into the `translations` table.

6. **Cross-project features** — To copy features from another project, you can use the `@` mention in chat to reference another project, and I can read its code and replicate components here. Alternatively, you can remix a project to fork it entirely.

## Technical details

### Files to create/modify

**New component**: `src/components/shared/ListingMap.tsx`
- Reusable Leaflet map component accepting array of `{lat, lng, title, badge}` items
- Based on existing `EventsMap.tsx` pattern

**Modified files**:
- `src/pages/Rentals.tsx` — Replace map placeholder with `<ListingMap>`, replace emojis with Lucide icons, convert form to 2-step wizard
- `src/pages/Parking.tsx` — Same map + icon + wizard treatment
- `src/pages/Venues.tsx` — Fetch venue_types for filter bar, join on query, venue form with opening times UI (day checkboxes + time range), 2-step wizard, replace emoji
- `src/pages/NeighborHelp.tsx` — Add price input + price_type dropdown ("Fixed" / "Per Hour") to step 1 of the wizard form
- `src/pages/Wall.tsx` — Add prominent "Add Post" floating button on mobile

**Database migration**:
- Add `price TEXT` and `price_type TEXT DEFAULT 'fixed'` columns to `neighbor_help_posts`
- Add RLS policy for venues INSERT (currently missing — users can't insert venues)

**Data seeding** (via insert tool):
- Seed ~100+ Turkish translation entries for Rentals, Parking, Venues, NeighborHelp, Wall labels
- Seed venue_types if not already populated (Restaurant, Pharmacy, Bar, Cafe, Hospital, etc.)

### Venue opening times UI
- Multi-select day buttons: Mon-Sun
- For each selected day: two time inputs (open, close)
- Stored as JSON in the existing `hours` column on the `venues` table

### Map implementation
- Uses Leaflet (already a dependency)
- Centered on Beyoglu (41.0370, 28.9850)
- Items without lat/lng simply won't show pins
- Popup on click shows title + badge

