# Beyoğlu Connect — Full Documentation

_Last updated: 2026-08-25_

## 1. What the app is

A mobile-first neighbourhood community hub for Istanbul districts (currently branded Beyoğlu Connect). It combines a local business directory, a universal community feed, classifieds/rentals/parking, events and groups, pets, neighbour help, lost & found, jobs, families, reels, and 1:1 messaging — all scoped by district and available in Turkish/English (Arabic planned) via a database-driven translation system.

Stack: React 18 + Vite + TypeScript, React Router, TanStack Query, Tailwind + shadcn/ui, Leaflet maps, backend on Lovable Cloud (Postgres + Auth + Storage + Realtime). No custom server; the client talks to the database directly under row-level security.

## 2. Feature modules

| Module | Route | What it does |
|---|---|---|
| Home | `/` | Module launcher, highlights, search entry |
| Wall (universal feed) | `/wall` | Aggregates wall posts, classifieds, venues, help posts and lost & found into one feed; per-source queries with error isolation and timeouts |
| Venues directory | `/venues`, `/venue/:id` | 55 venue types in 20 groups, dynamic attributes, photos, hours, reviews, saves, claims, analytics |
| Charts | `/charts` | Ranked venues by rating/activity |
| Classifieds | `/classifieds` | Buy/sell listings with categories, photos, price, contact prefs |
| Rentals | `/rentals` | Flats/rooms: rooms, m², furnished, pets allowed, floor, available-from |
| Parking | `/parking` | Parking spots by type (garage, open lot, street…) |
| Events | `/events`, `/events/:id` | Event creation, cover photos, free/paid, attendee RSVP, map |
| Groups | `/groups`, `/groups/:id` | Public/private groups, members with roles, group wall posts |
| Pets | `/pets` | Adoption, pet care/sitting, friend finder (swipe), lost & found, shops & vets; species/breed reference data |
| Neighbour help | `/help` | Offer/want help by category with price type |
| Lost & found | `/lost-found` | Pets and items, last-seen map markers, resolve flow |
| Jobs / Families | `/jobs`, `/families` | Local job and family-service posts |
| Reels | `/reels` | Short vertical video/photo posts tied to venue or district |
| Messaging | `/messages` | Realtime 1:1 conversations, participants, read state |
| Profiles | `/profile/:userId`, `/profile/edit` | Display name, avatar, bio, district, privacy toggles, reviews, follows/friends |
| Notifications | bell in nav | Per-user notification rows with link targets |
| Admin | `/admin/*` | Dashboard, module toggles, theme, reports moderation, settings, AI |

Cross-cutting: likes and comments on any entity (`entity_type` + `entity_id`), reporting/moderation, district filtering, geolocation distance labels (haversine), global search, bottom nav on mobile / sidebar on desktop.

## 3. Data model (tables)

**Reference/config:** `districts`, `species`, `breeds`, `app_options` (bilingual dropdown option sets: parking types, rental types, help categories…), `classified_categories`, `venue_type_groups`, `venue_types`, `venue_attribute_definitions`, `languages`, `translations`, `module_settings`, `theme_settings`, `site_settings`.

**Identity:** `profiles` (1 per auth user, privacy flags, language preference), `user_roles` (`admin | moderator | vendor | user | banned`, checked through the `has_role` security-definer function), `user_privacy_settings`, `user_follows`, `user_friends`, `user_reviews`.

**Content:** `wall_posts`, `classifieds` (sections: classifieds/rental/parking), `events` + `event_attendees`, `groups` + `group_members`, `neighbor_help_posts`, `lost_found_posts`, `families`, `reels`, `pet_profiles`, `pet_photos`, `pet_posts`, `pet_sitting_posts`, `pet_connections`.

**Directory:** `venues`, `venue_attributes`, `venue_menu_items`, `venue_deals`, `venue_reviews`, `venue_saves`, `venue_claims`, `venue_analytics`.

**Social/ops:** `likes`, `comments`, `conversations`, `conversation_participants`, `messages`, `notifications`, `reports`, `audit_log`, `waitlist`.

**Storage buckets:** `user-media`, `events`, `groups`, `lost-found` (public read).

**Database automation:** `handle_new_user` (creates a profile on signup), `update_updated_at_column`, `update_conversation_timestamp`, `validate_review_rating` (1–5), `has_role`.

## 4. Key workflows

- **Signup** → auth user created → trigger inserts a `profiles` row → user edits profile, picks district and language.
- **Create a listing** → user opens the module's dialog form → photos upload to a storage bucket → row inserted with `user_id`, `district_id`, category value-key → appears in that module and in the Wall feed.
- **Wall feed** → five parallel queries (wall posts, classifieds, venues, help, lost & found), each error-isolated and timeout-guarded → merged, district-filtered, sorted by recency.
- **Contact / messaging** → “Contact” on a card → finds or creates a conversation with both participants → realtime messages, `last_message_at` bumped by trigger.
- **Pets adoption / friend finder** → pet profile created with `species_id`/`breed_id` → filterable by species, breed, size, energy → swipe matching writes `pet_connections`.
- **Lost & found** → report with last-seen point → pinned/urgent card and map marker → owner resolves, setting `resolved_at`.
- **Moderation** → user reports content → row in `reports` → admin acts in `/admin/reports` (hide content, assign `banned` role) → `audit_log` entry.
- **Admin configuration** → module toggles (`module_settings`), theme colours (`theme_settings`), option sets (`app_options`), translations (`translations`) — all read live by the app.
- **i18n** → `t(key, fallback)` from `LanguageProvider`, translations loaded from the DB per language, preference persisted in localStorage and `profiles.language_preference`.

## 5. Technical notes

- Provider order: Helmet → Router → Theme → Query → Language → Auth → Location → Tooltip → ErrorBoundary → routes.
- All routes lazy-loaded; module-level `QueryClient` with `staleTime` 5 min, `retry: 0`, no refetch on window focus.
- `useAppOptions` never caches empty results; forms guard Selects until options resolve; hardcoded fallback category lists exist in Classifieds/Rentals/Parking.
- Profile lookups are batched: `UserName` coalesces all requests in a 30 ms window into one `in()` query to avoid N+1 request storms.
- Location: geolocation prompt deferred 4 s, decision stored in localStorage, distances computed client-side.

## 6. Known gaps (from the prior audit, still open)

No privacy policy/terms, consent capture, account deletion or data export; profiles and uploaded media are world-readable; `conversation_participants` insert policy is too permissive; the AI key is stored in a publicly readable settings table; theming variables are partly unconsumed; generated database types are stale with many `as any` casts.
