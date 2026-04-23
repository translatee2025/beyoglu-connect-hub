
Goal: do one stabilization pass that fixes the real systemic causes instead of patching symptoms.

1. Confirmed root causes to address
- Profile N+1 still exists in practice across card pages. `UserName` is still rendered inside repeated cards on `Wall.tsx`, `Classifieds.tsx`, `Parking.tsx`, `Rentals.tsx`, `Pets.tsx`, `NeighborHelp.tsx`, `Events.tsx`, `Venues.tsx`, and others. The current `UserName` batching reduces some calls, but every card still mounts its own query hook and Wall also has per-card like queries.
- Category data is inconsistent, not just “stale”. Some screens use `value_key`, some use labels, and Classifieds currently posts label strings from the form while filters/badges expect canonical keys. That guarantees broken dropdown/filter/badge behavior even if the fetch succeeds.
- Image rendering is brittle. Many cards use inline `<img>` with `onError` DOM mutations that hide the image permanently instead of switching to a stable fallback. Photo parsing is also inconsistent across pages.
- Navigation recovery is weak. `NotFound.tsx` uses a plain `<a href="/">`, causing a full reload instead of SPA navigation. That can reset the app after a bad route.
- Wall is especially overloaded because it combines many sources, still renders per-card `UserName`, and for logged-in users also mounts a `LikeButton` query per feed item.

2. Implementation pass
- Create one shared page-level profile loader hook:
  - `useProfilesMap(userIds: string[])`
  - single `.in("user_id", ids)` query
  - returns `{ [userId]: { display_name, avatar_url } }`
- Create one presentational profile renderer for cards, e.g. `ProfileInline`, that accepts `userId + profileMap` and never fetches.
- Replace `UserName` inside repeated card lists on:
  - `Wall.tsx`
  - `Classifieds.tsx`
  - `Parking.tsx`
  - `Rentals.tsx`
  - `Pets.tsx`
  - `NeighborHelp.tsx`
  - `Events.tsx`
  - `Venues.tsx`
  - and any other page that renders card grids/lists with `UserName`
- Keep `UserName` only for isolated/detail contexts where one-off fetches are acceptable.

3. Wall hardening
- Refactor Wall feed loading so one slow source does not hold the entire page in skeleton state.
- Add page-level profile batching for all feed items.
- Batch likes for visible Wall items instead of one `useLikes` query per card.
- Keep comments lazy-loaded only when opened.
- Fix the realtime cache key mismatch so updates target `["wall-posts", selectedDistrict]`.
- Remove temporary debug logs after validation.

4. Category system fix
- Standardize category handling everywhere to:
  - store `value_key` in DB
  - render human labels from app options
  - never post labels back into DB
- Refactor `useAppOptions` consumers so forms/pages work with option objects, not raw label arrays.
- Fix `Classifieds.tsx` + `ClassifiedPostForm.tsx`:
  - form select values must be canonical keys
  - pills/badges must render labels from those keys
  - subcategory group keys must be derived from parent `value_key`, not label text
- Apply same key/label discipline to:
  - `Parking.tsx`
  - `Rentals.tsx`
  - `NeighborHelp.tsx`
- Use fallback option objects only as a temporary rendering fallback, not as posted DB values.

5. Database/data cleanup
- Audit `app_options` rows for:
  - `classified_categories`
  - `parking_types`
  - `rental_types`
  - `help_categories`
  - any `classified_sub_*` groups
- Add a migration that:
  - seeds missing option groups/rows without deleting existing data
  - backfills old Turkish/label category values in `classifieds` and related tables to canonical `value_key`s
- Preserve all existing content; no schema reset.

6. Image stability fix
- Create a shared `SafeImage`/`CardImage` component with:
  - local error state
  - placeholder fallback instead of `style.display = "none"`
  - consistent `loading="lazy"` behavior
- Normalize media sources with `parsePhotos` everywhere needed.
- Replace ad-hoc image rendering in Wall, Classifieds, Rentals, Parking, Venues, Groups, Events, Pets, and other card pages that currently use inline `<img>` fallback hacks.
- Ensure cards still show a visual placeholder when storage/media temporarily fails.

7. Navigation recovery fix
- Replace the hard reload in `NotFound.tsx` with SPA navigation (`Link` or navigate(-1)/home button).
- Add a small route-change utility to restore stable page behavior after bad routes/back navigation if needed.
- Verify no other plain `href="/"` style navigations are used for internal app routes.

8. Verification pass after implementation
- Measure requests on Wall, Classifieds, Pets, Rentals, Parking, Help:
  - one profile batch request per page instead of dozens
  - no per-card profile fetch storm
  - no per-card like storm on Wall
- Open category dialogs and verify options appear consistently on first open.
- Post/select/filter categories and confirm badges show labels, not raw keys or Turkish legacy strings.
- Navigate into a detail page, trigger a 404 path, then go back and confirm content/images remain visible.
- Validate image fallback behavior on broken/slow media URLs.

Technical details
- Files likely touched:
  - `src/hooks/useAppOptions.ts`
  - new shared hooks/components for profile maps and safe images
  - `src/components/shared/UserName.tsx` (reduced role or left for non-list contexts)
  - `src/components/classifieds/ClassifiedPostForm.tsx`
  - `src/pages/Wall.tsx`
  - `src/pages/Classifieds.tsx`
  - `src/pages/Parking.tsx`
  - `src/pages/Rentals.tsx`
  - `src/pages/NeighborHelp.tsx`
  - `src/pages/Pets.tsx`
  - `src/pages/Events.tsx`
  - `src/pages/Venues.tsx`
  - `src/pages/NotFound.tsx`
  - one database migration for option seeding + category backfill
- No schema reset, no auth reset, no data deletion.
- The objective is stabilization first: consistent keys, batched profile/like loading, resilient media, and SPA-safe recovery.
