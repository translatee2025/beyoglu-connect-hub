

# Remove Hero Sections from All Pages

## Pages to modify (7 total)

Each page has a centered icon/heading/subtitle block that needs to be removed. The page should start directly with its functional content (search bar, tabs, filters).

### 1. `src/pages/NeighborHelp.tsx` (lines 81-87)
Remove the `<div className="text-center mb-8">` block containing the HandHelping icon, "Neighbor Help" h1, and subtitle paragraph. Page starts with the search bar + post button row.

### 2. `src/pages/Events.tsx` (lines 124-131)
Remove the `<div className="text-center mb-12">` block containing "Etkinlikler" h1 and subtitle. Keep the create button row and tabs below.

### 3. `src/pages/LostFound.tsx` (lines 333-336)
Remove the h1 "Lost & Found" and subtitle paragraph. Keep the action buttons row.

### 4. `src/pages/Parking.tsx` (lines 111-117)
Remove the `<div className="text-center mb-8">` block with Car icon, "Parking Finder" h1, and subtitle. Page starts with tabs.

### 5. `src/pages/Rentals.tsx` (lines 117-123)
Remove the `<div className="text-center mb-8">` block with Home icon, "Rental Finder" h1, and subtitle. Page starts with tabs.

### 6. `src/pages/Classifieds.tsx` (lines 73-76)
Remove the `<div className="text-center mb-8">` block with "Classifieds" h1 and subtitle. Page starts with search bar.

### 7. `src/pages/Groups.tsx` (lines 240-247)
Remove the `<div className="text-center mb-8">` block with "Community Groups" h1 and subtitle. Page starts with search bar.

### 8. `src/pages/Pets.tsx` (lines 83-91)
Remove the `<div className="text-center mb-12">` block with Dog icon, "Pet Community" h1, and subtitle. Page starts with search bar.

## What does NOT change
- Wall/feed page — untouched
- Venues page — already has no large hero (just a small inline h1, which stays)
- No data queries, routing, or functionality changes
- All buttons, forms, tabs remain intact

