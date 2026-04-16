

# Full Audit: Why Nothing Is Working

## Root Causes Found

### Issue 1: Parking page shows empty — listing_mode mismatch
**Parking.tsx line 80** queries `listing_mode = "rent"` for the "offering" tab, but all seeded parking data has `listing_mode = "offering"`. Result: zero rows returned, empty state shown.

The parking form also saves new listings as `"rent"` (line 274), which is inconsistent with rentals which uses `"offering"`.

**Fix**: Update the parking offering query to use `listing_mode = "offering"`, matching what the seeded data (and the rental page) uses. Also update the parking form to save as `"offering"` instead of `"rent"`.

### Issue 2: Images still not displaying — picsum.photos may be blocked
The previous fix replaced Unsplash URLs with `picsum.photos` URLs. But `picsum.photos` can also be blocked or rate-limited in the preview sandbox. The `onError` fallback was added but if ALL images fail, every card shows the 🏠 emoji — which looks like nothing works.

**Fix**: Replace external image URLs with placeholder SVG data URIs for the seeded data, OR use Unsplash with the proper `source.unsplash.com` redirect format which is more reliable. Also add visible `alt` text and a colored background so failed images still look intentional.

### Issue 3: Wall feed shows skeleton loaders
Data exists (30 wall posts with correct `district_id` for Beyoğlu, `group_id = null`, RLS open for all reads). The query should succeed. Possible causes:
- Build error from recent edits preventing deployment
- React Query `staleTime: 5min` caching a previous error
- The screenshot captured a transient loading state

**Fix**: Add error handling to the wall query with `onError` logging. Verify the build compiles cleanly. Check for TypeScript errors in recently edited files (Groups.tsx, NeighborHelp.tsx, PetSittingWalkingSection.tsx).

### Issue 4: Pet sitting cards may not match filter logic
Seeded `pet_sitting_posts` data has `listing_type = "offering"` or `"looking"` and `service_type = "sitting"` or `"walking"`. The PetSittingWalkingSection filters by these exact values. This should work, but the `price` column is `numeric` type while the code does `(p.price || "").replace(...)` which would crash on a number.

**Fix**: Cast `price` to string before string operations: `String(p.price || "")`.

## Implementation Plan

### Step 1: Fix Parking listing_mode mismatch
In `src/pages/Parking.tsx`:
- Change the offering query from `.eq("listing_mode", "rent")` to `.eq("listing_mode", "offering")`
- Change the parking form insert from `listing_mode: "rent"` to `listing_mode: "offering"`

### Step 2: Fix pet sitting price string crash
In `src/components/pets/PetSittingWalkingSection.tsx`:
- Change `(p.price || "").replace(...)` to `String(p.price || "").replace(...)` in all price parsing
- Fix the card price display similarly

### Step 3: Replace image URLs with reliable sources
Run a database UPDATE to replace picsum.photos URLs with a more reliable pattern — either `https://placehold.co/800x600/EFF4FF/1E3A5F?text=🏠` style data URIs or keep picsum but add cache-busting. Also ensure `onError` handlers in both RentalCard and ParkingCard show a styled placeholder (not just an emoji).

### Step 4: Run TypeScript build check
Run `npx tsc --noEmit` to catch any compilation errors from recent edits that may prevent the app from building and deploying.

### Step 5: Add error boundary logging to Wall feed
Add `onError` callback to the wall-posts useQuery to surface any silent failures. Also add a brief `console.log` to confirm data is being fetched.

## Files Changed
- `src/pages/Parking.tsx` — fix listing_mode query and form
- `src/components/pets/PetSittingWalkingSection.tsx` — fix price type handling
- `src/pages/Rentals.tsx` — verify image rendering works
- Database UPDATE for image URLs
- Build verification

