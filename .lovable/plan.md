

## Plan — Final i18n cleanup pass

Most translation keys already exist in DB. Code mostly uses `t()` correctly. The remaining hardcoded strings live in a handful of components, plus a few DB inserts to add missing keys and the classifieds category lookup.

### Code edits

**1. `src/components/shared/PhotoUploader.tsx`** (lines 226-227)
- Replace fallback `"+ Fotoğraf Ekle"` → use `t("common.add_photo", "Add Photo")` (key already in DB).
- Same for "max photos reached" — change Turkish fallback to English.

**2. `src/components/pets/ShopsVetsSection.tsx`** (lines 262, 290)
- Map popup: replace hardcoded `typeLabel = "Pet Shop"/"Veteriner"` with localized strings via `t("pets.shop", ...)` / `t("pets.vet", ...)`.
- Map popup "Detay" button → `t("common.details", ...)`.

**3. `src/components/GlobalSearch.tsx`**
- Add `t()` from `useLanguage` in both `GlobalSearchDesktop` and `GlobalSearchMobile`.
- Replace placeholder `"Ara..."` → `t("common.search", "Search...")`.
- Replace `"Aranıyor..."` → `t("common.searching", "Searching...")`.
- Replace `"Sonuç bulunamadı..."` → `t("common.no_results", "No results found.")`.
- Mobile: placeholder `"Mekan, etkinlik, kişi ara..."` → `t("search.placeholder_mobile", ...)`, "İptal" → `t("common.cancel", "Cancel")`.

**4. `src/pages/Classifieds.tsx`**
- Add `useAppOptions("classified_categories")` hook.
- Update `getCatLabel` to first look up from app_options (localized), then fall back to DB category name.

**5. `src/pages/Groups.tsx`** — verify CreateGroupForm submit button at the bottom of the form uses `t("common.creating",...)` / `t("groups.create",...)`. Will need to view lines 373-453 to confirm and patch if needed.

**6. `src/pages/LostFound.tsx`** — already correctly uses `t()` for all top-level strings. No changes needed.

**7. `src/pages/Parking.tsx`** — already fully wrapped in `t()`. Existing keys (`parking.listings`, `common.looking_for`) work; no code change.

**8. `src/pages/Venues.tsx`** — already wrapped. No code change. The empty-state message at line 166 still has Turkish fallback — wrap with proper key fallback.

### Database inserts (one batch)

Insert / update missing keys:
- `common.searching` (en/tr) — already exists? Will upsert.
- `common.no_results`, `common.cancel`, `search.placeholder_mobile`
- `pets.shop` already exists ("Pet Shop"/"Pet Mağazası"?) — verify; insert if missing.
- All 16 `classified_categories` rows into `app_options` table.
- Update Parking page TR title from "Otopark Bul" → keep as is (already reasonable).

### Out of scope
- Sidebar/MobileDrawer "Help" link already uses `t("nav.help", "Help")` — DB has the key (verified).
- Profile date formatting already language-aware ✓.
- PetSittingWalkingSection already uses `t("pets.pet_walking", ...)` ✓.
- EventsMap "Detay →" — already fixed in previous pass.

### Files to edit
- `src/components/shared/PhotoUploader.tsx`
- `src/components/pets/ShopsVetsSection.tsx`
- `src/components/GlobalSearch.tsx`
- `src/pages/Classifieds.tsx`
- `src/pages/Venues.tsx` (empty-state fallback only)
- `src/pages/Groups.tsx` (only if submit button hardcoded — verify first)
- DB: 1 INSERT for missing translation keys, 1 INSERT for classified_categories app_options

