
Goal: make the Pets adoption view reliable so it never appears blank/empty when adoption records exist, and fix the underlying pet data inconsistencies that are still causing fragile behavior.

1. Confirmed findings
- The published `/pets` page is not failing because of missing read access: `pet_profiles`, `pet_posts`, `species`, and `profiles` requests all return 200, and the published site currently renders adoption cards in browser inspection.
- The current adoption tab has a real state bug: it shows loading/empty UI based on `pet_posts` loading (`postsLoading`) instead of `pet_profiles` loading, even though adoption cards come from `pet_profiles`. That can produce false empty states.
- Pet species handling is inconsistent across the pets module:
  - `useSpecies()` returns species table UUIDs.
  - `pet_profiles.species` is still an enum-like text field (`dog`, `cat`, etc.).
  - `AdoptionForm` and `AddPetForm` currently pass `form.species` straight into `pet_profiles.species`, even though that value can be a UUID from `speciesOptions`.
- That mismatch means pet creation/edit flows can silently break or create malformed data, which then makes adoption filters and labels unreliable.
- A blocking location-permission modal is rendered globally by `LocationProvider`. It does not fully explain an empty data state, but it can make the page look “stuck” and should be softened so it never obscures the core listing experience.

2. Pets adoption stabilization pass
- Refactor `src/pages/Pets.tsx` so adoption state is driven by the correct query:
  - track `petsLoading` from the `pet_profiles` query
  - use `petsLoading` for skeletons/empty state in the adoption tab
  - keep `pet_posts` loading isolated to lost/found and other pet-post features
- Harden the adoption list derivation:
  - derive adoption cards only from normalized pet profile rows
  - exclude lost pets from adoption listings unless explicitly intended
  - ensure search/filter/sort run against normalized values, not mixed raw DB shapes
- Add a safer adoption empty-state condition:
  - show skeleton while `pet_profiles` is still loading
  - only show “No adoption posts yet” after `pet_profiles` resolves successfully with zero usable rows

3. Normalize pet species/breed data
- Introduce a single mapping layer for pet records:
  - canonical species identity = `species_id` when available
  - display label/emoji = looked up from `species` table
  - legacy enum text (`dog`, `cat`, etc.) = fallback only
- Update `AdoptionForm.tsx` and `AddPetForm.tsx` so they write consistent pet data:
  - store `species_id` from the selected option
  - store `breed_id` where available
  - keep `species` text aligned to the canonical species name expected by existing UI/database consumers
- Update pet list/filter components to compare on canonical ids first, with legacy text fallback for old rows.
- Fix label rendering so cards, pills, and filters never depend on partial string matching like `label.includes(...)`.

4. Data backfill and compatibility
- Add one migration to repair malformed/legacy pet rows without deleting data:
  - fill `species_id` for existing `pet_profiles` rows by matching legacy `species` text to the `species` table
  - optionally fill `breed_id` where an exact breed match exists for the resolved species
  - normalize obviously broken UUID-in-enum cases created by the current forms
- Preserve all existing pet data and make the code tolerate both normalized and legacy rows during rollout.

5. Reduce UI blockers on Pets
- Adjust `LocationProvider` behavior so the location modal does not feel like the page is broken:
  - render it as dismissible/non-blocking for list browsing, or defer it until the user enters a nearby/map mode
  - avoid showing it immediately on first render of every page
- Keep location access optional and only required for “nearby” features.

6. Secondary Pets hardening in the same pass
- Replace remaining brittle pet image usage with the shared safe image pattern where needed.
- Normalize photo selection for pet cards so both `photos[]` and `photo_url` render consistently.
- Update lost/found and friend-finder pet views to use the same species normalization logic, preventing another round of empty/filter mismatches elsewhere in the pets module.

7. Verification after implementation
- Verify `/pets` published and preview both:
  - render adoption cards on first load
  - show skeletons only while `pet_profiles` is actually loading
  - show a true empty state only when there are genuinely no adoption pets
- Test species and breed filters across mixed old/new pet rows.
- Create a new adoption listing and confirm it:
  - inserts successfully
  - appears in the adoption tab immediately
  - keeps image, species label, and filters working
- Test with location modal skipped and allowed to confirm the page remains usable in both cases.

Technical details
- Files likely touched:
  - `src/pages/Pets.tsx`
  - `src/components/pets/AdoptionForm.tsx`
  - `src/components/pets/AddPetForm.tsx`
  - `src/hooks/useSpeciesBreeds.ts`
  - `src/providers/LocationProvider.tsx`
  - shared pet normalization helper(s)
  - one migration for pet species/breed backfill
- No schema reset, no auth reset, no data deletion.
- Priority is correctness first: proper adoption loading state, normalized species data, and a non-blocking browsing experience.
