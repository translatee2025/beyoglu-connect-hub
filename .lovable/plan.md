

## Plan — 10 fixes across DB, sidebar, groups, pets

### DB migrations (one batch, user-approved)
1. Add `name_tr` to `venue_types`, wipe + reseed 8 canonical types with TR labels.
2. Replace `app_options` rows for `rental_types` (apartment sizes), `parking_types`, `help_categories` (incl. babysitting/tutoring/pet care), `classified_categories`.
3. Wipe + reseed `classified_categories` table with 12 EN entries (slug-based).

Note: existing `wall_posts.category`, `classifieds.category`, `neighbor_help_posts.category` rows may reference old values — content stays but category filtering may not match. Acceptable since user requested replacement.

### Code edits

**`src/pages/Venues.tsx`**
- Update `venueTypes` query to select `name_tr`.
- Update `CATEGORY_EMOJI` map to new 8-type list.
- Render `language === "tr" ? (vt.name_tr || vt.name) : vt.name`.

**`src/pages/Rentals.tsx` & `src/pages/Parking.tsx`**
- Add empty-state fallback when `mapPins(...)` is empty (`t("common.no_map_data", ...)`).

**`src/pages/Classifieds.tsx`**
- Already uses `useAppOptions("classified_categories")`. Update so:
  - `categoryNames` derives from `classifiedCats` labels.
  - Filter pills render from `classifiedCats`.
  - `ClassifiedPostForm` receives `classifiedCats.map(c => c.label)`.

**`src/components/AppSidebar.tsx`**
- Remove Families + Lost & Found nav items.
- Replace top brand row with brand + inline TR/EN toggle (uses existing `language`/`setLanguage` from `useLanguage()`).
- Remove the old bottom-of-sidebar language toggle.

**`src/components/MobileDrawer.tsx`**
- Remove Families + Lost & Found nav items.

**`src/pages/GroupDetail.tsx`**
- Replace Dialog-wrapped post composer with inline composer (Textarea + PhotoUploader + Post button) above posts list, only when `user` truthy and on Feed tab.
- Drop the unused Dialog imports if no longer used.
- Update `activeMembers` filter to require `m.profile?.display_name` (removes orphan "Kullanıcı" rows).
- Add translation key `groups.whats_on_mind` and `groups.post_btn` via insert (also do via DB batch).

**`src/pages/Pets.tsx`**
- Add `staleTime: 1000 * 60 * 5` and `gcTime: 1000 * 60 * 10` to pet-profiles and pet-posts useQuery calls to prevent skeleton flash on remount.

### Translation key inserts
- `common.no_map_data` (en/tr)
- `groups.whats_on_mind` (en/tr)
- `groups.post_btn` (en/tr)

### Out of scope / preserved
- Routes for `/families` and `/lost-found` stay registered in App.tsx (just hidden from nav) — won't break deep links.
- Existing wall posts and classifieds with old category strings remain in DB; only filter labels change.
- No auth/schema resets, no edits to preconfigured Supabase files.

### Files touched
- `src/pages/Venues.tsx`
- `src/pages/Rentals.tsx`
- `src/pages/Parking.tsx`
- `src/pages/Classifieds.tsx`
- `src/components/AppSidebar.tsx`
- `src/components/MobileDrawer.tsx`
- `src/pages/GroupDetail.tsx`
- `src/pages/Pets.tsx`
- 1 DB migration batch

