

# Enable Realtime for Wall Feed

## Overview
Two changes: a migration to add `wall_posts` to the realtime publication, and a `useEffect` in `Wall.tsx` that subscribes to INSERT events and prepends new posts (skipping group posts).

## Change 1 — Migration

Create a migration with:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.wall_posts;
```

## Change 2 — Realtime subscription in `Wall.tsx`

Add a `useEffect` that:

1. Creates a Supabase channel subscribing to `postgres_changes` INSERT events on `wall_posts`
2. On each payload, checks `new.group_id` — if not null, ignores it
3. If `group_id` is null, converts the row to a `FeedItem` (same mapping as the existing query) and prepends it to the `wall-posts` query cache via `queryClient.setQueryData`
4. Returns a cleanup function that unsubscribes the channel

**Note on district filtering**: The current Wall component has no district/scope selector, so there is no district state to filter by. The subscription will accept all non-group posts. If a scope selector is added later, the subscription can be updated to filter by `district_id`.

## Files changed
| File | Change |
|------|--------|
| New migration SQL | `ALTER PUBLICATION supabase_realtime ADD TABLE public.wall_posts` |
| `src/pages/Wall.tsx` | Add `useEffect` import, add realtime subscription effect |

