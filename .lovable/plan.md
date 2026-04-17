
# Plan — 3-part refactor: bug fixes, options table, admin content manager

## Part 1 — Bug fixes (verification needed)

**FIX 1 — PetSittingWalkingSection** ⚠️ DO NOT APPLY. Verified earlier in this conversation: the actual DB rows use `offering`/`looking`. Reversing this would break the page. Skipping per prior decision unless you confirm DB has changed.

**FIX 2 — Jobs route** in `AppSidebar.tsx` + `MobileDrawer.tsx`: change `to: "#"` → `to: "/jobs"`.

**FIX 3 — VenueDetail "Mesaj Gönder" button**: locate the button without onClick, wire it to `navigate(\`/messages?to=${venue.created_by_user_id}\`)`, swap label to `t("common.send_message", "Send Message")`.

**FIX 4 — Turkish fallbacks → English** in:
- `NeighborHelp.tsx` (3 strings)
- `Families.tsx` (2 strings)
- `EditProfile.tsx` (15 strings)
- `Pets.tsx` sort pills (2 strings)
- `LostFoundSection.tsx` (1 string)
- `ShopsVetsSection.tsx` (1 string)

Rule: only the fallback (2nd arg of `t()`) changes. Translation keys preserved. Real Turkish UI continues to come from the `translations` table.

## Part 2 — `app_options` table + `useAppOptions` hook

**DB migration** (schema only):
- Create `public.app_options` table with columns per spec.
- Enable RLS, add public-read + admin-manage policies.

**Data seed** (via insert tool, not migration):
- ~85 rows across groups: `rental_types`, `parking_types`, `help_categories`, `event_categories`, `group_categories`, `neighborhoods`, and 6 `classified_sub_*` groups.

**New hook**: `src/hooks/useAppOptions.ts` — fetches by `group_key`, returns localized `{ value, label, emoji, metadata }[]`, 10-min staleTime.

**Refactor consumers** to use the hook:
| File | Group key |
|---|---|
| `Rentals.tsx` | `rental_types` |
| `Parking.tsx` | `parking_types` |
| `NeighborHelp.tsx` | `help_categories` |
| `components/events/CreateEventForm.tsx` | `event_categories` |
| `Groups.tsx` | `group_categories` |
| `components/pets/ReportLostPetForm.tsx` | `neighborhoods` (use `metadata.lat/lng`) |
| `Classifieds.tsx` | `classified_sub_<cat>` per parent category |

Keep "All" pseudo-option hardcoded where filter UIs need it. Preserve existing query/filter logic — only the source of the option list changes.

## Part 3 — Admin Content Manager

**New page** `src/pages/admin/AdminContent.tsx` with two tabs:

**Tab 1 — Options Manager**
- Left: scrollable list of distinct `group_key` pills (queried from `app_options`).
- Right: table for selected group — columns: Sort | Emoji | EN Label | TR Label | Value Key | Active | Delete.
- Inline edit on cell click (debounced save to `app_options`).
- "Add Option" opens inline form (value_key, label_en, label_tr, emoji, sort_order).
- All mutations via supabase client; React Query invalidation on success.

**Tab 2 — Translations Manager**
- Filters: language pills (TR/EN/All) + search box on `translation_key`.
- Table: Key | TR Value | EN Value | Edit action.
- Edit opens Drawer with both TR and EN value fields → upserts both rows.
- "Add Translation" form: key + en_value + tr_value → inserts 2 rows.

**Routing & nav**:
- Register `/admin/content` route (find the admin route block; based on `AdminLayout.tsx` it lives in `App.tsx` under `<Route path="/admin" element={<AdminLayout />}>`).
- Add nav entry to `AdminLayout.tsx` `adminNav` array: `{ to: '/admin/content', label: 'Content', icon: FileText }`.

## What I am NOT doing
- Not touching `PetSittingWalkingSection.tsx` (would break page — confirmed earlier).
- Not modifying any existing admin page.
- Not touching `translations` rows beyond what the new admin UI does at runtime.
- Not changing translation keys — only English fallback strings.

## Order of execution
1. DB migration (create `app_options` + RLS).
2. Seed data via insert tool.
3. Create `useAppOptions` hook.
4. Apply Part 1 bug fixes (parallel file edits).
5. Refactor consumer pages to use the hook.
6. Build `AdminContent.tsx` + register route + nav link.
