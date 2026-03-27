
-- Fix remaining RLS: venue_analytics read by venue owners
CREATE POLICY "Anyone can read venue analytics" ON public.venue_analytics FOR SELECT USING (true);

-- Seed venue type groups
INSERT INTO public.venue_type_groups (name, icon, color_accent, sort_order) VALUES
('Pets', '🐾', '#3B82F6', 1),
('Food & Drink', '🍽️', '#F59E0B', 2),
('Health', '🏥', '#EF4444', 3),
('Beauty & Personal Care', '💇', '#EC4899', 4),
('Fitness & Sports', '🏋️', '#10B981', 5),
('Home & Repair', '🔧', '#6366F1', 6),
('Services', '🏦', '#8B5CF6', 7),
('Education & Kids', '📚', '#06B6D4', 8),
('Shopping & Lifestyle', '🛍️', '#F97316', 9),
('Entertainment & Culture', '🎭', '#A855F7', 10),
('Community & Public', '🕌', '#14B8A6', 11),
('Groceries & Daily', '🛒', '#84CC16', 12);

-- Seed venue types for Pets group
INSERT INTO public.venue_types (group_id, name, icon, sort_order, default_attributes)
SELECT g.id, t.name, t.icon, t.sort_order, t.default_attributes::jsonb
FROM public.venue_type_groups g,
(VALUES
  ('Veterinary Clinic', '🏥', 1, '{"services_tab_label":"Services"}'),
  ('Pet Shop', '🛒', 2, '{"services_tab_label":"Products"}'),
  ('Dog Groomer', '✂️', 3, '{"services_tab_label":"Services"}'),
  ('Dog Walker', '🚶', 4, '{"services_tab_label":"Services"}'),
  ('Pet Boarding', '🏠', 5, '{"services_tab_label":"Services"}'),
  ('Animal Shelter', '🐾', 6, '{"services_tab_label":""}'),
  ('Dog Park', '🌳', 7, '{"services_tab_label":""}'),
  ('Aquarium & Fish Shop', '🐠', 8, '{"services_tab_label":"Products"}')
) AS t(name, icon, sort_order, default_attributes)
WHERE g.name = 'Pets';

-- Seed venue types for Food & Drink
INSERT INTO public.venue_types (group_id, name, icon, sort_order, default_attributes)
SELECT g.id, t.name, t.icon, t.sort_order, '{"services_tab_label":"Menu"}'::jsonb
FROM public.venue_type_groups g,
(VALUES
  ('Restaurant', '🍽️', 1), ('Café', '☕', 2), ('Bar', '🍺', 3), ('Pub', '🍻', 4),
  ('Rooftop Bar', '🌃', 5), ('Nightclub', '🎵', 6), ('Patisserie', '🎂', 7), ('Bakery', '🍞', 8),
  ('Börekçi', '🥐', 9), ('Döner & Kebab', '🥙', 10), ('Kokoreç', '🌭', 11),
  ('Seafood', '🐟', 12), ('Burger & Fast Food', '🍔', 13), ('Pizza', '🍕', 14),
  ('Breakfast & Brunch', '🥞', 15), ('Tea House', '🫖', 16), ('Nargile Café', '💨', 17)
) AS t(name, icon, sort_order)
WHERE g.name = 'Food & Drink';

-- Seed venue types for Health
INSERT INTO public.venue_types (group_id, name, icon, sort_order, default_attributes)
SELECT g.id, t.name, t.icon, t.sort_order, '{"services_tab_label":"Services"}'::jsonb
FROM public.venue_type_groups g,
(VALUES
  ('Hospital', '🏥', 1), ('Private Clinic', '🩺', 2), ('Pharmacy', '💊', 3),
  ('Dentist', '🦷', 4), ('Eye Clinic', '👓', 5), ('Physiotherapy', '💪', 6),
  ('Psychologist', '🧠', 7), ('Lab & Diagnostics', '🔬', 8)
) AS t(name, icon, sort_order)
WHERE g.name = 'Health';

-- Seed some actual venues in Beyoğlu (matching existing hardcoded data + extras)
WITH vet_type AS (SELECT id FROM public.venue_types WHERE name = 'Veterinary Clinic' LIMIT 1),
     shop_type AS (SELECT id FROM public.venue_types WHERE name = 'Pet Shop' LIMIT 1),
     cafe_type AS (SELECT id FROM public.venue_types WHERE name = 'Café' LIMIT 1),
     restaurant_type AS (SELECT id FROM public.venue_types WHERE name = 'Restaurant' LIMIT 1),
     pharmacy_type AS (SELECT id FROM public.venue_types WHERE name = 'Pharmacy' LIMIT 1)
INSERT INTO public.venues (venue_type_id, name, address, lat, lng, phone, neighborhood, status, is_verified) VALUES
((SELECT id FROM vet_type), 'Beyoğlu Veteriner', 'Tomtom Mah. No:8', 41.0355, 28.9790, '+90 212 555 0202', 'Tomtom', 'active', true),
((SELECT id FROM vet_type), 'Dr. Pati Vet Clinic', 'Firuzağa Mah. No:22', 41.0295, 28.9850, '+90 212 555 0303', 'Cihangir', 'active', true),
((SELECT id FROM vet_type), 'İstanbul Vet Center', 'Asmalımescit Mah. No:5', 41.0330, 28.9760, '+90 212 555 0404', 'Asmalımescit', 'active', true),
((SELECT id FROM shop_type), 'PetCity Beyoğlu', 'İstiklal Cad. No:45', 41.0340, 28.9775, '+90 212 555 0101', 'Beyoğlu', 'active', true),
((SELECT id FROM shop_type), 'Happy Paws Pet Shop', 'Cihangir Mah. Akarsu Sok. No:12', 41.0310, 28.9830, NULL, 'Cihangir', 'active', false),
((SELECT id FROM shop_type), 'PetLand Store', 'Galatasaray, İstiklal Cad. No:120', 41.0365, 28.9810, NULL, 'Galatasaray', 'active', true),
((SELECT id FROM cafe_type), 'Karabatak Cafe', 'Kara Ali Kaptan Sk. No:7', 41.0280, 28.9745, '+90 212 243 2234', 'Karaköy', 'active', true),
((SELECT id FROM cafe_type), 'Kronotrop Coffee', 'Firuzağa Mah. Cezayir Sk. No:3', 41.0305, 28.9825, NULL, 'Cihangir', 'active', true),
((SELECT id FROM restaurant_type), 'Helvetia Lokanta', 'Asmalımescit Mah. General Yazgan Sk.', 41.0332, 28.9762, '+90 212 245 8780', 'Asmalımescit', 'active', true),
((SELECT id FROM pharmacy_type), 'Taksim Eczanesi', 'Taksim Meydanı No:1', 41.0370, 28.9854, '+90 212 555 9999', 'Taksim', 'active', true);
