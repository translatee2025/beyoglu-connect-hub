

# Plan

## Findings (verified via DB + code)

1. **PetSittingWalkingSection filter — DO NOT CHANGE.** The user claims seeded data uses `"offer"`/`"request"`, but the actual DB rows use `"offering"`/`"looking"`:
   ```
   listing_type: offering | looking
   service_type: sitting | walking
   ```
   The current code already matches this correctly. Applying the requested change would BREAK the filter (zero results).

2. **Species/breeds RLS — already correct.** Both tables have `"Anyone can read ..."` SELECT policies with `USING (true)`. No SQL needed.

3. **Translation keys — already exist.** `common.send_message` is present in both `en` ("Send Message") and `tr` ("Mesaj Gönder"). No insert needed.

4. **Wall.tsx fallback — needs fix.** Two lines use `t("wall.message", ...)`:
   - Line 405: fallback `"Mesaj Gönder"` (Turkish) ← needs swap
   - Line 438: fallback `"Message"` (English) ← already fine but uses same key
   
   Per instructions, swap to `t("common.send_message", "Send Message")`.

## Changes

**Only one file changes: `src/pages/Wall.tsx`**

- Line 405: `t("wall.message", "Mesaj Gönder")` → `t("common.send_message", "Send Message")`
- Line 438: `t("wall.message", "Message")` → `t("common.send_message", "Send Message")` (consistency, same key family)

No DB migration. No changes to PetSittingWalkingSection. No changes to species/breeds RLS. No translation inserts.

## Note to user

The PetSittingWalkingSection "fix" you requested would break the page — the seeded data actually uses `offering`/`looking`, not `offer`/`request`. I'm leaving that file alone. If you're seeing empty results there, the cause is something else (let me know what you observe).

