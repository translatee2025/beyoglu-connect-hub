

# In-App Notification System

## Overview
Add notification triggers to 4 existing actions (like, comment, message, RSVP), a bell icon with badge to the header, a dropdown panel, and realtime subscription. No existing features are redesigned.

## Database Migration

1. Add `notifications` table to `supabase_realtime` publication so the bell badge updates in real time.

## New Component: NotificationBell

**File: `src/components/NotificationBell.tsx`**

A self-contained component that:
- Queries unread count: `SELECT count(*) FROM notifications WHERE user_id = auth.uid() AND read = false`
- Queries 20 most recent notifications ordered by `created_at DESC`
- Renders a bell icon (`Bell` from lucide) with a red circular badge showing unread count (hidden when 0)
- Uses `Popover` (from existing ui/popover) for the dropdown panel
- Each row shows: type-based icon (Heart/MessageCircle/Mail/Calendar/Settings), body text, relative time, distinct background for unread
- Clicking a row: navigates to `link`, sets `read = true` via UPDATE
- "Mark all as read" button: `UPDATE notifications SET read = true WHERE user_id = auth.uid() AND read = false`
- Realtime subscription on `notifications` table filtered by `user_id = auth.uid()` for INSERT events — increments badge and prepends to list

## Navigation.tsx Changes

- Import `NotificationBell`
- Place it in the desktop header between `LanguageSwitcher` and the mail icon (line ~121), only when `user` is authenticated
- Place it in the mobile header area as well, next to the language switcher

## Notification Trigger: Likes

**File: `src/hooks/useLikes.ts`**

After a successful like INSERT (not unlike), look up the content owner's `user_id` from the relevant table based on `entityType`:
- `wall_post` → query `wall_posts` 
- `classified` → query `classifieds`
- `pet_post` → query `pet_posts`
- `reel` → query `reels` (add "reel" to EntityType)

Skip if liker === owner. Fetch current user's display_name from profiles. Insert notification row.

## Notification Trigger: Comments

**File: `src/components/shared/CommentsSection.tsx`**

In `addComment` mutation's `onSuccess`, look up the content owner based on `entityType`/`entityId` (same table mapping as likes). Skip if commenter === owner. Insert notification with type `'comment'`.

## Notification Trigger: Messages

**File: `src/pages/Messages.tsx`**

In `sendMessage` mutation's `onSuccess`, look up the other participant in the conversation. Insert notification with type `'message'`, link `'/messages'`. Only when conversation status is `'accepted'`.

## Notification Trigger: Event RSVP

**File: `src/pages/Events.tsx`**

In `toggleRsvp` mutation, after a successful INSERT (not delete), look up the event's `user_id`. Skip if RSVP user === event creator. Insert notification with type `'event_rsvp'`, link `'/events/' + eventId`.

## Helper Utility

**File: `src/lib/notifications.ts`**

A small helper function used by all triggers:
```typescript
async function createNotification(params: {
  userId: string;       // recipient
  type: string;
  body: string;
  link: string;
}) {
  await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    body: params.body,
    link: params.link,
  });
}
```

And a helper to get the current user's display name from profiles cache or a quick query.

## Files Changed
| File | Change |
|------|--------|
| Migration SQL | Add notifications to supabase_realtime |
| `src/lib/notifications.ts` | New helper utility |
| `src/components/NotificationBell.tsx` | New component |
| `src/components/Navigation.tsx` | Add bell icon |
| `src/hooks/useLikes.ts` | Add notification on like |
| `src/components/shared/CommentsSection.tsx` | Add notification on comment |
| `src/pages/Messages.tsx` | Add notification on message send |
| `src/pages/Events.tsx` | Add notification on RSVP |

No other pages, components, or tables are touched.

