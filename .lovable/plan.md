

# Plan: Port Chat System and Venue Charts from NightLix

## What we're building

1. **Enhanced Messaging/Chat page** — Rebuild `Messages.tsx` with patterns from NightLix's Chat.tsx, adding realtime DM support with bubble UI, search for users to start conversations, delete conversation functionality, and proper mobile-responsive split layout.

2. **Venue Charts page** — A new "Top Venues" ranking page inspired by NightLix's Charts.tsx, adapted for this project's venue types (Restaurant, Cafe, Bar, etc.). Venues ranked by likes count with featured cards for top 3 and a list for the rest. Filter by venue type.

## Technical details

### 1. Messaging improvements (`src/pages/Messages.tsx`)

The current Messages page already works with `conversations`, `conversation_participants`, and `messages` tables. We'll enhance it with:

- **Delete conversation** — AlertDialog confirmation, then delete from `conversations`
- **Better search** — Search profiles by display_name to start new chats
- **Realtime** — Already has realtime subscription; will keep and polish
- **Bubble UI** — Already has chat bubbles; will refine styling
- **Mobile UX** — Already responsive with hidden panel logic; minor polish

The existing DB schema (`conversations`, `conversation_participants`, `messages`) is sufficient. No schema changes needed for messaging.

### 2. Venue Charts page (`src/pages/VenueCharts.tsx`)

New page showing venue rankings based on likes:

- **Top 3 featured cards** — Large card for #1, two side-by-side for #2 and #3
- **List items for rank 4+** — Compact rows with rank number, name, venue type, like count
- **Filter by venue type** — Tabs or buttons for Restaurant, Cafe, Bar, etc.
- **Like button** — Uses existing `likes` table with `entity_type = 'venue'`
- **No new tables needed** — Uses existing `venues` + `likes` tables

### Files to create/modify

- **`src/pages/Messages.tsx`** — Enhance with delete conversation dialog, polished search, mobile refinements
- **`src/pages/VenueCharts.tsx`** — New page with venue rankings by likes
- **`src/App.tsx`** — Add route for `/charts` pointing to VenueCharts
- **`src/components/Navigation.tsx`** — Add Charts link to nav

### Routing

```
/charts → VenueCharts (new)
/messages → Messages (enhanced)
```

### Adaptation notes

- NightLix uses `channels` (public chat rooms) + `conversations` (DMs). This project only needs DMs, so we skip channel logic.
- NightLix Charts uses `charts_cache` table and `venue_likes`. We'll use the existing `likes` table (entity_type='venue') and query venues directly — no new tables needed.
- NightLix's `OnlineStatusIndicator` and `blocked_users` won't be ported (would need new tables). Can add later.

