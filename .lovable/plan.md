
# Plan — Comprehensive i18n + UX fixes (13 fixes)

## Approach
Apply all 13 fixes as a single coordinated pass. Translation keys go in via SQL migration first so newly-wrapped `t()` calls render properly. Files are edited surgically — only the targeted strings/logic change.

## Order of execution
1. **SQL migration** — insert ~50 translation key pairs (Fix 13). Uses `ON CONFLICT` upsert; safe to re-run. Requires unique constraint on `(language_code, translation_key)` — will verify and add if missing.
2. **Read all target files** in parallel before editing.
3. **Edit pass** — apply Fixes 1–12 (parallel where files are independent).

## Fixes summary

| # | File(s) | Change |
|---|---|---|
| 1 | NeighborHelp, LostFound, Groups, Classifieds, Rentals, Parking, Wall | Replace `timeAgo` with language-aware inline strings (`şimdi/now`, `dk/m`, `s/h`, `g/d`). Ensure `language` is destructured from `useLanguage`. |
| 2 | Wall (ListingCard, SocialCard), Venues, Rentals, Parking, Pets PostCard, UserName | Add `onError` handler to user-content `<img>` tags — hides broken img, sets parent bg `#EFF4FF`. |
| 3 | Pets.tsx | Wrap tab labels, "Create Post", "Tümü 🐾", EmptyState button, "İletişim" in `t()`. Verify species pills use `s.label`. |
| 4 | Groups.tsx, GroupDetail.tsx | Wrap title, create button, group-type labels, admin badge, post-to-group, public badge, feed tab in `t()`. |
| 5 | NeighborHelp.tsx + post form | Add `getCategoryLabel` helper using `helpCats` lookup; wrap price-type, offer/request badges, share, contact, form labels. |
| 6 | Venues.tsx, VenueDetail.tsx | Wrap title, add-venue, send-message, list/map, save, added-by, reviews, no-reviews, hours. Map weekday keys → `weekday.<day>` translation. |
| 7 | Events.tsx, EventDetail.tsx | Wrap title, list/map, free-only, ends, attendees, free, location. Use `MONTHS_EN` when `language==="en"`. Fix UTC time bug → `toLocaleTimeString` with explicit local timezone. Add "+ Create Event" button with auth guard. |
| 8 | LostFound.tsx | Wrap title, report-lost/found buttons, lost/found tabs, contact button. Apply Fix 1 timeAgo. |
| 9 | Classifieds.tsx, SortFilterBar.tsx | Wrap post-ad, message buttons. SortFilterBar already i18n'd (verified). Category badge → lookup from DB `categories` array. |
| 10 | AdoptionForm.tsx | Replace age inputs with Select dropdowns (years 0–15 + Unknown, months 0–11 conditional). Gender → `grid-cols-2` always. Breed pills → `flex-wrap` + "Mixed" first option. Submit button → English fallback. |
| 11 | FriendFinder.tsx / AddPetForm.tsx | Find personality/looking-for/lifestyle pill buttons; replace `text-muted-foreground` (unselected state) with `text-foreground` or `#374151`. |
| 12 | Profile.tsx | "Member since" date → `toLocaleDateString` with `language === 'tr' ? 'tr-TR' : 'en-US'`. |
| 13 | SQL migration | Upsert ~50 translation key pairs. |

## What I am NOT doing
- Not changing any database schema beyond the translation upserts.
- Not touching working `t()` calls — only adding new ones / fixing fallbacks.
- Not modifying logic in queries, RLS, or server-side code.
- Not changing the species/breed data sources (hooks already correct).
- Not removing the Turkish month constants — keeping them for TR mode.

## Verification after apply
- Toggle EN/TR on Wall, Pets, Venues, Events, Groups, Classifieds, LostFound, Help, Profile pages.
- Confirm time labels show `5m`/`5dk`, `2h`/`2s`, etc.
- Confirm event times match local clock (not UTC offset).
- Confirm broken images don't render — show muted background instead.
- Confirm AdoptionForm has dropdowns + wrapping breed pills + visible Mixed option.
