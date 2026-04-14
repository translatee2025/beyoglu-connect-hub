

# Plan: Restructure Classifieds + Pets into Category-Based Modules

## What Changes

### 1. Split Classifieds into 3 Separate Pages

**Current state:** One `/classifieds` page with hardcoded items including apartments.

**New structure:**
- `/classifieds` — Standard classifieds (Services, Items, Electronics, Furniture, Jobs, etc.) with category filter chips. No housing/parking.
- `/rentals` — Dedicated apartment/housing finder with list + map view. Fields: title, type (1+1, 2+1, studio), price, neighborhood, photos, description, map pin, contact.
- `/parking` — Dedicated parking finder with list + map view. Fields: title, type (garage, open, street), price, availability, photos, map pin, contact.

Each page gets a "Post Ad" dialog that saves to a `classifieds` database table with a `section` enum (`classifieds`, `rental`, `parking`) and a `category` field.

**Database — new `classifieds` table:**
- id, user_id, section (enum: classifieds/rental/parking), category, title, description, type (offer/need), price, currency, photos (text[]), address, lat, lng, phone, whatsapp, contact_preference, status (active/sold/closed), created_at

**Navigation:** Add "Rentals" and "Parking" to nav alongside existing "Classifieds".

### 2. Restructure Pets Page with Category Tabs

**Replace current tabs** (Browse, Discover, Map, Friends, Lost & Found) with category-based tabs:

| Tab | Description |
|-----|-------------|
| 🐾 Adoption | Pets available for adoption — user posts with pet details, photos, contact |
| 🏠 Pet Sitting | Two sub-filters: "I Want a Sitter" / "I Offer Sitting" — posts with availability, price, experience |
| ❤️ Friends | Find playmates — keeps existing swipe/browse/friend-finder functionality |
| 🚨 Lost & Found | Lost/found reports with map — keeps existing functionality |
| 🏥 Shops & Vets | Browse pet shops and vet clinics on map — keeps existing map layer |

### 3. Replace "Add My Pet" with Universal Post Button

**Remove** the current "Add My Pet" dialog button.

**Add** a single "Create Post" button that opens a dialog with **big icon buttons** to choose what to post:

```text
┌─────────────────────────────────────┐
│       What would you like to post?  │
│                                     │
│  🐾 Pet for      🏠 Pet Sitting    │
│     Adoption        Service         │
│                                     │
│  ❤️ Find a       🚨 Lost / Found   │
│     Friend          Report          │
│                                     │
│  🏥 Register     🏥 Register       │
│     Shop            Vet Clinic      │
└─────────────────────────────────────┘
```

Each button opens a **different form** tailored to that post type:

- **Adoption:** Pet name, species, breed, age, gender, photos, description, contact, location
- **Pet Sitting:** Title, I want/I offer toggle, availability, price range, experience, area, contact
- **Find a Friend:** Existing AddPetForm (pet profile for matching)
- **Lost/Found:** Existing ReportLostPetForm
- **Register Shop:** Shop name, address, phone, WhatsApp, opening hours, photos, map pin, description
- **Register Vet:** Same as shop form but for vet clinics

### 4. Database Changes

**New table: `pet_posts`**
- id, user_id, post_type (enum: adoption, pet_sitting, friend, lost, found, shop, vet), title, description, photos (text[]), species, breed, age_text, gender, price, phone, whatsapp, address, lat, lng, opening_hours (JSONB), is_offering (bool for sitting), status (active/resolved/closed), created_at

This single table handles all pet community posts. The `post_type` determines which fields are relevant and which tab the post appears in.

Shops and vets posted here also appear on the pet map as pins (like they do now, but user-generated instead of hardcoded).

**RLS:** Authenticated users can insert their own posts. Anyone can read active posts. Only the author can update/delete.

### 5. Routes Update in App.tsx

Add two new routes inside PublicLayout:
- `/rentals` → new `Rentals` page
- `/parking` → new `Parking` page

### 6. Files to Create/Modify

**New files:**
- `src/pages/Rentals.tsx` — Housing finder with list + map, category filters, post dialog
- `src/pages/Parking.tsx` — Parking finder with list + map, post dialog
- `src/components/pets/PetPostChooser.tsx` — The big-button category chooser dialog
- `src/components/pets/AdoptionForm.tsx` — Form for adoption posts
- `src/components/pets/PetSittingForm.tsx` — Form for sitting posts
- `src/components/pets/RegisterVenueForm.tsx` — Form for shop/vet registration
- `src/components/classifieds/ClassifiedPostForm.tsx` — Form for standard classifieds

**Modified files:**
- `src/pages/Pets.tsx` — New tab structure, replace "Add My Pet" with universal post button
- `src/pages/Classifieds.tsx` — Add categories, remove housing items, connect to DB
- `src/components/Navigation.tsx` — Add Rentals and Parking nav items
- `src/App.tsx` — Add /rentals and /parking routes

**Database migration:** One migration creating `classifieds` and `pet_posts` tables with RLS.

### 7. Classifieds Categories

Standard classifieds categories (filter chips on the page):
- All, Services, Items for Sale, Electronics, Furniture, Jobs, Lessons & Tutoring, Events & Tickets, Free Stuff, Other

