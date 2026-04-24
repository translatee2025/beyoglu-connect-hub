-- Backfill species_id for existing pet_profiles rows that have legacy enum text
-- but no species_id reference. Match on lowercase name_en.
UPDATE public.pet_profiles AS p
SET species_id = s.id
FROM public.species AS s
WHERE p.species_id IS NULL
  AND p.species IS NOT NULL
  AND lower(s.name_en) = lower(p.species::text);

-- Backfill breed_id where an exact breed name match exists for the resolved species.
UPDATE public.pet_profiles AS p
SET breed_id = b.id
FROM public.breeds AS b
WHERE p.breed_id IS NULL
  AND p.breed IS NOT NULL
  AND p.species_id IS NOT NULL
  AND b.species_id = p.species_id
  AND (lower(b.name_en) = lower(p.breed) OR lower(b.name_tr) = lower(p.breed));