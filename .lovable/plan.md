

# Database Migrations Plan

## 7 Migrations (schema only, no frontend except Families stub)

### Migration 1 — `profiles.language_preference`
Add `language_preference text DEFAULT 'tr'` to profiles.

### Migration 2 — `pet_profiles` species/breed FKs + photos array
Add `species_id uuid REFERENCES species(id)`, `breed_id uuid REFERENCES breeds(id)`, `photos text[] DEFAULT '{}'`. Then backfill `species_id` from existing enum via `UPDATE ... SET species_id = (SELECT id FROM species WHERE LOWER(name_en) = LOWER(species::text))`.

### Migration 3 — Create `pet_sitting_posts`
New table with service_type, listing_type, species_id FK, price, price_type, available_days, neighborhood, district_id FK, lat/lng, photos, is_active. RLS: public read, owner insert/update/delete.

### Migration 4 — Create `families`
New table with post_type, title, description, category, neighborhood, district_id FK, photos, price, is_active. RLS: public read, owner insert/update/delete.

Frontend: Update nav links from `#` to `/families` in AppSidebar and MobileDrawer. Create `/families` page with "coming soon" message.

### Migration 5 — Create `user_privacy_settings`
New table with show_photo, allow_messages, show_age, show_gender, show_neighborhood. RLS: owner-only for all operations.

### Migration 6 — Classifieds rental columns
Add: room_type, size_m2, is_furnished, pets_allowed, floor_number, total_floors, available_from, latitude, longitude, listing_type.

### Migration 7 — Classifieds parking column
Add: parking_type with check constraint (kapali/acik/otomatik).

### Verification
After migrations, query `information_schema.columns` for all affected tables and output results.

### Technical Notes
- All CHECK constraints use simple value lists (no time-based checks), so they're safe
- Migrations use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` for idempotency
- Existing columns (species enum, breed text) kept for backward compatibility
- The families page is a minimal stub — no data fetching yet

