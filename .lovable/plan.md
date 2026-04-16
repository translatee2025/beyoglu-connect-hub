

# Fix: Rental & Parking Images Not Displaying

## Problem

The rental cards show empty blue-gray rectangles instead of apartment photos. The database has correct photo URLs (Unsplash links), the code correctly extracts `item.photos[0]`, and the `<img>` tag is rendered — but the images don't visually appear.

**Root cause**: Two potential issues working together:

1. **Unsplash hotlinking may be blocked** in the preview environment — the `<img>` renders but returns a broken/empty response, showing only the `#EFF4FF` background.
2. **No fallback on image load error** — when the `<img>` fails to load, there's no `onError` handler to show the house emoji or placeholder.

## Plan

### Step 1: Add `onError` fallback to RentalCard image

In `src/pages/Rentals.tsx`, update the `RentalCard` component to handle broken images gracefully. Add state tracking for image load failure and fall back to the emoji placeholder when the image fails.

### Step 2: Replace Unsplash URLs with working alternatives

Update the seeded rental photo URLs in the database. Replace the `?w=800` Unsplash URLs (which may be blocked by hotlink protection) with `?auto=format&fit=crop&w=800&q=80` format, or use Unsplash's `source.unsplash.com` redirect service, or replace with `picsum.photos` URLs that reliably work in preview environments.

Run an UPDATE query on the classifieds table to fix all rental and parking photo URLs.

### Step 3: Apply same fix to ParkingCard in `src/pages/Parking.tsx`

Add the same `onError` fallback pattern to parking card images.

## Technical details

- Only 2 files modified: `Rentals.tsx`, `Parking.tsx`
- One database UPDATE to fix photo URLs
- No logic, routing, or query changes

