

# Plan: Restructure Rentals/Parking Views, Add Wall Feed, Venues Module, Neighbor Help Module

## Summary

Five changes: (1) Restructure Rentals with separate "Looking" list view and "Offering" list+map view with rent/sell toggle, (2) same pattern for Parking, (3) Wall becomes a real-time aggregated feed from all modules, (4) new Venues page for restaurants/pharmacies/bars/hospitals/tekkels/etc, (5) new Neighbor Help page — a single wall of offer/want posts with category filters.

---

## 1. Rentals Page Restructure

**Two top-level tabs:** "I Need a Place" and "Apartments for Rent/Sale"

- **"I Need a Place" tab:** Simple Craigslist-style list of posts. Filters: category (Studio, 1+1, 2+1, etc.), neighborhood. No map. Each post shows title, description, budget, contact.
- **"Apartments for Rent/Sale" tab:** Two sub-views — List and Map (toggle). Filter chips include a **Rent / Sale** toggle button. Posts that have lat/lng show as pins on the map. Post form includes a rent/sell selector.

**DB change:** Add a `listing_mode` column (text, nullable) to `classifieds` table — values: `rent`, `sell`, `looking`. This distinguishes seekers from offerers and rent from sale.

**Files:** Rewrite `src/pages/Rentals.tsx`.

## 2. Parking Page Restructure

**Two top-level tabs:** "I Need Parking" and "Parking for Rent"

- **"I Need Parking" tab:** Simple list view with filters (type, neighborhood).
- **"Parking for Rent" tab:** List + Map toggle. Posts with lat/lng appear as map pins.

**DB change:** Uses same `listing_mode` column on `classifieds` (`rent` vs `looking`).

**Files:** Rewrite `src/pages/Parking.tsx`.

## 3. Wall — Aggregated Activity Feed

Wall pulls the latest posts from all tables (`classifieds`, `pet_posts`, plus new `venues`, `neighbor_help_posts`) ordered by `created_at`, and also allows direct status posts.

**New DB table: `wall_posts`** — for direct status posts on the wall.
- id, user_id, content (text), created_at

The Wall page queries all sources in parallel, merges by date, and shows a unified feed. Each card shows source badge (Rental, Pet, Venue, Help, etc.) and links to the original.

**Files:** Rewrite `src/pages/Wall.tsx`.

## 4. Venues Page (New)

Similar structure to Pets. Categories as tabs or filter chips:
- Restaurants, Pharmacies, Bars, Hospitals, Tekkels, Other

Each venue is a user post with: name/headline (free text — user can write "Shoe Repair" etc.), address, phone, WhatsApp, opening hours, description, photos, map pin.

**Two views:** List + Map toggle.

**New DB table: `venues`**
- id, user_id, category (text), name, description, address, phone, whatsapp, opening_hours (jsonb), photos (text[]), lat, lng, neighborhood, status, created_at, updated_at

**New files:** `src/pages/Venues.tsx`, `src/components/venues/VenuePostForm.tsx`

**Navigation:** Add "Venues" to nav with `Store` icon.

## 5. Neighbor Help Page (New)

Single wall view (no map). Top filter chips for categories:
- Plumbing & Bathroom, Painting, Furniture Repair, Electrical, Assembly & Hanging, Mixed/Other

Each post: Offer or Want toggle, category, title, description, neighborhood, contact info.

**New DB table: `neighbor_help_posts`**
- id, user_id, help_type (text: offer/want), category (text), title, description, neighborhood, phone, whatsapp, status (text: active/closed), created_at, updated_at

**New files:** `src/pages/NeighborHelp.tsx`

**Navigation:** Add "Help" to nav with `Handshake` icon.

## 6. Routes & Navigation

Add to `App.tsx`:
- `/venues` → Venues
- `/help` → NeighborHelp

Update `Navigation.tsx` with two new nav items.

## 7. Database Migration

Single migration:
1. `ALTER TABLE classifieds ADD COLUMN listing_mode text;` — values: rent/sell/looking
2. Create `wall_posts` table with RLS
3. Create `venues` table with RLS
4. Create `neighbor_help_posts` table with RLS

All tables: authenticated users can insert own rows, anyone can read active posts, only author can update/delete.

## Files Summary

| Action | File |
|--------|------|
| Rewrite | `src/pages/Rentals.tsx` |
| Rewrite | `src/pages/Parking.tsx` |
| Rewrite | `src/pages/Wall.tsx` |
| Create | `src/pages/Venues.tsx` |
| Create | `src/components/venues/VenuePostForm.tsx` |
| Create | `src/pages/NeighborHelp.tsx` |
| Modify | `src/App.tsx` — add 2 routes |
| Modify | `src/components/Navigation.tsx` — add 2 nav items |
| Create | DB migration — 1 alter + 3 new tables |

