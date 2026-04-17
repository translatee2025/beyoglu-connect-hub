

# i18n Audit Report

## TL;DR
The user asked to extend a `scripts/i18n-audit.mjs` to compare en/tr/de — but **none of those exist**. There's no scripts folder, no JSON locale files, and no German locale. Translations live in the Supabase `translations` table and only **en + tr** are configured. Per the user's request, this is a report only, no code changes.

## DB-side translations (Supabase `translations` table)

| Locale | Keys | Status |
|---|---|---|
| `en` | 831 | active, default |
| `tr` | 833 | active |
| `de` | — | **does not exist** |

**Diff between en and tr:**
- `en` missing 0 keys present in `tr`... but 2 orphan keys exist only in `tr` and are NEVER used in code: `whats_on_your_mind`, `whatsapp` (legacy keys, safe to drop)
- `tr` missing 0 keys present in `en`
- **18 EN values are identical to TR** (untranslated). Most are fine (proper nouns: WhatsApp, Reels, Villa, neighborhoods like Beyoğlu, Cihangir, Galata, Taksim). Two need fixing: `filter.max_price` = `"Max ₺"` and `filter.min_price` = `"Min ₺"` should be `"Max"` / `"Min"` in EN (or use a non-currency-bound label).

## Code-side coverage
- 663 total `t()` calls across the codebase
- 445 unique keys referenced
- DB has 831 keys → **~386 keys in DB are never called from code** (legacy/dead keys)
- Code keys not yet verified against DB; spot-check looked clean

## Hardcoded strings still in source (~386 lines with Turkish characters)

These bypass i18n entirely and stay in Turkish regardless of language setting. **Top offenders:**

| File | Hardcoded TR lines | Worst issues |
|---|---|---|
| `src/components/pets/PetMap.tsx` | 29 | Sample venues with Turkish addresses, popup HTML strings, "I've Seen This Pet!" |
| `src/pages/GroupDetail.tsx` | 29 | Tab labels, empty states, action buttons |
| `src/pages/VenueDetail.tsx` | 25 | Reviews section, hours, contact labels |
| `src/pages/Venues.tsx` | 23 | Filter chips, sort labels, category names |
| `src/components/pets/ShopsVetsSection.tsx` | 19 | Card labels, status badges |
| `src/components/pets/LostFoundSection.tsx` | 19 | "Kayıp", "Bulundu", "Liste", "Harita", "Yakınımda", "Yükleniyor...", time-ago "dk önce / s önce / g önce" |
| `src/pages/Profile.tsx` | 18 | Stats labels, action buttons |
| `src/pages/Groups.tsx` | 16 | Category chips, member count |
| `src/pages/EventDetail.tsx` | 16 | RSVP labels, share text |
| `src/pages/EditProfile.tsx` | 16 | Form labels, save button states |
| `src/components/pets/FriendFinder.tsx` | 15 | Size labels with emojis, "Tüm Cinsler", toast messages |
| `src/pages/Events.tsx` | 14 | Filter pills, empty states |
| `src/pages/Classifieds.tsx` | 14 | Section tabs, sort options |
| `src/pages/Wall.tsx` | 11 | Composer placeholder, post actions |
| `src/components/GlobalSearch.tsx` | 11 | "Mekanlar / Etkinlikler / Gönderiler / Kişiler", "Aranıyor...", "Sonuç bulunamadı", "İptal", placeholder |
| `src/components/MobileDrawer.tsx` | 3 | Hardcoded district list `["İstanbul","Beyoğlu","Şişli","Kadıköy","Beşiktaş"]` |
| `src/components/AppSidebar.tsx` | 4 | Same hardcoded districts + "beyoğlu" brand text |
| `src/components/Navigation.tsx` | 1 | "beyoğlu" brand text |

**Other categories of issues:**
- **Form placeholders** in 8+ files use `placeholder="Cihangir, Beyoğlu"` directly (AddPetForm, AdoptionForm, PetSittingForm, ClassifiedPostForm, etc.)
- **Toast messages** with English strings hardcoded (FriendFinder line 108: `"You've already sent a woof to this pet!"`, AddPetForm line 120: `"Pet added successfully!"`)
- **Map popup HTML** in EventsMap and PetMap uses template strings — not using `t()` at all
- **Pet attribute labels** (PetFilters.tsx) hardcode English: `"😊 Friendly"`, `"🎾 Playful"`, `"🛡️ Protective"`, etc.
- **Time-ago helpers** in `LostFoundSection.tsx` use Turkish suffixes (`"dk önce"`, `"s önce"`, `"g önce"`) regardless of language
- **Districts array** is hardcoded in TWO places (AppSidebar + MobileDrawer) instead of using the `districts` DB table
- **EventsMap & PetMap sample data** contains hardcoded Turkish vet/petshop seeded directly into the component, ignoring the `venues` DB table

## What's working well
- LanguageProvider correctly fetches translations per language and falls back to the key/fallback string
- All recently-updated pages (Wall, Events, Parking, Help, Venues, Groups, etc.) use `t()` with English fallbacks for new strings
- Date formatting uses locale-aware `tr-TR` / `en-US` switching
- Direction (LTR/RTL) is set on `<html>` based on language config
- DB has open RLS for read; auth + provider order is correct

## Recommended fixes (not done — report only)
1. **Drop 2 orphan TR keys**: `whats_on_your_mind`, `whatsapp`
2. **Fix 2 mistranslated EN values**: `filter.max_price` → `"Max"`, `filter.min_price` → `"Min"`
3. **Migrate ~386 hardcoded Turkish lines to `t()`** — prioritize the top 6 files (PetMap, GroupDetail, VenueDetail, Venues, ShopsVetsSection, LostFoundSection)
4. **Replace hardcoded districts arrays** in AppSidebar + MobileDrawer with a query against the `districts` table
5. **Localize map popup HTML** in EventsMap and PetMap (call `t()` and inject into the template)
6. **Localize hardcoded toasts and form placeholders** across pet components
7. **Audit cleanup**: 386 keys exist in the DB that are never referenced in code — candidates for removal after confirming no admin UI uses them

