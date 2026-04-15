
-- Species table
CREATE TABLE public.species (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_tr text NOT NULL,
  emoji text NOT NULL,
  display_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.species ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read species" ON public.species FOR SELECT USING (true);
CREATE POLICY "Admins can manage species" ON public.species FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Breeds table
CREATE TABLE public.breeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  species_id uuid NOT NULL REFERENCES public.species(id) ON DELETE CASCADE,
  name_en text NOT NULL,
  name_tr text NOT NULL,
  is_popular boolean NOT NULL DEFAULT false
);

ALTER TABLE public.breeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read breeds" ON public.breeds FOR SELECT USING (true);
CREATE POLICY "Admins can manage breeds" ON public.breeds FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_breeds_species_id ON public.breeds(species_id);

-- Seed species
INSERT INTO public.species (name_en, name_tr, emoji, display_order) VALUES
  ('Dog', 'Köpek', '🐕', 1),
  ('Cat', 'Kedi', '🐈', 2),
  ('Bird', 'Kuş', '🐦', 3),
  ('Rabbit', 'Tavşan', '🐇', 4),
  ('Fish', 'Balık', '🐠', 5),
  ('Reptile', 'Sürüngen', '🦎', 6),
  ('Hamster', 'Hamster', '🐹', 7),
  ('Other', 'Diğer', '🐾', 8);

-- Seed dog breeds
INSERT INTO public.breeds (species_id, name_en, name_tr, is_popular)
SELECT s.id, b.name_en, b.name_tr, b.is_popular
FROM public.species s,
(VALUES
  ('Golden Retriever', 'Golden Retriever', true),
  ('Labrador Retriever', 'Labrador Retriever', true),
  ('German Shepherd', 'Alman Çoban Köpeği', true),
  ('French Bulldog', 'Fransız Bulldog', true),
  ('Bulldog', 'Bulldog', true),
  ('Poodle', 'Kaniş', true),
  ('Beagle', 'Beagle', true),
  ('Rottweiler', 'Rottweiler', true),
  ('Yorkshire Terrier', 'Yorkshire Terrier', true),
  ('Husky', 'Husky', true),
  ('Other', 'Diğer', false)
) AS b(name_en, name_tr, is_popular)
WHERE s.name_en = 'Dog';

-- Seed cat breeds
INSERT INTO public.breeds (species_id, name_en, name_tr, is_popular)
SELECT s.id, b.name_en, b.name_tr, b.is_popular
FROM public.species s,
(VALUES
  ('Persian', 'İran Kedisi', true),
  ('Maine Coon', 'Maine Coon', true),
  ('Siamese', 'Siyam Kedisi', true),
  ('British Shorthair', 'British Shorthair', true),
  ('Ragdoll', 'Ragdoll', true),
  ('Bengal', 'Bengal', true),
  ('Sphynx', 'Sfenks', true),
  ('Scottish Fold', 'Scottish Fold', true),
  ('Abyssinian', 'Habeş Kedisi', true),
  ('Turkish Angora', 'Ankara Kedisi', true),
  ('Other', 'Diğer', false)
) AS b(name_en, name_tr, is_popular)
WHERE s.name_en = 'Cat';

-- Seed bird breeds
INSERT INTO public.breeds (species_id, name_en, name_tr, is_popular)
SELECT s.id, b.name_en, b.name_tr, b.is_popular
FROM public.species s,
(VALUES
  ('Budgerigar', 'Muhabbet Kuşu', true),
  ('Canary', 'Kanarya', true),
  ('Cockatiel', 'Sultan Papağanı', true),
  ('African Grey Parrot', 'Afrika Gri Papağanı', true),
  ('Amazon Parrot', 'Amazon Papağanı', true),
  ('Parrotlet', 'Forpus', true),
  ('Lovebird', 'Cennet Papağanı', true),
  ('Pastel Budgerigar', 'Pastel Muhabbet', true),
  ('Indian Myna', 'Hint Bülbülü', true),
  ('Finch', 'Ispinoz', true),
  ('Other', 'Diğer', false)
) AS b(name_en, name_tr, is_popular)
WHERE s.name_en = 'Bird';

-- Seed rabbit breeds
INSERT INTO public.breeds (species_id, name_en, name_tr, is_popular)
SELECT s.id, b.name_en, b.name_tr, b.is_popular
FROM public.species s,
(VALUES
  ('Holland Lop', 'Holland Lop', true),
  ('Mini Rex', 'Mini Rex', true),
  ('Netherland Dwarf', 'Hollanda Cüce', true),
  ('Lionhead', 'Lionhead', true),
  ('Angora', 'Angora', true),
  ('Flemish Giant', 'Flemish Giant', true),
  ('Dutch', 'Dutch', true),
  ('Californian', 'Californian', true),
  ('English Lop', 'English Lop', true),
  ('Rex', 'Rex', true),
  ('Other', 'Diğer', false)
) AS b(name_en, name_tr, is_popular)
WHERE s.name_en = 'Rabbit';

-- Seed minimal breeds for hamster, fish, reptile, other
INSERT INTO public.breeds (species_id, name_en, name_tr, is_popular)
SELECT s.id, 'Other', 'Diğer', false
FROM public.species s
WHERE s.name_en IN ('Hamster', 'Fish', 'Reptile', 'Other');
