

# Plan: User Profiles Everywhere + Contact DM + Turkish Translations

## Summary

Three issues to fix:
1. Several pages show placeholder icons instead of actual user avatars/names (Rentals, Parking, Pets)
2. "Contact" buttons are dead — they should open a DM conversation with the poster
3. Turkish translations are missing for all UI strings

## Changes

### 1. Add UserName component to pages missing it

**Rentals.tsx** — Add `UserName` import and show `<UserName userId={item.user_id} showAvatar />` in `RentalCard` (currently no user info shown at all).

**Parking.tsx** — Same as Rentals: add `UserName` to `ParkingCard`.

**Pets.tsx** — Add `UserName` to `PostCard` component (pet sitting, lost/found, adoption, shop posts all have `user_id`).

### 2. Make "Contact" buttons open DM

Create a shared helper or inline logic: when "Contact" is clicked, check if user is logged in. If yes, navigate to `/messages?to={userId}`. If no, redirect to `/auth`.

Update all 5 pages with Contact buttons:
- `Classifieds.tsx`
- `NeighborHelp.tsx`
- `Rentals.tsx`
- `Parking.tsx`
- `Pets.tsx`

Update `Messages.tsx` to read `?to=` query param and auto-open a conversation with that user on mount.

### 3. Add Turkish translations via database migration

Insert translation rows for all UI strings used across the app. This covers:
- Navigation labels (nav.wall, nav.venues, nav.pets, nav.events, nav.groups, nav.classifieds, nav.rentals, nav.parking, nav.help, nav.reels, nav.charts, nav.login, nav.signup)
- Page titles and subtitles for all modules
- Common actions (Contact, Search, Post, Back, Next, Loading, etc.)
- Form labels used in posting forms
- Badge labels (Offering, Looking, I Can Help, I Need Help, etc.)

All strings currently use `t("key", "English fallback")` pattern — the fallback works for English but Turkish needs DB rows. We'll insert ~80-100 translation rows for `language_code = 'tr'`.

### 4. Wire up `t()` calls in hardcoded pages

Several pages (Classifieds, Rentals, Parking, NeighborHelp, Pets) have hardcoded English strings. Wrap them with `t()` calls using the `useLanguage` hook so they respond to language changes.

## Files to modify
- `src/pages/Classifieds.tsx` — add `useLanguage`, `useNavigate`, wire Contact to DM, wrap strings with `t()`
- `src/pages/NeighborHelp.tsx` — same
- `src/pages/Rentals.tsx` — add `UserName`, same contact/translation fixes
- `src/pages/Parking.tsx` — add `UserName`, same
- `src/pages/Pets.tsx` — add `UserName`, same
- `src/pages/Messages.tsx` — handle `?to=` query param to auto-start DM
- `src/components/Navigation.tsx` — ensure all nav label keys match translation keys
- **Database migration** — insert ~100 Turkish translation rows into `translations` table

