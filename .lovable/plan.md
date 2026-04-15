

# Plan: CMS-Managed Content + Complete Turkish Translation

## Problem

1. **Homepage and key content is hardcoded** — hero title, tagline, feature cards, CTA sections are all in `Index.tsx` as static strings. No way to edit from backend.
2. **Turkish translation is incomplete** — 308 TR keys exist but large swaths of the app remain English: Auth page, Events page, Venues page, Wall badges, Profile page, Messages page, Reels page, VenueCharts page, all post forms (Rental, Parking, Classified, Pet sub-forms), Navigation dropdown items ("More", "My Profile", "Log Out"), and filter/category labels.
3. **Default language should be Turkish** per user's choice.

## Solution

### Part A: CMS-Managed Content via `site_settings`

The `site_settings` table already exists with admin-only write access. We will:

1. **Seed CMS content keys** into `site_settings` for all editable homepage sections:
   - `hero_title`, `hero_subtitle`, `hero_cta_primary`, `hero_cta_secondary`
   - `features_heading`, `features_subtitle`
   - `feature_1_title`, `feature_1_desc`, `feature_2_title`, `feature_2_desc`, etc.
   - `benefits_heading`, `benefit_1_title`, `benefit_1_desc`, etc.
   - `cta_heading`, `cta_subtitle`, `cta_button`
   
   Each key stores a JSON object like `{"en": "Welcome to Beyoğlu Connect", "tr": "Beyoğlu Connect'e Hoş Geldiniz"}` so the value is multilingual.

2. **Update `Index.tsx`** to fetch from `site_settings` via react-query, using the current language to pick the right value. Falls back to hardcoded defaults if no setting exists.

3. **Expand Admin Settings page** (`AdminSettings.tsx`) to include a "Homepage Content" section where admin can edit hero text, feature cards, CTA text — with fields for each active language.

### Part B: Complete Turkish Translation

**Database insert** of ~200+ new translation rows covering every remaining hardcoded string:

**Pages to wrap with `t()` and add TR translations:**

| Page | Hardcoded strings to translate |
|---|---|
| **Auth.tsx** | "Welcome Back", "Create Account", "Set Password", "Your Info", "Email", "Password", "Choose Password", "Display Name", "Phone Number", "Log In", "Create Account", "Don't have an account?", "Already have an account?", step labels, validation messages |
| **Events.tsx** | "Local Events", "Discover and join...", "Upcoming", "Past Events", "Create Event", "List View", "Map View", "RSVP", "attending", category badges |
| **Venues.tsx** | "Venues", "Restaurants, pharmacies...", "Search venues...", "Add Venue", "All", "List", "Map", "View Details", weekday labels, venue form: "Name", "Type", "Address", "Phone", "Description", "Opening Hours", step labels |
| **Wall.tsx** | "Community Wall", "What's happening...", badge labels ("Post", "Rental", "Parking", "Classified", "Pets", "Venue", "Help Offer", "Help Wanted"), "Share", "Post" button |
| **Profile.tsx** | "Edit Profile", "Save", "Cancel", "About", "Activity", "Friends", tab labels, "Display Name", "Bio", "Neighborhood", "Phone", "No activity yet" |
| **Messages.tsx** | "Messages", "New", "No conversations yet", "Search users...", "No users found", "Delete conversation?", "Type a message...", "Cancel", "Delete" |
| **Reels.tsx** | "Create Reel", "Caption", "Neighborhood", "Post Reel", "No reels yet" |
| **VenueCharts.tsx** | "Venue Charts", "Most loved places...", "All", "More Venues", "No venues ranked yet..." |
| **Navigation.tsx** | "More", "My Profile", "Log Out", "Messages" (in mobile menu) |
| **NeighborHelp.tsx** | Category array labels ("Plumbing & Bathroom", "Painting", etc.), form labels |
| **Parking.tsx** | Type array labels ("Garage", "Open Air", etc.), form: "Title", "Parking Type", "Budget", "Description", "Photos", "Neighborhood", "Phone", step labels |
| **Rentals.tsx** | Category labels ("1+0 Studio", etc.), form: "Title", "Listing Type", "For Rent", "For Sale", "Category", "Budget/Price", "Description", step labels |
| **ClassifiedPostForm.tsx** | "Post a Classified Ad", "Title", "Type", "Offering", "Looking for", "Category", "Price", "Neighborhood", "Description", "Photos/Videos", "Phone", "Post Ad" |
| **Pet sub-forms** | AdoptionForm, PetSittingForm, ReportLostPetForm — all labels and placeholders |

### Part C: Default Language to Turkish

Update `src/config.ts`: change `defaultLanguage` from `'en'` to `'tr'`.

## Files to create/modify

**Database:**
- Insert ~200 new Turkish translation rows (via insert tool)
- Insert ~20 CMS content keys into `site_settings` (via insert tool)

**Frontend files to modify:**
- `src/config.ts` — change defaultLanguage to 'tr'
- `src/pages/Index.tsx` — fetch from site_settings, use `t()` for all text
- `src/pages/Auth.tsx` — add useLanguage, wrap all strings with `t()`
- `src/pages/Events.tsx` — add useLanguage, wrap all strings
- `src/pages/Venues.tsx` — add useLanguage, wrap all strings including form
- `src/pages/Wall.tsx` — add useLanguage, translate badge labels
- `src/pages/Profile.tsx` — add useLanguage, wrap all strings
- `src/pages/Messages.tsx` — add useLanguage, wrap all strings
- `src/pages/Reels.tsx` — add useLanguage, wrap all strings
- `src/pages/VenueCharts.tsx` — add useLanguage, wrap all strings
- `src/components/Navigation.tsx` — translate "More", "My Profile", "Log Out"
- `src/pages/NeighborHelp.tsx` — translate category array
- `src/pages/Parking.tsx` — translate type array + form labels
- `src/pages/Rentals.tsx` — translate category array + form labels
- `src/components/classifieds/ClassifiedPostForm.tsx` — add useLanguage, wrap all labels
- `src/components/pets/AdoptionForm.tsx` — wrap labels
- `src/components/pets/PetSittingForm.tsx` — wrap labels
- `src/components/pets/ReportLostPetForm.tsx` — wrap labels
- `src/pages/admin/AdminSettings.tsx` — add Homepage Content CMS editor section

