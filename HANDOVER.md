# Beyoğlu Connect — Handover & Roadmap

_Generated from a 6-domain readiness audit (user management · GDPR/KVKK · security · backend/functions · product modules · UX workflows)._
_Live: https://translatee2025.github.io/beyoglu-connect-hub/ · Backend: CityHub Supabase (project rpowcyefavqynpvoumdg) · Repo: translatee2025/beyoglu-connect-hub._

## State of the app today

Beyoğlu Connect is a mobile-first React/Vite SPA deployed to GitHub Pages at the `/beyoglu-connect-hub/` sub-path, talking directly to the user's own "CityHub" Supabase project (`rpowcyefavqynpvoumdg`) with only the anon key — there is **no server-side compute layer at all** (no `supabase/functions/`, just five Postgres triggers/RLS helpers). It has genuinely impressive breadth — ~17 modules, realtime 1:1 messaging, a DB-driven i18n system, a follow graph, a notifications center, venue reviews, real haversine geo-distance, and a working moderation queue UI — built on a mostly-sound table-level RLS posture. But it is **not launchable to real Turkish/EU users**: there is no Privacy Policy/Terms, no consent capture, no account deletion or data export (KVKK/GDPR erasure + access), no age gate, profiles and all user photos are world-readable, the `banned` role and all content-moderation writes silently no-op at the DB layer, and there is a confirmed stored XSS plus a third-party AI key sitting in a publicly-readable table. The recurring theme below the surface is "schema-ahead-of-UI": tables exist (`venue_saves`, `venue_claims`, `user_reviews`, `message_requests`) but the UI to use them is dead, missing, or bypassed, and core first-action loops (Send Message, empty-state Post) are wired to nothing.

## Carry-over known issues

- **Stored/DOM XSS in `src/components/pets/LostFoundSection.tsx`** (`bindPopup` at L383–398 interpolates raw `item.title`/`item.user_id` into HTML + an `onclick`; `divIcon` at L370 injects `item.photo` into `url()`). *Fix:* HTML-escape every interpolated value and pass `user_id` via a `data-` attribute read by an event listener instead of inlining `onclick`; whitelist `item.photo` as an http(s) URL.
- **AI provider key in a public table** — `src/pages/admin/AdminAI.tsx` writes `ai_api_key` into `site_settings`, which has `SELECT USING (true)`; any anon visitor can read it with the public key. *Fix:* move AI calls into an Edge Function holding the key as a secret; rotate the key now; split secrets into an admin-only table.
- **Messaging broken access control** — `conversation_participants` INSERT is `WITH CHECK (auth.uid() IS NOT NULL)`, so any logged-in user can join any conversation by UUID and read/delete its messages. *Fix:* require the caller to be the conversation creator or an existing participant; scope message DELETE to `sender_id = auth.uid()`.
- **Dead theming system** — `src/providers/ThemeProvider.tsx` (L41–48) sets eight `--color-*` CSS vars that **nothing consumes** (`var(--color-*)` = 0 hits app-wide); `src/config.ts` colors and the `AdminTheme.tsx` editor change nothing visible. *Fix:* either bind these vars in the Tailwind/`index.css` theme tokens, or delete the provider + AdminTheme to stop shipping a fake control.
- **Stale Supabase types + `as any` escape hatches** — `src/integrations/supabase/types.ts` is out of date vs the live DB and bypassed by **44 `as any`** casts across `src/`. *Fix:* regenerate with the project's service token (`supabase gen types ... --project-id rpowcyefavqynpvoumdg`) and remove the casts.
- **Committed secret / bad hygiene** — `.env` is git-tracked (contains the project ref + anon key) and `.gitignore` has no env entry. *Fix:* `git rm --cached .env`, add `.env` to `.gitignore`, commit an `.env.example`.
- **Personal access token to revoke** — the Supabase PAT used this session for seeding/type-gen should be revoked in the Supabase dashboard now that seeding is done.
- **Deprecated CI actions** — `.github/workflows/deploy.yml` runs on `node-version: 20` with `setup-node@v4`/`checkout@v4` (Node-20 runtime deprecation). *Fix:* bump to Node 22 actions before Sep 2026.

## Prioritized roadmap

### P0 — Legal/security blockers (must land before any real user)

1. **Fix the stored XSS** — *why:* one malicious lost-pet post executes arbitrary JS in every map viewer's session, and the Supabase session lives in `localStorage` (full account takeover, worm-able). *First step:* add `src/lib/escapeHtml.ts`, refactor `LostFoundSection.tsx` to build the popup with `createElement`/`textContent` and a `data-user-id` listener; audit other Leaflet popups.
2. **Remove the AI key from `site_settings` + rotate it** — *why:* an OpenAI/Google key in a world-readable table is a financial/data-exfil leak on an open-source, public-URL app. *First step:* stand up the first Edge Function (`ai-proxy`) holding the key as a function secret; restrict `site_settings` SELECT to non-secret rows; rotate the leaked key.
3. **Tighten messaging RLS** — *why:* private 1:1 chats are readable/deletable by any authenticated user who guesses a conversation UUID (KVKK/GDPR confidentiality breach). *First step:* replace the `conversation_participants` INSERT policy and re-scope message DELETE in a new migration; re-test DM creation.
4. **Account deletion + data export (KVKK Art. 7 / GDPR Art. 17 & 15/20)** — *why:* right to erasure and access are the two most-enforced data-subject rights; their absence blocks lawful EU/TR launch. *First step:* build `delete-account` and `export-my-data` Edge Functions using the service-role admin API, plus a 30-day soft-delete (`profiles.deleted_at`, hidden via RLS) and a "Delete my account / Download my data" UI in account settings.
5. **Lock down PII exposure** — *why:* `profiles` is `SELECT USING (true)` (phone/age/gender world-readable) and migration `20260601224744` made the `user-media` bucket fully public; the `photo_public`/`messages_public`/`age_public` toggles are written but never enforced. *First step:* expose profiles via a `SECURITY DEFINER` view/RPC that nulls sensitive columns for non-owners and honors the `*_public` flags; move user photos to signed/authenticated-read URLs; enforce `messages_public` server-side.
6. **Consent, Terms/Privacy pages, age gate** — *why:* KVKK aydınlatma metni + GDPR Arts. 13/7 + DSA require an accessible notice, a recorded lawful basis, and a minimum-age gate; none exist. *First step:* author TR/EN Privacy + Terms + Cookie pages and route them; add a required unticked consent checkbox + DOB/age confirmation to the final signup step; persist `consent_records` (version, timestamp, IP).
7. **Make the `banned` role and content moderation actually enforce** — *why:* `AdminReports.tsx` "ban"/"hide" succeed in the UI but RLS silently rejects them (no admin override on content tables; no policy reads `banned`), giving admins false confidence (DSA illegal-content failure). *First step:* add an `is_banned()` helper to every write `WITH CHECK`, add `has_role('admin'|'moderator')` UPDATE override policies on `wall_posts`/`classifieds`/`venues`/`events`, stop overwriting the role row, and gate the app shell on `banned`.
8. **Password reset** — *why:* no recovery path = permanent lockout and churn; baseline launch expectation. *First step:* add a "Forgot password?" link calling `resetPasswordForEmail` and a `/reset-password` route calling `updateUser({ password })`; configure the Supabase template + redirect allow-list.
9. **Custom SMTP, secret hygiene, CI bump** — *why:* Supabase's sandbox sender is throttled/spam-prone (verification + reset emails won't reliably arrive); committed `.env` and Node-20 CI are latent risks. *First step:* configure a TR-friendly provider (Resend/Postmark) in Auth settings; `git rm --cached .env`; revoke the session PAT; bump CI to Node 22.

### P1 — Core for a credible product

1. **Onboarding / first-run + profile completeness** — *why:* users land on the feed with blank profiles and no district set, starving the neighborhood feed; first-run is the highest-leverage activation moment. *First step:* a skippable post-verify "pick your district + avatar" card and a "% complete" banner.
2. **Wire the dead first-action CTAs** — *why:* "Send Message" has no `onClick` in `Wall.tsx` (L465/L499) and `Venues.tsx` (L219), and the feed empty-state `onAction` is a no-op — the most likely first actions silently fail (rage-tap abandonment). *First step:* copy the working `navigate('/messages?to=...')` pattern already in Rentals/Parking/Classifieds.
3. **Block / mute + honor the message-request gate** — *why:* core personal-safety primitive expected under DSA; `message_requests` and the "allow anyone to message me" toggle exist but are bypassed. *First step:* add a `user_blocks` table enforced in messaging RLS, and either honor or remove the request gate (no dead controls).
4. **Server-side notification fan-out + friend-request loop** — *why:* notifications are client-inserted with `WITH CHECK (user_id IS NOT NULL)` (anyone can spam/phish any user); friend requests fire **no** notification and have **no** inbox UI, so the connection loop is dead. *First step:* move notification creation into DB triggers/`SECURITY DEFINER` RPCs, tighten the INSERT policy, fire a `friend_request` notification, and surface `useFriendRequests` as a Connections inbox.
5. **User-to-user reviews (write path) + verified badges + admin role assignment** — *why:* `user_reviews` is read-only theater, `profiles.verified`/`venue_claims` are never surfaced, and there's no UI to assign moderator/vendor roles. *First step:* add a "Leave a review" form gated to users with a prior conversation, render a verified badge in `UserName`/`Profile`, and build an Admin > Users screen plus a venue-claims review queue that grants the `vendor` role on approval.
6. **Accessibility pass (EAA in force June 2025)** — *why:* only 7 aria-labels app-wide, icon-only buttons unlabeled, no `prefers-reduced-motion`, labels not associated — a legal liability for EU users. *First step:* add `aria-label` to every icon-only button, adopt the vendored `Form`/`FormField` wrapper for label association, add a global reduced-motion rule, and add axe/Lighthouse as a CI gate.
7. **Form quality** — *why:* disabled-submit + zero inline validation + raw Supabase error toasts strand users and suppress listings (the marketplace's supply engine). *First step:* adopt the already-vendored react-hook-form + zod stack, always-enabled submit with on-blur field errors, single-column layouts.
8. **Observability + rate limiting/CAPTCHA** — *why:* a client-only SPA with no telemetry makes production errors invisible, and unbounded client writes invite spam/scraping. *First step:* wire Sentry into `ErrorBoundary`, add a consent-gated analytics tool, enable Turnstile/hCaptcha on auth, and add per-user write limits via the new Edge Function layer.

### P2 — Growth

1. **Feed ranking** — *why:* `Wall.tsx` merges 6 tables by `created_at` and ignores the populated follow graph — a bulletin board, not a social feed. *First step:* a `Following`/`Discover` split backed by a scored, paginated Postgres RPC (recency decay + engagement + same-district boost).
2. **Real search + geo `nearby`** — *why:* leading-wildcard `ILIKE` over only 4 of ~15 content types won't index, ignores Turkish diacritics, and "nearby" filters client-side only. *First step:* add `tsvector`/`pg_trgm` (with `unaccent` + Turkish config) GIN indexes and a `nearby` RPC via PostGIS `ST_DWithin`; cover classifieds/rentals/pets/groups.
3. **Saves/favorites** — *why:* `venue_saves` exists and the Save button is dead — a primary retention loop. *First step:* wire the optimistic toggle (mirror the follow toggle) and add a "Saved" tab.
4. **PWA / push** — *why:* a repeatedly-opened mobile neighborhood app with no installability, offline shell, or background re-engagement. *First step:* add `vite-plugin-pwa` (mind the `/beyoglu-connect-hub/` SW scope) + Web Push (VAPID) via an Edge Function and a `push_subscriptions` table.
5. **Scheduled jobs** — *why:* nothing expires stale listings/deals/events (ghost-town feed). *First step:* enable `pg_cron` to flip expired rows and roll up `venue_analytics`, kept in a migration.
6. **Monetization** — *why:* no revenue path despite `venue_claims`/`venue_deals` in schema. *First step:* phase-2 plan anchored on verified-business subscriptions + promoted placements + paid event tickets via a TR PSP (iyzico/PayTR), not Stripe-only.

## Domain gap tables

### User Management
| Area | Status | Priority | Recommendation |
|---|---|---|---|
| Account deletion & deactivation (erasure) | missing | P0 | Delete/deactivate flow via service-role Edge Function + 30-day soft-delete + audit log |
| `banned` role set but never enforced | partial | P0 | `is_banned()` in write `WITH CHECK`; gate app shell; stop overwriting role rows |
| Profile PII world-readable; privacy toggles inert | partial | P0 | `SECURITY DEFINER` view/RPC honoring `*_public`; split sensitive columns; never send phone to others |
| Password reset / recovery | missing | P0 | `resetPasswordForEmail` + `/reset-password` route + Supabase template |
| Email verification posture unclear; signup write assumes session | partial | P1 | Persist phone/display_name via `handle_new_user` from `raw_user_meta_data`; decide verification gate |
| `moderator`/`vendor` defined but unused | partial | P1 | Admin > Users role-assignment screen; enforce capabilities via `has_role()` |
| Block / mute | missing | P1 | `user_blocks` table enforced in messaging/feed RLS; Block+Report on every profile |
| Onboarding & profile completeness | missing | P1 | Skippable district+avatar first-run; completeness meter |
| Signup consent / terms / age gate | missing | P1 | Required consent checkbox + age confirmation; persist consent record |
| Identity & business verification surfacing | partial | P2 | Render verified badge; admin claim queue that grants `vendor` on approval |
| Reputation / trust levels | missing | P2 | Aggregate `user_reviews`; lightweight trust tiers gating high-risk actions |

### Privacy / Compliance (KVKK / GDPR / DSA)
| Area | Status | Priority | Recommendation |
|---|---|---|---|
| Consent & lawful basis at signup | missing | P0 | Unticked consent checkbox + `consent_records` (version/ts/IP); justify mandatory phone |
| Privacy Policy & Terms pages | missing | P0 | TR/EN Privacy (aydınlatma) + Terms + Cookie pages, routed and footer-linked; name controller |
| Right to erasure (account+data deletion) | missing | P0 | Re-auth delete flow + service-role function purging auth row, storage, FK rows |
| DSAR / data export & portability | missing | P0 | "Download my data" Edge Function assembling JSON/ZIP; document 30-day SLA |
| Cookie / tracking & geolocation consent | missing | P0 | Consent banner gating non-essential storage; explicit in-app geolocation consent |
| Public exposure of photos & profiles | partial | P0 | Signed/auth-read media; restrict profile SELECT to minimal fields/owner |
| DSA statement of reasons & appeal | partial | P1 | Specific statement of reasons on moderation + appeal channel + reporter notice + decision log |
| Age gating / minors | missing | P1 | DOB/min-age at signup; block under-age; minor-safety defaults |
| Marketing opt-in & waitlist consent | missing | P1 | Separate marketing opt-in + stored consent; tighten waitlist INSERT; unsubscribe path |
| Data retention policy & enforcement | missing | P2 | Per-category retention; `pg_cron` deletion/anonymization; publish in notice |
| Breach notification process | missing | P2 | 72h runbook (KVKK Board + lead EU DPA) + incident register + RLS/storage monitoring |
| Processor agreements & cross-border transfer | missing | P2 | Retain Supabase/hosting DPAs; document region/residency; SCCs + KVKK transfer basis |

### Security / RLS
| Area | Status | Priority | Recommendation |
|---|---|---|---|
| Input validation / XSS (Leaflet popup) | exists | P0 | Escape/`textContent` all popup HTML; `data-` attr instead of inline `onclick`; whitelist photo URL |
| Exposed AI secret in `site_settings` | exists | P0 | Move to Edge Function secret; rotate key; restrict `site_settings` SELECT |
| Messaging broken access control | partial | P0 | Restrict participant INSERT to creator/existing participant; scope DELETE to sender |
| Admin/ban moderation non-functional at DB | partial | P1 | Admin/mod UPDATE override policies; `is_banned()` in write checks |
| Auth hardening (6-char pw, no MFA, committed `.env`) | partial | P1 | Email confirm + leaked-password protection + MFA for admins; min length ≥8–10; `git rm --cached .env` |
| Storage bucket write scoping | partial | P1 | Constrain `events`/`groups` INSERT/UPDATE to `auth.uid()` folder (the `user-media` pattern) |
| Over-permissive `WITH CHECK (true)` (notifications, audit_log, waitlist) | partial | P2 | Move inserts to `SECURITY DEFINER`; rate-limit/captcha waitlist |
| CSP / defense-in-depth | missing | P2 | Strict `<meta>` CSP after removing inline handlers; Referrer-Policy; `noopener` |
| Spam / abuse prevention | missing | P2 | Auth CAPTCHA; per-user write limits; self-follow CHECK; paginate profile listing |
| Column-level privacy enforcement | partial | P2 | View/RPC nulling age/gender per `*_public`; owner-only direct SELECT |
| Audit logging & advisor scan | partial | P2 | Write audit via `SECURITY DEFINER`; run `get_advisors` on `rpowcyefavqynpvoumdg` with scoped token |

### Backend / Infrastructure
| Area | Status | Priority | Recommendation |
|---|---|---|---|
| Edge functions / server compute layer | missing | P0 | Stand up `supabase/functions/`; start with notification fan-out, email, payments webhook |
| Transactional email (verify/reset/notify) | partial | P0 | Custom SMTP provider; add reset flow; route notification emails via Edge Function |
| Marketplace payments / escrow | missing | P0 | Decide lead-gen vs transactional; if transactional, TR PSP + orders/escrow/disputes |
| Push / web-push + PWA | missing | P1 | Service worker + Web Push (VAPID) + `push_subscriptions`; PWA manifest |
| Search infra (full-text + geo) | partial | P1 | `tsvector`/`pg_trgm` GIN + ranked RPC; PostGIS `ST_DWithin` nearby RPC |
| Scheduled / background jobs | missing | P1 | `pg_cron` to expire listings/deals/events, roll up analytics, build digests |
| Notification creation trust model | partial | P1 | Triggers/`SECURITY DEFINER` fan-out; tighten INSERT; whitelist `notif.link` |
| Observability / error tracking | missing | P1 | Sentry in `ErrorBoundary` + consent-gated analytics |
| Rate limiting / abuse prevention | missing | P1 | Edge-function write gateway with token-bucket limits; CAPTCHA on auth |
| Realtime robustness | exists | P2 | Apply payloads via `setQueryData`; scope conversations channel per-user |
| Image optimization / CDN | missing | P2 | Supabase image transforms (WebP/AVIF, width/quality); client-side thumbnail on upload |

### Modules / Feature Depth
| Area | Status | Priority | Recommendation |
|---|---|---|---|
| Feed ranking algorithm | missing | P0 | Following/Discover split + scored paginated RPC (recency+engagement+district) |
| User-to-user reviews / trust stack | partial | P0 | "Leave a review" form gated to prior contact; aggregate rating on profiles/cards |
| Favorites / saves (dead Save button) | partial | P0 | Wire `venue_saves` optimistic toggle; add Saved tab; extend to events/classifieds |
| Verified businesses / claim-a-venue | partial | P1 | Claim CTA → `venue_claims`; admin review queue; verified badge; grant `vendor` |
| Messaging robustness (block/media/read receipts) | partial | P1 | `blocks` table in RLS; image attachments; write/display `read_at` on UPDATE sub |
| Events RSVP vs real ticketing | partial | P1 | Relabel "Buy Ticket" until payments exist; add RSVP states + capacity |
| Search & discovery coverage | partial | P1 | Add classifieds/rentals/pets/groups; full-text + Turkish-aware matching; results page |
| PWA / installability / offline | missing | P1 | `vite-plugin-pwa` manifest + Workbox SW (mind base path) + install prompt |
| Monetization model | missing | P2 | Verified-business subs + promoted placements + paid tickets via iyzico/PayTR |
| Stub modules in primary nav (Jobs, Families) | partial | P2 | Hide behind `More`/feature flag until built; fast-follow Jobs via classifieds pattern |
| Geo "nearby" sorting & map discovery | partial | P2 | DB-side radius filter + "Nearest" sort (PostGIS); feed proximity boost |
| i18n completeness & EN/TR fallback | partial | P2 | Audit `translations` for full tr+en; standardize fallback language; CI check for missing keys |

### Engagement / UX
| Area | Status | Priority | Recommendation |
|---|---|---|---|
| Onboarding & first-run activation | missing | P0 | Skippable district + avatar first-run; non-blocking completeness banner |
| Empty-state → first-action loop (dead CTAs) | partial | P0 | Wire Send Message + empty-state Post to existing `navigate` pattern; audit all buttons |
| Form quality & validation | partial | P1 | react-hook-form + zod; always-enabled submit + on-blur errors; humanize auth errors |
| Notification taxonomy & preferences | partial | P1 | `notification_preferences` + Settings (≤2 taps); batch likes; opt-in digest; friend-request notif |
| Social loops (friend-request inbox) | partial | P1 | Surface `useFriendRequests` as Connections inbox with Accept/Decline |
| Trust / reputation mechanics | missing | P1 | Show "Member since", verified-phone badge, listing count on profiles/CTAs |
| Accessibility (a11y / EAA) | partial | P1 | aria-labels on icon buttons; associate labels; global reduced-motion; axe/Lighthouse CI |
| Message-request / contact safety UX | partial | P2 | Honor `message_requests` gate (pending inbox) or remove the dead toggle |
| Microinteractions & optimistic UI | exists | P2 | Add <200ms like pop (reduced-motion aware); optional pull-to-refresh |
| Personalization & memory | partial | P2 | Default feed district to `profiles.district_id`; "recently viewed" rail |

## Suggested module build order

1. **Compliance & account-control layer (Privacy/Terms pages, consent, deletion, export, password reset)** — the hard legal gate; nothing can onboard a real EU/TR user until this exists, and it forces the first Edge Functions into being.
2. **Edge Function backbone + secret/email hardening** — unblocks erasure/export/AI-proxy/email/payments/fan-out at once; it's the single structural prerequisite for most P0/P1 work.
3. **Moderation enforcement + `banned`/block + messaging RLS fix** — turns the existing (currently fake) trust-and-safety UI into something real, and closes the DSA/privacy holes in DMs.
4. **Onboarding + wire dead CTAs + saves toggle** — the cheapest activation/retention wins; mostly wiring to patterns that already exist elsewhere in the app.
5. **Notifications fan-out + friend-request inbox + reviews write path** — closes the broken social/trust loops so the community graph and reputation actually form.
6. **Verified-business claim flow + admin role management** — lights up the supply side (594 seeded venues with no owners) and is the gateway to monetization.
7. **Search + geo `nearby` + feed ranking** — discovery depth once there's enough content and trust signal to rank against.
8. **PWA/push, then monetization (TR PSP)** — growth and revenue, sequenced last because they depend on the trusted backend and a credible core.

## Beyoğlu-specific feature ideas

1. **District-scoped feed defaulting to the user's mahalle** (Cihangir, Galata, Çukurcuma, Tarlabaşı…) — `profiles.district_id` already exists; auto-select it so the first screen feels local, not a global İstanbul stream.
2. **"What's near me right now" map mode** — Beyoğlu is dense and walkable; a PostGIS radius query over venues + geo-tagged classifieds is the headline single-neighborhood use case.
3. **Verified-business deals for İstiklal/Galata venues** — `venue_deals` + `qr_code_token` already exist; let claimed cafés/bars/shops post a redeemable QR deal as the first monetization hook.
4. **Lost & Found pet map with proximity alerts** — the section exists (and is the XSS site, so it's getting touched anyway); add opt-in push when a lost/found post lands within N km of the user.
5. **Nightlife/events tonight rail** — Beyoğlu's events/nightlife density makes a "tonight in your district" ranked rail (with real RSVP states and, later, paid tickets via iyzico/PayTR) a strong retention loop.
6. **Turkish-aware search with `unaccent`** — matching "Cihangir/cihangır", "Beyoğlu/beyoglu", "İ/i" correctly is essential for a TR-first product; bake the Turkish collation/`unaccent` config into the search RPC from day one.
7. **Neighbor-help / Komşu Yardım trust badges** — pair the help module with a verified-phone + "member since" signal so strangers feel safe exchanging help offers and small services.
8. **Bilingual-by-default surfaces for the expat-heavy district** — Cihangir/Galata have large foreign-resident populations; ensure full tr+en `translations` coverage and drop hardcoded `language==='tr'` ternaries so the UI is never half-translated.
9. **Building/sokak-level rental & parking listings** — hyper-local rentals and scarce parking are real Beyoğlu pain points; the `classifieds.section` pattern (already used by Rentals/Parking) extends naturally to street-level geo tagging.

## Start here next chat

1. **Open the real project root: `/Users/ag/Documents/IstanbulConnect/beyoglu-connect-hub`** (not the outer dir) — repo `translatee2025/beyoglu-connect-hub`, Supabase project `rpowcyefavqynpvoumdg` ("CityHub"), live at GitHub Pages `/beyoglu-connect-hub/`.
2. **Revoke the Supabase personal access token** used for seeding this session, and **`git rm --cached .env`** + add `.env` to `.gitignore` (it currently leaks the project ref/anon key).
3. **Fix the stored XSS in `src/components/pets/LostFoundSection.tsx`** (escape popup HTML L388/L393, drop inline `onclick` for a `data-` attr listener, whitelist `item.photo` at L370) — highest-impact, self-contained.
4. **Run `get_advisors` (security + performance) against `rpowcyefavqynpvoumdg`** with a properly-scoped token and triage; expect the public `site_settings` AI-key leak, world-readable profiles, the open `user-media` bucket, and disabled leaked-password protection.
5. **Pull the AI key out of `site_settings` and rotate it** — create `supabase/functions/ai-proxy` as the first Edge Function and restrict `site_settings` SELECT.
6. **Regenerate Supabase types** (`generate_typescript_types` / CLI) to refresh `src/integrations/supabase/types.ts` and start removing the 44 `as any` casts.
7. **Land the messaging RLS fix** (`conversation_participants` INSERT + message DELETE scoping) as a new migration and re-test DM creation.
8. **Spike the compliance layer**: scaffold TR/EN Privacy + Terms routes, the signup consent checkbox + age gate, and the `delete-account`/`export-my-data` Edge Functions — the actual launch blocker.
