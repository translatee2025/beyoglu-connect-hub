

# Plan — fix language toggle gaps + verify "feed empty" claim

## Root cause analysis

**Language toggle**: works correctly — DB has `en` + `tr` translations for the filter chips (`Rentals/Kiralık`, `Events/Etkinlikler`, `Community/Topluluk`) and the photo button (`Add Photos / Fotoğraf Ekle`). The UI labels DO swap. What does NOT swap:
1. **Composer action chips** in `Wall.tsx` lines 299–307 — `📸 Photo / 📍 Location / 🏠 Rental` are **hardcoded English**, no `t()` call.
2. The `+ Fotoğraf Ekle` label — already wrapped in `t()` and has both translations. It will toggle correctly. The screenshot just shows TR because TR is the active language (toggle button shows "TR", which is the *current* state).

**"Posts not visible"**: Verified DB-side — wall_posts (30 in Beyoğlu), classifieds (20), venues (18 with valid joins), events (5 upcoming). RLS allows public read on all four. The skeletons in your screenshots are normal loading state. Most likely you captured the screenshot during initial load. **There is no real "missing posts" bug I can reproduce from the code or DB.** If posts are *truly* never appearing for you after waiting, it's a runtime/network issue I'd need console logs to diagnose.

## Changes (one file)

**`src/pages/Wall.tsx`** — wrap the three hardcoded composer chips with `t()`:
- `📸 Photo` → `t("wall.composer.chip_photo", "Photo")`
- `📍 Location` → `t("wall.composer.chip_location", "Location")`
- `🏠 Rental` → `t("wall.composer.chip_rental", "Rental")`

## DB migration

Insert 6 translation rows (3 keys × 2 languages):
```
wall.composer.chip_photo    → en: "Photo"     tr: "Fotoğraf"
wall.composer.chip_location → en: "Location"  tr: "Konum"
wall.composer.chip_rental   → en: "Rental"    tr: "Kiralık"
```

## What I am NOT doing
- Not touching the language toggle itself — it works.
- Not changing `PhotoUploader` — already i18n'd correctly.
- Not changing the filter bar — already i18n'd correctly.
- Not "fixing" the empty feed — feed queries are healthy. If you still see no posts after the page fully loads, send me a console log (F12 → Console tab, copy any red errors) and I'll diagnose from there.

