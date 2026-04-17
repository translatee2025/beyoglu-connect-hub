
## Findings

From the schema dump above, `comments` table **already exists** with correct RLS:
- `Anyone can view comments` (SELECT, public, USING true) ✓
- `Auth users can create comments` (INSERT) ✓
- `Users can delete own comments` (DELETE) ✓

So the 503 is **not** an RLS or missing-table issue. No SQL changes needed.

The defensive code change in `CommentsSection.tsx` is still worth doing — it will prevent any transient comments query failure from freezing feed cards.

## Changes (one file)

**`src/components/shared/CommentsSection.tsx`** — add try/catch + error handling to both `queryFn`s:

1. `comments` query (line ~40): wrap in try/catch, return `[]` on error/exception.
2. `comment-count` query (line ~80): wrap in try/catch, return `0` on error/exception.

Both queries currently throw on error which propagates into React Query's error state. With graceful fallback the cards render normally even if comments are temporarily unreachable.

## Not doing
- No SQL migration. Table + policies are already correct per the schema dump.
- No changes to any other file.

## Note to user
The 503 you're seeing is most likely a transient Supabase issue or a network blip, not a schema problem. The code hardening below makes the feed resilient to it. If 503s persist after this change, share a console log entry showing the exact failing request URL so I can dig further.
