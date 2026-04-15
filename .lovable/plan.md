

# Desktop Sidebar Layout — Implementation Plan

## Problem
All pages render as a centered mobile column with only a top header bar. No desktop sidebar exists.

## Approach
Create a new `AppSidebar` component and refactor `PublicLayout` to show sidebar on desktop (≥1024px) and header+bottom-nav on mobile (<1024px). No page content, routing logic, or data queries change.

## Files to Create

### 1. `src/components/AppSidebar.tsx` (new)
A fixed 220px left sidebar visible only on `lg:` breakpoint (1024px+). Contains:
- App name "beyoğlu" (16px, weight 800, color #1E3A5F)
- District scope pills (İstanbul active default, Beyoğlu, Şişli, Kadıköy, Beşiktaş) — static display only, no query filtering
- Three nav sections with labeled dividers:
  - **DISCOVER**: Feed `/wall`, Venues `/venues`, Events `/events`, Reels `/reels`
  - **COMMUNITY**: Groups `/groups`, Pets `/pets`, Families (placeholder), Lost & Found `/lost-found`
  - **SERVICES**: Rentals `/rentals`, Parking `/parking`, Help `/help`, Classifieds `/classifieds`, Jobs (placeholder)
- Nav items use `NavLink` with active style: bg `#EFF4FF`, color `#1E3A5F`, weight 500, left border 3px solid `#E74C3C`
- Bottom section: user avatar + name + district + language toggle (TR | EN)
- Uses `useAuth`, `useLanguage`, `useLocation` for active state and user info

## Files to Modify

### 2. `src/components/PublicLayout.tsx`
- Import `AppSidebar`
- Desktop: render `AppSidebar` fixed left + main content with `lg:ml-[220px] lg:p-6 lg:max-w-[860px]`
- Mobile: keep existing `Navigation` (header) + `BottomNav` (bottom tabs)
- Hide `Navigation` on desktop (`lg:hidden`), hide `AppSidebar` on mobile (`hidden lg:block`)

### 3. `src/components/Navigation.tsx`
- Add `lg:hidden` to the root `<nav>` so the header bar only shows on mobile

### 4. `src/components/BottomNav.tsx`
- Already has `lg:hidden` — no change needed

## What Does NOT Change
- No routing changes
- No page content changes
- No Supabase queries
- No data logic
- Admin routes, Auth, Reels keep their own layouts

## Visual Result
- **Desktop**: White sidebar left with sections, main content scrolls in the remaining space
- **Mobile**: Unchanged — header bar + bottom tabs

