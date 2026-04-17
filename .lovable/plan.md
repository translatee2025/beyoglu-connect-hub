
## Plan — reset RLS on `public.comments`

Per schema dump, no triggers exist on `comments` and current policies look fine, but the user reports persistent 503s. A clean policy reset is cheap and safe — applying as requested.

## Migration

One SQL migration:

1. Drop all known policy name variants on `public.comments` (8 DROP POLICY IF EXISTS).
2. Drop the two trigger names listed (DROP TRIGGER IF EXISTS) — no-op if absent.
3. `ALTER TABLE ... DISABLE ROW LEVEL SECURITY;` then re-`ENABLE`.
4. Create three clean policies: `comments_select` (SELECT, USING true), `comments_insert` (INSERT, WITH CHECK auth.uid() = user_id), `comments_delete` (DELETE, USING auth.uid() = user_id).

## Verification

After migration runs, run `SELECT count(*) FROM public.comments;` to confirm no 503.

## Not doing

- No application code changes.
- No new tables, columns, or indexes.
- Not touching any other table's policies or triggers.
