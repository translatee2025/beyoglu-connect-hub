
# Plan — Full live audit, both languages, all 17 pages

## Scope
- **17 pages** × **2 languages (TR + EN)** × **~150 checklist items**
- Output: per-item report (✅/🔴/⚠️) sorted by page + summary + top 5 critical issues

## Approach

### Step 1 — Setup (2 calls)
- Dismiss location prompt
- Verify language toggle location (top right)

### Step 2 — Per page (×17), each language (×2)
For each `(page, language)` pair:
1. Navigate to the page
2. Extract all visible text (buttons, pills, badges, tabs, timestamps, placeholders)
3. Screenshot only when image-loading checks are required (Wall, Pets, Venues, Rentals, Parking, Profile)
4. For pages with sub-tabs/forms (Pets sub-tabs, Adoption form, Group detail), additional `act` + `extract` per sub-view

**Estimated browser calls**: ~80–110
- Page navigations: 17 pages × 2 langs = 34
- Extracts: 34 + ~12 sub-tabs/forms = ~46
- Screenshots (image checks): ~12
- Language toggles: ~17
- Setup/dismiss: ~2

### Step 3 — Aggregate
Build the full report in one final message:
- Per-page section with every item from the checklist marked
- Note differences between TR and EN (e.g., "EN shows 'Mesaj Gönder' = leaked TR string")
- Summary counts + top 5 critical issues

## Pages to cover
`/wall`, `/pets` (+ Pet Sitting tab, + Find a Friend tab, + Adoption form), `/groups`, `/groups/:id`, `/events`, `/events/:id`, `/venues`, `/venue/:id`, `/rentals`, `/parking`, `/help`, `/lost-found`, `/classifieds`, `/profile/:id`, Global Search.

## What I will report per item
`[emoji] [Page · TR|EN] — [What checked] — [Exact text found]`
Items checked in both languages get two lines if behavior differs, one line if identical.

## Trade-offs you should know
- **Time**: ~10–15 minutes of browser activity
- **Cost**: ~100 browser tool calls (high but you approved)
- **Failure modes**: If a page errors or session drops, I'll report what I got and continue. Won't restart the entire audit.
- **Detail pages** (`/groups/:id`, `/events/:id`, `/venue/:id`, `/profile/:id`): I'll pick the first available record on each list page.

## What I will NOT do
- Test create/post/delete actions (read-only audit; would mutate live data)
- Test auth-gated flows beyond what's visible to logged-out user
- Fix any bugs found — this is audit-only, fixes come in a follow-up
